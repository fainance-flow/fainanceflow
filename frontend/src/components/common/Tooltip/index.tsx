"use client";

import * as RT from "@radix-ui/react-tooltip";

type Props = {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
};

const Tooltip = ({ content, children, side = "top", delayDuration = 200 }: Props) => {
  return (
    <RT.Provider delayDuration={delayDuration}>
      <RT.Root>
        <RT.Trigger asChild>{children}</RT.Trigger>
        <RT.Portal>
          <RT.Content
            side={side}
            sideOffset={6}
            className="z-50 px-2.5 py-1.5 rounded-md bg-ink text-canvas text-xs font-mono tracking-wide shadow-elevated animate-fade-in"
          >
            {content}
            <RT.Arrow className="fill-ink" />
          </RT.Content>
        </RT.Portal>
      </RT.Root>
    </RT.Provider>
  );
};

export default Tooltip;
