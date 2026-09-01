import {
  ArrowRight,
  BookOpen,
  Crown,
  Focus,
  Plus,
  Shield,
  Trophy,
} from "lucide-react";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

export function RulesDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-[#d8c5a7] hover:bg-white/5 hover:text-white"
        >
          <BookOpen className="size-4" />
          Rules
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-[#d7b66d]/20 bg-[#180b0d] text-[#f4e8d1] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            How to play SE!ZE
          </DialogTitle>
          <DialogDescription className="text-[#b9aa96]">
            Movement, capture, powers, and all three paths to victory.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-sm leading-6 text-[#d5c5ae]">
          <Rule icon={Shield} title="Move">
            Red moves first. Guards move one open square in any direction.
            Bosses move one or two open squares in any direction and cannot jump
            pieces.
          </Rule>
          <Rule icon={Plus} title="Attach a power">
            A guard on + gets a rook-like plus cap; × gives it a pyramid cap for
            long diagonals. A guard reaching a center marker takes a crown and
            becomes a boss.
          </Rule>
          <Rule icon={Focus} title="Capture">
            Complete a straight or diagonal sandwich with the piece you moved. A
            piece that moves into an existing sandwich is safe; only the player
            completing the trap captures.
          </Rule>
          <Rule icon={Crown} title="Win three ways">
            Occupy all four central spaces, capture every opposing boss, or
            reduce the opponent to two remaining pieces. Each side starts with
            two bosses, and center promotion can add more.
          </Rule>
          <Rule icon={Trophy} title="Score captures">
            Gain 1 point for a guard, 2 for a guard with a plus or pyramid cap,
            and 3 for any boss, including a crowned promotion. Scores are
            tracked without a timer and do not replace the three win conditions.
          </Rule>
          <Button
            asChild
            className="w-full bg-[#8f1832] text-white hover:bg-[#aa2140]"
          >
            <Link href="/rules">
              Open the visual guide <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Rule({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Shield;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[2.25rem_1fr] gap-3">
      <span className="grid size-9 place-items-center rounded-full border border-[#d7b66d]/20 bg-[#8a1730]/25 text-[#e2bd72]">
        <Icon className="size-4" />
      </span>
      <div>
        <h3 className="font-medium text-[#fff1d7]">{title}</h3>
        <p>{children}</p>
      </div>
    </div>
  );
}
