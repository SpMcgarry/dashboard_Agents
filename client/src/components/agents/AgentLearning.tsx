import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";

interface LearningSource {
  id: string;
  type: "document" | "drive" | "dropbox" | "coinbase";
  name: string;
  status: "active" | "processing" | "error";
  lastProcessed: string;
  progress: number;
}

interface AgentLearningProps {
  agentId: string;
}

export function AgentLearning({ agentId }: AgentLearningProps) {
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [sourceUrl, setSourceUrl] = useState<string>("");
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: learningSources, isLoading } = useQuery<LearningSource[]>({
    queryKey: ["agentLearning", agentId],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/learning-sources`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch learning sources");
      return response.json();
    },
  });

  useEffect(() => {
    // Initialize WebSocket connection
    const token = localStorage.getItem("token");
    if (!token) return;

    const ws = new WebSocket(
      `ws://${window.location.host}/ws/learning?token=${token}&agentId=${agentId}`
    );

    ws.onopen = () => {
      console.log("WebSocket connected");
      setWsConnection(ws);
      wsRef.current = ws;
    };

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      handleWebSocketUpdate(update);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Error",
        description: "Failed to connect to learning updates",
        variant: "destructive",
      });
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setWsConnection(null);
      wsRef.current = null;
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [agentId]);

  const handleWebSocketUpdate = (update: any) => {
    switch (update.type) {
      case "progress":
        toast({
          title: "Learning Progress",
          description: `${update.message || "Processing..."} (${update.progress}%)`,
        });
        break;
      case "error":
        toast({
          title: "Error",
          description: update.error,
          variant: "destructive",
        });
        break;
      case "complete":
        toast({
          title: "Success",
          description: "Learning process completed successfully",
        });
        break;
    }
  };

  const addSourceMutation = useMutation({
    mutationFn: async (data: { type: string; url: string }) => {
      const response = await fetch(`/api/agents/${agentId}/learning-sources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add learning source");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Learning source added successfully",
      });
      setSourceUrl("");
    },
  });

  const startLearningMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      const response = await fetch(`/api/agents/${agentId}/learn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ sourceId }),
      });
      if (!response.ok) throw new Error("Failed to start learning process");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Learning process started successfully",
      });
    },
  });

  const handleAddSource = () => {
    if (!selectedSource || !sourceUrl) return;
    addSourceMutation.mutate({ type: selectedSource, url: sourceUrl });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Learning</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Learning Source */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Add Learning Source</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sourceType">Source Type</Label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="drive">Google Drive</SelectItem>
                  <SelectItem value="dropbox">Dropbox</SelectItem>
                  <SelectItem value="coinbase">Coinbase</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">Source URL/Path</Label>
              <Input
                id="sourceUrl"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="Enter URL or file path"
              />
            </div>
          </div>
          <Button
            onClick={handleAddSource}
            disabled={!selectedSource || !sourceUrl || addSourceMutation.isPending}
          >
            Add Source
          </Button>
        </div>

        {/* Learning Sources List */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Learning Sources</h3>
          {isLoading ? (
            <p>Loading sources...</p>
          ) : (
            <div className="space-y-4">
              {learningSources?.map((source) => (
                <div
                  key={source.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{source.name}</h4>
                      <p className="text-sm text-gray-500">
                        Last processed: {new Date(source.lastProcessed).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startLearningMutation.mutate(source.id)}
                      disabled={source.status === "processing"}
                    >
                      {source.status === "processing" ? "Processing..." : "Learn"}
                    </Button>
                  </div>
                  {source.status === "processing" && (
                    <Progress value={source.progress} className="w-full" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* External Agent Integration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">External Agent Integration</h3>
          <div className="space-y-2">
            <Label htmlFor="externalAgent">External Agent URL</Label>
            <div className="flex gap-2">
              <Input
                id="externalAgent"
                placeholder="Enter external agent URL"
                className="flex-1"
              />
              <Button>Import Agent</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 