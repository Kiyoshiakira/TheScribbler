'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Sparkles, User, FileText, Upload } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { runAiAgent } from '@/app/actions';
import { Skeleton } from '../ui/skeleton';
import React from 'react';
import { useScript } from '@/context/script-context';


interface Character {
  name: string;
  description: string;
  imageId: string;
  scenes: number;
  profile?: string;
  imageUrl?: string;
}

const CHARACTERS_STORAGE_KEY = 'scriptscribbler-characters';

const initialCharacters: Character[] = [
  {
    name: 'Jane',
    description: 'A sharp, ambitious lawyer.',
    imageId: 'character1',
    scenes: 5,
  },
  {
    name: 'Leo',
    description: 'A free-spirited artist.',
    imageId: 'character2',
    scenes: 4,
  },
  {
    name: 'Barista',
    description: 'An easily flustered coffee shop employee.',
    imageId: 'character3',
    scenes: 1,
  },
  {
    name: 'Mr. Henderson',
    description: "Jane's demanding boss.",
    imageId: 'character4',
    scenes: 1,
  },
  {
    name: 'Chloe',
    description: "Leo's supportive artist friend.",
    imageId: 'character5',
    scenes: 2,
  },
];

const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id);

function CharacterDialog({ character, onSave, trigger }: { character?: Character | null, onSave: (char: Character) => void, trigger: React.ReactNode }) {
  const { scriptContent } = useScript();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [profile, setProfile] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    if (open) {
      setName(character?.name || '');
      setDescription(character?.description || '');
      setProfile(character?.profile || '');
      setImageUrl(character?.imageUrl || (character?.imageId && getImage(character.imageId)?.imageUrl) || '');
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
    setIsGenerating(true);
    setProfile('');
    setName('');

    const result = await runAiAgent({
      request: `Generate a character profile for: ${description}`,
      script: scriptContent,
    });
    
    setIsGenerating(false);
    
    if (result.error || !result.data?.toolResult) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Could not generate a structured character profile.',
      });
    } else {
        const toolResult = result.data.toolResult as { name: string; profile: string };
        if (toolResult.name && toolResult.profile) {
            setName(toolResult.name);
            setProfile(toolResult.profile);
        } else {
             toast({
                variant: 'destructive',
                title: 'AI Response Error',
                description: 'The AI did not return a valid name and profile. Please try again.',
            });
        }
    }
  };

  const handleSave = () => {
    if (!name) {
      toast({
        variant: 'destructive',
        title: 'Name required',
        description: 'Please enter a name for the character.',
      });
      return;
    }
    onSave({
      name,
      description,
      profile,
      imageUrl,
      scenes: character?.scenes || 0,
      imageId: character?.imageId || `character${Date.now()}`,
    });
    setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{character ? 'Edit Character' : 'Add New Character'}</DialogTitle>
          <DialogDescription>
            {character ? 'Edit the details for this character.' : 'Create a new character profile. Use the AI generator for a detailed starting point.'}
          </DialogDescription>
        </DialogHeader>
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
                <Button size="sm" variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                </Button>
            </div>
          </div>
          <div className="col-span-4 space-y-2">
            <div className='flex justify-between items-center'>
                <Label htmlFor="name">Character Name</Label>
            </div>
            {isGenerating ? (
                <Skeleton className="h-10 w-2/3" />
            ) : (
                <Input id="name" placeholder="Character's Name" value={name} onChange={e => setName(e.target.value)} />
            )}
          </div>
          <div className="col-span-4 space-y-2">
            <Label htmlFor="profile">Character Profile</Label>
            {isGenerating ? (
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
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>Save Character</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CharactersView() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(CHARACTERS_STORAGE_KEY);
      setCharacters(item ? JSON.parse(item) : initialCharacters);
    } catch (error) {
      console.warn(`Error reading localStorage key “${CHARACTERS_STORAGE_KEY}”:`, error);
      setCharacters(initialCharacters);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        window.localStorage.setItem(CHARACTERS_STORAGE_KEY, JSON.stringify(characters));
      } catch (error) {
        console.warn(`Error setting localStorage key “${CHARACTERS_STORAGE_KEY}”:`, error);
      }
    }
  }, [characters, isLoaded]);

  const handleSaveCharacter = (charToSave: Character) => {
    const existingIndex = characters.findIndex(c => c.imageId === charToSave.imageId);
    if (existingIndex > -1) {
      const updatedCharacters = [...characters];
      updatedCharacters[existingIndex] = charToSave;
      setCharacters(updatedCharacters);
    } else {
      setCharacters([charToSave, ...characters]);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Characters</h1>
        <CharacterDialog
          onSave={handleSaveCharacter}
          character={null}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Character
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {characters.map((character) => {
          const image = character.imageUrl ? { imageUrl: character.imageUrl, imageHint: 'character portrait' } : getImage(character.imageId);
          return (
            <CharacterDialog
                key={character.imageId}
                character={character}
                onSave={handleSaveCharacter}
                trigger={
                    <Card className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="p-0">
                      <div className="aspect-square w-full bg-muted overflow-hidden">
                        {image && (
                          <Image
                            src={image.imageUrl}
                            alt={`Portrait of ${character.name}`}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                            data-ai-hint={(image as any).imageHint || 'character portrait'}
                          />
                        )}
                        {!image && <div className="w-full h-full bg-muted flex items-center justify-center"><User className="w-1/2 h-1/2 text-muted-foreground" /></div>}
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
                }
            />
          );
        })}
      </div>
    </div>
  );
}
