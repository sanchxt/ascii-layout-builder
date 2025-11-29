import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { releases } from "../data/releases";
import type { Release, ChangeCategory } from "../types/release";

const categoryStyles: Record<ChangeCategory, string> = {
  feature: "bg-emerald-100 text-emerald-700",
  fix: "bg-amber-100 text-amber-700",
  improvement: "bg-blue-100 text-blue-700",
  breaking: "bg-red-100 text-red-700",
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
    <article className="py-8 border-b border-zinc-100 last:border-0">
      <header className="flex items-baseline gap-3 mb-4">
        <span className="font-mono text-sm font-semibold text-zinc-900">
          {release.version}
        </span>
        <span className="text-xs text-zinc-400">{release.date}</span>
      </header>

      <ul className="space-y-2">
        {release.changes.map((change, i) => (
          <li key={i} className="grid grid-cols-[80px_1fr] items-start gap-2.5 text-sm">
            <CategoryBadge category={change.category} />
            <span className="text-zinc-600">{change.text}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function ReleasesPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-sm">
        <div className="max-w-xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <span className="text-xs text-zinc-400 font-mono">warpscew</span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-lg font-semibold text-zinc-900 mb-8">Releases</h1>

        <div>
          {releases.map((release) => (
            <ReleaseEntry key={release.version} release={release} />
          ))}
        </div>
      </main>
    </div>
  );
}
