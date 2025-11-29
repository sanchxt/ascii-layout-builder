export type ChangeCategory = "feature" | "fix" | "improvement" | "breaking";

export interface ReleaseChange {
  text: string;
  category: ChangeCategory;
}

export interface Release {
  version: string;
  date: string;
  changes: ReleaseChange[];
}
