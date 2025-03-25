import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, MessagesSquare, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ActiveAgent } from "@/context/AgentContext";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface ChatHistoryResponse {
  messages: ChatMessage[];
}

const AgentChat = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const agentId = parseInt(id || "0");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messageInput, setMessageInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch agent data
  const { 
    data: agent,
    isLoading: isLoadingAgent,
    refetch: refetchAgent
  } = useQuery<ActiveAgent>({
    queryKey: [`/api/agents/${agentId}`],
    enabled: !!agentId && agentId > 0
  });
  
  // Set chat history when agent data changes
  useEffect(() => {
    if (agent?.conversationHistory) {
      const history = agent.conversationHistory as ChatHistoryResponse;
      if (history.messages && Array.isArray(history.messages)) {
        setChatHistory(history.messages);
      }
    }
  }, [agent]);

  // Process message mutation
  const processMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", `/api/agents/${agentId}/process`, { message });
      return response.json();
    },
    onSuccess: (data) => {
      // Update with latest response
      refetchAgent();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process message",
        variant: "destructive"
      });
      setLoading(false);
    }
  });
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || loading || processMutation.isPending) return;
    
    // Optimistically add message to chat
    const userMessage: ChatMessage = {
      role: "user",
      content: messageInput,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setMessageInput("");
    setLoading(true);
    
    try {
      await processMutation.mutateAsync(userMessage.content);
    } catch (error) {
      // Error is handled in mutation onError
    } finally {
      setLoading(false);
    }
  };
  
  // Handle keypress for sending message
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: Date | string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get agent initials for avatar
  const getAgentInitials = (name: string) => {
    if (!name) return "AI";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };
  
  return (
    <div className="max-w-4xl mx-auto h-[85vh] flex flex-col">
      {/* Agent chat header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-2">
            <AvatarFallback className="bg-primary-100 text-primary-600">
              {isLoadingAgent ? "..." : getAgentInitials(agent?.name || "")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold text-neutral-800">
              {isLoadingAgent ? "Loading..." : agent?.name || "Agent Chat"}
            </h2>
            <p className="text-sm text-neutral-500">
              {isLoadingAgent ? "..." : agent?.status || "Status unknown"}
            </p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => refetchAgent()}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>
      
      <Separator className="mb-4" />
      
      {/* Chat messages area */}
      <Card className="flex-grow mb-4 overflow-hidden">
        <CardContent className="p-4 h-full overflow-y-auto">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400">
              <MessagesSquare className="h-12 w-12 mb-2 opacity-20" />
              <p>No messages yet</p>
              <p className="text-sm">Start a conversation with the agent</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chatHistory.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div 
                    className={`max-w-[80%] px-4 py-2 rounded-lg ${
                      message.role === "assistant" 
                        ? "bg-neutral-100 text-neutral-800" 
                        : "bg-primary-100 text-primary-800"
                    }`}
                  >
                    <div className="text-sm mb-1">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 text-right">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Input area */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Type your message..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={handleKeyPress}
          className="resize-none"
          rows={2}
          disabled={loading || processMutation.isPending || isLoadingAgent || !agent}
        />
        <Button 
          onClick={handleSendMessage}
          disabled={loading || processMutation.isPending || isLoadingAgent || !agent || !messageInput.trim()}
          className="self-end"
        >
          {loading || processMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default AgentChat;