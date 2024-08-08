import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Lottie from "react-lottie";
import toast from "react-hot-toast";
import ping from '../../assets/ping.mp3';

import InputGroup from "react-bootstrap/InputGroup";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";

import ProfileModal from "./ProfileModal";
import { getSender, getSenderFull } from "../../config/chatLogic";
import animationData from "../../animations/typing.json";

import { ChatState } from "../../context/ChatProvider";
import UpdateGroupChatModal from "./UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";

import Loading from "./Loading";
import io from "socket.io-client";
import { FaPaperclip } from "react-icons/fa";
import FileUploadModal from "./FileUploadModal";

//const ENDPOINT = "http://localhost:3000"; //dev
const ENDPOINT = "https://chat-live-qziv.onrender.com/"; //prod
let socket, selectedChatCompare = null;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messageRef = useRef(messages);
  

  const { selectedChat, user, notification, setNotification } = ChatState();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const fileSendHandler = (data) => {
    socket.emit("new message", data);
    setMessages([...messages, data]);
  }

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      setLoading(true);

      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config
      );

      //console.log('Fetching along the flow, this can overwrite');
      setMessages(data);
      setLoading(false);

      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast.error("Something Went Wrong with fetching chats");
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    if (e.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setNewMessage(""); // This is async, so we should be good with sending post

        const { data } = await axios.post(
          "/api/message",
          {
            content: newMessage,
            chatId: selectedChat._id,
          },
          config
        );
        //console.log(`Data we send through socket io - ${data}`);
        //console.log('sending message');
        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        toast.error("Something went wrong with sending message");
      }
    }
  };
  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    /*Type Indicator */
    //console.log("Before connected socket");
    if (!socketConnected) return;
    if (!typing) {
      //console.log("Sending typing to other side");
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    let timerLength = 3000;
    setTimeout(() => {
      let timeNow = new Date().getTime();
      let timeDiff = timeNow - lastTypingTime;

      if (timeDiff >= timerLength && typing) {
        //console.log("Sending stop typing to other side");
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  useEffect(() => {
    socket = io(ENDPOINT, {
      withCredentials: false,
    });
    socket.emit("setup", user);
    socket.on("connected", () => {
      setSocketConnected(true)
    });
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    return () => {
      //Stop listening to these events as part of cleanup
      socket.off('connected', () => {
        setSocketConnected(false);
      });
      socket.off('typing');
      socket.off('stop typing');
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat; // selectedChat is not directly accessible so this way to access inside .on callback
  }, [selectedChat]);

  useEffect(() => {
    /*The below use effect ends up resetting the messages state everytime we get a new message. We are
     * using a ref to overcome this issue*/
    messageRef.current = messages;
  });

  useEffect(() => {
    const audio = new Audio(ping);    
    socket?.on("message recieved", (newMessageRecieved) => {
      
      //console.log('on msg recieved');
      //console.log(selectedChatCompare?._id, newMessageRecieved._id);

      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        // If there is no selectedChat or the current selected chat is not the one we got message from

        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
          //console.log("doing a fetch again here");
        }
      } else {
        /**
         * Directly using the messages state here end up resetting the state with each event recieved.
         * This seems to be the behavior when we use useEffect, socket.on and state updation together.
         * So the chat history gets erased from messages and does not show up on screen.
         * TO overcome this, we are using a useRef to track the current messages state with every render in the 
         * useEffect right above this one. 
         * And here, instead of accessing messages directly, we will use the ref value instead.
         * This seems to solve this issue.
         */
        setMessages([...messageRef.current, newMessageRecieved]); // This way the messages state does not reset everytimre.
      }
      //Play notification sound
      audio.play();
    });

    return () => {
      socket.off("message recieved");
    }
  },[]);

  return (
    <div style={{ height: "100%" }}>
      {!selectedChat ? (
        <div className="singleChat-blank">
          <p>Click on a user to start chatting</p>
        </div>
      ) : (
        <>
          {!selectedChat.isGroupChat ? (
            <>
              <div className="singleChat-header">
                <p>{getSender(user, selectedChat.users)}</p>
                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
              </div>
            </>
          ) : (
            <div className="singleChat-header">
              <p>{selectedChat.chatName.toUpperCase()}</p>
              <UpdateGroupChatModal
                fetchMessages={fetchMessages}
                fetchAgain={fetchAgain}
                setFetchAgain={setFetchAgain}
              />
            </div>
          )}
          <div className="singleChat-box">
            {loading ? (
              <Loading />
            ) : (
              <div className="singleChat-box__messages">
                <ScrollableChat messages={messages} />
              </div>
            )}
            {isTyping ? (
              <div>
                <Lottie
                  options={defaultOptions}
                  height={25}
                  width={150}
                  style={{ marginBottom: 5, marginLeft: 0 }}
                />
              </div>
            ) : null}
            <InputGroup>
              <Form.Control
                placeholder="Enter a message"
                aria-label="Recipient's username with two button addons"
                onKeyDown={(e) => sendMessage(e)}
                onChange={typingHandler}
                required
                value={newMessage}
              />
              <DropdownButton
                variant="outline-secondary"
                title={<FaPaperclip />}
                id="input-group-dropdown-2"
                align="end"
              >
                <FileUploadModal title="File" handler={fileSendHandler}>
                <Dropdown.Item>Upload File</Dropdown.Item>
                </FileUploadModal>
                <Dropdown.Divider />
                <FileUploadModal title="Image" handler={fileSendHandler}>
                  <Dropdown.Item>Upload Image</Dropdown.Item>
                </FileUploadModal>
              </DropdownButton>
              {/* <Button variant="outline-secondary">Send Attachment</Button> */}
            </InputGroup>
          </div>
        </>
      )}
    </div>
  );
};

export default SingleChat;
