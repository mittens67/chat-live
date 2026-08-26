import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from "react-router-dom";
import { Compass } from "lucide-react";

import Loading from "./components/ui/Loading";
import ErrorBoundary from "./components/ErrorBoundary";
import RequireAuth from "./components/RequireAuth";
import { ChatState } from "./context/ChatProvider";
import SocketProvider from "./context/SocketProvider";
import { setUnauthorizedHandler } from "./lib/api";

const HomePage = lazy(() => import("./pages/HomePage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));

const NotFound = () => (
  <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
    <Compass size={40} aria-hidden="true" className="text-border" />
    <p className="text-3xl font-semibold text-accent">404</p>
    <h1 className="text-xl font-semibold">That page does not exist.</h1>
    <p className="text-subtle">
      The link may be broken, or the page may have moved.
    </p>
    <Link
      to="/"
      className="mt-2 rounded-md bg-accent px-4 py-2 font-medium text-on-accent no-underline hover:bg-accent-hover"
    >
      Go home
    </Link>
  </div>
);

function App() {
  const { logout } = ChatState();

  //Lets the axios response interceptor clear context state on a 401, not just
  //localStorage - otherwise an expired token left the UI in a logged-in state
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  return (
    /* Theme now comes from data-theme on <html>, set in ChatProvider - no
       theme class, and no radial-gradient background fighting the panes */
    <div className="min-h-dvh bg-bg text-text">
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
