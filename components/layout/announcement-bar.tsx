import { Leaf } from "lucide-react";

export function AnnouncementBar({ text }: { text: string }) {
  return (
    <div className="bg-musgo text-pedra" role="note">
      <p className="container flex h-9 items-center justify-center gap-2 text-center text-[0.8125rem] font-light tracking-wide">
        <Leaf className="h-3.5 w-3.5 shrink-0 text-salvia-clara" strokeWidth={1.5} aria-hidden />
        {text}
      </p>
    </div>
  );
}
