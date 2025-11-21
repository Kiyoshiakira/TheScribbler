'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User as UserIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DOMPurify from 'isomorphic-dompurify';

interface Script {
    title: string;
    content: string;
    logline?: string;
    lastModified: {
        toDate: () => Date;
    } | null;
}

interface Character {
    id: string;
    name: string;
    description?: string;
}

interface Scene {
    id: string;
    title: string;
    description?: string;
}

interface Note {
    id: string;
    title: string;
    content: string;
}

export default function PublicScriptView() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;
    const scriptId = params.scriptId as string;
    const { user: currentUser } = useUser();
    const firestore = useFirestore();

    const scriptDocRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'users', userId, 'scripts', scriptId) : null),
        [firestore, userId, scriptId]
    );

    const { data: script, isLoading: isScriptLoading } = useDoc<Script>(scriptDocRef);

    const charactersCollectionRef = useMemoFirebase(
        () => (firestore ? collection(firestore, 'users', userId, 'scripts', scriptId, 'characters') : null),
        [firestore, userId, scriptId]
    );

    const { data: characters, isLoading: areCharactersLoading } = useCollection<Character>(charactersCollectionRef);

    const scenesCollectionRef = useMemoFirebase(
        () => (firestore ? collection(firestore, 'users', userId, 'scripts', scriptId, 'scenes') : null),
        [firestore, userId, scriptId]
    );

    const scenesQuery = useMemoFirebase(
        () => (scenesCollectionRef ? query(scenesCollectionRef, orderBy('title', 'asc')) : null),
        [scenesCollectionRef]
    );

    const { data: scenes, isLoading: areScenesLoading } = useCollection<Scene>(scenesQuery);

    const notesCollectionRef = useMemoFirebase(
        () => (firestore ? collection(firestore, 'users', userId, 'scripts', scriptId, 'notes') : null),
        [firestore, userId, scriptId]
    );

    const { data: notes, isLoading: areNotesLoading } = useCollection<Note>(notesCollectionRef);

    const isOwnScript = currentUser?.uid === userId;

    const handleGoBack = () => {
        router.push(`/user/${userId}`);
    };

    const handleEditScript = () => {
        // Navigate to app with script ID in localStorage for the app to pick up
        try {
            window.localStorage.setItem('scriptscribbler-current-script-id', scriptId);
            router.push('/');
        } catch (error) {
            console.error('Failed to set script ID in localStorage:', error);
            router.push('/');
        }
    };

    if (isScriptLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <p className="text-muted-foreground">Loading script...</p>
                </div>
            </div>
        );
    }

    if (!script) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <p className="text-muted-foreground">Script not found</p>
                    <Button onClick={handleGoBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={handleGoBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Profile
                    </Button>
                    {isOwnScript && (
                        <Button onClick={handleEditScript}>
                            Edit in App
                        </Button>
                    )}
                </div>

                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold font-headline mb-2">
                        {script.title}
                    </h1>
                    {script.logline && (
                        <p className="text-lg text-muted-foreground italic mb-4">
                            {script.logline}
                        </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                        Last modified: {script.lastModified ? new Date(script.lastModified.toDate()).toLocaleDateString() : 'Just now'}
                    </p>
                </div>

                <Tabs defaultValue="script" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="script">Script</TabsTrigger>
                        <TabsTrigger value="characters">Characters ({characters?.length || 0})</TabsTrigger>
                        <TabsTrigger value="scenes">Scenes ({scenes?.length || 0})</TabsTrigger>
                        <TabsTrigger value="notes">Notes ({notes?.length || 0})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="script">
                        <Card>
                            <CardHeader>
                                <CardTitle>Script Content</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                    <pre className="whitespace-pre-wrap font-mono text-sm">
                                        {script.content}
                                    </pre>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="characters">
                        {areCharactersLoading ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
                            </div>
                        ) : characters && characters.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {characters.map((character) => (
                                    <Card key={character.id}>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <UserIcon className="h-5 w-5" />
                                                {character.name}
                                            </CardTitle>
                                        </CardHeader>
                                        {character.description && (
                                            <CardContent>
                                                <p className="text-sm text-muted-foreground">
                                                    {character.description}
                                                </p>
                                            </CardContent>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-16 text-center text-muted-foreground">
                                    <UserIcon className="mx-auto h-12 w-12 mb-4" />
                                    <p>No characters defined yet.</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="scenes">
                        {areScenesLoading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                            </div>
                        ) : scenes && scenes.length > 0 ? (
                            <div className="space-y-4">
                                {scenes.map((scene) => (
                                    <Card key={scene.id}>
                                        <CardHeader>
                                            <CardTitle>{scene.title}</CardTitle>
                                            {scene.description && (
                                                <CardDescription>{scene.description}</CardDescription>
                                            )}
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-16 text-center text-muted-foreground">
                                    <p>No scenes defined yet.</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="notes">
                        {areNotesLoading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
                            </div>
                        ) : notes && notes.length > 0 ? (
                            <div className="space-y-4">
                                {notes.map((note) => (
                                    <Card key={note.id}>
                                        <CardHeader>
                                            <CardTitle>{note.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {/* Security: Content is sanitized with DOMPurify before rendering */}
                                            <div 
                                                className="prose prose-sm max-w-none dark:prose-invert"
                                                dangerouslySetInnerHTML={{ 
                                                    __html: DOMPurify.sanitize(note.content || '') 
                                                }}
                                            />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-16 text-center text-muted-foreground">
                                    <p>No notes yet.</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
