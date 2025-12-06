import type {
  Command,
  CommandGroup,
  CommandCategory,
  SearchResult,
  RecentCommandEntry,
} from "../types/command";
import { CATEGORY_CONFIG } from "../types/command";
import {
  parseLayoutCommand,
  getCommandSuggestions,
} from "@/features/layout-system/lib/layoutParser";

export function fuzzySearch(
  query: string,
  commands: Command[],
  recentCommands: RecentCommandEntry[] = []
): SearchResult[] {
  if (!query.trim()) {
    return commands.map((cmd) => ({
      command: cmd,
      score: 0,
      matchedIndices: [],
    }));
  }

  const lowerQuery = query.toLowerCase();
  const queryTokens = lowerQuery.split(/\s+/).filter(Boolean);

  const results: SearchResult[] = [];

  for (const command of commands) {
    if (command.isAvailable && !command.isAvailable()) continue;

    let score = 0;
    const matchedIndices: number[] = [];
    const lowerLabel = command.label.toLowerCase();

    if (lowerLabel === lowerQuery) {
      score += 100;
      matchedIndices.push(
        ...Array.from({ length: command.label.length }, (_, i) => i)
      );
    } else if (lowerLabel.startsWith(lowerQuery)) {
      score += 50;
      matchedIndices.push(...Array.from({ length: query.length }, (_, i) => i));
    } else if (lowerLabel.includes(lowerQuery)) {
      score += 30;
      const idx = lowerLabel.indexOf(lowerQuery);
      matchedIndices.push(
        ...Array.from({ length: query.length }, (_, i) => idx + i)
      );
    } else {
      let tokenScore = 0;
      for (const token of queryTokens) {
        if (lowerLabel.includes(token)) {
          tokenScore += 15;
          const idx = lowerLabel.indexOf(token);
          matchedIndices.push(
            ...Array.from({ length: token.length }, (_, i) => idx + i)
          );
        }
      }
      score += tokenScore;
    }

    if (command.keywords) {
      for (const keyword of command.keywords) {
        const lowerKeyword = keyword.toLowerCase();
        if (lowerKeyword === lowerQuery) {
          score += 25;
        } else if (lowerKeyword.startsWith(lowerQuery)) {
          score += 20;
        } else if (lowerKeyword.includes(lowerQuery)) {
          score += 15;
        }
        for (const token of queryTokens) {
          if (lowerKeyword.includes(token)) {
            score += 10;
          }
        }
      }
    }

    if (command.description) {
      const lowerDesc = command.description.toLowerCase();
      if (lowerDesc.includes(lowerQuery)) {
        score += 10;
      }
      for (const token of queryTokens) {
        if (lowerDesc.includes(token)) {
          score += 5;
        }
      }
    }

    if (command.id.toLowerCase().includes(lowerQuery)) {
      score += 5;
    }

    if (command.category.toLowerCase().includes(lowerQuery)) {
      score += 8;
    }

    if (command.priority === "high") {
      score += 10;
    } else if (command.priority === "low") {
      score -= 5;
    }

    const recentEntry = recentCommands.find((r) => r.commandId === command.id);
    if (recentEntry) {
      const hoursSinceUse =
        (Date.now() - recentEntry.timestamp) / (1000 * 60 * 60);
      const recencyBoost = Math.max(0, 15 - hoursSinceUse * 0.5);
      score += recencyBoost;
      score += Math.min(recentEntry.executionCount * 2, 10);
    }

    if (score > 0) {
      results.push({
        command,
        score,
        matchedIndices: [...new Set(matchedIndices)].sort((a, b) => a - b),
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

export function groupByCategory(commands: Command[]): CommandGroup[] {
  const groups = new Map<CommandCategory, Command[]>();

  for (const command of commands) {
    if (command.isAvailable && !command.isAvailable()) continue;

    const existing = groups.get(command.category) || [];
    existing.push(command);
    groups.set(command.category, existing);
  }

  const result: CommandGroup[] = [];
  for (const [category, cmds] of groups) {
    const config = CATEGORY_CONFIG[category];
    result.push({
      id: category,
      label: config.label,
      icon: config.icon,
      commands: cmds,
    });
  }

  return result.sort((a, b) => {
    const orderA = CATEGORY_CONFIG[a.id as CommandCategory]?.order ?? 99;
    const orderB = CATEGORY_CONFIG[b.id as CommandCategory]?.order ?? 99;
    return orderA - orderB;
  });
}

export function groupSearchResults(results: SearchResult[]): CommandGroup[] {
  const groups = new Map<CommandCategory, SearchResult[]>();

  for (const result of results) {
    const category = result.command.category;
    const existing = groups.get(category) || [];
    existing.push(result);
    groups.set(category, existing);
  }

  const grouped: CommandGroup[] = [];
  for (const [category, categoryResults] of groups) {
    const config = CATEGORY_CONFIG[category];
    grouped.push({
      id: category,
      label: config.label,
      icon: config.icon,
      commands: categoryResults.map((r) => r.command),
    });
  }

  return grouped.sort((a, b) => {
    const maxScoreA =
      results.find((r) => r.command.category === a.id)?.score ?? 0;
    const maxScoreB =
      results.find((r) => r.command.category === b.id)?.score ?? 0;
    return maxScoreB - maxScoreA;
  });
}

export function detectLayoutSyntax(query: string): {
  isLayout: boolean;
  parsed: ReturnType<typeof parseLayoutCommand> | null;
  suggestions: string[];
} {
  const trimmed = query.trim().toLowerCase();

  const layoutKeywords = ["flex", "grid", "layout", "row", "col", "column"];
  const startsWithLayoutKeyword = layoutKeywords.some((kw) =>
    trimmed.startsWith(kw)
  );

  const gridPattern = /^\d+x\d+/;
  const isGridPattern = gridPattern.test(trimmed);

  if (!startsWithLayoutKeyword && !isGridPattern) {
    return { isLayout: false, parsed: null, suggestions: [] };
  }

  const parsed = parseLayoutCommand(query);
  const suggestions = getCommandSuggestions(query);

  return {
    isLayout: true,
    parsed,
    suggestions,
  };
}

export function filterBySelectionContext(
  commands: Command[],
  hasSelection: boolean,
  selectionCount: number,
  selectedTypes: ("box" | "line" | "artboard")[]
): Command[] {
  return commands.filter((cmd) => {
    if (cmd.isAvailable && !cmd.isAvailable()) return false;

    if (!cmd.meta) return true;

    const {
      requiresSelection,
      selectionType,
      minSelectionCount,
      maxSelectionCount,
    } = cmd.meta;

    if (requiresSelection && !hasSelection) return false;

    if (selectionType && selectionType.length > 0) {
      const hasMatchingType = selectedTypes.some((t) =>
        selectionType.includes(t)
      );
      if (!hasMatchingType && hasSelection) return false;
    }

    if (minSelectionCount !== undefined && selectionCount < minSelectionCount)
      return false;

    if (maxSelectionCount !== undefined && selectionCount > maxSelectionCount)
      return false;

    return true;
  });
}

export function getRecentCommands(
  allCommands: Command[],
  recentEntries: RecentCommandEntry[],
  limit = 5
): Command[] {
  const commandMap = new Map(allCommands.map((c) => [c.id, c]));

  return recentEntries
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
    .map((entry) => commandMap.get(entry.commandId))
    .filter(
      (cmd): cmd is Command =>
        cmd !== undefined && (!cmd.isAvailable || cmd.isAvailable())
    );
}

export function highlightMatches(
  text: string,
  matchedIndices: number[]
): { text: string; isHighlighted: boolean }[] {
  if (matchedIndices.length === 0) {
    return [{ text, isHighlighted: false }];
  }

  const segments: { text: string; isHighlighted: boolean }[] = [];
  const indexSet = new Set(matchedIndices);
  let currentSegment = "";
  let currentHighlighted = indexSet.has(0);

  for (let i = 0; i < text.length; i++) {
    const isMatch = indexSet.has(i);
    if (isMatch !== currentHighlighted) {
      if (currentSegment) {
        segments.push({
          text: currentSegment,
          isHighlighted: currentHighlighted,
        });
      }
      currentSegment = text[i];
      currentHighlighted = isMatch;
    } else {
      currentSegment += text[i];
    }
  }

  if (currentSegment) {
    segments.push({ text: currentSegment, isHighlighted: currentHighlighted });
  }

  return segments;
}
