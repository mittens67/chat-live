import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Paperclip,
  Send,
  ArrowLeft,
  MessagesSquare,
  FileText,
  Image as ImageIcon,
  Video,
} from "lucide-react";

import ProfileModal from "./ProfileModal";
import EmojiPickerButton from "./EmojiPickerButton";
import {
  getSender,
  getSenderFull,
  insertMessageInOrder,
} from "../../config/chatLogic";

import { ChatState } from "../../context/ChatProvider";
import { useSocket } from "../../context/SocketProvider";
import UpdateGroupChatModal from "./UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";
import TypingIndicator from "./TypingIndicator";

import Loading from "./Loading";
import FileUploadModal from "./FileUploadModal";
import api, { errorMessage } from "../../lib/api";
import { DEFAULT_AVATAR, GROUP_AVATAR, onAvatarError } from "../../lib/defaultAvatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./primitives/DropdownMenu";

const TYPING_TIMEOUT = 3000;

const SingleChat = ({ setFetchAgain, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  //Which upload dialog is open, if any. One shared FileUploadModal instance
  //parameterized by kind, rather than two - it is opened from inside the
  //attachment DropdownMenu, and a Dialog trigger nested inside an open
  //dropdown is the one Radix combination that reliably fights over focus, so
  //this drives the dialog's `open` state directly instead.
  const [uploadKind, setUploadKind] = useState(null);

  const { selectedChat, user, setNotification } = ChatState();
  const { socket, connected } = useSocket();

  //Mirrors selectedChat for use inside socket callbacks without making the
  //listener depend on it (and therefore re-subscribe on every chat switch)
  const selectedChatRef = useRef(selectedChat);
  const typingRef = useRef(false);
  const typingTimerRef = useRef(null);
  const audioRef = useRef(null);
  //Chains this chat's own outgoing sends so only one is ever in flight.
  //sendMessage on the server does several sequential DB round trips
  //(Message.create, three populate() calls, a Chat update), so two sends
  //fired close together could both still be in flight at once - and their
  //writes could then land in either order, showing your own messages out of
  //the order you sent them in. Queuing removes that window entirely.
  const sendQueueRef = useRef(Promise.resolve());

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
        setMessages((prev) => insertMessageInOrder(prev, incoming));
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
    setMessages((prev) => insertMessageInOrder(prev, data));
    //Refetches the chat list so its own preview/timestamp update too. Without
    //this, sending a message only updated the open conversation - the sender's
    //own row in the list kept showing the old "latestMessage" until something
    //else happened to trigger a refetch (e.g. the recipient replying).
    setFetchAgain((prev) => !prev);
  };

  const submitMessage = () => {
    const content = newMessage.trim();
    if (!content || !selectedChat) return;

    stopTyping();
    setNewMessage("");
    const chatId = selectedChat._id;

    //Chained onto the previous send rather than fired immediately: this is
    //what keeps two quick sends from ever being in flight at the same time.
    //The user can keep typing right away - only the request to the server is
    //serialized, not the input.
    sendQueueRef.current = sendQueueRef.current
      .then(() => api.post("/message", { content, chatId }))
      .then(({ data }) => appendOwnMessage(data))
      .catch((error) => {
        setNewMessage((current) => current || content);
        toast.error(errorMessage(error, "Could not send message"));
      });
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

  const backButton = onBack && (
    <button
      type="button"
      title="Go back to chat list"
      onClick={onBack}
      className="singleChat-back md:hidden"
    >
      <ArrowLeft size={18} aria-hidden="true" />
      <span className="sr-only">Go back to chat list</span>
    </button>
  );

  return (
    <div className="singleChat">
      {!selectedChat ? (
        <div className="singleChat-blank">
          <MessagesSquare size={40} aria-hidden="true" />
          <p>Click on a user to start chatting</p>
        </div>
      ) : (
        <>
          {!selectedChat.isGroupChat ? (
            <div className="singleChat-header">
              <div className="singleChat-headerInfo">
                {backButton}
                <img
                  src={getSenderFull(user, selectedChat.users)?.picture || DEFAULT_AVATAR}
                  onError={onAvatarError}
                  alt=""
                  className="singleChat-avatar"
                />
                <p>{getSender(user, selectedChat.users)}</p>
              </div>
              <ProfileModal user={getSenderFull(user, selectedChat.users)} />
            </div>
          ) : (
            <div className="singleChat-header">
              <div className="singleChat-headerInfo">
                {backButton}
                <img src={GROUP_AVATAR} alt="" className="singleChat-avatar" />
                <p>{selectedChat.chatName?.toUpperCase()}</p>
              </div>
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
                <ScrollableChat
                  messages={messages}
                  isGroupChat={selectedChat.isGroupChat}
                />
              </div>
            )}
            {isTyping ? <TypingIndicator /> : null}

            <div className="composer">
              <input
                placeholder="Enter a message"
                aria-label="Message"
                onKeyDown={handleKeyDown}
                onChange={typingHandler}
                value={newMessage}
                className="composer-input"
              />

              <EmojiPickerButton
                onSelect={(emoji) => setNewMessage((prev) => prev + emoji)}
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="composer-btn"
                    aria-label="Attach a file"
                  >
                    <Paperclip size={16} aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onSelect={() => setUploadKind("file")}
                    className="flex items-center gap-2"
                  >
                    <FileText size={15} aria-hidden="true" className="shrink-0 text-subtle" />
                    Upload File
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setUploadKind("image")}
                    className="flex items-center gap-2"
                  >
                    <ImageIcon size={15} aria-hidden="true" className="shrink-0 text-subtle" />
                    Upload Image
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setUploadKind("video")}
                    className="flex items-center gap-2"
                  >
                    <Video size={15} aria-hidden="true" className="shrink-0 text-subtle" />
                    Upload Video
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={submitMessage}
                disabled={!newMessage.trim()}
                aria-label="Send message"
                className="composer-btn composer-btn--send"
              >
                <Send size={16} aria-hidden="true" />
              </button>
            </div>

            <FileUploadModal
              kind={uploadKind}
              open={Boolean(uploadKind)}
              onOpenChange={(next) => !next && setUploadKind(null)}
              handler={appendOwnMessage}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default SingleChat;
