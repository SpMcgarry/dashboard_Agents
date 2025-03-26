import React from 'react';
import { Workspace } from '@/types/workspace';
import { WorkspaceList } from '@/components/workspace/WorkspaceList';
import { WorkspaceDetail } from '@/components/workspace/WorkspaceDetail';
import { CreateWorkspaceDialog } from '@/components/workspace/CreateWorkspaceDialog';
import { WorkspaceSettingsDialog } from '@/components/workspace/WorkspaceSettingsDialog';

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = React.useState<string>();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = React.useState(false);

  // TODO: Fetch workspaces from API
  React.useEffect(() => {
    // Mock data for development
    setWorkspaces([
      {
        id: '1',
        name: 'Development Team',
        company: 'Acme Corp',
        description: 'Workspace for the development team',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        settings: {
          allowExternalAgents: false,
          requireApproval: true,
          maxAgents: 10,
          maxGroups: 5,
          maxChats: 20,
          retentionPeriod: 30,
        },
        security: {
          twoFactorEnabled: false,
          allowedDomains: [],
          ipWhitelist: [],
        },
        groups: [],
        chats: [],
        agents: [],
        prompts: [],
      },
    ]);
  }, []);

  const handleCreateWorkspace = async (data: { name: string; company: string; description?: string }) => {
    // TODO: Call API to create workspace
    const newWorkspace: Workspace = {
      id: Math.random().toString(36).substring(7),
      name: data.name,
      company: data.company,
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      settings: {
        allowExternalAgents: false,
        requireApproval: true,
        maxAgents: 10,
        maxGroups: 5,
        maxChats: 20,
        retentionPeriod: 30,
      },
      security: {
        twoFactorEnabled: false,
        allowedDomains: [],
        ipWhitelist: [],
      },
      groups: [],
      chats: [],
      agents: [],
      prompts: [],
    };

    setWorkspaces([...workspaces, newWorkspace]);
    setSelectedWorkspaceId(newWorkspace.id);
  };

  const handleUpdateWorkspace = async (workspace: Partial<Workspace>) => {
    // TODO: Call API to update workspace
    setWorkspaces(workspaces.map(w => 
      w.id === workspace.id ? { ...w, ...workspace, updatedAt: new Date().toISOString() } : w
    ));
  };

  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <WorkspaceList
            workspaces={workspaces}
            selectedWorkspaceId={selectedWorkspaceId}
            onSelectWorkspace={setSelectedWorkspaceId}
            onCreateWorkspace={() => setIsCreateDialogOpen(true)}
            onOpenSettings={(workspaceId) => {
              setSelectedWorkspaceId(workspaceId);
              setIsSettingsDialogOpen(true);
            }}
          />
        </div>

        <div className="md:col-span-2">
          {selectedWorkspace ? (
            <WorkspaceDetail
              workspace={selectedWorkspace}
              onUpdateWorkspace={handleUpdateWorkspace}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Select a workspace to view details</p>
            </div>
          )}
        </div>
      </div>

      <CreateWorkspaceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateWorkspace={handleCreateWorkspace}
      />

      {selectedWorkspace && (
        <WorkspaceSettingsDialog
          workspace={selectedWorkspace}
          open={isSettingsDialogOpen}
          onOpenChange={setIsSettingsDialogOpen}
          onUpdateWorkspace={handleUpdateWorkspace}
        />
      )}
    </div>
  );
} 