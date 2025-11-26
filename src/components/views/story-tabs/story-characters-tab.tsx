'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Loader2, User, Upload, Users, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useCurrentScript } from '@/context/current-script-context';
import { collection, addDoc, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { sanitizeFirestorePayload } from '@/lib/firestore-utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { aiGenerateCharacterProfile } from '@/ai/flows/ai-generate-character-profile';

interface StoryCharacter {
  id?: string;
  name: string;
  role: string;
  description: string;
  personality: string;
  background: string;
  goals: string;
  imageUrl?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

const CHARACTER_ROLES = ['Protagonist', 'Antagonist', 'Supporting', 'Minor', 'Other'];

export default function StoryCharactersTab() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currentScriptId } = useCurrentScript();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<StoryCharacter | null>(null);

  const charactersCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'storyCharacters') : null),
    [firestore, user, currentScriptId]
  );

  const { data: characters, isLoading } = useCollection<StoryCharacter>(charactersCollection);

  const handleOpenDialog = (character: StoryCharacter | null = null) => {
    if (character) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = character;
      setEditingCharacter(rest);
    } else {
      setEditingCharacter({
        name: '',
        role: 'Supporting',
        description: '',
        personality: '',
        background: '',
        goals: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSaveCharacter = async (characterToSave: StoryCharacter) => {
    if (!charactersCollection) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot save character: no active script.' });
      return;
    }

    const isNew = !characterToSave.id;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...plainData } = characterToSave;

    try {
      if (isNew) {
        const docData = sanitizeFirestorePayload({ ...plainData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        await addDoc(charactersCollection, docData).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: charactersCollection.path,
            operation: 'create',
            requestResourceData: docData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });
      } else {
        const characterDocRef = doc(charactersCollection, id);
        const updateData = sanitizeFirestorePayload({ ...plainData, updatedAt: serverTimestamp() });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        await setDoc(characterDocRef, updateData, { merge: true }).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: characterDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });
      }
      toast({
        title: isNew ? 'Character Created' : 'Character Updated',
        description: `${characterToSave.name} has been saved.`,
      });
      setDialogOpen(false);
    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
        console.error('Error saving character:', error);
        toast({
          variant: 'destructive',
          title: 'Save Error',
          description: 'An unexpected error occurred while saving the character.',
        });
      }
    }
  };

  const handleDeleteCharacter = async (character: StoryCharacter) => {
    if (!charactersCollection || !character.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot delete character.' });
      return;
    }

    if (!confirm(`Delete "${character.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const characterRef = doc(charactersCollection, character.id);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      await deleteDoc(characterRef).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: characterRef.path,
          operation: 'delete',
          requestResourceData: {},
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });

      toast({
        title: 'Character Deleted',
        description: `${character.name} has been deleted.`,
      });
    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
        console.error('Error deleting character:', error);
        toast({
          variant: 'destructive',
          title: 'Delete Error',
          description: 'An unexpected error occurred while deleting the character.',
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  // Handle case when no project is selected
  if (!currentScriptId) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-headline">Characters</h2>
        </div>
        <Card className="p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Project Selected</h3>
          <p className="text-muted-foreground">
            Please select or create a project from the Dashboard to manage characters.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold font-headline">Characters</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Character
        </Button>
      </div>

      {characters && characters.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Characters Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first character to populate your story.
          </p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Character
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {characters?.map((character) => (
            <Card
              key={character.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleOpenDialog(character)}
            >
              <CardHeader className="p-0">
                <div className="aspect-square w-full bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                  {character.imageUrl ? (
                    <Image
                      src={character.imageUrl}
                      alt={character.name}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-1/2 h-1/2 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <CardTitle className="font-headline text-base truncate">{character.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{character.role}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{character.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CharacterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        character={editingCharacter}
        onSave={handleSaveCharacter}
        onDelete={handleDeleteCharacter}
      />
    </div>
  );
}

function CharacterDialog({
  open,
  onOpenChange,
  character,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: StoryCharacter | null;
  onSave: (character: StoryCharacter) => void;
  onDelete: (character: StoryCharacter) => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Supporting');
  const [description, setDescription] = useState('');
  const [personality, setPersonality] = useState('');
  const [background, setBackground] = useState('');
  const [goals, setGoals] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setName(character?.name || '');
      setRole(character?.role || 'Supporting');
      setDescription(character?.description || '');
      setPersonality(character?.personality || '');
      setBackground(character?.background || '');
      setGoals(character?.goals || '');
      setImageUrl(character?.imageUrl || '');
    }
  }, [open, character]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!description && !name) {
      toast({ 
        variant: 'destructive', 
        title: 'Input Required', 
        description: 'Please provide at least a name or description to generate character details with AI.' 
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await aiGenerateCharacterProfile({
        characterDescription: description || `A ${role.toLowerCase()} character`,
        characterName: name || undefined,
        existingProfile: [personality, background, goals].filter(Boolean).join('\n\n'),
      });

      // Update fields with AI-generated content
      if (!name && result.name) {
        setName(result.name);
      }
      
      // Parse the profile to extract different sections if possible
      const profileText = result.profile;
      
      // If fields are empty, fill them with the generated profile
      if (!personality && !background && !goals) {
        // Split the profile into sections if it contains clear markers
        const sections = profileText.split('\n\n');
        if (sections.length >= 3) {
          setPersonality(sections[0]);
          setBackground(sections[1]);
          setGoals(sections[2]);
        } else {
          // Otherwise put it all in personality
          setPersonality(profileText);
        }
      } else {
        // Enhance existing content
        if (!personality) setPersonality(profileText);
        if (!background) setBackground(profileText);
        if (!goals) setGoals(profileText);
      }

      toast({
        title: 'AI Generation Complete',
        description: 'Character profile has been generated. Review and edit as needed.',
      });
    } catch (error) {
      console.error('Error generating character profile:', error);
      toast({
        variant: 'destructive',
        title: 'AI Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate character profile.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!name) {
      toast({ variant: 'destructive', title: 'Name Required', description: 'Please enter a name for the character.' });
      return;
    }
    setIsSaving(true);
    await onSave({
      ...(character || {}),
      id: character?.id,
      name,
      role,
      description,
      personality,
      background,
      goals,
      imageUrl,
    });
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-headline">{character?.id ? 'Edit Character' : 'Add Character'}</DialogTitle>
              <DialogDescription>
                {character?.id ? 'Edit your character details.' : 'Create a new character for your story.'}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
              title="Generate character details with AI"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              AI Generate
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1 flex flex-col items-center gap-2">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <Image src={imageUrl} alt={name} width={96} height={96} className="object-cover w-full h-full" />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
            <div className="col-span-3 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Character Name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHARACTER_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief physical and character description..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personality">Personality</Label>
            <Textarea
              id="personality"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Personality traits, quirks, and behavior..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="background">Background</Label>
            <Textarea
              id="background"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="Character's history and backstory..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goals">Goals & Motivations</Label>
            <Textarea
              id="goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="What does this character want? What drives them?"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          {character?.id && (
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(character);
                onOpenChange(false);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Character
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
