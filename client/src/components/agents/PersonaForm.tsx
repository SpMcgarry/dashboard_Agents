import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAgent } from "@/context/AgentContext";

const PersonaForm = () => {
  const { currentTemplate, addTrait, removeTrait } = useAgent();
  const [newTrait, setNewTrait] = useState("");

  const handleAddTrait = () => {
    if (newTrait.trim() && !currentTemplate.persona.traits.includes(newTrait)) {
      addTrait(newTrait.trim());
      setNewTrait("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTrait();
    }
  };

  return (
    <Card className="mb-6 shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-md font-semibold text-neutral-800 mb-4">Agent Persona</h3>
        
        <div className="mb-4">
          <Label className="mb-1">Personality Traits</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {currentTemplate.persona.traits.map((trait) => (
              <span 
                key={trait}
                className="px-3 py-1 bg-primary-50 text-primary-600 text-sm rounded-full flex items-center"
              >
                {trait}
                <button 
                  onClick={() => removeTrait(trait)}
                  className="ml-1 text-primary-400 hover:text-primary-600"
                >
                  <span className="material-icons text-sm">close</span>
                </button>
              </span>
            ))}
            <div className="flex">
              <Input
                value={newTrait}
                onChange={(e) => setNewTrait(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add trait"
                className="px-3 py-1 h-8 text-sm rounded-l-full"
              />
              <button 
                onClick={handleAddTrait}
                className="px-3 py-1 border border-dashed border-neutral-300 text-neutral-500 text-sm rounded-r-full hover:bg-neutral-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <Label htmlFor="agent-backstory" className="mb-1">Backstory/Context</Label>
          <Textarea 
            id="agent-backstory" 
            rows={3} 
            placeholder="Give your agent context and background knowledge..."
            value={currentTemplate.persona.backstory}
            onChange={(e) => {
              const persona = { ...currentTemplate.persona, backstory: e.target.value };
              useAgent().setCurrentTemplate({ persona });
            }}
          />
        </div>
        
        <div>
          <Label htmlFor="agent-instructions" className="mb-1">Specific Instructions</Label>
          <Textarea 
            id="agent-instructions" 
            rows={3} 
            placeholder="Instructions that guide the agent's behavior..."
            value={currentTemplate.persona.instructions}
            onChange={(e) => {
              const persona = { ...currentTemplate.persona, instructions: e.target.value };
              useAgent().setCurrentTemplate({ persona });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonaForm;
