"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PersonaDialog } from "./personaDialog"
import { PersonaCard } from "./personaCard"
import { EmptyCustomPersonas } from "./emptyCustomPersonas"
import { Persona } from "@/types"
import { v4 as uuidv4 } from 'uuid';

export default function PersonasScreen() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingPersona, setEditingPersona] = useState<Persona | null>(null)
  const [isNewPersonaDialogOpen, setIsNewPersonaDialogOpen] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newPersona, setNewPersona] = useState<Persona>({
    id: "",
    name: "",
    description: "",
    temperature: 0.7,
    messageLength: "Medium",
    primaryIntent: "Information-seeking",
    communicationStyle: "Casual",
    techSavviness: "Intermediate",
    emotionalState: "Neutral",
    errorTolerance: "Medium",
    decisionSpeed: "Thoughtful",
    slangUsage: "None",
    historyBasedMemory: true,
    systemPrompt: "",
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/tools/personas')
        
        if (!response.ok) {
          throw new Error('Failed to fetch personas')
        }
        
        const data = await response.json()
        setPersonas(data)
      } catch (err) {
        console.error('Error fetching personas:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
  
    fetchPersonas()
  }, [])


  const handleEditPersona = (persona: Persona) => {
    setSelectedPersona(persona);
    setIsEditDialogOpen(true);      
  }

  const handleSaveEdit = () => {
    if (editingPersona) {
      setPersonas(personas.map((p) => (p.id === editingPersona.id ? editingPersona : p)))
      setEditingPersona(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingPersona(null)
  }

  const handleCreatePersona = async () => {
    try {
      setLoading(true)

      const apiKey = localStorage.getItem("anthropic_api_key");
      if (!apiKey) {
        setError("API key is required to generate personas");
        setLoading(false);
        return;
      }

      const response = await fetch('/api/tools/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(newPersona)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create persona')
      }
      
      const createdPersona = await response.json()
      setPersonas([...personas, createdPersona])
      // Reset the newPersona state to initial values
      setNewPersona({
        id: uuidv4(),
        name: "",
        description: "",
        // Include all other default values
        temperature: 0.7,
        messageLength: "Medium",
        primaryIntent: "Information-seeking",
        communicationStyle: "Casual",
        techSavviness: "Intermediate",
        emotionalState: "Neutral",
        errorTolerance: "Medium",
        decisionSpeed: "Thoughtful",
        slangUsage: "None",
        historyBasedMemory: true,
        systemPrompt: "",
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      setIsNewPersonaDialogOpen(false)
    } catch (err) {
      console.error('Error creating persona:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  // Update handleDeletePersona
  const handleDeletePersona = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tools/personas/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete persona')
      }
      
      setPersonas(personas.filter(p => p.id !== id))
    } catch (err) {
      console.error('Error deleting persona:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePersona = async () => {
    try {
      setLoading(true);
      const method = selectedPersona?.id ? "PUT" : "POST";
      const url = selectedPersona?.id
        ? `/api/tools/personas/${selectedPersona.id}`
        : "/api/tools/personas";
  
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedPersona),
      });

      console.log("Res-Giri", response);
  
      if (!response.ok) throw new Error(`Failed to ${selectedPersona?.id ? "update" : "create"} persona`);
  
      const updatedPersona = await response.json();
      setPersonas((prev) =>
        selectedPersona?.id
          ? prev.map((p) => (p.id === selectedPersona.id ? updatedPersona : p))
          : [...prev, updatedPersona]
      );
  
      setIsNewPersonaDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedPersona(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">AI Personas</h1>
          <p className="text-muted-foreground">Customize how your AI agents interact with users</p>
        </div>
        
        <PersonaDialog
          open={isNewPersonaDialogOpen}
          onOpenChange={setIsNewPersonaDialogOpen}
          persona={newPersona}
          setPersona={setNewPersona}
          onSave={handleCreatePersona}
          onCancel={() => setIsNewPersonaDialogOpen(false)}
          title="Create New Persona"
          buttonText="Create Persona"
        >
          <Button onClick={() => setIsNewPersonaDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Persona
          </Button>
        </PersonaDialog>

        {selectedPersona && (
          <PersonaDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            persona={selectedPersona}
            setPersona={setSelectedPersona}
            onSave={handleSavePersona}
            onCancel={() => setIsEditDialogOpen(false)}
            title="Edit Persona"
            buttonText="Update Persona"
          />
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 border-b border-muted">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            All Personas
          </TabsTrigger>
          <TabsTrigger
            value="standard"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            Standard
          </TabsTrigger>
          <TabsTrigger
            value="custom"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            Custom
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {personas.map((persona) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                editingPersona={editingPersona}
                setEditingPersona={setEditingPersona}
                onEdit={handleEditPersona}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
                onDelete={handleDeletePersona}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="standard" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {personas.filter(p => p.isDefault).map((persona) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                editingPersona={editingPersona}
                setEditingPersona={setEditingPersona}
                onEdit={handleEditPersona}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
                onDelete={handleDeletePersona}
                standardOnly={true}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="custom" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {personas.slice(4).length > 0 ? (
              personas.filter(p => p.isDefault).map((persona) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  editingPersona={editingPersona}
                  setEditingPersona={setEditingPersona}
                  onEdit={handleEditPersona}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                  onDelete={handleDeletePersona}
                />
              ))
            ) : (
              <EmptyCustomPersonas onCreateNew={() => setIsNewPersonaDialogOpen(true)} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


