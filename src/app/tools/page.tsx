"use client";

import { useState, useRef, useEffect } from "react";
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
  const [activeHeadersBodyTab, setActiveHeadersBodyTab] = useState("headers");

  const agentDescriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const idealUserProfileRef = useRef<HTMLTextAreaElement | null>(null);
  const agentEndpointRef = useRef<HTMLInputElement | null>(null);
  const headerKeyRef = useRef<HTMLInputElement | null>(null);
  const headerValueRef = useRef<HTMLInputElement | null>(null);
  const requestBodyRef = useRef<HTMLTextAreaElement | null>(null);
  
  const handleTabNavigation = (e: KeyboardEvent) => {
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      const activeElement = document.activeElement;
      if (activeElement === agentDescriptionRef.current) {
        idealUserProfileRef.current?.focus();
        return;
      }
      if (activeElement === idealUserProfileRef.current) {
        setActiveTab("testing");
        setTimeout(() => {
          agentEndpointRef.current?.focus();
        }, 50);
        return;
      }
      if (activeElement === agentEndpointRef.current) {
        setActiveHeadersBodyTab("headers");
        setTimeout(() => {
          headerKeyRef.current?.focus();
        }, 50);
        return;
      }
      if (activeElement === headerKeyRef.current) {
        headerValueRef.current?.focus();
        return;
      }
      if (activeElement === headerValueRef.current) {
        setActiveHeadersBodyTab("body");
        setTimeout(() => {
          requestBodyRef.current?.focus();
        }, 50);
        return;
      }
      if (activeElement === requestBodyRef.current) {
        setActiveTab("description");
        setActiveHeadersBodyTab("headers");
        setTimeout(() => {
          agentDescriptionRef.current?.focus();
        }, 50);
        return;
      }
      setActiveTab("description");
      setActiveHeadersBodyTab("headers");
      setTimeout(() => {
        agentDescriptionRef.current?.focus();
      }, 50);
    }
  };
  
  useEffect(() => {
    window.addEventListener("keydown", handleTabNavigation);
    return () => {
      window.removeEventListener("keydown", handleTabNavigation);
    };
  }, []);

  return (
    <div className="relative min-h-screen p-6" tabIndex={-1}>
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
            agentDescriptionRef={agentDescriptionRef}
            idealUserProfileRef={idealUserProfileRef}
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
                agentEndpointRef={agentEndpointRef}
                requestBodyRef={requestBodyRef}
                headerKeyRef={headerKeyRef}
                headerValueRef={headerValueRef}
                activeTab={activeHeadersBodyTab}
                setActiveTab={setActiveHeadersBodyTab}
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
