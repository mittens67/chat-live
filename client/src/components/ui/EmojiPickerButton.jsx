import { lazy, Suspense } from "react";
import { Smile } from "lucide-react";

import { ChatState } from "../../context/ChatProvider";
import { Popover, PopoverTrigger, PopoverContent } from "./primitives/Popover";

//emoji-picker-react ships its own ~1MB dataset; loading it eagerly would tax
//every visit to the app for a feature most messages never touch. Split into
//its own chunk (see manualChunks in vite.config.js) and only fetched once
//the composer's emoji button is actually opened.
const EmojiPicker = lazy(() => import("emoji-picker-react"));

const EmojiPickerButton = ({ onSelect }) => {
  const { darkTheme } = ChatState();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="composer-btn" aria-label="Add an emoji">
          <Smile size={16} aria-hidden="true" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="border-none bg-transparent p-0 shadow-none">
        <Suspense
          fallback={
            <div className="flex h-80 w-72 items-center justify-center rounded-lg border border-border bg-surface text-sm text-subtle">
              Loading…
            </div>
          }
        >
          <EmojiPicker
            theme={darkTheme ? "dark" : "light"}
            onEmojiClick={(emojiData) => onSelect(emojiData.emoji)}
            emojiStyle="native"
            skinTonesDisabled
            previewConfig={{ showPreview: false }}
            width={288}
            height={320}
          />
        </Suspense>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPickerButton;
