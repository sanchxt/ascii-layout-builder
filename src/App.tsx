import { AppLayout } from "@/components/layout/AppLayout";
import { Canvas } from "@/features/canvas/components/Canvas";
import { CommandPalette } from "@/features/commands/components/CommandPalette";
import { InlineCommandInput } from "@/features/commands/components/InlineCommandInput";
import { useInlineCommand } from "@/features/commands/hooks/useInlineCommand";
import { OutputDrawer } from "@/features/output-drawer/components/OutputDrawer";
import { LayoutPanel } from "@/features/layout-system/components/LayoutPanel";

function App() {
  useInlineCommand();

  return (
    <AppLayout>
      <Canvas />
      <CommandPalette />
      <InlineCommandInput />
      <OutputDrawer />
      <LayoutPanel />
    </AppLayout>
  );
}

export default App;
