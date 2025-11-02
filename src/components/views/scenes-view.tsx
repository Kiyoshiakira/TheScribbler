'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clapperboard, Clock, GripVertical, Plus, MoreHorizontal, Lightbulb, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useCurrentScript } from '@/context/current-script-context';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import AiFab from '../ai-fab';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { useScript } from '@/context/script-context';
import { runGetAiSuggestions } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/settings-context';

export interface Scene {
  id: string;
  sceneNumber: number;
  setting: string;
  description: string;
  time: number;
}

export default function ScenesView() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currentScriptId } = useCurrentScript();
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsDialogOpen, setSuggestionsDialogOpen] = useState(false);
  const { script } = useScript();
  const { toast } = useToast();
  const { settings } = useSettings();

  const scenesCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'scenes') : null),
    [firestore, user, currentScriptId]
  );
  
  const scenesQuery = useMemoFirebase(
    () => (scenesCollection ? query(scenesCollection, orderBy('sceneNumber', 'asc')) : null),
    [scenesCollection]
  );

  const { data: scenes, isLoading: areScenesLoading } = useCollection<Scene>(scenesQuery);

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
    const result = await runGetAiSuggestions({ screenplay: script.content, model: settings.aiModel });
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


  if (areScenesLoading) {
    return (
       <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-32" />
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Scenes</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Scene
        </Button>
      </div>

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
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Card>
        ))}
         {!areScenesLoading && scenes && scenes.length === 0 && (
         <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
            <Clapperboard className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-medium">No Scenes Found</h3>
            <p className="mt-1 text-sm">Import a script or create a new scene to get started.</p>
         </div>
      )}
      </div>

       <AiFab
        actions={['openChat']}
        customActions={[{
            label: 'Suggest Scene Improvements',
            icon: <Lightbulb className="mr-2 h-4 w-4" />,
            onClick: handleGetSuggestions,
            isLoading: isSuggestionsLoading,
        }]}
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
