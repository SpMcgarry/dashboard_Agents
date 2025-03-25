import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AgentTemplate } from "@/context/AgentContext";

interface JsonPreviewProps {
  template: AgentTemplate;
}

const JsonPreview = ({ template }: JsonPreviewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [jsonText, setJsonText] = useState('');
  
  // Format the JSON for display
  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };
  
  // Toggle edit mode
  const toggleEdit = () => {
    if (!isEditing) {
      // When entering edit mode, set the current JSON text
      setJsonText(formatJson(template));
    }
    setIsEditing(!isEditing);
  };
  
  return (
    <Card className="mb-6 shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-semibold text-neutral-800">JSON Configuration Preview</h3>
          <Button 
            variant="ghost" 
            className="text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center"
            onClick={toggleEdit}
          >
            <span className="material-icons text-sm mr-1">code</span>
            {isEditing ? "View Formatted JSON" : "Edit Raw JSON"}
          </Button>
        </div>
        
        <div className="bg-neutral-50 rounded-md p-4 overflow-x-auto">
          {isEditing ? (
            <textarea 
              className="json-preview font-mono text-xs text-neutral-800 w-full bg-neutral-50 border-none focus:outline-none focus:ring-0"
              rows={20}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          ) : (
            <pre className="json-preview text-xs text-neutral-800">{formatJson(template)}</pre>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default JsonPreview;
