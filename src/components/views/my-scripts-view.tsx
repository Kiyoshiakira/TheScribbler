'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Book, Library, Loader2, Plus, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentScript } from '@/context/current-script-context';
import { Skeleton } from '../ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { type View } from '@/app/page';

const initialScriptContent = `FADE IN:

INT. COFFEE SHOP - DAY

A stylish coffee shop. Sunlight streams in. The aroma of coffee fills the air.

JANE (28), sharp and professional, types on her laptop.

LEO (30), an artist, sketches in a notebook, lost in his world.

A sudden CRASH makes everyone jump. A barista dropped a tray.

In the silence, Jane and Leo's eyes meet. A spark.

FADE OUT.
`;

interface Script {
    id: string;
    title: string;
    lastModified: {
        toDate: () => Date;
    } | null;
}

interface MyScriptsViewProps {
    setView: (view: View) => void;
}

export default function MyScriptsView({ setView }: MyScriptsViewProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { setCurrentScriptId } = useCurrentScript();

    const scriptsCollection = useMemoFirebase(
        () => (user && firestore ? collection(firestore, 'users', user.uid, 'scripts') : null),
        [firestore, user]
    );

    const { data: scripts, isLoading: areScriptsLoading } = useCollection<Script>(scriptsCollection);

    const handleCreateNewScript = async () => {
        if (!scriptsCollection) return;
        try {
            const newScriptRef = await addDoc(scriptsCollection, {
                title: 'Untitled Script',
                content: initialScriptContent,
                authorId: user?.uid,
                createdAt: serverTimestamp(),
                lastModified: serverTimestamp(),
            });
            toast({
                title: 'Script Created',
                description: 'A new untitled script has been added to your collection.',
            });
            setCurrentScriptId(newScriptRef.id);
            setView('editor');
        } catch (error: any) {
            console.error("Error creating script: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not create a new script.',
            });
        }
    };

    const handleOpenScript = (scriptId: string) => {
        setCurrentScriptId(scriptId);
        setView('editor');
    };
    
    const handleDeleteScript = async (scriptId: string) => {
        if (!firestore || !user) return;
        
        const scriptRef = doc(firestore, 'users', user.uid, 'scripts', scriptId);

        try {
            const batch = writeBatch(firestore);

            // Get and delete all subcollections
            const subcollections = ['characters', 'scenes', 'notes'];
            for (const sub of subcollections) {
                const subcollectionRef = collection(scriptRef, sub);
                const snapshot = await getDocs(subcollectionRef);
                snapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                });
            }

            // Delete the main script document
            batch.delete(scriptRef);

            await batch.commit();

            toast({
                title: 'Script Deleted',
                description: 'The script and all its data have been permanently deleted.',
            });
        } catch (error: any) {
             console.error("Error deleting script and its subcollections: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not delete the script.',
            });
        }
    }


    if (areScriptsLoading) {
        return (
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-40" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
                </div>
            </div>
        )
    }

    const sortedScripts = scripts ? [...scripts].sort((a, b) => {
        const timeA = a.lastModified ? a.lastModified.toDate().getTime() : 0;
        const timeB = b.lastModified ? b.lastModified.toDate().getTime() : 0;
        return timeB - timeA;
    }) : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">My Scripts</h1>
                <Button onClick={handleCreateNewScript}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Script
                </Button>
            </div>
            
            {sortedScripts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sortedScripts.map((script) => (
                         <Card key={script.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-headline flex items-start justify-between">
                                    <span className="truncate pr-4">{script.title}</span>
                                </CardTitle>
                                <CardDescription>
                                    Last modified: {script.lastModified ? new Date(script.lastModified.toDate()).toLocaleDateString() : 'Just now'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow" />
                            <CardContent className="flex justify-between items-center">
                                <Button onClick={() => handleOpenScript(script.id)}>
                                    <Book className="mr-2 h-4 w-4" />
                                    Open
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon">
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete your
                                            script and all its associated data (characters, scenes, notes).
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteScript(script.id)}>
                                            Continue
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                    <Library className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-medium">No Scripts Found</h3>
                    <p className="mt-1 text-sm">
                        Get started by creating your first script or importing one.
                    </p>
                </div>
            )}
        </div>
    )
}
