import { isSameSenderMargin, isSameUser, isUrlImage } from "../../config/chatLogic";

const RenderMessage = ({ url, m, user, messages, i }) => {

  const defaultImage = "./src/assets/download.png";
  

  if (url) {
     let imgSrc = isUrlImage(m.content) ? m.content : defaultImage;
     console.log(imgSrc);
    return (
      <a
        href={m.content}
        target="_blank"
        style={{
          backgroundColor: `${
            m.sender._id === user._id ? "#BEC6A0" : "#708871"
          }`,
          display: "inline-block",
          marginLeft: isSameSenderMargin(messages, m, i, user._id),
          marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
          borderRadius: "20px",
          padding: "5px 15px",
        }}
      >
        <img
          src={imgSrc}
          alt="Click to view attachment in new tab"
          style={{
            maxWidth: "75%",
            maxHeight: "150px",
            maxWidth: "150px",
            minHeight: "100px",
            minWidth: "100px",
          }}
        />
      </a>
    );
  } else {
    return (
      <span
        style={{
          backgroundColor: `${
            m.sender._id === user._id ? "#BEC6A0" : "#708871"
          }`,
          marginLeft: isSameSenderMargin(messages, m, i, user._id),
          marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
          borderRadius: "20px",
          padding: "5px 15px",
          maxWidth: "75%",
        }}
      >
        {m.content}
      </span>
    );
  }
};

export default RenderMessage;
