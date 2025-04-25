
import { ThemeProvider } from "./components/ThemeToggle";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Router, Switch } from "wouter";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import ProcessingPage from "./pages/ProcessingPage";
import ResultsPage from "./pages/ResultsPage";
import NotFoundPage from "./pages/not-found";

const queryClient = new QueryClient();

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Router>
              <Header />
              <main className="container mx-auto px-4 py-8">
                <Switch>
                  <Route path="/" component={HomePage} />
                  <Route path="/processing" component={ProcessingPage} />
                  <Route path="/results" component={ResultsPage} />
                  <Route component={NotFoundPage} />
                </Switch>
              </main>
            </Router>
            <Toaster />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
