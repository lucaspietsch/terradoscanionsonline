"use client";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;
export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  React.ComponentPropsWithoutRef<typeof Dialog.Content> & { side?: "right" | "left" | "top"; hideClose?: boolean }
>(({ className, children, side = "right", hideClose, ...props }, ref) => (
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[60] bg-sombra/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <Dialog.Content
      ref={ref}
      className={cn(
        "fixed z-[61] flex flex-col bg-nevoa shadow-xl outline-none transition ease-in-out data-[state=closed]:duration-200 data-[state=open]:duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out",
        side === "right" && "inset-y-0 right-0 h-full w-full max-w-md data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
        side === "left" && "inset-y-0 left-0 h-full w-[88%] max-w-sm data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
        side === "top" && "inset-x-0 top-0 data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        className,
      )}
      {...props}
    >
      {children}
      {!hideClose && (
        <Dialog.Close className="absolute right-4 top-4 rounded p-2 text-musgo hover:bg-musgo/10" aria-label="Fechar">
          <X className="h-5 w-5" strokeWidth={1.5} />
        </Dialog.Close>
      )}
    </Dialog.Content>
  </Dialog.Portal>
));
SheetContent.displayName = "SheetContent";
