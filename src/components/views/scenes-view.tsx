
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clapperboard, Clock, GripVertical, Plus, MoreHorizontal, Lightbulb, List, LayoutGrid } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useCollection, useFirestore, useUser, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useCurrentScript } from '@/context/current-script-context';
import { collection, query, orderBy, addDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import AiFab from '../ai-fab';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { useScript } from '@/context/script-context';
import { runGetAiSuggestions } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

export interface Scene {
  id: string;
  sceneNumber: number;
  setting: string;
  description: string;
  time: number;
}

function SceneDialog({ 
  scene, 
  onSave, 
  open, 
  onOpenChange,
  nextSceneNumber 
}: { 
  scene: Scene | null;
  onSave: (scene: Omit<Scene, 'id'>) => Promise<boolean>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextSceneNumber: number;
}) {
  const [sceneNumber, setSceneNumber] = useState(1);
  const [setting, setSetting] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setSceneNumber(scene?.sceneNumber || nextSceneNumber);
      setSetting(scene?.setting || '');
      setDescription(scene?.description || '');
      setTime(scene?.time || 5);
    }
  }, [open, scene, nextSceneNumber]);

  const handleSave = async () => {
    if (!setting) {
      toast({
        variant: 'destructive',
        title: 'Setting Required',
        description: 'Please enter a setting for the scene.',
      });
      return;
    }
    setIsSaving(true);
    const success = await onSave({
      sceneNumber,
      setting,
      description,
      time,
    });
    setIsSaving(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{scene ? 'Edit Scene' : 'Add New Scene'}</DialogTitle>
          <DialogDescription>
            {scene ? 'Update the scene details below.' : 'Create a new scene for your script.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sceneNumber">Scene Number</Label>
              <Input
                id="sceneNumber"
                type="number"
                value={sceneNumber}
                onChange={(e) => setSceneNumber(parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="setting">Setting *</Label>
              <Input
                id="setting"
                value={setting}
                onChange={(e) => setSetting(e.target.value)}
                placeholder="e.g., INT. COFFEE SHOP - DAY"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what happens in this scene..."
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Estimated Time (minutes)</Label>
              <Input
                id="time"
                type="number"
                value={time}
                onChange={(e) => setTime(parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Scene'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


const ScenesListView = ({ scenes, onEdit, onDuplicate, onDelete }: { scenes: Scene[] | null; onEdit: (scene: Scene) => void; onDuplicate: (scene: Scene) => void; onDelete: (scene: Scene) => void }) => (
    <div className="space-y-4">
        {scenes && scenes.map((scene) => (
            <Card key={scene.id} className="flex items-center p-2 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 sm:gap-4 flex-1">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab flex-shrink-0" />
                <div className="flex items-center gap-2 sm:gap-4 flex-1">
                    <Clapperboard className="h-8 w-8 text-primary hidden sm:block" />
                    <div className="flex-1">
                    <p className="font-bold">Scene {scene.sceneNumber}: {scene.setting}</p>
                    <p className="text-sm text-muted-foreground sm:hidden mt-1">{scene.description}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 sm:hidden">
                        <Clock className="h-4 w-4" />
                        <span>{scene.time} min</span>
                    </div>
                    <p className="text-sm text-muted-foreground hidden sm:block">{scene.description}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{scene.time} min</span>
                    </div>
                </div>
                </div>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-2 sm:ml-4 flex-shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(scene)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(scene)}>Duplicate</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete(scene)}>Delete</DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </Card>
        ))}
    </div>
);

const BeatboardView = ({ scenes, onEdit }: { scenes: Scene[] | null; onEdit: (scene: Scene) => void }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {scenes && scenes.map((scene) => (
          <Card 
            key={scene.id} 
            className="flex flex-col shadow-sm hover:shadow-lg transition-shadow cursor-pointer h-56"
            onClick={() => onEdit(scene)}
          >
            <CardHeader>
                <CardTitle className='font-headline text-lg flex items-start justify-between gap-2'>
                    <span className="truncate">Scene {scene.sceneNumber}: {scene.setting}</span>
                    <span className="text-sm font-medium text-muted-foreground flex-shrink-0">{scene.time}'</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                 <p className="text-sm text-muted-foreground line-clamp-4">{scene.description}</p>
            </CardContent>
          </Card>
        ))}
    </div>
);


export default function ScenesView() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currentScriptId } = useCurrentScript();
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsDialogOpen, setSuggestionsDialogOpen] = useState(false);
  const { script } = useScript();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'list' | 'beatboard'>('list');
  const [sceneDialogOpen, setSceneDialogOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);

  const scenesCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'scenes') : null),
    [firestore, user, currentScriptId]
  );
  
  const scenesQuery = useMemoFirebase(
    () => (scenesCollection ? query(scenesCollection, orderBy('sceneNumber', 'asc')) : null),
    [scenesCollection]
  );

  const { data: scenes, isLoading: areScenesLoading } = useCollection<Scene>(scenesQuery);

  const nextSceneNumber = useMemo(() => {
    if (!scenes || scenes.length === 0) return 1;
    return Math.max(...scenes.map(s => s.sceneNumber)) + 1;
  }, [scenes]);

  const handleOpenDialog = (scene: Scene | null) => {
    setEditingScene(scene);
    setSceneDialogOpen(true);
  };

  const handleSaveScene = async (sceneData: Omit<Scene, 'id'>): Promise<boolean> => {
    if (!firestore || !scenesCollection) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot save scene: no active script.',
      });
      return false;
    }

    try {
      if (editingScene?.id) {
        // Update existing scene
        const sceneDocRef = doc(scenesCollection, editingScene.id);
        await setDoc(sceneDocRef, sceneData, { merge: true }).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: sceneDocRef.path,
            operation: 'update',
            requestResourceData: sceneData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });
        toast({
          title: 'Scene Updated',
          description: `Scene ${sceneData.sceneNumber} has been updated.`,
        });
      } else {
        // Create new scene
        await addDoc(scenesCollection, sceneData).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: scenesCollection.path,
            operation: 'create',
            requestResourceData: sceneData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });
        toast({
          title: 'Scene Created',
          description: `Scene ${sceneData.sceneNumber} has been created.`,
        });
      }
      return true;
    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
        console.error('Error saving scene:', error);
        toast({
          variant: 'destructive',
          title: 'Save Error',
          description: 'An unexpected error occurred while saving the scene.',
        });
      }
      return false;
    }
  };

  const handleGetSuggestions = async () => {
    if (!script?.content) {
      toast({
        variant: 'destructive',
        title: 'Script is empty',
        description: 'Cannot generate suggestions for an empty script.',
      });
      return;
    }
    setIsSuggestionsLoading(true);
    setSuggestions([]);
    setSuggestionsDialogOpen(true);
    const result = await runGetAiSuggestions({ screenplay: script.content });
    setIsSuggestionsLoading(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
      setSuggestionsDialogOpen(false);
    } else if (result.data) {
      setSuggestions(result.data.suggestions);
    }
  };

  const handleDuplicateScene = async (scene: Scene) => {
    if (!firestore || !scenesCollection) return;

    try {
      const duplicatedScene = {
        sceneNumber: nextSceneNumber,
        setting: scene.setting + ' (Copy)',
        description: scene.description,
        time: scene.time,
      };
      await addDoc(scenesCollection, duplicatedScene).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: scenesCollection.path,
          operation: 'create',
          requestResourceData: duplicatedScene,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });
      toast({
        title: 'Scene Duplicated',
        description: `Scene ${scene.sceneNumber} has been duplicated as scene ${nextSceneNumber}.`,
      });
    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
        console.error('Error duplicating scene:', error);
        toast({
          variant: 'destructive',
          title: 'Duplication Error',
          description: 'An error occurred while duplicating the scene.',
        });
      }
    }
  };

  const handleDeleteScene = async (scene: Scene) => {
    if (!firestore || !scenesCollection || !scene.id) return;

    if (!confirm(`Delete scene ${scene.sceneNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      const sceneRef = doc(scenesCollection, scene.id);
      await deleteDoc(sceneRef).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: sceneRef.path,
          operation: 'delete',
          requestResourceData: {},
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });
      toast({
        title: 'Scene Deleted',
        description: `Scene ${scene.sceneNumber} has been deleted.`,
      });
    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
        console.error('Error deleting scene:', error);
        toast({
          variant: 'destructive',
          title: 'Deletion Error',
          description: 'An error occurred while deleting the scene.',
        });
      }
    }
  };


  if (areScenesLoading) {
    return (
       <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-56" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
             <Card key={i} className="flex items-center p-2 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-4 flex-1">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-8 w-8 hidden sm:block" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="hidden sm:flex items-center gap-2">
                   <Skeleton className="h-5 w-16" />
                </div>
              </div>
               <Skeleton className="h-8 w-8 ml-2 sm:ml-4" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline">Scenes</h1>
        <div className='flex items-center gap-4'>
            <RadioGroup defaultValue="list" onValueChange={(value: 'list' | 'beatboard') => setViewMode(value)} className="flex items-center gap-2">
                <Label htmlFor="view-list" className='cursor-pointer flex items-center gap-2 text-sm p-2 rounded-md has-[:checked]:bg-primary has-[:checked]:text-primary-foreground hover:bg-muted/50'>
                    <RadioGroupItem value="list" id="view-list" className='sr-only' />
                    <List className='w-4 h-4'/>
                    List
                </Label>
                 <Label htmlFor="view-beatboard" className='cursor-pointer flex items-center gap-2 text-sm p-2 rounded-md has-[:checked]:bg-primary has-[:checked]:text-primary-foreground hover:bg-muted/50'>
                    <RadioGroupItem value="beatboard" id="view-beatboard" className='sr-only' />
                    <LayoutGrid className='w-4 h-4' />
                    Beatboard
                </Label>
            </RadioGroup>
            <Button onClick={() => handleOpenDialog(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Scene
            </Button>
        </div>
      </div>

      {viewMode === 'list' ? <ScenesListView scenes={scenes} onEdit={handleOpenDialog} onDuplicate={handleDuplicateScene} onDelete={handleDeleteScene} /> : <BeatboardView scenes={scenes} onEdit={handleOpenDialog} />}

      {!areScenesLoading && scenes && scenes.length === 0 && (
        <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
            <Clapperboard className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-medium">No Scenes Found</h3>
            <p className="mt-1 text-sm">Import a script or create a new scene to get started.</p>
        </div>
      )}

       <AiFab
        actions={['openChat']}
        customActions={[{
            label: 'Suggest Scene Improvements',
            icon: <Lightbulb className="mr-2 h-4 w-4" />,
            onClick: handleGetSuggestions,
            isLoading: isSuggestionsLoading,
        }]}
       />

      {/* Scene Dialog */}
      <SceneDialog
        scene={editingScene}
        onSave={handleSaveScene}
        open={sceneDialogOpen}
        onOpenChange={setSceneDialogOpen}
        nextSceneNumber={nextSceneNumber}
      />

        {/* Suggestions Dialog */}
      <Dialog open={suggestionsDialogOpen} onOpenChange={setSuggestionsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" /> AI Suggestions
            </DialogTitle>
            <DialogDescription>
              Here are some quick suggestions to improve your scenes.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] -mx-6 px-6">
             <div className="space-y-4 py-4">
                {isSuggestionsLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-4/5" />
                </div>
                ) : suggestions.length > 0 ? (
                <ul className="space-y-3">
                {suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm flex gap-3 p-3 bg-muted/50 rounded-md">
                    <Lightbulb className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>{suggestion}</span>
                    </li>
                ))}
                </ul>
                ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                    No suggestions available at the moment.
                </div>
                )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
