import { useState } from "react";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import { ChatState } from "../../context/ChatProvider";

import Loading from "./Loading";
import UserListItem from "./UserListItem";
import api, { errorMessage } from "../../lib/api";
import { useUserSearch } from "../../lib/useUserSearch";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "./primitives/Sheet";

const SearchSidePanel = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const { openChat, chats, setChats } = ChatState();
  const { query, setQuery, results, loading } = useUserSearch();

  const accessChat = async (userId) => {
    setLoadingChat(true);

    try {
      const { data } = await api.post("/chat", { userId });

      //chats starts as null, so this used to throw if a result was clicked
      //before the chat list had loaded
      const existing = chats ?? [];
      if (!existing.find((c) => c._id === data._id)) {
        setChats([data, ...existing]);
      }

      openChat(data);
      setOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, "Could not open that chat"));
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>

      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Search Users</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-3">
          {/* Results come from a debounced hook now, so there is no search
              button to press and Enter no longer does nothing */}
          <div className="sidePanel-search">
            <Search size={16} aria-hidden="true" className="text-subtle shrink-0" />
            <input
              placeholder="Search by name or email"
              aria-label="Search users"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
            />
          </div>

          {loading || loadingChat ? (
            <Loading />
          ) : (
            results?.map((result) => (
              <UserListItem
                key={result._id}
                user={result}
                handler={() => accessChat(result._id)}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SearchSidePanel;
