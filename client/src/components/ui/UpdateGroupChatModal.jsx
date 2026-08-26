import { useState } from "react";
import toast from "react-hot-toast";
import { Pencil } from "lucide-react";

import UserBadgeItem from "./UserBadgeItem";
import Loading from "./Loading";
import UserListItem from "./UserListItem";
import { ChatState } from "../../context/ChatProvider";
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
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./primitives/AlertDialog";

//fetchAgain is no longer needed as a prop: the flips below use the functional
//updater form, so this never has to read the current value
const UpdateGroupChatModal = ({ fetchMessages, setFetchAgain }) => {
  const [open, setOpen] = useState(false);
  const [groupChatName, setGroupChatName] = useState("");
  const [loading, setLoading] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);

  const { selectedChat, setSelectedChat, user } = ChatState();
  const { query, setQuery, results, loading: searching } = useUserSearch();

  const isAdmin = selectedChat?.groupAdmin?._id === user._id;

  const handleAddUser = async (userToAdd) => {
    if (selectedChat.users.find((u) => u._id === userToAdd._id)) {
      toast.error("That user is already in this group");
      return;
    }

    //The server enforces this too; checking here just avoids a pointless round
    //trip and gives a clearer message
    if (!isAdmin) {
      toast.error("Only the group admin can add members");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.put("/chat/groupadd", {
        chatId: selectedChat._id,
        userId: userToAdd._id,
      });
      setSelectedChat(data);
      setFetchAgain((prev) => !prev);
    } catch (error) {
      toast.error(errorMessage(error, "Could not add that user"));
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async () => {
    const name = groupChatName.trim();
    if (!name) return;

    setRenameLoading(true);

    try {
      const { data } = await api.put("/chat/rename", {
        chatId: selectedChat._id,
        chatName: name,
      });
      setSelectedChat(data);
      setFetchAgain((prev) => !prev);
      setGroupChatName("");
    } catch (error) {
      toast.error(errorMessage(error, "Could not rename group"));
    } finally {
      setRenameLoading(false);
    }
  };

  const handleRemove = async (userToRemove) => {
    const isSelf = userToRemove._id === user._id;

    if (!isAdmin && !isSelf) {
      toast.error("Only the group admin can remove members");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.put("/chat/groupremove", {
        chatId: selectedChat._id,
        userId: userToRemove._id,
      });

      if (isSelf) {
        //Leaving closes the chat; there is nothing left to refetch
        setSelectedChat(undefined);
        setOpen(false);
      } else {
        setSelectedChat(data);
        fetchMessages();
      }

      setFetchAgain((prev) => !prev);
    } catch (error) {
      toast.error(errorMessage(error, "Could not remove that user"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="modal-btn" aria-label="Edit group">
          <Pencil size={16} aria-hidden="true" />
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selectedChat.chatName}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-left">
          <div className="flex flex-wrap">
            {selectedChat.users.map((u) => (
              <UserBadgeItem
                key={u._id}
                user={u}
                isAdmin={selectedChat.groupAdmin?._id === u._id}
                //Only show a remove control where the action is actually
                //permitted, instead of on every member
                handler={
                  isAdmin || u._id === user._id
                    ? () => handleRemove(u)
                    : undefined
                }
              />
            ))}
          </div>

          <div className="flex gap-2">
            <input
              placeholder="Rename group"
              aria-label="New group name"
              value={groupChatName}
              onChange={(e) => setGroupChatName(e.target.value)}
              className="field-input"
            />
            <button
              type="button"
              className="modal-btn shrink-0"
              disabled={renameLoading}
              onClick={handleRename}
            >
              {renameLoading ? "Saving…" : "Update"}
            </button>
          </div>

          <input
            placeholder="Add members"
            aria-label="Search members to add"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="field-input"
          />

          {searching || loading ? (
            <Loading />
          ) : (
            <div className="max-h-40 overflow-y-auto mask-[linear-gradient(to_bottom,transparent,black_12px,black_calc(100%-12px),transparent)]">
              {results?.map((result) => (
                <UserListItem
                  key={result._id}
                  user={result}
                  handler={() => handleAddUser(result)}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className="modal-btn modal-btn--danger">
                Leave Group
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave {selectedChat.chatName}?</AlertDialogTitle>
                <AlertDialogDescription>
                  You&apos;ll stop receiving messages from this group. An admin
                  can add you back later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleRemove(user)}>
                  Leave Group
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateGroupChatModal;
