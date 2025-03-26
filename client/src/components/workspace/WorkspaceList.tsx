import React from 'react';
import { Workspace } from '@/types/workspace';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Settings, Users, MessageSquare, Bot } from 'lucide-react';

interface WorkspaceListProps {
  workspaces: Workspace[];
  selectedWorkspaceId?: string;
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: () => void;
  onOpenSettings: (workspaceId: string) => void;
}

export function WorkspaceList({
  workspaces,
  selectedWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onOpenSettings,
}: WorkspaceListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Workspaces</h2>
        <Button onClick={onCreateWorkspace} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Workspace
        </Button>
      </div>

      <div className="grid gap-4">
        {workspaces.map((workspace) => (
          <Card
            key={workspace.id}
            className={`cursor-pointer transition-colors ${
              selectedWorkspaceId === workspace.id
                ? 'border-primary bg-primary/5'
                : 'hover:border-primary/50'
            }`}
            onClick={() => onSelectWorkspace(workspace.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">{workspace.name}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSettings(workspace.id);
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{workspace.description}</CardDescription>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {workspace.groups.length} Groups
                </div>
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {workspace.chats.length} Chats
                </div>
                <div className="flex items-center">
                  <Bot className="h-4 w-4 mr-1" />
                  {workspace.agents.length} Agents
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 