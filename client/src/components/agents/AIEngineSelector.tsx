import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useAgent } from "@/context/AgentContext";

const AIEngineSelector = () => {
  const { currentTemplate, setCurrentTemplate } = useAgent();
  
  const updateAIEngine = (field: string, value: any) => {
    const aiEngine = { ...currentTemplate.aiEngine };
    
    if (field === 'provider') {
      aiEngine.provider = value;
      
      // Update model based on provider
      switch (value) {
        case 'openai':
          aiEngine.model = 'gpt-3.5-turbo';
          break;
        case 'anthropic':
          aiEngine.model = 'claude-2';
          break;
        case 'local':
          aiEngine.model = 'llama-2-13b';
          break;
      }
    } else if (field === 'model') {
      aiEngine.model = value;
    } else if (field.startsWith('parameters.')) {
      const paramField = field.split('.')[1];
      aiEngine.parameters = {
        ...aiEngine.parameters,
        [paramField]: value
      };
    }
    
    setCurrentTemplate({ aiEngine });
  };
  
  // Get provider-specific model options
  const getModelOptions = (provider: string) => {
    switch (provider) {
      case 'openai':
        return [
          { value: 'gpt-4', label: 'GPT-4' },
          { value: 'gpt-4o', label: 'GPT-4o' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
          { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16k' }
        ];
      case 'anthropic':
        return [
          { value: 'claude-2', label: 'Claude 2' },
          { value: 'claude-instant', label: 'Claude Instant' }
        ];
      case 'local':
        return [
          { value: 'llama-2-13b', label: 'LLaMA 2 (13B)' },
          { value: 'llama-2-70b', label: 'LLaMA 2 (70B)' },
          { value: 'mistral-7b', label: 'Mistral 7B' }
        ];
      default:
        return [];
    }
  };
  
  return (
    <Card className="mb-6 shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-md font-semibold text-neutral-800 mb-4">AI Engine Configuration</h3>
        
        <RadioGroup 
          value={currentTemplate.aiEngine.provider}
          onValueChange={(value) => updateAIEngine('provider', value)}
          className="space-y-4"
        >
          {/* OpenAI Option */}
          <div className="border border-neutral-200 rounded-md p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <RadioGroupItem value="openai" id="openai" className="mr-2" />
                <Label htmlFor="openai" className="text-sm font-medium text-neutral-800">OpenAI</Label>
              </div>
              <span className="px-2 py-1 bg-success bg-opacity-10 text-success text-xs rounded-full">
                Active
              </span>
            </div>
            
            {currentTemplate.aiEngine.provider === 'openai' && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="openai-model" className="block text-xs font-medium text-neutral-600 mb-1">Model</Label>
                  <Select 
                    value={currentTemplate.aiEngine.model} 
                    onValueChange={(value) => updateAIEngine('model', value)}
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {getModelOptions('openai').map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="openai-temperature" className="block text-xs font-medium text-neutral-600 mb-1">
                    Temperature: {currentTemplate.aiEngine.parameters.temperature.toFixed(1)}
                  </Label>
                  <Slider
                    id="openai-temperature"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[currentTemplate.aiEngine.parameters.temperature]}
                    onValueChange={(value) => updateAIEngine('parameters.temperature', value[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>Precise (0.0)</span>
                    <span>Balanced (0.7)</span>
                    <span>Creative (1.0)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Anthropic Option */}
          <div className="border border-neutral-200 rounded-md p-4 mb-4 opacity-70">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <RadioGroupItem value="anthropic" id="anthropic" className="mr-2" />
                <Label htmlFor="anthropic" className="text-sm font-medium text-neutral-800">Anthropic Claude</Label>
              </div>
              <span className="px-2 py-1 bg-neutral-100 text-neutral-500 text-xs rounded-full">Configure</span>
            </div>
            
            {currentTemplate.aiEngine.provider === 'anthropic' && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-xs font-medium text-neutral-600 mb-1">Model</Label>
                  <Select 
                    value={currentTemplate.aiEngine.model} 
                    onValueChange={(value) => updateAIEngine('model', value)}
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {getModelOptions('anthropic').map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="block text-xs font-medium text-neutral-600 mb-1">
                    Temperature: {currentTemplate.aiEngine.parameters.temperature.toFixed(1)}
                  </Label>
                  <Slider
                    min={0}
                    max={1}
                    step={0.1}
                    value={[currentTemplate.aiEngine.parameters.temperature]}
                    onValueChange={(value) => updateAIEngine('parameters.temperature', value[0])}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Local LLM Option */}
          <div className="border border-neutral-200 rounded-md p-4 opacity-70">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <RadioGroupItem value="local" id="local" className="mr-2" />
                <Label htmlFor="local" className="text-sm font-medium text-neutral-800">Local LLM</Label>
              </div>
              <span className="px-2 py-1 bg-neutral-100 text-neutral-500 text-xs rounded-full">Configure</span>
            </div>
            
            {currentTemplate.aiEngine.provider === 'local' && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-xs font-medium text-neutral-600 mb-1">Model</Label>
                  <Select 
                    value={currentTemplate.aiEngine.model} 
                    onValueChange={(value) => updateAIEngine('model', value)}
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {getModelOptions('local').map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default AIEngineSelector;
