import { useState } from "react";
import toast from "react-hot-toast";
import { UploadCloud } from "lucide-react";
import { ChatState } from "../../context/ChatProvider";
import api, { errorMessage } from "../../lib/api";
import {
  uploadToCloudinary,
  videoThumbnailUrl,
  IMAGE_TYPES,
  VIDEO_TYPES,
  DOCUMENT_TYPES,
} from "../../lib/cloudinary";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./primitives/Dialog";

const KIND_CONFIG = {
  file: {
    label: "File",
    accept:
      ".xlsx,.xls,.doc,.docx,.ppt,.pptx,.txt,.pdf,application/pdf,text/plain",
    resourceType: "auto",
    allowedTypes: DOCUMENT_TYPES,
    messageType: "file",
  },
  image: {
    label: "Image",
    accept: "image/*",
    resourceType: "image",
    allowedTypes: IMAGE_TYPES,
    messageType: "image",
  },
  video: {
    label: "Video",
    accept: "video/*",
    resourceType: "video",
    allowedTypes: VIDEO_TYPES,
    messageType: "video",
  },
};

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
  const [progress, setProgress] = useState(0);
  const [upload, setUpload] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const { selectedChat } = ChatState();
  const config = KIND_CONFIG[kind] ?? KIND_CONFIG.file;

  const reset = () => {
    setUpload(null);
    setPreview(null);
    setFileName("");
    setProgress(0);
  };

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const postDetails = async (file) => {
    if (!file) return;

    reset();
    setFileName(file.name);
    //Local object URL, so the preview shows instantly rather than waiting on
    //the upload round trip
    if (kind === "image" || kind === "video") {
      setPreview(URL.createObjectURL(file));
    }
    setLoading(true);

    try {
      const url = await uploadToCloudinary(file, {
        resourceType: config.resourceType,
        allowedTypes: config.allowedTypes,
        onProgress: setProgress,
      });

      setUpload({
        url,
        type: config.messageType,
        //Metadata only, and only what is cheap to know client-side - no
        //separate probe of the file just to fill in width/height/duration
        attachment: {
          mimeType: file.type,
          bytes: file.size,
          ...(kind === "video" ? { thumbnailUrl: videoThumbnailUrl(url) } : {}),
        },
      });
    } catch (error) {
      toast.error(error.message);
      reset();
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    postDetails(event.dataTransfer.files?.[0]);
  };

  const handleSendFile = async () => {
    if (!upload) return;

    try {
      const { data } = await api.post("/message", {
        content: upload.url,
        type: upload.type,
        attachment: upload.attachment,
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
          <DialogTitle>{`Upload ${config.label}`}</DialogTitle>
        </DialogHeader>

        <div
          className="uploadDrop"
          data-active={dragActive ? "" : undefined}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            aria-label={`Choose a ${config.label.toLowerCase()} to upload`}
            accept={config.accept}
            className="uploadDrop-input"
            onChange={(e) => postDetails(e.target.files?.[0])}
          />

          {preview && kind === "image" && (
            <img src={preview} alt="" className="uploadDrop-imagePreview" />
          )}
          {preview && kind === "video" && (
            // Local preview only, muted so it cannot surprise-autoplay audio
            <video
              src={preview}
              controls
              muted
              className="uploadDrop-imagePreview"
            />
          )}
          {!preview && (
            <>
              <UploadCloud size={22} aria-hidden="true" />
              <span className="uploadDrop-text">
                Drag a {config.label.toLowerCase()} here, or click to browse
              </span>
            </>
          )}

          {fileName && <span className="uploadDrop-fileName">{fileName}</span>}
        </div>

        {loading && (
          <div className="uploadDrop-progress">
            <div
              className="uploadDrop-progressBar"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <DialogFooter>
          <button
            type="button"
            className="modal-btn"
            disabled={loading || !upload}
            onClick={handleSendFile}
          >
            {loading ? `Uploading… ${progress}%` : "Send"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadModal;
