"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@utils/cn";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

const Drawer = ({ open, onOpenChange, title, children, className }: Props) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed right-0 top-0 z-50 h-full w-[92vw] max-w-md",
            "bg-surface border-l border-line-strong shadow-elevated p-6 overflow-y-auto",
            "data-[state=open]:animate-fade-in",
            className
          )}
        >
          {title && (
            <Dialog.Title className="font-display text-2xl tracking-tight mb-4">
              {title}
            </Dialog.Title>
          )}
          {children}
          <Dialog.Close
            className="absolute top-4 right-4 h-8 w-8 grid place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Drawer;
