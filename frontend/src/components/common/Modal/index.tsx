"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@utils/cn";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeMap: Record<NonNullable<Props["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const Modal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  size = "md",
}: Props) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Backdrop — always dark regardless of theme */}
        <Dialog.Overlay
          className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-sm data-[state=open]:animate-fade-in"
        />
        {/* Content — fixed full-screen flex container so the inner card is always
            perfectly centered regardless of viewport size or scroll position */}
        <Dialog.Content
          className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 outline-none"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div
            className={cn(
              "relative w-full bg-surface border border-line-strong rounded-2xl shadow-elevated",
              "max-h-[calc(100vh-2rem)] overflow-y-auto",
              "data-[state=open]:animate-fade-up",
              sizeMap[size],
              className
            )}
          >
            <div className="p-6">
              {title && (
                <div className="mb-5 pr-10">
                  <span className="editorial-rule">Composing</span>
                  <Dialog.Title className="font-display text-2xl tracking-tight mt-2">
                    {title}
                  </Dialog.Title>
                  {description && (
                    <Dialog.Description className="text-sm text-muted mt-1">
                      {description}
                    </Dialog.Description>
                  )}
                </div>
              )}
              {children}
            </div>
            <Dialog.Close
              className="absolute top-4 right-4 h-9 w-9 grid place-items-center rounded-full bg-surface-2 text-muted hover:bg-surface-2/70 hover:text-ink transition-colors border border-line-strong"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Modal;
