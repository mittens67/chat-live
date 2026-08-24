import {
  isSameSenderMargin,
  isSameUser,
  isUrlImage,
} from "../../config/chatLogic";
import attachmentPlaceholder from "../../assets/download.png";

const RenderMessage = ({ url, m, user, messages, i }) => {
  const isOwn = m.sender._id === user._id;

  const bubbleStyle = {
    backgroundColor: isOwn ? "#BEC6A0" : "#708871",
    marginLeft: isSameSenderMargin(messages, m, i, user._id),
    marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
    borderRadius: "20px",
    padding: "5px 15px",
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
