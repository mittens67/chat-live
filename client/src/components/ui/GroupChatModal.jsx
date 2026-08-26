import { useState } from "react";
import toast from "react-hot-toast";

import { ChatState } from "../../context/ChatProvider";
import Loading from "./Loading";
import UserListItem from "./UserListItem";
import UserBadgeItem from "./UserBadgeItem";
import api, { errorMessage } from "../../lib/api";
import { useUserSearch } from "../../lib/useUserSearch";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./primitives/Dialog";

const GroupChatModal = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [groupChatName, setGroupChatName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const { chats, setChats, openChat } = ChatState();
  const { query, setQuery, results, loading, reset } = useUserSearch();

  const handleGroup = (userToAdd) => {
    if (selectedUsers.some((u) => u._id === userToAdd._id)) {
      toast.error("That user is already added");
      return;
    }
    setSelectedUsers((prev) => [...prev, userToAdd]);
  };

  const handleDelete = (delUser) => {
    setSelectedUsers((prev) => prev.filter((sel) => sel._id !== delUser._id));
  };

  const handleSubmit = async () => {
    //An empty array is truthy, so the old `!selectedUsers` check never caught
    //a group with no members
    if (!groupChatName.trim() || selectedUsers.length < 2) {
      toast.error("Enter a name and pick at least 2 people");
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await api.post("/chat/group", {
        name: groupChatName.trim(),
        users: selectedUsers.map((u) => u._id),
      });
      setChats([data, ...(chats ?? [])]);
      //Switches into the new group immediately, rather than leaving whatever
      //chat was open before still showing while the group merely appears in
      //the list - the previous code never called this, so "Group created!"
      //was the only feedback that anything had happened
      openChat(data);
      setOpen(false);
      toast.success("Group created!");
      setGroupChatName("");
      setSelectedUsers([]);
      reset();
    } catch (error) {
      toast.error(errorMessage(error, "Group could not be created"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Group Chat</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 text-left">
          <label className="field">
            <span className="field-label">Chat Name</span>
            <input
              type="text"
              required
              placeholder="Enter chat name"
              value={groupChatName}
              onChange={(e) => setGroupChatName(e.target.value)}
              className="field-input"
            />
          </label>

          <label className="field">
            <span className="field-label">Add Users</span>
            <input
              type="text"
              required
              placeholder="Search by name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="field-input"
            />
          </label>

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap">
              {selectedUsers.map((u) => (
                <UserBadgeItem
                  key={u._id}
                  user={u}
                  handler={() => handleDelete(u)}
                />
              ))}
            </div>
          )}

          {loading ? (
            <Loading />
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {results?.slice(0, 4).map((result) => (
                <UserListItem
                  user={result}
                  handler={() => handleGroup(result)}
                  key={result._id}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            className="modal-btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Creating…" : "Create"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GroupChatModal;
