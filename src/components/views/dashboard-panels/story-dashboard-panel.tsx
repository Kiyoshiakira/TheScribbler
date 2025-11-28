'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ListTree, FileText, Users, MapPin, Clock, StickyNote, Plus, Book } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useCurrentScript } from '@/context/current-script-context';
import { collection } from 'firebase/firestore';
import type { View } from '@/components/layout/AppLayout';

interface StoryDashboardPanelProps {
  setView: (view: View) => void;
  onCreate?: () => void;
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

function StatCard({ title, value, icon, isLoading }: { title: string; value: number; icon: React.ReactNode; isLoading: boolean }) {
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
  );
}

export default function StoryDashboardPanel({ setView, onCreate }: StoryDashboardPanelProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currentScriptId } = useCurrentScript();

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

  // Empty state when no project is loaded
  if (!currentScriptId) {
    return (
      <Card className="p-8 text-center">
        <Book className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Story Selected</h3>
        <p className="text-muted-foreground mb-4">
          Create a new story or select an existing one to get started with StoryScribbler.
        </p>
        {onCreate && (
          <Button onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Story
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row 1 */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Outline Items"
          value={outlineItems?.length || 0}
          icon={<ListTree className="h-4 w-4 text-muted-foreground" />}
          isLoading={isOutlineLoading}
        />
        <StatCard
          title="Chapters"
          value={chapters?.length || 0}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          isLoading={isChaptersLoading}
        />
        <StatCard
          title="Characters"
          value={storyCharacters?.length || 0}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          isLoading={isStoryCharactersLoading}
        />
      </div>

      {/* Stats Row 2 */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="World Elements"
          value={worldElements?.length || 0}
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
          isLoading={isWorldLoading}
        />
        <StatCard
          title="Timeline Events"
          value={timelineEvents?.length || 0}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          isLoading={isTimelineLoading}
        />
        <StatCard
          title="Notes"
          value={storyNotes?.length || 0}
          icon={<StickyNote className="h-4 w-4 text-muted-foreground" />}
          isLoading={isStoryNotesLoading}
        />
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

      {/* Collapsible Lists */}
      <Accordion type="multiple" className="w-full space-y-4">
        <Card>
          <AccordionItem value="chapters" className="border-b-0">
            <AccordionTrigger className="p-6 font-headline text-lg">
              <div className="flex items-center gap-2">
                <FileText /> Chapters ({chapters?.length || 0})
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              {isChaptersLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="space-y-4">
                  {chapters && chapters.length > 0 ? (
                    chapters.slice(0, 5).map((chapter, idx) => (
                      <div key={chapter.id} className="flex items-start gap-4 p-2 rounded-md hover:bg-muted/50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">
                              Chapter {idx + 1}: {chapter.title}
                            </div>
                            {chapter.wordCount && <Badge variant="outline">{chapter.wordCount} words</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{chapter.summary}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No chapters added yet.</div>
                  )}
                  {chapters && chapters.length > 5 && (
                    <Button variant="link" className="p-0 h-auto" onClick={() => setView('chapters')}>
                      View all {chapters.length} chapters...
                    </Button>
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
              {isStoryCharactersLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="space-y-4">
                  {storyCharacters && storyCharacters.length > 0 ? (
                    storyCharacters.slice(0, 5).map((char) => (
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
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No characters added yet.</div>
                  )}
                  {storyCharacters && storyCharacters.length > 5 && (
                    <Button variant="link" className="p-0 h-auto" onClick={() => setView('characters')}>
                      View all {storyCharacters.length} characters...
                    </Button>
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
              {isStoryNotesLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="space-y-4">
                  {storyNotes && storyNotes.length > 0 ? (
                    storyNotes.slice(0, 3).map((note) => (
                      <div key={note.id} className="flex items-start gap-4 p-2 rounded-md hover:bg-muted/50">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold">{note.title}</div>
                            <Badge variant="secondary">{note.category}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.content}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No notes added yet.</div>
                  )}
                  {storyNotes && storyNotes.length > 3 && (
                    <Button variant="link" className="p-0 h-auto" onClick={() => setView('story-notes')}>
                      View all {storyNotes.length} notes...
                    </Button>
                  )}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Card>
      </Accordion>
    </div>
  );
}
