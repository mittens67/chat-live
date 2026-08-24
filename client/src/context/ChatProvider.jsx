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
