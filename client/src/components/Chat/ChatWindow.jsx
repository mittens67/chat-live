import SingleChat from "../ui/SingleChat";

const ChatWindow = ({ setFetchAgain, showChatWindow, closeChatWindow }) => {
  return (
    /**
     * Tailwind visibility rather than Bootstrap's d-none/d-block, which are
     * `display: ... !important` and would override the flex container.
     *
     * The mobile back button used to render as a sibling row above
     * SingleChat, which read as two stacked header bars on small screens.
     * It now lives inside SingleChat's own header (passed down as onBack),
     * merging into one row.
     */
    <div
      className={`chatWindow min-h-0 flex-col ${
        showChatWindow ? "flex" : "hidden md:flex"
      }`}
    >
      <SingleChat setFetchAgain={setFetchAgain} onBack={closeChatWindow} />
    </div>
  );
};

export default ChatWindow;
