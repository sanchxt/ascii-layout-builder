export type SelectableItemType = "box" | "line";

export interface SelectionItem {
  id: string;
  type: SelectableItemType;
}

export interface SelectionState {
  selectedIds: SelectionItem[];
  activeItemId: string | null;
  activeItemType: SelectableItemType | null;

  select: (id: string, type: SelectableItemType, multi?: boolean) => void;
  deselect: (id: string, type: SelectableItemType) => void;
  clearSelection: () => void;
  selectAll: () => void;
  setActive: (id: string, type: SelectableItemType) => void;
  clearActive: () => void;

  selectMultiple: (items: SelectionItem[], addToSelection?: boolean) => void;

  getSelectedBoxIds: () => string[];
  getSelectedLineIds: () => string[];
  isSelected: (id: string) => boolean;
  getSelectionCount: () => number;
  hasSelection: () => boolean;
  getActiveItem: () => SelectionItem | null;
}
