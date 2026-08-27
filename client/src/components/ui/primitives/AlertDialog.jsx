import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "../../../lib/cn";

/**
 * A themed AlertDialog built on Radix, for destructive actions that need a
 * confirmation step (e.g. "Leave Group"). Unlike Dialog, AlertDialog has no
 * default close-on-overlay-click or Escape-to-close - the user must pick
 * Cancel or Action, which is the point for a destructive confirmation.
 */
const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogContent = ({ className, children, ...props }) => (
  <AlertDialogPrimitive.Portal>
    <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 transition-opacity data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
    <AlertDialogPrimitive.Content
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-5 shadow-lg transition-[opacity,transform] duration-150 focus:outline-none data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100",
        className
      )}
      {...props}
    >
      {children}
    </AlertDialogPrimitive.Content>
  </AlertDialogPrimitive.Portal>
);

const AlertDialogHeader = ({ className, ...props }) => (
  <div className={cn("mb-4 text-center", className)} {...props} />
);

const AlertDialogTitle = ({ className, ...props }) => (
  <AlertDialogPrimitive.Title
    className={cn("text-lg font-semibold text-text", className)}
    {...props}
  />
);

const AlertDialogDescription = ({ className, ...props }) => (
  <AlertDialogPrimitive.Description
    className={cn("mt-1.5 text-sm text-subtle", className)}
    {...props}
  />
);

const AlertDialogFooter = ({ className, ...props }) => (
  <div className={cn("mt-5 flex justify-end gap-2", className)} {...props} />
);

const AlertDialogCancel = ({ className, ...props }) => (
  <AlertDialogPrimitive.Cancel
    className={cn("modal-btn modal-btn--ghost", className)}
    {...props}
  />
);

const AlertDialogAction = ({ className, ...props }) => (
  <AlertDialogPrimitive.Action
    className={cn("modal-btn modal-btn--danger", className)}
    {...props}
  />
);

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
};
