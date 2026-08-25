import {
  isSameSenderMargin,
  isSameUser,
  isUrlImage,
} from "../../config/chatLogic";
import attachmentPlaceholder from "../../assets/download.png";

const RenderMessage = ({ url, m, user, messages, i }) => {
  const isOwn = m.sender._id === user._id;

  //Tokens rather than hardcoded hex, so bubbles follow the theme and are
  //legible: the received bubble was #708871 with inherited black text, which
  //is 2.9:1 and fails WCAG AA. Both pairings are now verified above 4.5:1.
  const bubbleStyle = {
    backgroundColor: isOwn ? "var(--c-sent-bg)" : "var(--c-received-bg)",
    color: isOwn ? "var(--c-sent-text)" : "var(--c-received-text)",
    marginLeft: isSameSenderMargin(messages, m, i, user._id),
    marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
    borderRadius: "var(--radius-xl)",
    padding: "0.375rem 0.75rem",
  };

  if (url) {
    const isImage = isUrlImage(m.content);

    return (
      <a
        href={m.content}
        target="_blank"
        //Without noopener the opened page can navigate this one via
        //window.opener - reverse tabnabbing on user-supplied content
        rel="noopener noreferrer"
        style={{ ...bubbleStyle, display: "inline-block" }}
      >
        <img
          //An imported asset, so Vite fingerprints it and it exists in the
          //build. The previous raw "./src/assets/..." path 404'd in production.
          src={isImage ? m.content : attachmentPlaceholder}
          alt={isImage ? "Image attachment" : "File attachment"}
          style={{
            maxWidth: "150px",
            maxHeight: "150px",
            minHeight: "100px",
            minWidth: "100px",
          }}
        />
      </a>
    );
  }

  return <span style={{ ...bubbleStyle, maxWidth: "75%" }}>{m.content}</span>;
};

export default RenderMessage;
