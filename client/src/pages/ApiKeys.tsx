import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface ApiKey {
  id: number;
  provider: string;
  keyName: string;
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export default function ApiKeys() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState({
    provider: "",
    keyName: "",
    apiKey: "",
    expiresAt: "",
  });
  const queryClient = useQueryClient();

  // Fetch API keys
  const { data: apiKeys, isLoading } = useQuery<ApiKey[]>({
    queryKey: ["apiKeys"],
    queryFn: async () => {
      const response = await fetch("/api/api-keys", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch API keys");
      return response.json();
    },
  });

  // Create new API key
  const createKeyMutation = useMutation({
    mutationFn: async (data: typeof newKey) => {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create API key");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      setIsDialogOpen(false);
      setNewKey({ provider: "", keyName: "", apiKey: "", expiresAt: "" });
      toast({
        title: "Success",
        description: "API key created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete API key
  const deleteKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete API key");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createKeyMutation.mutate(newKey);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New API Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New API Key</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={newKey.provider}
                  onValueChange={(value) =>
                    setNewKey({ ...newKey, provider: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  value={newKey.keyName}
                  onChange={(e) =>
                    setNewKey({ ...newKey, keyName: e.target.value })
                  }
                  placeholder="e.g., Production OpenAI Key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={newKey.apiKey}
                  onChange={(e) =>
                    setNewKey({ ...newKey, apiKey: e.target.value })
                  }
                  placeholder="Enter your API key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={newKey.expiresAt}
                  onChange={(e) =>
                    setNewKey({ ...newKey, expiresAt: e.target.value })
                  }
                />
              </div>
              <Button type="submit" className="w-full">
                Create API Key
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {apiKeys?.map((key) => (
          <Card key={key.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{key.keyName}</span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    key.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {key.isActive ? "Active" : "Inactive"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Provider:</span>{" "}
                  <span className="capitalize">{key.provider}</span>
                </div>
                <div>
                  <span className="font-medium">Created:</span>{" "}
                  {format(new Date(key.createdAt), "PPP")}
                </div>
                {key.lastUsed && (
                  <div>
                    <span className="font-medium">Last Used:</span>{" "}
                    {format(new Date(key.lastUsed), "PPP")}
                  </div>
                )}
                {key.expiresAt && (
                  <div>
                    <span className="font-medium">Expires:</span>{" "}
                    {format(new Date(key.expiresAt), "PPP")}
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteKeyMutation.mutate(key.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 