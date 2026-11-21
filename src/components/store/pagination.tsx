import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  searchParams,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set("pagina", String(targetPage));
    return `${basePath}?${params.toString()}`;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-1"
      aria-label="Paginação"
    >
      {pages.map((candidate) => (
        <Link
          key={candidate}
          href={hrefFor(candidate)}
          className={cn(
            "focus-ring flex size-9 items-center justify-center rounded-lg text-sm font-medium",
            candidate === page
              ? "bg-lilac-600 text-white"
              : "text-ink-700 hover:bg-lilac-50",
          )}
          aria-current={candidate === page ? "page" : undefined}
        >
          {candidate}
        </Link>
      ))}
    </nav>
  );
}
