import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-gray-900">Hello World</h1>
        <Button size="lg">Click Me</Button>
      </div>
    </div>
  );
}

export default App;
