
'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Sparkles, User, FileText, Upload, Loader2, Users } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { runGetAiCharacterProfile } from '@/app/actions';
import { Skeleton } from '../ui/skeleton';
import React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, addDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useCurrentScript } from '@/context/current-script-context';
import AiFab from '../ai-fab';

export interface Character {
  id?: string;
  name: string;
  description: string;
  scenes: number;
  profile?: string;
  imageUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

function CharacterDialog({ character, onSave, onGenerate, open, onOpenChange, isGenerating }: { character: Character | null, onSave: (char: Character) => void, onGenerate: (desc: string, name?: string, profile?: string) => Promise<Character | null>, open: boolean, onOpenChange: (open: boolean) => void, isGenerating: boolean }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [profile, setProfile] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const { toast } = useToast();
  
  const isNewCharacter = !character?.id;

  useEffect(() => {
    if (open) {
      setName(character?.name || '');
      setDescription(character?.description || '');
      setProfile(character?.profile || '');
      setImageUrl(character?.imageUrl || '');
    }
  }, [open, character]);

  const handleGenerate = async () => {
    if (!description) {
      toast({
          variant: 'destructive',
          title: 'Description needed',
          description: 'Please enter a brief character description to generate a profile.',
      });
      return;
    }
    setIsAiGenerating(true);
    // Don't clear the name and profile - pass them to AI for context
    const currentName = name;
    const currentProfile = profile;
    
    const profileData = await onGenerate(description, currentName, currentProfile);
    setIsAiGenerating(false);

    if (profileData) {
        setName(profileData.name);
        setProfile(profileData.profile || '');
        setDescription(profileData.description || '');
    }
  };

  const handleSave = async () => {
    if (!name) {
      toast({
        variant: 'destructive',
        title: 'Name required',
        description: 'Please enter a name for the character.',
      });
      return;
    }
    setIsSaving(true);
    await onSave({
      ...(character || {}),
      id: character?.id,
      name,
      description,
      profile,
      imageUrl,
      scenes: character?.scenes || 0,
    });
    setIsSaving(false);
    onOpenChange(false);
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">{isNewCharacter ? 'Add New Character' : 'Edit Character'}</DialogTitle>
          <DialogDescription>
            {isNewCharacter ? 'Create a new character profile. Use the AI generator for a detailed starting point.' : 'Edit the details for this character.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="grid grid-cols-4 gap-4 py-4">
            <div className="col-span-1 flex flex-col items-center gap-2 pt-2">
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
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            <div className="col-span-3 space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="description">One-line Description</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., A grizzled detective haunted by his past."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className='flex justify-end items-center'>
                <Button size="sm" variant="outline" onClick={handleGenerate} disabled={isAiGenerating || isGenerating}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isAiGenerating || isGenerating ? 'Generating...' : 'Generate with AI'}
                </Button>
              </div>
            </div>
            <div className="col-span-4 space-y-2">
              <div className='flex justify-between items-center'>
                <Label htmlFor="name">Character Name</Label>
              </div>
              {isAiGenerating || isGenerating ? (
                <Skeleton className="h-10 w-2/3" />
              ) : (
                <Input id="name" placeholder="Character's Name" value={name} onChange={e => setName(e.target.value)} />
              )}
            </div>
            <div className="col-span-4 space-y-2">
              <Label htmlFor="profile">Character Profile</Label>
              {isAiGenerating || isGenerating ? (
                <div className='space-y-2 pt-2'>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
              ) : (
                <Textarea
                  id="profile"
                  className="min-h-[150px]"
                  placeholder="Full character profile will appear here..."
                  value={profile}
                  onChange={e => setProfile(e.target.value)}
                />
              )}
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Character
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CharactersView() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currentScriptId } = useCurrentScript();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

  const charactersCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'characters') : null),
    [firestore, user, currentScriptId]
  );

  const { data: characters, isLoading: areCharactersLoading } = useCollection<Character>(charactersCollection);

  const handleOpenDialog = (character: Character | null) => {
    // Remove timestamp properties before passing to the dialog
    if (character) {
      const { createdAt, updatedAt, ...rest } = character;
      setEditingCharacter(rest);
    } else {
      setEditingCharacter(null);
    }
    setDialogOpen(true);
  };

  const handleSaveCharacter = async (charToSave: Character) => {
    if (!firestore || !charactersCollection) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot save character: no active script.' });
      return;
    }
  
    const isNew = !charToSave.id;
    const { id, createdAt, updatedAt, ...plainCharData } = charToSave;

  
    try {
        if (isNew) {
            const docData = { ...plainCharData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
            const docRef = await addDoc(charactersCollection, docData).catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: charactersCollection.path,
                    operation: 'create',
                    requestResourceData: docData,
                });
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            });
        } else {
            const charDocRef = doc(charactersCollection, charToSave.id);
            const updateData = { ...plainCharData, updatedAt: serverTimestamp() };
            await setDoc(charDocRef, updateData, { merge: true }).catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: charDocRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            });
        }
        toast({
            title: isNew ? 'Character Created' : 'Character Updated',
            description: `${charToSave.name} has been saved.`,
        });
    } catch (error) {
         if (!(error instanceof FirestorePermissionError)) {
            console.error("Error saving character: ", error);
            toast({
                variant: 'destructive',
                title: 'Save Error',
                description: 'An unexpected error occurred while saving the character.',
            });
        }
    }
  };
  
  const handleGenerateCharacter = async (description: string, characterName?: string, existingProfile?: string): Promise<Character | null> => {
      if (!description) {
          toast({
              variant: 'destructive',
              title: 'Description needed',
              description: 'Please enter a brief character description to generate a profile.',
          });
          return null;
      }
      setIsGenerating(true);
      
      const result = await runGetAiCharacterProfile({ 
        characterDescription: description,
        characterName: characterName || undefined,
        existingProfile: existingProfile || undefined,
      });
      
      setIsGenerating(false);

      if (result.error || !result.data) {
          toast({
              variant: 'destructive',
              title: 'Error',
              description: result.error || 'Could not generate a structured character profile.',
          });
          return null;
      } else {
          const profileData = result.data;
          if (profileData.name && profileData.profile) {
              const generatedChar: Character = {
                  name: profileData.name,
                  profile: profileData.profile,
                  description: profileData.profile.split('\n')[0],
                  scenes: 0
              };
              setEditingCharacter(generatedChar);
              setDialogOpen(true);
              return generatedChar;
          } else {
              toast({
                  variant: 'destructive',
                  title: 'AI Response Error',
                  description: 'The AI did not return a valid name and profile. Please try again.',
              });
              return null;
          }
      }
  };


  if (areCharactersLoading) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="p-0">
                             <Skeleton className="aspect-square w-full" />
                        </CardHeader>
                        <CardContent className="p-3">
                            <Skeleton className="h-5 w-3/4 mb-2" />
                            <Skeleton className="h-3 w-full" />
                        </CardContent>
                         <CardFooter className="p-3">
                            <Skeleton className="h-4 w-full" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Characters</h1>
        <Button onClick={() => handleOpenDialog(null)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Character
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {characters && characters.map((character) => {
          return (
            <Card
              key={character.id}
              className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleOpenDialog(character)}
            >
              <CardHeader className="p-0">
                <div className="aspect-square w-full bg-muted overflow-hidden">
                  {character.imageUrl ? (
                    <Image
                      src={character.imageUrl}
                      alt={`Portrait of ${character.name}`}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                      data-ai-hint={'character portrait'}
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center"><User className="w-1/2 h-1/2 text-muted-foreground" /></div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <CardTitle className="font-headline text-base truncate">{character.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1 truncate">{character.description}</p>
              </CardContent>
              <CardFooter className="p-3 bg-muted/50 flex justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>Profile</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-primary" />
                  <span className="font-medium">{character.scenes} Scenes</span>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      {!areCharactersLoading && characters && characters.length === 0 && (
         <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
            <Users className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-medium">No Characters Yet</h3>
            <p className="mt-1 text-sm">Add a character to get started, or import a script.</p>
         </div>
      )}
      <AiFab
        actions={['openChat']}
        customActions={[{
            label: 'Generate New Character',
            icon: <Sparkles className="mr-2 h-4 w-4" />,
            onClick: () => {
              setEditingCharacter(null); // Ensure we're creating a new character
              setDialogOpen(true);
            },
            isLoading: isGenerating,
        }]}
      />
      <CharacterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        character={editingCharacter}
        onSave={handleSaveCharacter}
        onGenerate={handleGenerateCharacter}
        isGenerating={isGenerating}
      />
    </div>
  );
}
