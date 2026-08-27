import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../../../lib/cn";

/**
 * A themed floating panel built on Radix, for rich interactive content that
 * needs its own internal focus/keyboard handling (the emoji picker's search
 * box and grid) - unlike DropdownMenu, Popover does not impose roving-
 * tabindex/typeahead menu semantics that would fight with a widget's own.
 */
const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = ({ className, align = "end", sideOffset = 8, ...props }) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-lg border border-border bg-surface shadow-lg outline-none transition-[opacity,transform] duration-150 data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
);

export { Popover, PopoverTrigger, PopoverContent };
