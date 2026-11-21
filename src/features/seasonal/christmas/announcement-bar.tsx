import Link from "next/link";
import { Gift } from "lucide-react";

export function ChristmasAnnouncementBar() {
  return (
    <div className="bg-[#b3243b] px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
      <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
        <Gift className="size-4 shrink-0 text-[#f5c96a]" aria-hidden />
        Natal GR Design: encomende seus presentes personalizados com
        antecedência.
        <Link
          href="/produtos"
          className="font-semibold underline underline-offset-2"
        >
          Ver presentes
        </Link>
      </span>
    </div>
  );
}
