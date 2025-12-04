import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { releases } from "../data/releases";
import { ThemeToggle } from "@/features/theme/components/ThemeToggle";
import type { Release, ChangeCategory } from "../types/release";

const categoryStyles: Record<ChangeCategory, string> = {
  feature: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  fix: "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  improvement: "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  breaking: "bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400",
  change: "bg-purple-500/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
};

function CategoryBadge({ category }: { category: ChangeCategory }) {
  return (
    <span
      className={`justify-self-start px-1.5 py-0.5 text-[10px] font-medium rounded ${categoryStyles[category]}`}
    >
      {category}
    </span>
  );
}

function ReleaseEntry({ release }: { release: Release }) {
  return (
    <article className="py-8 border-b border-border last:border-0">
      <header className="flex items-baseline gap-3 mb-4">
        <span className="font-mono text-sm font-semibold text-foreground">
          {release.version}
        </span>
        <span className="text-xs text-muted-foreground">{release.date}</span>
      </header>

      <ul className="space-y-2">
        {release.changes.map((change, i) => (
          <li
            key={i}
            className="grid grid-cols-[80px_1fr] items-start gap-2.5 text-sm"
          >
            <CategoryBadge category={change.category} />
            <span className="text-muted-foreground">{change.text}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function ReleasesPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-xs text-muted-foreground font-mono">warpscew</span>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-lg font-semibold text-foreground mb-8">Releases</h1>

        <div>
          {releases.map((release) => (
            <ReleaseEntry key={release.version} release={release} />
          ))}
        </div>
      </main>
    </div>
  );
}
