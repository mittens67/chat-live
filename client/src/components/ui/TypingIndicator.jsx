/**
 * Three bouncing dots.
 *
 * Replaces a react-lottie animation whose lottie-web dependency was roughly
 * 300kB of the 502kB chat bundle - for a 6kB animation rendered in a 25x150px
 * box. Same effect, no dependency.
 */
const TypingIndicator = () => (
  <div className="typing-indicator" role="status" aria-label="Typing">
    <span />
    <span />
    <span />
  </div>
);

export default TypingIndicator;
