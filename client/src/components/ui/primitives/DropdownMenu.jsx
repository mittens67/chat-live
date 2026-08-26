import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "../../../lib/cn";

/** A themed dropdown menu built on Radix, replacing react-bootstrap's Dropdown. */
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuContent = ({
  className,
  sideOffset = 8,
  align = "end",
  ...props
}) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      sideOffset={sideOffset}
      align={align}
      className={cn(
        "z-50 min-w-56 overflow-hidden rounded-lg border border-border bg-surface p-1 shadow-lg transition-opacity data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
);

const DropdownMenuItem = ({ className, ...props }) => (
  <DropdownMenuPrimitive.Item
    className={cn(
      "cursor-pointer rounded-md px-3 py-2 text-sm text-text outline-none data-[disabled]:cursor-default data-[disabled]:opacity-50 data-[highlighted]:bg-accent-subtle",
      className
    )}
    {...props}
  />
);

/** Non-interactive text, e.g. "No new messages". */
const DropdownMenuLabel = ({ className, ...props }) => (
  <div className={cn("px-3 py-2 text-sm text-subtle", className)} {...props} />
);

const DropdownMenuSeparator = ({ className, ...props }) => (
  <DropdownMenuPrimitive.Separator
    className={cn("my-1 h-px bg-border", className)}
    {...props}
  />
);

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
