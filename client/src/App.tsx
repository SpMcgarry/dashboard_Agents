import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AgentProvider } from "@/context/AgentContext";
import { AuthProvider } from "@/context/AuthContext";

// Components
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

// Pages
import Dashboard from "@/pages/Dashboard";
import CreateAgent from "@/pages/CreateAgent";
import AgentTemplates from "@/pages/AgentTemplates";
import ActiveAgents from "@/pages/ActiveAgents";
import AgentChat from "@/pages/AgentChat";
import LLMSettings from "@/pages/LLMSettings";
import ApiIntegrations from "@/pages/ApiIntegrations";
import ApiKeys from "@/pages/ApiKeys";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem('token');

  React.useEffect(() => {
    if (!token) {
      setLocation('/login');
    }
  }, [token, setLocation]);

  if (!token) {
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Switch>
        <Route path="/login" component={Login} />
        <Route>
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
                  <Route path="/agents/:id/chat" component={AgentChat} />
                  <Route path="/llm-settings" component={LLMSettings} />
                  <Route path="/integrations" component={ApiIntegrations} />
                  <Route path="/api-keys" component={ApiKeys} />
                  <Route component={NotFound} />
                </Switch>
              </main>
            </div>
          </div>
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AgentProvider>
          <Router />
          <Toaster />
        </AgentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
