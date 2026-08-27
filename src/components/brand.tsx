import Link from "next/link";

import { cn } from "~/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-3 font-semibold tracking-[0.16em] text-[#f4e8ce]",
        className,
      )}
    >
      <span className="grid size-9 place-items-center rounded-full border border-[#cfa85b]/60 bg-[#6f0c1f] font-serif text-sm text-[#e9ca87] shadow-[inset_0_0_0_3px_rgba(44,7,13,0.55)]">
        16
      </span>
      <span className="font-serif text-xl tracking-[0.18em]">SE!ZE</span>
    </Link>
  );
}
