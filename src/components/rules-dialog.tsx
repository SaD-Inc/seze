import {
  ArrowRight,
  BookOpen,
  Crown,
  Diamond,
  Focus,
  Shield,
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
            Prototype rules v0.1. Publicly known mechanics are implemented;
            unresolved details may change.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-sm leading-6 text-[#d5c5ae]">
          <Rule icon={Shield} title="Move">
            Guards move one open orthogonal space. Captains move one or two open
            orthogonal spaces and cannot jump pieces.
          </Rule>
          <Rule icon={Diamond} title="Use power spaces">
            A guard landing on a marked space gains one extended rook-like or
            bishop-like move. The power is spent when used.
          </Rule>
          <Rule icon={Focus} title="Capture">
            Sandwich an opposing piece orthogonally between the piece you moved
            and another friendly piece. A single move can capture on several
            sides.
          </Rule>
          <Rule icon={Crown} title="Win three ways">
            Occupy all four central spaces, capture both opposing captains, or
            reduce the opponent to two remaining pieces.
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
