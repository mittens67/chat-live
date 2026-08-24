import { cloneElement } from "react";

/**
 * Attaches an open handler to whatever element it wraps.
 *
 * The modals used to wrap their trigger in `<span onClick={...}>`, which put
 * the click handler on a non-interactive element - not focusable, not
 * keyboard-operable. Cloning the child instead puts the handler on the Button
 * or Dropdown.Item that is already accessible.
 */
const ModalTrigger = ({ children, onClick }) => {
  if (!children) return null;
  return cloneElement(children, { onClick });
};

export default ModalTrigger;
