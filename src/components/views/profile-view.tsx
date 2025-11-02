'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, deleteDoc, doc, getDocs, writeBatch, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Book, Edit, Loader2, Trash, Users, UserCheck } from 'lucide-react';
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
import type { View } from '../layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


interface Script {
    id: string;
    title: string;
    lastModified: {
        toDate: () => Date;
    } | null;
}

interface ProfileViewProps {
  setView: (view: View | 'profile-edit') => void;
}


export default function ProfileView({ setView }: ProfileViewProps) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { setCurrentScriptId } = useCurrentScript();
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [deleteScriptDoc, setDeleteScriptDoc] = useState(true);
    const [deleteCharacters, setDeleteCharacters] = useState(true);
    const [deleteScenes, setDeleteScenes] = useState(true);
    const [deleteNotes, setDeleteNotes] = useState(true);

    const scriptsCollectionRef = useMemoFirebase(
        () => (user && firestore ? collection(firestore, 'users', user.uid, 'scripts') : null),
        [firestore, user]
    );

    const scriptsQuery = useMemoFirebase(
        () => (scriptsCollectionRef ? query(scriptsCollectionRef, orderBy('lastModified', 'desc')) : null),
        [scriptsCollectionRef]
    )

    const { data: scripts, isLoading: areScriptsLoading } = useCollection<Script>(scriptsQuery);
    
    const userDocRef = useMemoFirebase(
      () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
      [firestore, user]
    );
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<{ photoURL?: string, coverImageUrl?: string, bio?: string }>(userDocRef);


    const handleOpenScript = (scriptId: string) => {
        setCurrentScriptId(scriptId);
        setView('dashboard');
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
            
            const subcollectionsToDelete = [];
            if (deleteCharacters) subcollectionsToDelete.push('characters');
            if (deleteScenes) subcollectionsToDelete.push('scenes');
            if (deleteNotes) subcollectionsToDelete.push('notes');

            for (const sub of subcollectionsToDelete) {
                const subcollectionRef = collection(scriptRef, sub);
                const snapshot = await getDocs(subcollectionRef);
                snapshot.forEach((doc) => batch.delete(doc.ref));
            }
            
            if (deleteScriptDoc) {
                batch.delete(scriptRef);
            }

            await batch.commit().catch(serverError => {
                console.error('Script deletion batch commit failed:', serverError);
                const permissionError = new FirestorePermissionError({
                    path: scriptRef.path,
                    operation: 'delete',
                    requestResourceData: {
                        deleteScriptDoc,
                        deleteCharacters,
                        deleteScenes,
                        deleteNotes
                    }
                });
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            });

            toast({
                title: 'Delete Successful',
                description: 'The selected script components have been deleted.',
            });
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: error instanceof Error ? error.message : 'Could not delete the selected components.',
            });
        } finally {
            setIsDeleting(false);
        }
    }
    
    const isLoading = isUserLoading || isProfileLoading || areScriptsLoading;

    const ScriptsList = () => {
        if (areScriptsLoading) {
            return (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
                </div>
            )
        }

        return (
            <div className='mt-6'>
                {scripts && scripts.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {scripts.map((script) => (
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
                        <Book className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-medium">No Scripts Found</h3>
                        <p className="mt-1 text-sm">
                            Your created and imported scripts will appear here.
                        </p>
                    </div>
                )}
            </div>
        )
    }

    const PlaceholderContent = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
      <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg mt-6">
        {icon}
        <h3 className="mt-4 text-lg font-medium">{title}</h3>
        <p className="mt-1 text-sm">
            This section is under construction. Come back soon!
        </p>
      </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <Card className="overflow-hidden">
                <div className="h-32 sm:h-48 bg-muted relative">
                    {isLoading ? <Skeleton className="h-full w-full" /> : (
                        userProfile?.coverImageUrl && (
                            <Image
                                src={userProfile.coverImageUrl}
                                alt="Cover image"
                                fill
                                className="object-cover"
                            />
                        )
                    )}
                </div>
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:-mt-20">
                     <Avatar className="w-28 h-28 sm:w-32 sm:h-32 border-4 border-background flex-shrink-0 -mt-16 sm:mt-0">
                        {isLoading ? <Skeleton className="h-full w-full rounded-full" /> : (
                            <>
                                <AvatarImage src={userProfile?.photoURL || user?.photoURL || undefined} />
                                <AvatarFallback className="text-4xl">{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </>
                        )}
                    </Avatar>
                     <div className="w-full sm:flex-1 mt-2 sm:mt-0 sm:pb-2">
                         {isLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-48" />
                                <Skeleton className="h-5 w-64" />
                            </div>
                         ) : (
                            <>
                             <h1 className="text-2xl sm:text-3xl font-bold font-headline truncate">{user?.displayName}</h1>
                             <div className="text-muted-foreground mt-1 truncate">{userProfile?.bio || 'No bio yet.'}</div>
                            </>
                         )}
                    </div>
                    <Button variant="outline" onClick={() => setView('profile-edit')} className="w-full sm:w-auto flex-shrink-0">
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                </div>
            </Card>
            
            <Tabs defaultValue="scripts" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="scripts">My Scripts</TabsTrigger>
                <TabsTrigger value="friends">My Friends</TabsTrigger>
                <TabsTrigger value="collabs">My Collabs</TabsTrigger>
              </TabsList>
              <TabsContent value="scripts">
                <ScriptsList />
              </TabsContent>
              <TabsContent value="friends">
                <PlaceholderContent title="Friends List Coming Soon" icon={<Users className="mx-auto h-12 w-12" />} />
              </TabsContent>
              <TabsContent value="collabs">
                <PlaceholderContent title="Collaborations Coming Soon" icon={<UserCheck className="mx-auto h-12 w-12" />} />
              </TabsContent>
            </Tabs>
        </div>
    );
}
