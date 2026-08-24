import { createContext, useContext, useEffect, useMemo, useState } from "react";
import io from "socket.io-client";

import { SOCKET_URL } from "../lib/config";
import { ChatState } from "./ChatProvider";

const SocketContext = createContext({ socket: null, connected: false });

/**
 * Owns the single socket connection for the app.
 *
 * Previously the connection lived in a module-level `let socket` inside
 * SingleChat, was created in an effect that never disconnected, and was
 * therefore duplicated by StrictMode's double-invoke and leaked on every
 * navigation. Keeping it here means exactly one connection, tied to the
 * lifetime of the logged-in user, with real teardown.
 */
const SocketProvider = ({ children }) => {
  const { user } = ChatState();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  const token = user?.token;

  useEffect(() => {
    if (!token) {
      setSocket(null);
      setConnected(false);
      return undefined;
    }

    //The server authenticates the handshake, so the token goes here rather
    //than being emitted afterwards in a "setup" payload
    const instance = io(SOCKET_URL, {
      auth: { token },
      withCredentials: false,
    });

    instance.on("connected", () => setConnected(true));
    instance.on("disconnect", () => setConnected(false));
    instance.on("connect_error", () => setConnected(false));

    setSocket(instance);

    return () => {
      instance.removeAllListeners();
      instance.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [token]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

export default SocketProvider;
