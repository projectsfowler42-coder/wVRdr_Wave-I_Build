import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/runtime/shell/ErrorBoundary";
import WarRoom from "@/pages/WarRoom";

function App() {
  return (
    <TooltipProvider>
      <ErrorBoundary>
        <WarRoom />
      </ErrorBoundary>
    </TooltipProvider>
  );
}

export default App;
