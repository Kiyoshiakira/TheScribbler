'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clapperboard, Clock, GripVertical, Plus, MoreHorizontal } from 'lucide-react';
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

interface Scene {
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

  const scenesCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'scenes') : null),
    [firestore, user, currentScriptId]
  );
  
  const scenesQuery = useMemoFirebase(
    () => (scenesCollection ? query(scenesCollection, orderBy('sceneNumber', 'asc')) : null),
    [scenesCollection]
  );

  const { data: scenes, isLoading: areScenesLoading } = useCollection<Scene>(scenesQuery);

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
    </div>
  );
}
