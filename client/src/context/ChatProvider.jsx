import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ChatContext = createContext();

const STORAGE_KEY = "userInfo";
const THEME_KEY = "darkTheme";

/** localStorage can hold anything; never let a bad value crash the app. */
const readJSON = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
};

const ChatProvider = ({ children }) => {
  //Hydrated lazily rather than in an effect, so the very first render already
  //has the user. The effect version left every consumer to cope with
  //`user === undefined` on mount, which is what left ChatList spinning forever.
  const [user, setUser] = useState(() => readJSON(STORAGE_KEY));
  const [selectedChat, setSelectedChat] = useState();
  const [chats, setChats] = useState(null);
  const [notification, setNotification] = useState([]);
  const [darkTheme, setDarkTheme] = useState(() => {
    const stored = readJSON(THEME_KEY);
    if (typeof stored === "boolean") return stored;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, JSON.stringify(darkTheme));
    //A single root attribute drives every themed token, replacing the root
    //class, the inline background styles, and the per-modal data-bs-theme props
    document.documentElement.dataset.theme = darkTheme ? "dark" : "light";
  }, [darkTheme]);

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setSelectedChat(undefined);
    setChats(null);
    setNotification([]);
  };

  const login = (userInfo) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
    setUser(userInfo);
  };

  /**
   * Selects a chat and marks it read.
   *
   * The single place "viewing a chat" and "clearing its unread state" are
   * linked. Every call site used to call setSelectedChat directly; the bell
   * dropdown separately filtered out only the one notification that was
   * clicked, so a chat with several unread messages stayed marked unread
   * after reading all of them, and opening a chat from the chat list itself
   * (rather than the bell) never cleared anything at all.
   */
  const openChat = (chat) => {
    setSelectedChat(chat);
    setNotification((prev) => prev.filter((n) => n.chat._id !== chat._id));
  };

  //Memoised: without this the value object is a new reference on every render,
  //so every consumer re-renders on any state change anywhere
  const value = useMemo(
    () => ({
      user,
      setUser,
      login,
      logout,
      selectedChat,
      setSelectedChat,
      openChat,
      chats,
      setChats,
      notification,
      setNotification,
      darkTheme,
      setDarkTheme,
    }),
    [user, selectedChat, chats, notification, darkTheme]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const ChatState = () => useContext(ChatContext);

export default ChatProvider;
