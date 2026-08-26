import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../../lib/cn";

/**
 * A slide-in drawer, replacing react-bootstrap's Offcanvas.
 *
 * Built on the same Radix Dialog primitive as Dialog.jsx - a Sheet is
 * accessibility-wise identical to a dialog (focus trap, Escape to close,
 * inert background), it just slides in from an edge instead of appearing
 * centered. No separate Radix package needed for that distinction.
 */
const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;

const SheetContent = ({ className, side = "left", children, ...props }) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 transition-opacity data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
    <DialogPrimitive.Content
      className={cn(
        "fixed inset-y-0 z-50 flex w-[calc(100%-3rem)] max-w-sm flex-col bg-surface p-5 shadow-lg transition-transform duration-200 focus:outline-none",
        side === "left" &&
          "left-0 border-r border-border data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0",
        side === "right" &&
          "right-0 border-l border-border data-[state=closed]:translate-x-full data-[state=open]:translate-x-0",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className="absolute right-4 top-4 rounded-sm text-subtle hover:text-text"
        aria-label="Close"
      >
        <X size={18} aria-hidden="true" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

const SheetHeader = ({ className, ...props }) => (
  <div className={cn("mb-4 pr-6", className)} {...props} />
);

const SheetTitle = ({ className, ...props }) => (
  <DialogPrimitive.Title
    className={cn("text-lg font-semibold text-text", className)}
    {...props}
  />
);

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle };
