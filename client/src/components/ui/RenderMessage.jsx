import { inferMessageType } from "../../config/chatLogic";
import { FILE_ICON } from "../../lib/fileIcon";

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
  return (
    <a
      href={message.content}
      target="_blank"
      //Without noopener the opened page can navigate this one via
      //window.opener - reverse tabnabbing on user-supplied content
      rel="noopener noreferrer"
      className="block"
    >
      <img
        src={message.content}
        //No caption is available for user-uploaded content; naming the
        //sender is the most useful thing we can offer a screen reader
        alt={message.sender?.name ? `Sent by ${message.sender.name}` : "Attachment"}
        className="max-h-64 max-w-full rounded-lg object-cover"
        loading="lazy"
      />
    </a>
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

  return (
    <a
      href={message.content}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 no-underline"
    >
      <img src={FILE_ICON} alt="" className="h-8 w-8 shrink-0" />
      <span className="truncate underline decoration-1 underline-offset-2">
        {name}
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
