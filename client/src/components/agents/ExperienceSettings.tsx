import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAgent } from "@/context/AgentContext";

const ExperienceSettings = () => {
  const { currentTemplate, setCurrentTemplate } = useAgent();
  
  // Initialize experience settings if not present
  const experienceSettings = currentTemplate.experienceSettings || {
    memoryType: "conversation",
    retentionPeriod: "session",
    summarizationEnabled: true
  };
  
  const updateExperienceSettings = (field: string, value: any) => {
    const updatedSettings = { ...experienceSettings, [field]: value };
    setCurrentTemplate({ experienceSettings: updatedSettings });
  };
  
  return (
    <Card className="mb-6 shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-md font-semibold text-neutral-800 mb-4">Experience & Memory Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-1">Memory Type</Label>
            <div className="relative">
              <Select 
                value={experienceSettings.memoryType}
                onValueChange={(value) => updateExperienceSettings('memoryType', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select memory type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conversation">Conversation history</SelectItem>
                  <SelectItem value="summarized">Summarized experiences</SelectItem>
                  <SelectItem value="long_term">Long-term memory</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-1">Retention Period</Label>
            <div className="relative">
              <Select 
                value={experienceSettings.retentionPeriod}
                onValueChange={(value) => updateExperienceSettings('retentionPeriod', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select retention period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="session">Session only</SelectItem>
                  <SelectItem value="24_hours">24 hours</SelectItem>
                  <SelectItem value="7_days">7 days</SelectItem>
                  <SelectItem value="30_days">30 days</SelectItem>
                  <SelectItem value="indefinite">Indefinite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="summarization" 
              checked={experienceSettings.summarizationEnabled}
              onCheckedChange={(checked) => updateExperienceSettings('summarizationEnabled', checked)}
            />
            <Label htmlFor="summarization" className="text-sm text-neutral-700">
              Enable periodic experience summarization
            </Label>
          </div>
          <p className="text-xs text-neutral-500 mt-1 ml-11">
            The agent will periodically summarize interactions to build long-term memory
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExperienceSettings;
