import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAgent } from "@/context/AgentContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Import agent component sections
import PersonaForm from "@/components/agents/PersonaForm";
import AIEngineSelector from "@/components/agents/AIEngineSelector";
import ApiIntegrationCard from "@/components/agents/ApiIntegrationCard";
import ExperienceSettings from "@/components/agents/ExperienceSettings";
import JsonPreview from "@/components/agents/JsonPreview";

const CreateAgent = () => {
  const [, navigate] = useLocation();
  const { 
    currentTemplate, 
    setCurrentTemplate, 
    saveTemplate,
    createAgent
  } = useAgent();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    
    try {
      const savedTemplate = await saveTemplate();
      if (savedTemplate) {
        // Navigate to templates page or show success message
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    
    try {
      // First save template if needed
      let templateToUse = currentTemplate;
      if (!templateToUse.id) {
        templateToUse = await saveTemplate() || templateToUse;
      }
      
      // Then create agent
      const agent = await createAgent(templateToUse, templateToUse.name);
      if (agent) {
        navigate("/agents");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-neutral-800">Create New Agent</h2>
        <div>
          <Button 
            variant="outline" 
            className="mr-2"
            disabled={isSubmitting}
          >
            <span className="material-icons text-sm mr-1 align-text-bottom">file_copy</span>
            Import Template
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSubmitting}
          >
            <span className="material-icons text-sm mr-1 align-text-bottom">save</span>
            Save Agent
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="mb-6 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="agent-name" className="mb-1">Agent Name</Label>
              <Input 
                id="agent-name" 
                placeholder="E.g., Customer Support Assistant"
                value={currentTemplate.name}
                onChange={(e) => setCurrentTemplate({ name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="agent-role" className="mb-1">Role/Purpose</Label>
              <Input 
                id="agent-role" 
                placeholder="E.g., Handle customer inquiries"
                value={currentTemplate.role}
                onChange={(e) => setCurrentTemplate({ role: e.target.value })}
              />
            </div>
          </div>
          
          <div className="mt-6">
            <Label htmlFor="agent-description" className="mb-1">Agent Description</Label>
            <Textarea 
              id="agent-description" 
              rows={3} 
              placeholder="Describe what this agent will do and its capabilities..."
              value={currentTemplate.description}
              onChange={(e) => setCurrentTemplate({ description: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* AI Engine */}
      <AIEngineSelector />
      
      {/* Persona */}
      <PersonaForm />
      
      {/* API Integrations */}
      <ApiIntegrationCard />
      
      {/* Experience Settings */}
      <ExperienceSettings />
      
      {/* JSON Preview */}
      <JsonPreview template={currentTemplate} />
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mb-8">
        <Button 
          variant="outline"
          onClick={handleSave}
          disabled={isSubmitting}
        >
          Save as Template
        </Button>
        <Button 
          onClick={handleCreate}
          disabled={isSubmitting}
        >
          Create Agent
        </Button>
      </div>
    </div>
  );
};

export default CreateAgent;
