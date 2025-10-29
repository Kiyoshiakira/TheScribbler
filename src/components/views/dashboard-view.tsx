'use client';

import { useScript } from "@/context/script-context";
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useCurrentScript } from "@/context/current-script-context";
import { collection, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Users, StickyNote, Clapperboard, Edit, NotebookPen, BookOpen, Plus, Sparkles } from 'lucide-react';
import type { Character } from "./characters-view";
import type { Note } from "./notes-view";
import type { Scene } from "./scenes-view";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import type { View } from "../layout/AppLayout";
import { useToast } from "@/hooks/use-toast";


function StatCard({ title, value, icon, isLoading }: { title: string, value: number, icon: React.ReactNode, isLoading: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{value}</div>}
            </CardContent>
        </Card>
    )
}

export default function DashboardView({ setView }: { setView: (view: View) => void }) {
    const { script, isScriptLoading } = useScript();
    const { user } = useUser();
    const firestore = useFirestore();
    const { currentScriptId, setCurrentScriptId } = useCurrentScript();
    const { toast } = useToast();

    const charactersCollection = useMemoFirebase(
        () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'characters') : null),
        [firestore, user, currentScriptId]
    );
    const { data: characters, isLoading: areCharactersLoading } = useCollection<Character>(charactersCollection);

    const notesCollection = useMemoFirebase(
        () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'notes') : null),
        [firestore, user, currentScriptId]
    );
    const { data: notes, isLoading: areNotesLoading } = useCollection<Note>(notesCollection);

    const scenesCollection = useMemoFirebase(
        () => (user && firestore && currentScriptId ? query(collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'scenes'), orderBy('sceneNumber')) : null),
        [firestore, user, currentScriptId]
    );
    const { data: scenes, isLoading: areScenesLoading } = useCollection<Scene>(scenesCollection);
    
    const handleCreateNewScript = async () => {
        if (!firestore || !user) return;
        try {
            const scriptsCollectionRef = collection(firestore, 'users', user.uid, 'scripts');
            const newScriptDoc = await addDoc(scriptsCollectionRef, {
                title: 'Untitled Script',
                content: 'SCENE 1\n\nINT. ROOM - DAY\n\nA new story begins.',
                logline: '',
                authorId: user.uid,
                createdAt: serverTimestamp(),
                lastModified: serverTimestamp(),
            });
            toast({
                title: 'Script Created',
                description: 'A new untitled script has been added to your collection.',
            });
            setCurrentScriptId(newScriptDoc.id);
            setView('editor');
        } catch (error) {
            console.error('Error creating new script:', error);
            const permissionError = new FirestorePermissionError({
                path: `users/${user.uid}/scripts`,
                operation: 'create',
                requestResourceData: { title: 'Untitled Script' }
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not create a new script.',
            });
        }
    };


    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Start a New Script</CardTitle>
                    <CardDescription>
                        Begin your next masterpiece from scratch or let our AI give you a starting point.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="w-full" onClick={handleCreateNewScript}>
                        <Plus className="mr-2 h-5 w-5" />
                        Create New Script
                    </Button>
                    <Button size="lg" variant="secondary" className="w-full">
                        <Sparkles className="mr-2 h-5 w-5" />
                        Start with AI
                    </Button>
                </CardContent>
            </Card>


            {/* Header */}
            <div className="space-y-2">
                <h2 className="text-3xl font-bold font-headline">Current Script: {isScriptLoading ? <Skeleton className="h-9 w-48 inline-block" /> : script?.title}</h2>
                <div className="flex items-center gap-4">
                    <p className="text-lg text-muted-foreground italic">
                        {isScriptLoading ? <Skeleton className="h-6 w-96" /> : (script?.logline || "No logline has been set for this script yet.")}
                    </p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Scenes" value={scenes?.length || 0} icon={<Clapperboard className="h-4 w-4 text-muted-foreground" />} isLoading={areScenesLoading} />
                <StatCard title="Characters" value={characters?.length || 0} icon={<Users className="h-4 w-4 text-muted-foreground" />} isLoading={areCharactersLoading} />
                <StatCard title="Notes" value={notes?.length || 0} icon={<StickyNote className="h-4 w-4 text-muted-foreground" />} isLoading={areNotesLoading} />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-4">
                <Button size="lg" onClick={() => setView('editor')}>
                    <BookOpen className="mr-2" /> Open Editor
                </Button>
                <Button size="lg" variant="secondary" onClick={() => setView('logline')}>
                    <NotebookPen className="mr-2" /> Edit Logline
                </Button>
            </div>

            {/* Collapsible Lists */}
            <Accordion type="multiple" className="w-full space-y-4">
                <Card>
                    <AccordionItem value="characters" className="border-b-0">
                        <AccordionTrigger className="p-6 font-headline text-lg">
                            <div className="flex items-center gap-2">
                                <Users /> Characters ({characters?.length || 0})
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            {areCharactersLoading ? <Skeleton className="h-20 w-full" /> : (
                                <div className="space-y-4">
                                    {characters && characters.length > 0 ? characters.slice(0, 5).map(char => (
                                        <div key={char.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50">
                                            <Avatar>
                                                <AvatarImage src={char.imageUrl} />
                                                <AvatarFallback>{char.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">{char.name}</p>
                                                <p className="text-sm text-muted-foreground truncate">{char.description}</p>
                                            </div>
                                        </div>
                                    )) : <p className="text-sm text-muted-foreground">No characters added yet.</p>}
                                     {characters && characters.length > 5 && (
                                        <Button variant="link" className="p-0 h-auto" onClick={() => setView('characters')}>View all {characters.length} characters...</Button>
                                    )}
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Card>
                
                <Card>
                     <AccordionItem value="notes" className="border-b-0">
                        <AccordionTrigger className="p-6 font-headline text-lg">
                             <div className="flex items-center gap-2">
                                <StickyNote /> Notes ({notes?.length || 0})
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            {areNotesLoading ? <Skeleton className="h-20 w-full" /> : (
                                 <div className="space-y-4">
                                    {notes && notes.length > 0 ? notes.slice(0, 3).map(note => (
                                        <div key={note.id} className="flex items-start gap-4 p-2 rounded-md hover:bg-muted/50">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold">{note.title}</p>
                                                    <Badge variant="secondary">{note.category}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.content}</p>
                                            </div>
                                        </div>
                                    )) : <p className="text-sm text-muted-foreground">No notes added yet.</p>}
                                    {notes && notes.length > 3 && (
                                        <Button variant="link" className="p-0 h-auto" onClick={() => setView('notes')}>View all {notes.length} notes...</Button>
                                    )}
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Card>
            </Accordion>
        </div>
    )
}
