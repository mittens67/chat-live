import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import InputGroup from "react-bootstrap/InputGroup";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

import ProfileModal from "./ProfileModal";
import { getSender, getSenderFull } from "../../config/chatLogic";

import { ChatState } from "../../context/ChatProvider";
import { useSocket } from "../../context/SocketProvider";
import UpdateGroupChatModal from "./UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";
import TypingIndicator from "./TypingIndicator";

import Loading from "./Loading";
import { FaPaperclip, FaPaperPlane } from "react-icons/fa";
import FileUploadModal from "./FileUploadModal";
import api, { errorMessage } from "../../lib/api";

const TYPING_TIMEOUT = 3000;

const SingleChat = ({ setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const { selectedChat, user, setNotification } = ChatState();
  const { socket, connected } = useSocket();

  //Mirrors selectedChat for use inside socket callbacks without making the
  //listener depend on it (and therefore re-subscribe on every chat switch)
  const selectedChatRef = useRef(selectedChat);
  const typingRef = useRef(false);
  const typingTimerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  //Bumping this re-runs the fetch below; it is what UpdateGroupChatModal calls
  //after changing membership.
  const [refetchToken, setRefetchToken] = useState(0);
  const fetchMessages = useCallback(() => setRefetchToken((n) => n + 1), []);

  const chatId = selectedChat?._id;

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return undefined;
    }

    //Aborting on cleanup means a slow response for chat A can never land after
    //the user has switched to chat B and overwrite B's messages
    const controller = new AbortController();

    setLoading(true);
    setMessages([]);

    (async () => {
      try {
        const { data } = await api.get(`/message/${chatId}`, {
          signal: controller.signal,
        });
        setMessages(data);
        socket?.emit("join chat", chatId);
      } catch (error) {
        if (!controller.signal.aborted) {
          toast.error(errorMessage(error, "Could not load messages"));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [chatId, socket, refetchToken]);

  //Incoming messages. Functional updates mean this listener never needs to see
  //current state, so it can subscribe once and stay correct - the old version
  //closed over first-render state and needed a ref mirror to work around it.
  useEffect(() => {
    if (!socket) return undefined;

    const handleMessage = (incoming) => {
      const open = selectedChatRef.current;

      if (!open || open._id !== incoming.chat._id) {
        setNotification((prev) =>
          //Compare by id: the socket payload is freshly deserialized, so
          //reference equality is always false and duplicates slipped through
          prev.some((n) => n._id === incoming._id) ? prev : [incoming, ...prev]
        );
        setFetchAgain((prev) => !prev);
      } else {
        setMessages((prev) =>
          prev.some((m) => m._id === incoming._id) ? prev : [...prev, incoming]
        );
      }

      if (!audioRef.current) {
        audioRef.current = new Audio("/ping.mp3");
      }
      //Autoplay is blocked until the user has interacted with the page; that
      //rejection is expected and must not surface as an unhandled rejection
      audioRef.current.play().catch(() => {});
    };

    const handleTyping = () => setIsTyping(true);
    const handleStopTyping = () => setIsTyping(false);

    socket.on("message recieved", handleMessage);
    socket.on("typing", handleTyping);
    socket.on("stop typing", handleStopTyping);

    return () => {
      //Named handlers, so these actually remove the listeners. Passing a fresh
      //arrow function to .off() removed nothing.
      socket.off("message recieved", handleMessage);
      socket.off("typing", handleTyping);
      socket.off("stop typing", handleStopTyping);
    };
  }, [socket, setNotification, setFetchAgain]);

  useEffect(() => () => clearTimeout(typingTimerRef.current), []);

  const stopTyping = useCallback(() => {
    clearTimeout(typingTimerRef.current);
    if (typingRef.current && selectedChatRef.current) {
      typingRef.current = false;
      socket?.emit("stop typing", selectedChatRef.current._id);
    }
  }, [socket]);

  //Only adds it locally. The server fans the message out to everyone else when
  //it persists it, so the client no longer emits its own copy - what recipients
  //saw used to be whatever this browser claimed rather than what was stored.
  const appendOwnMessage = (data) => {
    setMessages((prev) => [...prev, data]);
  };

  const submitMessage = async () => {
    const content = newMessage.trim();
    if (!content || !selectedChat) return;

    stopTyping();
    setNewMessage("");

    try {
      const { data } = await api.post("/message", {
        content,
        chatId: selectedChat._id,
      });
      appendOwnMessage(data);
    } catch (error) {
      setNewMessage(content);
      toast.error(errorMessage(error, "Could not send message"));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!connected || !selectedChat) return;

    if (!typingRef.current) {
      typingRef.current = true;
      socket?.emit("typing", selectedChat._id);
    }

    //A single rolling timer. The old version started a new timeout on every
    //keystroke and compared against a timestamp defined in the same tick, so
    //the throttle never fired and the indicator stuck on.
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, TYPING_TIMEOUT);
  };

  return (
    <div style={{ height: "100%" }}>
      {!selectedChat ? (
        <div className="singleChat-blank">
          <p>Click on a user to start chatting</p>
        </div>
      ) : (
        <>
          {!selectedChat.isGroupChat ? (
            <div className="singleChat-header">
              <p>{getSender(user, selectedChat.users)}</p>
              <ProfileModal user={getSenderFull(user, selectedChat.users)} />
            </div>
          ) : (
            <div className="singleChat-header">
              <p>{selectedChat.chatName?.toUpperCase()}</p>
              <UpdateGroupChatModal
                fetchMessages={fetchMessages}
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
            {isTyping ? <TypingIndicator /> : null}
            <InputGroup>
              <Form.Control
                placeholder="Enter a message"
                aria-label="Message"
                onKeyDown={handleKeyDown}
                onChange={typingHandler}
                value={newMessage}
              />
              <DropdownButton
                variant="outline-secondary"
                title={<FaPaperclip aria-hidden="true" />}
                id="input-group-dropdown-2"
                align="end"
              >
                <FileUploadModal title="File" handler={appendOwnMessage}>
                  <Dropdown.Item>Upload File</Dropdown.Item>
                </FileUploadModal>
                <Dropdown.Divider />
                <FileUploadModal title="Image" handler={appendOwnMessage}>
                  <Dropdown.Item>Upload Image</Dropdown.Item>
                </FileUploadModal>
              </DropdownButton>
              <Button
                variant="outline-secondary"
                onClick={submitMessage}
                disabled={!newMessage.trim()}
                aria-label="Send message"
              >
                <FaPaperPlane aria-hidden="true" />
              </Button>
            </InputGroup>
          </div>
        </>
      )}
    </div>
  );
};

export default SingleChat;
