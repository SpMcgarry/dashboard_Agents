import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { ActiveAgent } from "@/context/AgentContext";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, RefreshCw, Play, Pause, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const StatusBadge = ({ status }: { status: string }) => {
  let color = "bg-neutral-300";
  
  switch (status) {
    case "active":
      color = "bg-success";
      break;
    case "idle":
      color = "bg-neutral-300";
      break;
    case "error":
      color = "bg-destructive";
      break;
    default:
      color = "bg-neutral-300";
  }
  
  return <span className={`w-2 h-2 rounded-full ${color} mr-2`} />;
};

const AgentStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "active":
      return <Badge className="bg-success/20 text-success border-success/20">Active</Badge>;
    case "idle":
      return <Badge variant="outline" className="bg-neutral-100 text-neutral-700">Idle</Badge>;
    case "error":
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const ActiveAgents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<ActiveAgent | null>(null);
  const [expandedAgentId, setExpandedAgentId] = useState<number | null>(null);
  
  // Fetch agents
  const { 
    data: agents, 
    isLoading
  } = useQuery<ActiveAgent[]>({
    queryKey: ['/api/agents'],
  });
  
  // Delete agent mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/agents/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Agent deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete agent",
        variant: "destructive"
      });
    }
  });
  
  // Update agent status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/agents/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update agent status",
        variant: "destructive"
      });
    }
  });
  
  // Handle delete click
  const handleDeleteClick = (agent: ActiveAgent) => {
    setSelectedAgent(agent);
    setDeleteDialogOpen(true);
  };
  
  // Confirm delete
  const confirmDelete = () => {
    if (selectedAgent?.id) {
      deleteMutation.mutate(selectedAgent.id);
    }
  };
  
  // Toggle agent status (active/idle)
  const toggleAgentStatus = (agent: ActiveAgent) => {
    if (!agent.id) return;
    
    const newStatus = agent.status === "active" ? "idle" : "active";
    updateStatusMutation.mutate({ id: agent.id, status: newStatus });
  };
  
  // Toggle expanded view for an agent
  const toggleExpandedView = (agentId: number) => {
    setExpandedAgentId(expandedAgentId === agentId ? null : agentId);
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string | Date) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Get experience summary text
  const getExperienceSummary = (agent: ActiveAgent) => {
    if (!agent.experienceSummary) return "No summary available";
    
    const summary = agent.experienceSummary as any;
    return summary.lastSummary || `${summary.interactions || 0} interactions recorded`;
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-neutral-800">Active Agents</h2>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/agents'] })}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          <Link href="/create-agent">
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Agent
            </Button>
          </Link>
        </div>
      </div>
      
      {isLoading ? (
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : agents && agents.length > 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <>
                    <TableRow 
                      key={agent.id} 
                      className="cursor-pointer hover:bg-neutral-50"
                      onClick={() => toggleExpandedView(agent.id!)}
                    >
                      <TableCell>
                        <div className="flex items-center">
                          <StatusBadge status={agent.status} />
                          <span className="font-medium">{agent.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <AgentStatusBadge status={agent.status} />
                      </TableCell>
                      <TableCell className="text-neutral-600 text-sm">
                        {formatTimestamp(agent.lastActive || '')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                          <Link href={`/agents/${agent.id}/chat`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Chat with agent"
                            >
                              <MessagesSquare className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleAgentStatus(agent)}
                            disabled={updateStatusMutation.isPending}
                            title={agent.status === "active" ? "Pause agent" : "Activate agent"}
                          >
                            {agent.status === "active" ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => handleDeleteClick(agent)}
                            disabled={deleteMutation.isPending}
                            title="Delete agent"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded view when clicked */}
                    {expandedAgentId === agent.id && (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-neutral-50">
                          <div className="p-3">
                            <h4 className="font-medium mb-2">Experience Summary</h4>
                            <p className="text-sm text-neutral-700 mb-3">
                              {getExperienceSummary(agent)}
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <h5 className="font-medium text-neutral-800 mb-1">Template ID</h5>
                                <p className="text-neutral-600">{agent.templateId || "N/A"}</p>
                              </div>
                              <div>
                                <h5 className="font-medium text-neutral-800 mb-1">Created</h5>
                                <p className="text-neutral-600">{formatTimestamp(agent.created || '')}</p>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex justify-end gap-2">
                              <Link href={`/agents/${agent.id}`}>
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
                              </Link>
                              <Link href={`/agents/${agent.id}/chat`}>
                                <Button size="sm" variant="default">
                                  Chat
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">No Active Agents</h3>
            <p className="text-neutral-600 mb-4">
              Create your first agent to start using AI capabilities.
            </p>
            <Link href="/create-agent">
              <Button>Create Agent</Button>
            </Link>
          </CardContent>
        </Card>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the agent "{selectedAgent?.name}"? 
              This action cannot be undone and all agent data will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActiveAgents;
