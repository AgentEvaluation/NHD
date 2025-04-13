import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Persona } from "@/types";
import { PersonaReadOnlyView } from "./personaReadOnlyView";
import { Edit, Trash2, X, Check } from "lucide-react";

interface PersonaCardProps {
  persona: Persona;
  editingPersona: Persona | null;
  setEditingPersona: React.Dispatch<React.SetStateAction<Persona | null>>;
  onEdit: (persona: Persona) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  standardOnly?: boolean;
}

export function PersonaCard({
  persona,
  editingPersona,
  setEditingPersona,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  standardOnly = false,
}: PersonaCardProps) {
  const isEditing = editingPersona && editingPersona.id === persona.id;

  return (
    <Card className="relative">
      {isEditing ? (
        <>
          
          <CardFooter className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="default" onClick={onSave}>
              <Check className="h-4 w-4" />
            </Button>
          </CardFooter>
        </>
      ) : (
        <>
          <CardHeader className="pb-2">
            <CardTitle>{persona.name}</CardTitle>
            <CardDescription>{persona.description}</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <PersonaReadOnlyView persona={persona} />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            {!standardOnly && (
              <Button size="sm" variant="ghost" onClick={() => onDelete(persona.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => onEdit(persona)}>
              <Edit className="h-4 w-4" />
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}