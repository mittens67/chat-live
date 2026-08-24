import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from "react-router-dom";

import Loading from "./components/ui/Loading";
import ErrorBoundary from "./components/ErrorBoundary";
import RequireAuth from "./components/RequireAuth";
import { ChatState } from "./context/ChatProvider";
import SocketProvider from "./context/SocketProvider";
import { setUnauthorizedHandler } from "./lib/api";

const HomePage = lazy(() => import("./pages/HomePage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));

const NotFound = () => (
  <div className="not-found">
    <h1>404</h1>
    <p>That page does not exist.</p>
    <Link to="/">Go home</Link>
  </div>
);

function App() {
  const { darkTheme, logout } = ChatState();

  //Lets the axios response interceptor clear context state on a 401, not just
  //localStorage - otherwise an expired token left the UI in a logged-in state
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  return (
    <div className={darkTheme ? "theme-dark app" : "theme-light app"}>
      <ErrorBoundary>
        <SocketProvider>
          <Router>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route
                  path="/chats"
                  element={
                    <RequireAuth>
                      <ChatPage />
                    </RequireAuth>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </SocketProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;
