
'use client';

import { useScript } from "@/context/script-context";
import { useUser, useFirestore, errorEmitter, FirestorePermissionError, useCollection, useMemoFirebase } from '@/firebase';
import { useCurrentScript } from "@/context/current-script-context";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Users, StickyNote, Clapperboard, BookOpen, NotebookPen, Plus, Sparkles, ListTree, FileText, MapPin, Clock, Link2, Unlink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import type { View } from "../layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useTool } from "@/context/tool-context";
import { useSettings } from "@/context/settings-context";


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

// Story Scribbler interfaces
interface OutlineItem {
  id?: string;
  title: string;
  description: string;
  order: number;
  parentId?: string;
}

interface Chapter {
  id?: string;
  title: string;
  summary: string;
  content: string;
  order: number;
  wordCount?: number;
}

interface StoryCharacter {
  id?: string;
  name: string;
  role: string;
  description: string;
  imageUrl?: string;
}

interface WorldElement {
  id?: string;
  name: string;
  type: string;
  description: string;
}

interface TimelineEvent {
  id?: string;
  title: string;
  description: string;
  timeframe: string;
  category: string;
}

interface StoryNote {
  id?: string;
  title: string;
  content: string;
  category: string;
}

export default function DashboardView({ setView }: { setView: (view: View) => void }) {
    const { script, isScriptLoading, characters, notes, scenes } = useScript();
    const { user } = useUser();
    const firestore = useFirestore();
    const { currentScriptId, setCurrentScriptId } = useCurrentScript();
    const { toast } = useToast();
    const { currentTool } = useTool();
    const { settings } = useSettings();

    const projectLinkingMode = settings.projectLinkingMode || 'shared';

    const areCharactersLoading = isScriptLoading;
    const areNotesLoading = isScriptLoading;
    const areScenesLoading = isScriptLoading;

    // Story Scribbler collections
    const outlineCollection = useMemoFirebase(
        () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'outline') : null),
        [firestore, user, currentScriptId]
    );
    const chaptersCollection = useMemoFirebase(
        () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'chapters') : null),
        [firestore, user, currentScriptId]
    );
    const storyCharactersCollection = useMemoFirebase(
        () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'storyCharacters') : null),
        [firestore, user, currentScriptId]
    );
    const worldBuildingCollection = useMemoFirebase(
        () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'worldBuilding') : null),
        [firestore, user, currentScriptId]
    );
    const timelineCollection = useMemoFirebase(
        () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'timeline') : null),
        [firestore, user, currentScriptId]
    );
    const storyNotesCollection = useMemoFirebase(
        () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'storyNotes') : null),
        [firestore, user, currentScriptId]
    );

    const { data: outlineItems, isLoading: isOutlineLoading } = useCollection<OutlineItem>(outlineCollection);
    const { data: chapters, isLoading: isChaptersLoading } = useCollection<Chapter>(chaptersCollection);
    const { data: storyCharacters, isLoading: isStoryCharactersLoading } = useCollection<StoryCharacter>(storyCharactersCollection);
    const { data: worldElements, isLoading: isWorldLoading } = useCollection<WorldElement>(worldBuildingCollection);
    const { data: timelineEvents, isLoading: isTimelineLoading } = useCollection<TimelineEvent>(timelineCollection);
    const { data: storyNotes, isLoading: isStoryNotesLoading } = useCollection<StoryNote>(storyNotesCollection);
    
    const handleCreateNewScript = async () => {
        if (!firestore || !user) return;
        try {
            const scriptsCollectionRef = collection(firestore, 'users', user.uid, 'scripts');
            const scriptData = {
                title: 'Untitled Script',
                content: 'SCENE 1\n\nINT. ROOM - DAY\n\nA new story begins.',
                logline: '',
                authorId: user.uid,
                createdAt: serverTimestamp(),
                lastModified: serverTimestamp(),
            };
            const newScriptDoc = await addDoc(scriptsCollectionRef, scriptData).catch(() => {
                const permissionError = new FirestorePermissionError({
                    path: scriptsCollectionRef.path,
                    operation: 'create',
                    requestResourceData: scriptData
                });
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            });
            toast({
                title: 'Script Created',
                description: 'A new untitled script has been added to your collection.',
            });
            setCurrentScriptId(newScriptDoc.id);
            setView('editor');
        } catch (error) {
            console.error('Error creating new script:', error);
            if (!(error instanceof FirestorePermissionError)) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not create a new script.',
                });
            }
        }
    };

    const handleStartWithAI = async () => {
        if (!firestore || !user) return;
        try {
            const scriptsCollectionRef = collection(firestore, 'users', user.uid, 'scripts');
            const scriptData = {
                title: 'AI-Assisted Script',
                content: 'INT. WRITER\'S ROOM - DAY\n\nA blank page awaits. The AI assistant stands ready to help craft your story.\n\n(Click the AI assistant button in the bottom right to start collaborating)',
                logline: 'An AI-assisted screenplay waiting to be written',
                authorId: user.uid,
                createdAt: serverTimestamp(),
                lastModified: serverTimestamp(),
            };
            const newScriptDoc = await addDoc(scriptsCollectionRef, scriptData).catch(() => {
                const permissionError = new FirestorePermissionError({
                    path: scriptsCollectionRef.path,
                    operation: 'create',
                    requestResourceData: scriptData
                });
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            });
            toast({
                title: 'AI-Assisted Script Created',
                description: 'Open the AI assistant to start creating your screenplay.',
            });
            setCurrentScriptId(newScriptDoc.id);
            setView('editor');
        } catch (error) {
            console.error('Error creating AI script:', error);
            if (!(error instanceof FirestorePermissionError)) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not create a new script.',
                });
            }
        }
    };


    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <CardTitle className="font-headline text-2xl">
                                {currentTool === 'StoryScribbler' ? 'Start a New Story' : 'Start a New Script'}
                            </CardTitle>
                            <CardDescription>
                                {currentTool === 'StoryScribbler' 
                                    ? 'Begin crafting your next story with outline, chapters, and world-building tools.'
                                    : 'Begin your next masterpiece from scratch or let our AI give you a starting point.'}
                            </CardDescription>
                        </div>
                        <Badge variant={projectLinkingMode === 'shared' ? 'default' : 'secondary'} className="flex items-center gap-1.5 shrink-0">
                            {projectLinkingMode === 'shared' ? (
                                <>
                                    <Link2 className="h-3 w-3" />
                                    <span>Shared Project</span>
                                </>
                            ) : (
                                <>
                                    <Unlink className="h-3 w-3" />
                                    <span>Separate Projects</span>
                                </>
                            )}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="w-full" onClick={handleCreateNewScript}>
                        <Plus className="mr-2 h-5 w-5" />
                        {currentTool === 'StoryScribbler' ? 'Create New Story' : 'Create New Script'}
                    </Button>
                    <Button size="lg" variant="secondary" className="w-full" onClick={handleStartWithAI}>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Start with AI
                    </Button>
                </CardContent>
            </Card>

            {currentScriptId && (
                <>
                    {/* Header */}
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold font-headline">
                            {currentTool === 'StoryScribbler' ? 'Current Story: ' : 'Current Script: '}
                            {isScriptLoading ? <Skeleton className="h-9 w-48 inline-block" /> : script?.title}
                        </h2>
                        <div className="text-lg text-muted-foreground italic">
                            {isScriptLoading ? <Skeleton className="h-6 w-96" /> : (script?.logline || "No logline has been set for this script yet.")}
                        </div>
                    </div>

                    {/* Stat Cards - Conditional based on tool */}
                    {currentTool === 'ScriptScribbler' ? (
                        <>
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

                            {/* Collapsible Lists for ScriptScribbler */}
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
                                                                <div className="font-semibold">{char.name}</div>
                                                                <p className="text-sm text-muted-foreground truncate">{char.description}</p>
                                                            </div>
                                                        </div>
                                                    )) : <div className="text-sm text-muted-foreground">No characters added yet.</div>}
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
                                                                    <div className="font-semibold">{note.title}</div>
                                                                    <Badge variant="secondary">{note.category}</Badge>
                                                                </div>
                                                                <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.content}</div>
                                                            </div>
                                                        </div>
                                                    )) : <div className="text-sm text-muted-foreground">No notes added yet.</div>}
                                                    {notes && notes.length > 3 && (
                                                        <Button variant="link" className="p-0 h-auto" onClick={() => setView('notes')}>View all {notes.length} notes...</Button>
                                                    )}
                                                </div>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                </Card>
                            </Accordion>
                        </>
                    ) : (
                        <>
                            {/* StoryScribbler Stats */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <StatCard title="Outline Items" value={outlineItems?.length || 0} icon={<ListTree className="h-4 w-4 text-muted-foreground" />} isLoading={isOutlineLoading} />
                                <StatCard title="Chapters" value={chapters?.length || 0} icon={<FileText className="h-4 w-4 text-muted-foreground" />} isLoading={isChaptersLoading} />
                                <StatCard title="Characters" value={storyCharacters?.length || 0} icon={<Users className="h-4 w-4 text-muted-foreground" />} isLoading={isStoryCharactersLoading} />
                            </div>
                            
                            {/* Additional Story Stats */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <StatCard title="World Elements" value={worldElements?.length || 0} icon={<MapPin className="h-4 w-4 text-muted-foreground" />} isLoading={isWorldLoading} />
                                <StatCard title="Timeline Events" value={timelineEvents?.length || 0} icon={<Clock className="h-4 w-4 text-muted-foreground" />} isLoading={isTimelineLoading} />
                                <StatCard title="Notes" value={storyNotes?.length || 0} icon={<StickyNote className="h-4 w-4 text-muted-foreground" />} isLoading={isStoryNotesLoading} />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-4">
                                <Button size="lg" onClick={() => setView('outline')}>
                                    <ListTree className="mr-2" /> Open Outline
                                </Button>
                                <Button size="lg" variant="secondary" onClick={() => setView('chapters')}>
                                    <FileText className="mr-2" /> View Chapters
                                </Button>
                            </div>

                            {/* Collapsible Lists for StoryScribbler */}
                            <Accordion type="multiple" className="w-full space-y-4">
                                <Card>
                                    <AccordionItem value="chapters" className="border-b-0">
                                        <AccordionTrigger className="p-6 font-headline text-lg">
                                            <div className="flex items-center gap-2">
                                                <FileText /> Chapters ({chapters?.length || 0})
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-6 pb-6">
                                            {isChaptersLoading ? <Skeleton className="h-20 w-full" /> : (
                                                <div className="space-y-4">
                                                    {chapters && chapters.length > 0 ? chapters.slice(0, 5).map((chapter, idx) => (
                                                        <div key={chapter.id} className="flex items-start gap-4 p-2 rounded-md hover:bg-muted/50">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="font-semibold">Chapter {idx + 1}: {chapter.title}</div>
                                                                    {chapter.wordCount && (
                                                                        <Badge variant="outline">{chapter.wordCount} words</Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{chapter.summary}</p>
                                                            </div>
                                                        </div>
                                                    )) : <div className="text-sm text-muted-foreground">No chapters added yet.</div>}
                                                    {chapters && chapters.length > 5 && (
                                                        <Button variant="link" className="p-0 h-auto" onClick={() => setView('chapters')}>View all {chapters.length} chapters...</Button>
                                                    )}
                                                </div>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                </Card>

                                <Card>
                                    <AccordionItem value="storyCharacters" className="border-b-0">
                                        <AccordionTrigger className="p-6 font-headline text-lg">
                                            <div className="flex items-center gap-2">
                                                <Users /> Characters ({storyCharacters?.length || 0})
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-6 pb-6">
                                            {isStoryCharactersLoading ? <Skeleton className="h-20 w-full" /> : (
                                                <div className="space-y-4">
                                                    {storyCharacters && storyCharacters.length > 0 ? storyCharacters.slice(0, 5).map(char => (
                                                        <div key={char.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50">
                                                            <Avatar>
                                                                <AvatarImage src={char.imageUrl} />
                                                                <AvatarFallback>{char.name.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="font-semibold">{char.name}</div>
                                                                    <Badge variant="secondary">{char.role}</Badge>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground truncate">{char.description}</p>
                                                            </div>
                                                        </div>
                                                    )) : <div className="text-sm text-muted-foreground">No characters added yet.</div>}
                                                    {storyCharacters && storyCharacters.length > 5 && (
                                                        <Button variant="link" className="p-0 h-auto" onClick={() => setView('characters')}>View all {storyCharacters.length} characters...</Button>
                                                    )}
                                                </div>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                </Card>

                                <Card>
                                    <AccordionItem value="storyNotes" className="border-b-0">
                                        <AccordionTrigger className="p-6 font-headline text-lg">
                                            <div className="flex items-center gap-2">
                                                <StickyNote /> Notes ({storyNotes?.length || 0})
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-6 pb-6">
                                            {isStoryNotesLoading ? <Skeleton className="h-20 w-full" /> : (
                                                <div className="space-y-4">
                                                    {storyNotes && storyNotes.length > 0 ? storyNotes.slice(0, 3).map(note => (
                                                        <div key={note.id} className="flex items-start gap-4 p-2 rounded-md hover:bg-muted/50">
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="font-semibold">{note.title}</div>
                                                                    <Badge variant="secondary">{note.category}</Badge>
                                                                </div>
                                                                <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.content}</div>
                                                            </div>
                                                        </div>
                                                    )) : <div className="text-sm text-muted-foreground">No notes added yet.</div>}
                                                    {storyNotes && storyNotes.length > 3 && (
                                                        <Button variant="link" className="p-0 h-auto" onClick={() => setView('story-notes')}>View all {storyNotes.length} notes...</Button>
                                                    )}
                                                </div>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                </Card>
                            </Accordion>
                        </>
                    )}
                </>
            )}
        </div>
    )
}
