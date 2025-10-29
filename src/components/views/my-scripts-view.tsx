'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Book, Library, Loader2, Plus, Trash, User } from 'lucide-react';
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
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { useRouter } from 'next/navigation';


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


export default function MyScriptsView() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { setCurrentScriptId } = useCurrentScript();
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    
    const [deleteScriptDoc, setDeleteScriptDoc] = useState(true);
    const [deleteCharacters, setDeleteCharacters] = useState(true);
    const [deleteScenes, setDeleteScenes] = useState(true);
    const [deleteNotes, setDeleteNotes] = useState(true);


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
            router.push('/dashboard');
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
        router.push('/dashboard');
    };
    
    const handleSelectiveDelete = async (scriptId: string) => {
        if (!firestore || !user || (!deleteScriptDoc && !deleteCharacters && !deleteScenes && !deleteNotes)) {
             toast({
                variant: 'destructive',
                title: 'No Selection',
                description: 'Please select at least one item to delete.',
            });
            return;
        }
        
        setIsDeleting(true);
        const scriptRef = doc(firestore, 'users', user.uid, 'scripts', scriptId);

        try {
            const batch = writeBatch(firestore);
            
            if (deleteCharacters) {
                const subcollectionRef = collection(scriptRef, 'characters');
                const snapshot = await getDocs(subcollectionRef);
                snapshot.forEach((doc) => batch.delete(doc.ref));
            }
            if (deleteScenes) {
                const subcollectionRef = collection(scriptRef, 'scenes');
                const snapshot = await getDocs(subcollectionRef);
                snapshot.forEach((doc) => batch.delete(doc.ref));
            }
            if (deleteNotes) {
                const subcollectionRef = collection(scriptRef, 'notes');
                const snapshot = await getDocs(subcollectionRef);
                snapshot.forEach((doc) => batch.delete(doc.ref));
            }

            if (deleteScriptDoc) {
                batch.delete(scriptRef);
            }

            await batch.commit();

            toast({
                title: 'Delete Successful',
                description: 'The selected script components have been deleted.',
            });
        } catch (error: any) {
             console.error("Error deleting script components: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not delete the selected components.',
            });
        } finally {
            setIsDeleting(false);
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
                <h2 className="text-2xl font-bold font-headline flex items-center gap-2"> <User /> {user?.displayName}'s Scripts</h2>
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
                                            <AlertDialogTitle>Delete Script Components</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action can be destructive. Select the components you want to permanently delete. Unchecking "Script" will clear its sub-collections but keep the script document itself.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <div className="space-y-4 my-4">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="del-script" checked={deleteScriptDoc} onCheckedChange={(c) => setDeleteScriptDoc(c as boolean)} />
                                                <Label htmlFor="del-script" className="font-semibold">Script</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="del-chars" checked={deleteCharacters} onCheckedChange={(c) => setDeleteCharacters(c as boolean)} />
                                                <Label htmlFor="del-chars">All Characters</Label>
                                            </div>
                                             <div className="flex items-center space-x-2">
                                                <Checkbox id="del-scenes" checked={deleteScenes} onCheckedChange={(c) => setDeleteScenes(c as boolean)} />
                                                <Label htmlFor="del-scenes">All Scenes</Label>
                                            </div>
                                             <div className="flex items-center space-x-2">
                                                <Checkbox id="del-notes" checked={deleteNotes} onCheckedChange={(c) => setDeleteNotes(c as boolean)} />
                                                <Label htmlFor="del-notes">All Notes</Label>
                                            </div>
                                        </div>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleSelectiveDelete(script.id)} disabled={isDeleting}>
                                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Delete Selected
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
