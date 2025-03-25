import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AgentProvider } from "@/context/AgentContext";

// Components
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

// Pages
import Dashboard from "@/pages/Dashboard";
import CreateAgent from "@/pages/CreateAgent";
import AgentTemplates from "@/pages/AgentTemplates";
import ActiveAgents from "@/pages/ActiveAgents";
import LLMSettings from "@/pages/LLMSettings";
import ApiIntegrations from "@/pages/ApiIntegrations";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/create-agent" component={CreateAgent} />
            <Route path="/templates" component={AgentTemplates} />
            <Route path="/agents" component={ActiveAgents} />
            <Route path="/llm-settings" component={LLMSettings} />
            <Route path="/integrations" component={ApiIntegrations} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AgentProvider>
        <Router />
        <Toaster />
      </AgentProvider>
    </QueryClientProvider>
  );
}

export default App;
