"use client";

import { useState } from "react";
import { useAgentConfig } from "@/hooks/useAgentConfig";
import AgentSetup from "@/components/tools/AgentSetup";
import AgentResponse from "@/components/tools/AgentResponse";
import AgentRules from "@/components/tools/AgentRules";
import AgentDescription from "@/components/tools/agentDescription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, MessageSquare } from "lucide-react";

export default function ToolsPage() {
  const {
    testName,
    setTestName,
    agentEndpoint,
    setAgentEndpoint,
    headers,
    setHeaders,
    manualResponse,
    loading,
    responseTime,
    rules,
    setRules,
    savedAgents,
    agentDescription,
    setAgentDescription,
    userDescription,
    setUserDescription,
    isEditMode,
    loadAgent,
    testManually,
    saveTest,
    currentAgentId,
    body,
    setbody,
  } = useAgentConfig();

  const [activeTab, setActiveTab] = useState("description");

  return (
    <div className="relative min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Configure Agent</h2>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border border-border"
            >
              Load Saved Agent
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {savedAgents.length > 0 ? (
                savedAgents.map((agent) => (
                  <DropdownMenuItem
                    key={agent.id}
                    onClick={() => loadAgent(agent.id)}
                  >
                    {agent.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No saved agents</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Input
            placeholder="Enter test name"
            value={testName ?? ""}
            onChange={(e) => setTestName(e.target.value)}
            className="w-64 bg-background"
          />
          <Button onClick={saveTest} disabled={!manualResponse || !testName}>
            {isEditMode ? "Update Test" : "Save Test"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="bg-transparent p-0 border-b border-border gap-2">
        <TabsTrigger
          value="description"
          className="
            relative
            px-3
            py-2
            text-sm
            text-muted-foreground
            transition-colors
            data-[state=active]:border-b-2
            data-[state=active]:border-primary
            data-[state=active]:text-foreground
            data-[state=active]:bg-transparent
            data-[state=active]:rounded-none
          "
        >
          Agent Description
        </TabsTrigger>
        <TabsTrigger
          value="testing"
          className="
            relative
            px-3
            py-2
            text-sm
            text-muted-foreground
            transition-colors
            data-[state=active]:border-b-2
            data-[state=active]:border-primary
            data-[state=active]:text-foreground
            data-[state=active]:bg-transparent
            data-[state=active]:rounded-none
          "
        >
          Testing Setup
        </TabsTrigger>

        </TabsList>

        <TabsContent value="description">
          <AgentDescription
            agentDescription={agentDescription}
            userDescription={userDescription}
            onAgentDescriptionChange={setAgentDescription}
            onUserDescriptionChange={setUserDescription}
          />
          <div className="flex justify-end mt-4">
            <Button onClick={() => setActiveTab("testing")}>Next</Button>
          </div>
        </TabsContent>

        <TabsContent value="testing">
          <div className="grid grid-cols-[2fr_1fr] items-stretch gap-6">
            <div>
              <AgentSetup
                agentEndpoint={agentEndpoint}
                setAgentEndpoint={setAgentEndpoint}
                headers={headers}
                setHeaders={setHeaders}
                body={body}
                setBody={setbody}
              />
              <Button
                onClick={testManually}
                disabled={loading || !body || !agentEndpoint}
                className="w-full mt-4"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {loading ? "Testing..." : "Test Agent"}
            </Button>
            </div>
            <div className="flex flex-col">
              <AgentRules
                manualResponse={manualResponse}
                rules={rules}
                setRules={setRules}
                agentId={currentAgentId}
              />
            </div>
          </div>
          <div className="flex flex-col mt-6 w-full space-y-4">

            <AgentResponse
              manualResponse={manualResponse}
              responseTime={responseTime}
              rules={rules}
              setRules={setRules}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
