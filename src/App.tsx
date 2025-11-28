import { AppLayout } from "@/components/layout/AppLayout";
import { Canvas } from "@/features/canvas/components/Canvas";
import { CommandPalette } from "@/features/commands/components/CommandPalette";
import { InlineCommandInput } from "@/features/commands/components/InlineCommandInput";
import { useInlineCommand } from "@/features/commands/hooks/useInlineCommand";

function App() {
  useInlineCommand();

  return (
    <AppLayout>
      <Canvas />
      <CommandPalette />
      <InlineCommandInput />
    </AppLayout>
  );
}

export default App;
