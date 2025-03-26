import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Workspace, Group, Chat } from '@/types/workspace';
import { Settings, Users, MessageSquare, Bot, Building2, FileText } from 'lucide-react';
import { WorkspaceSettingsDialog } from './WorkspaceSettingsDialog';

interface WorkspaceDetailProps {
  workspace: Workspace;
  onUpdateWorkspace: (workspace: Partial<Workspace>) => void;
}

export function WorkspaceDetail({ workspace, onUpdateWorkspace }: WorkspaceDetailProps) {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{workspace.name}</h1>
          <p className="text-muted-foreground">{workspace.company}</p>
        </div>
        <Button onClick={() => setIsSettingsOpen(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Overview</CardTitle>
              <CardDescription>
                Manage your workspace settings and view activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Groups</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{workspace.groups.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Active groups in workspace
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Chats</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{workspace.chats.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Active conversations
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Agents</CardTitle>
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{workspace.agents.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Active AI agents
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Prompts</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{workspace.prompts.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Saved prompts
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workspace Settings</CardTitle>
              <CardDescription>
                Current workspace configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">General Settings</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Allow External Agents</span>
                      <span className="text-sm font-medium">
                        {workspace.settings.allowExternalAgents ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Require Approval</span>
                      <span className="text-sm font-medium">
                        {workspace.settings.requireApproval ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Limits</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Max Agents</span>
                      <span className="text-sm font-medium">{workspace.settings.maxAgents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Max Groups</span>
                      <span className="text-sm font-medium">{workspace.settings.maxGroups}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Max Chats</span>
                      <span className="text-sm font-medium">{workspace.settings.maxChats}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Retention Period (days)</span>
                      <span className="text-sm font-medium">{workspace.settings.retentionPeriod}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Security</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Two-Factor Authentication</span>
                      <span className="text-sm font-medium">
                        {workspace.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Allowed Domains</span>
                      <span className="text-sm font-medium">
                        {workspace.security.allowedDomains?.length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">IP Whitelist</span>
                      <span className="text-sm font-medium">
                        {workspace.security.ipWhitelist?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle>Groups</CardTitle>
              <CardDescription>
                Manage workspace groups and members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Groups</h2>
                <Button>Create Group</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspace.groups.map((group) => (
                  <Card key={group.id} className="p-4">
                    <h3 className="font-medium">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                    <div className="mt-4 flex items-center space-x-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{group.members.length} members</span>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chats">
          <Card>
            <CardHeader>
              <CardTitle>Chats</CardTitle>
              <CardDescription>
                View and manage workspace conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Chats</h2>
                <Button>Create Chat</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspace.chats.map((chat) => (
                  <Card key={chat.id} className="p-4">
                    <h3 className="font-medium">{chat.name}</h3>
                    <p className="text-sm text-muted-foreground">{chat.description}</p>
                    <div className="mt-4 flex items-center space-x-2 text-sm text-muted-foreground">
                      <MessageSquare className="w-4 h-4" />
                      <span>{chat.messages.length} messages</span>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Agents</CardTitle>
              <CardDescription>
                Manage AI agents in your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Agents</h2>
                <Button>Add Agent</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspace.agents.map((agent) => (
                  <Card key={agent.id} className="p-4">
                    <h3 className="font-medium">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground">{agent.description}</p>
                    <div className="mt-4 flex items-center space-x-2 text-sm text-muted-foreground">
                      <Bot className="w-4 h-4" />
                      <span>{agent.capabilities.length} capabilities</span>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts">
          <Card>
            <CardHeader>
              <CardTitle>Prompts</CardTitle>
              <CardDescription>
                Manage workspace prompts and templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* TODO: Implement prompts list */}
              <p className="text-muted-foreground">Prompts list coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <WorkspaceSettingsDialog
        workspace={workspace}
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        onUpdateWorkspace={onUpdateWorkspace}
      />
    </div>
  );
} 