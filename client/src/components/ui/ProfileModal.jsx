import { Eye, Mail } from "lucide-react";
import { DEFAULT_AVATAR, onAvatarError } from "../../lib/defaultAvatar";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./primitives/Dialog";

/**
 * Two modes, both real uses in this app:
 *
 * - Controlled (open/onOpenChange passed): triggered from inside Header's
 *   account DropdownMenu. No trigger is rendered here - nesting a Dialog
 *   trigger inside an open dropdown menu is the one Radix combination that
 *   reliably fights over focus, so the menu item drives this directly.
 * - Uncontrolled (neither passed): renders its own eye-icon trigger, used
 *   standalone in a 1-1 chat header where there is no surrounding overlay to
 *   conflict with.
 */
const ProfileModal = ({ user, open, onOpenChange }) => {
  const isControlled = open !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <button
            type="button"
            className="modal-btn"
            aria-label={`View ${user.name}'s profile`}
          >
            <Eye size={16} aria-hidden="true" />
          </button>
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 text-center">
          <img
            src={user.picture || DEFAULT_AVATAR}
            onError={onAvatarError}
            alt=""
            className="h-28 w-28 rounded-full object-cover shadow-[0_0_0_3px_var(--c-border)]"
          />
          <div className="flex w-full items-center gap-2 rounded-md bg-raised px-3 py-2 text-left text-sm">
            <Mail size={16} aria-hidden="true" className="shrink-0 text-subtle" />
            <span className="truncate">{user.email}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
