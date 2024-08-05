import { useEffect, useState } from "react";
import axios from "axios";
import Lottie from 'react-lottie';
import toast from 'react-hot-toast';

import InputGroup from "react-bootstrap/InputGroupText";
import Form from "react-bootstrap/Form";

import ProfileModal from "./ProfileModal";
import { getSender, getSenderFull } from "../../config/chatLogic";
import animationData from "../../animations/typing.json";

import { ChatState } from "../../context/ChatProvider";
import UpdateGroupChatModal from "./UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";

import "../../styles/components/ui/singleChat.scss";
import Loading from "./Loading";
import io from 'socket.io-client';



const ENDPOINT = "http://localhost:3000";
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const { selectedChat, setSelectedChat, user, notification, setNotification } =
    ChatState();

    const defaultOptions = {
      loop: true,
      autoplay: true,
      animationData: animationData,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid slice",
      },
    };

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

        setMessages(data);
        setLoading(false);

        socket.emit('join chat', selectedChat._id);
      } catch (error) {
        toast.error("Something Went Wrong with fetching chats");
        setLoading(false);
      }
    };
  
  const sendMessage = async (e) => {
    if (e.key === "Enter" && newMessage) {
      socket.emit('stop typing', selectedChat._id);
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
            chatId: selectedChat,
          },
          config
        );
        socket.emit('new message',data);
        setMessages([...messages,data]);
      } catch (error) {
        toast.error("Something went wrong with sending message");
      }
    }
  };
  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    /*Type Indicator */
    if(!socketConnected) return;
    if(!typing) {
      setTyping(true);
      socket.emit('typing', selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    let timerLength = 3000;
    setTimeout(() => {
      let timeNow = new Date().getTime();
      let timeDiff = timeNow - lastTypingTime;

      if(timeDiff >= timerLength && typing) {
        socket.emit('stop typing', selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  useEffect(() => {
    socket = io(ENDPOINT, {
      withCredentials: false,
    });
    socket.emit('setup',user);
    socket.on('connection',() => setSocketConnected(true));
    socket.on('typing',() => setIsTyping(true));
    socket.on('stop typing',() => setIsTyping(false));
  },[]);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    socket.on('message recieved',(newMessageRecieved) => {
      if(!selectedChatCompare || selectedChatCompare._id === newMessageRecieved._id) {
        if(!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved,...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageRecieved])
      }
    });
  })



  return (
    <div style={{ height: "100%" }}>
      {!selectedChat ? (
        <div className="singleChat-blank"><p>Click on a user to start chatting</p></div>
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
          <div className="chat-box">
            {loading ? <Loading /> : <div className="chat-box__messages">
              <ScrollableChat messages={messages}/>
            </div>}
            { isTyping ? <div><Lottie
                    options={defaultOptions}
                    height={25}
                    width={70}
                    style={{ marginBottom: 15, marginLeft: 0 }}
                  /></div> : null}
            <InputGroup>
              <Form.Control
                placeholder="Enter a message"
                aria-label="Recipient's username with two button addons"
                onKeyDown={(e) => sendMessage(e)}
                onChange={typingHandler}
                required
                value={newMessage}
              />
              {/* <Button variant="outline-secondary">Attachment</Button> */}
              {/* <Button variant="outline-secondary">Send Attachment</Button> */}
            </InputGroup>
          </div>
        </>
      )}
    </div>
  );
};

export default SingleChat;
