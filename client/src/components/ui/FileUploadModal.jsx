import { useState } from "react";
import toast from "react-hot-toast";
import { ChatState } from "../../context/ChatProvider";
import api, { errorMessage } from "../../lib/api";
import {
  uploadToCloudinary,
  IMAGE_TYPES,
  DOCUMENT_TYPES,
} from "../../lib/cloudinary";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./primitives/Dialog";

const IMAGE_ACCEPT = "image/*";
const FILE_ACCEPT =
  ".xlsx,.xls,.doc,.docx,.ppt,.pptx,.txt,.pdf,application/pdf,text/plain";

/**
 * Controlled only - no internal trigger.
 *
 * This is opened from inside SingleChat's attachment DropdownMenu. Nesting a
 * Dialog trigger inside an already-open dropdown menu is the one Radix
 * combination that reliably fights over focus (the menu's own close-and-
 * return-focus behaviour races the dialog's focus trap); the fix is for the
 * parent to own `open` state and drive this directly, with no trigger
 * element here for the two roots to contend over.
 */
const FileUploadModal = ({ kind, open, onOpenChange, handler }) => {
  const [loading, setLoading] = useState(false);
  const [upload, setUpload] = useState(null);

  const { selectedChat } = ChatState();

  const isDocument = kind === "file";
  const label = isDocument ? "File" : "Image";

  const close = () => {
    setUpload(null);
    onOpenChange(false);
  };

  const postDetails = async (file) => {
    if (!file) return;

    setLoading(true);

    try {
      const url = await uploadToCloudinary(file, {
        resourceType: isDocument ? "auto" : "image",
        allowedTypes: isDocument ? DOCUMENT_TYPES : IMAGE_TYPES,
      });

      setUpload({ url, type: isDocument ? "file" : "image" });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFile = async () => {
    if (!upload) return;

    try {
      const { data } = await api.post("/message", {
        content: upload.url,
        type: upload.type,
        chatId: selectedChat._id,
      });

      handler(data);
      close();
    } catch (error) {
      close();
      toast.error(errorMessage(error, "Could not send the file"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`Upload ${label}`}</DialogTitle>
        </DialogHeader>

        <input
          type="file"
          aria-label={`Choose a ${label.toLowerCase()} to upload`}
          accept={isDocument ? FILE_ACCEPT : IMAGE_ACCEPT}
          onChange={(e) => postDetails(e.target.files[0])}
          className="field-input"
        />

        <DialogFooter>
          <button
            type="button"
            className="modal-btn"
            disabled={loading || !upload}
            onClick={handleSendFile}
          >
            {loading ? "Uploading..." : "Send"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadModal;
