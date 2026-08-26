import { useState } from "react";

import { inferMessageType, formatFileSize } from "../../config/chatLogic";
import { FILE_ICON } from "../../lib/fileIcon";
import { Dialog, DialogTrigger, DialogContent } from "./primitives/Dialog";

/**
 * One bubble's content, dispatched by message type.
 *
 * Previously this was a single component branching on a boolean `url` prop
 * derived by sniffing `content` at render time - there was no way to tell an
 * image from a file from plain text except by re-parsing the string. Now it
 * dispatches on the `type` field from Phase 1 (falling back to
 * inferMessageType for rows written before that field existed), and each
 * type owns its own layout rather than forcing images through the same
 * anchor-wrapped-in-bubble shape as text.
 */
const RENDERERS = {
  text: TextContent,
  image: ImageContent,
  video: VideoContent,
  file: FileContent,
};

function TextContent({ message }) {
  return <span className="whitespace-pre-wrap break-words">{message.content}</span>;
}

function ImageContent({ message }) {
  const [open, setOpen] = useState(false);
  //No caption is available for user-uploaded content; naming the sender is
  //the most useful thing we can offer a screen reader
  const alt = message.sender?.name ? `Sent by ${message.sender.name}` : "Attachment";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="block cursor-zoom-in rounded-lg p-0"
          aria-label={`View image sent${message.sender?.name ? ` by ${message.sender.name}` : ""}`}
        >
          <img
            src={message.content}
            alt={alt}
            className="max-h-64 max-w-full rounded-lg object-cover"
            loading="lazy"
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
        <img
          src={message.content}
          alt={alt}
          className="max-h-[85dvh] w-full rounded-lg object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}

function VideoContent({ message }) {
  return (
    // User-uploaded video has no caption track to offer; there is nothing to
    // attach a <track> to.
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      src={message.content}
      controls
      //Metadata only until played, so scrolling a chat full of clips does not
      //pull every video's full bytes
      preload="metadata"
      poster={message.attachment?.thumbnailUrl}
      className="max-h-64 max-w-full rounded-lg"
    >
      Your browser cannot play this video.
    </video>
  );
}

function FileContent({ message }) {
  const name = message.content.split("/").pop()?.split("?")[0] || "Attachment";
  const size = formatFileSize(message.attachment?.bytes);

  return (
    <a
      href={message.content}
      target="_blank"
      rel="noopener noreferrer"
      //border-current ties the card border to whichever bubble color this
      //renders inside (sent vs received) without a new token
      className="flex min-w-0 max-w-56 items-center gap-2.5 rounded-lg border border-current/15 px-2.5 py-2 no-underline"
    >
      <img src={FILE_ICON} alt="" className="h-8 w-8 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name}</span>
        {size && <span className="block text-xs opacity-70">{size}</span>}
      </span>
    </a>
  );
}

const RenderMessage = ({ message }) => {
  const type = inferMessageType(message);
  const Content = RENDERERS[type] ?? TextContent;

  //No width constraint here - the bubble around this (in ScrollableChat) is
  //auto-width, sized to its content, and already capped at 75% of the row.
  //A percentage max-width applied *again* in here would be a percentage of
  //that auto-width bubble - a width that depends on its own content - which
  //browsers cannot resolve sensibly during layout. In practice it collapsed
  //toward zero, so short messages wrapped one character per line.
  return <Content message={message} />;
};

export default RenderMessage;
