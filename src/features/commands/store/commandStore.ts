import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { CommandStore } from "../types/command";

const initialPaletteState = {
  isOpen: false,
  query: "",
  selectedIndex: 0,
  mode: "search" as const,
  layoutTargetId: null as string | null,
  layoutTargetType: null as "box" | "artboard" | null,
};

const initialInlineState = {
  isActive: false,
  targetId: null,
  targetType: null,
  query: "",
  position: null,
};

export const useCommandStore = create<CommandStore>()(
  devtools(
    (set, get) => ({
      ...initialPaletteState,

      open: () =>
        set(
          { isOpen: true, query: "", selectedIndex: 0 },
          false,
          "command/open"
        ),

      close: () =>
        set(
          {
            isOpen: false,
            query: "",
            selectedIndex: 0,
            mode: "search",
            layoutTargetId: null,
            layoutTargetType: null,
          },
          false,
          "command/close"
        ),

      toggle: () =>
        set(
          (state) => ({
            isOpen: !state.isOpen,
            query: state.isOpen ? "" : state.query,
            selectedIndex: 0,
          }),
          false,
          "command/toggle"
        ),

      setQuery: (query) =>
        set({ query, selectedIndex: 0 }, false, "command/setQuery"),

      setSelectedIndex: (selectedIndex) =>
        set({ selectedIndex }, false, "command/setSelectedIndex"),

      moveSelection: (direction) =>
        set(
          (state) => ({
            selectedIndex:
              direction === "up"
                ? Math.max(0, state.selectedIndex - 1)
                : state.selectedIndex + 1,
          }),
          false,
          "command/moveSelection"
        ),

      setMode: (mode) => set({ mode, query: "" }, false, "command/setMode"),

      setLayoutTarget: (id, type) =>
        set(
          { layoutTargetId: id, layoutTargetType: type },
          false,
          "command/setLayoutTarget"
        ),

      clearLayoutTarget: () =>
        set(
          { layoutTargetId: null, layoutTargetType: null },
          false,
          "command/clearLayoutTarget"
        ),

      executeSelected: () => {},

      inline: initialInlineState,

      inlineActions: {
        activate: (targetId, targetType, position) =>
          set(
            {
              inline: {
                isActive: true,
                targetId,
                targetType,
                query: "",
                position,
              },
            },
            false,
            "command/inlineActivate"
          ),

        deactivate: () =>
          set(
            { inline: initialInlineState },
            false,
            "command/inlineDeactivate"
          ),

        setQuery: (query) =>
          set(
            (state) => ({
              inline: { ...state.inline, query },
            }),
            false,
            "command/inlineSetQuery"
          ),

        execute: () => {
          set({ inline: initialInlineState }, false, "command/inlineExecute");
        },
      },
    }),
    { name: "CommandStore" }
  )
);

export const useCommandPaletteOpen = () =>
  useCommandStore((state) => state.isOpen);
export const useCommandQuery = () => useCommandStore((state) => state.query);
export const useCommandSelectedIndex = () =>
  useCommandStore((state) => state.selectedIndex);
export const useCommandMode = () => useCommandStore((state) => state.mode);
export const useInlineCommandState = () =>
  useCommandStore((state) => state.inline);
export const useLayoutTarget = () =>
  useCommandStore((state) => ({
    id: state.layoutTargetId,
    type: state.layoutTargetType,
  }));
