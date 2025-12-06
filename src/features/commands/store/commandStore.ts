import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { CommandStore, RecentCommandEntry } from "../types/command";

const MAX_RECENT_COMMANDS = 20;

const initialPaletteState = {
  isOpen: false,
  query: "",
  selectedIndex: 0,
  layoutTargetId: null as string | null,
  layoutTargetType: null as "box" | "artboard" | null,
  recentCommands: [] as RecentCommandEntry[],
};

const initialInlineState = {
  isActive: false,
  targetId: null,
  targetType: null,
  targetName: undefined,
  query: "",
  position: null,
};

export const useCommandStore = create<CommandStore>()(
  devtools(
    persist(
      (set) => ({
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

        recordCommandExecution: (commandId) =>
          set(
            (state) => {
              const existing = state.recentCommands.find(
                (r) => r.commandId === commandId
              );

              if (existing) {
                return {
                  recentCommands: state.recentCommands.map((r) =>
                    r.commandId === commandId
                      ? {
                          ...r,
                          timestamp: Date.now(),
                          executionCount: r.executionCount + 1,
                        }
                      : r
                  ),
                };
              }

              return {
                recentCommands: [
                  { commandId, timestamp: Date.now(), executionCount: 1 },
                  ...state.recentCommands,
                ].slice(0, MAX_RECENT_COMMANDS),
              };
            },
            false,
            "command/recordExecution"
          ),

        inline: initialInlineState,

        inlineActions: {
          activate: (targetId, targetType, position, targetName) =>
            set(
              {
                inline: {
                  isActive: true,
                  targetId,
                  targetType,
                  targetName,
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
      {
        name: "ascii-layout-builder:command-state",
        partialize: (state) => ({
          recentCommands: state.recentCommands,
        }),
      }
    ),
    { name: "CommandStore" }
  )
);

export const useCommandPaletteOpen = () =>
  useCommandStore((state) => state.isOpen);
export const useCommandQuery = () => useCommandStore((state) => state.query);
export const useCommandSelectedIndex = () =>
  useCommandStore((state) => state.selectedIndex);
export const useInlineCommandState = () =>
  useCommandStore((state) => state.inline);
export const useLayoutTarget = () =>
  useCommandStore((state) => ({
    id: state.layoutTargetId,
    type: state.layoutTargetType,
  }));
export const useRecentCommands = () =>
  useCommandStore((state) => state.recentCommands);
