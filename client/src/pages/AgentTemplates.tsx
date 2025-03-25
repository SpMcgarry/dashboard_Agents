import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { AgentTemplate } from "@/context/AgentContext";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Copy, Trash2, Edit } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const AgentTemplates = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  
  // Fetch templates
  const { 
    data: templates, 
    isLoading, 
    refetch 
  } = useQuery<AgentTemplate[]>({
    queryKey: ['/api/templates'],
  });
  
  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/templates/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template deleted successfully"
      });
      refetch();
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete template",
        variant: "destructive"
      });
    }
  });
  
  // Clone template mutation
  const cloneMutation = useMutation({
    mutationFn: async (template: AgentTemplate) => {
      const cloneData = {
        ...template,
        name: `${template.name} (Copy)`,
      };
      delete cloneData.id;
      delete cloneData.created;
      delete cloneData.lastUpdated;
      
      const response = await apiRequest("POST", "/api/templates", cloneData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Template cloned successfully"
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clone template",
        variant: "destructive"
      });
    }
  });
  
  // Handle delete click
  const handleDeleteClick = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };
  
  // Confirm delete
  const confirmDelete = () => {
    if (selectedTemplate?.id) {
      deleteMutation.mutate(selectedTemplate.id);
    }
  };
  
  // Clone template
  const handleCloneClick = (template: AgentTemplate) => {
    cloneMutation.mutate(template);
  };
  
  // Edit template
  const handleEditClick = (template: AgentTemplate) => {
    navigate(`/templates/${template.id}`);
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-neutral-800">Agent Templates</h2>
        
        <Link href="/create-agent">
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Create New Template
          </Button>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-6">
                <Skeleton className="h-7 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-neutral-800 mb-1 truncate">
                  {template.name}
                </h3>
                <p className="text-sm text-neutral-600 mb-1 truncate">
                  {template.role}
                </p>
                <p className="text-xs text-neutral-500 mb-4">
                  Last updated: {new Date(template.lastUpdated).toLocaleDateString()}
                </p>
                
                <div className="flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/create-agent?templateId=${template.id}`)}
                  >
                    Use Template
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleCloneClick(template)}
                      disabled={cloneMutation.isPending}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditClick(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:text-destructive/90"
                      onClick={() => handleDeleteClick(template)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">No Templates Yet</h3>
            <p className="text-neutral-600 mb-4">
              Create your first agent template to get started.
            </p>
            <Link href="/create-agent">
              <Button>Create Template</Button>
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
              Are you sure you want to delete the template "{selectedTemplate?.name}"? 
              This action cannot be undone.
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
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentTemplates;
