'use client';

import { useScript } from "@/context/script-context";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useCurrentScript } from "@/context/current-script-context";
import { collection, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Users, StickyNote, Clapperboard, Edit, NotebookPen, BookOpen } from 'lucide-react';
import type { Character } from "./characters-view";
import type { Note } from "./notes-view";
import type { Scene } from "./scenes-view";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import type { View } from "../layout/AppLayout";

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
    const { currentScriptId } = useCurrentScript();

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


    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="space-y-2">
                {isScriptLoading ? (
                    <>
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-4/5" />
                    </>
                ) : (
                    <>
                        <h1 className="text-4xl font-bold font-headline">{script?.title}</h1>
                        <div className="flex items-center gap-4">
                            <p className="text-lg text-muted-foreground italic">
                                {script?.logline || "No logline has been set for this script yet."}
                            </p>
                            <Button variant="outline" size="sm" onClick={() => setView('logline')}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </Button>
                        </div>
                    </>
                )}
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
                                    {characters && characters.length > 0 ? characters.map(char => (
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
                                    {notes && notes.length > 0 ? notes.map(note => (
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
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Card>
            </Accordion>
        </div>
    )
}
