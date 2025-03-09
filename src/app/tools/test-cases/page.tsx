"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TestCaseVariations } from "@/components/tools/TestCaseVariations";
import { AgentConfig } from "@/types";
import PersonaSelector from "@/components/tools/personaSelector";
import { Button } from "@/components/ui/button";

export default function TestCasesPage() {
  const [agentCases, setAgentCases] = useState<AgentConfig[]>([]);
  const [selectedCase, setSelectedCase] = useState<AgentConfig | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchSavedTests = async () => {
      try {
        const response = await fetch("/api/tools/agent-config");
        if (!response.ok) {
          throw new Error("Failed to fetch saved tests");
        }
        const data = await response.json();
        setAgentCases(data);
      } catch (error) {
        console.error("Error fetching saved tests:", error);
      }
    };
  
    fetchSavedTests();
  }, []);
  
  const handleCaseSelect = (test: AgentConfig) => {
    setSelectedCase(test);
  };

  const toggleSelectCase = (id: string) => {
    setSelectedIds((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((selectedId) => selectedId !== id)
        : [...prevSelected, id]
    );
  };

  const selectAllCases = () => {
    if (selectedIds.length === agentCases.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(agentCases.map((test) => test.id));
    }
  };

  // Placeholder for delete functionality
  const deleteSelectedCases = () => {
    console.log("Delete selected cases:", selectedIds);
    // Implement delete functionality here
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Test Scenarios</h1>
          <p className="text-muted-foreground">Manage test cases and personas for your agents</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Agent Cases Column */}
        <div className="col-span-4">
          <Card className="bg-background border-border border h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Agent Cases</CardTitle>
                <Badge variant="outline" className="bg-background">
                  {agentCases.length} Cases
                </Badge>
              </div>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectAllCases}
                  className="text-xs"
                >
                  {selectedIds.length === agentCases.length && agentCases.length > 0
                    ? "Deselect All"
                    : "Select All"}
                </Button>
                {selectedIds.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="text-xs"
                    onClick={deleteSelectedCases}
                  >
                    Delete Selected
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-12rem)] overflow-y-auto">
              <div className="space-y-2">
                {agentCases.map((test) => (
                  <div
                    key={test.id}
                    className={`p-4 rounded-[var(--radius)] cursor-pointer transition-colors border ${
                      selectedCase?.id === test.id
                        ? "border-primary bg-accent/10"
                        : "border-border hover:bg-accent/5"
                    }`}
                    onClick={() => handleCaseSelect(test)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(test.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelectCase(test.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="mr-2"
                        />
                        <h3 className="font-medium">
                          {test.name || "Unnamed Test"}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate max-w-[300px]">
                      Endpoint: {test.endpoint}
                    </p>
                  </div>
                ))}

                {agentCases.length === 0 && (
                  <div className="text-center py-8 text-zinc-500">
                    No agent cases yet. Create a test from the Dashboard.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Case Variations Column */}
        <div className="col-span-4">
          <TestCaseVariations selectedTestId={selectedCase?.id || ""} />
        </div>

        {/* Persona Selector Column */}
        <div className="col-span-4">
          <PersonaSelector selectedTest={selectedCase?.id || ""} />
        </div>
      </div>
    </div>
  );
}