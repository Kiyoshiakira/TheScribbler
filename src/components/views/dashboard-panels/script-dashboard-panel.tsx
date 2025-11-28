'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, NotebookPen, Users, StickyNote, Clapperboard, Plus } from 'lucide-react';
import { useScript } from '@/context/script-context';
import { useCurrentScript } from '@/context/current-script-context';
import type { View } from '@/components/layout/AppLayout';

interface ScriptDashboardPanelProps {
  setView: (view: View) => void;
  onCreate?: () => void;
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

export default function ScriptDashboardPanel({ setView, onCreate }: ScriptDashboardPanelProps) {
  const { script, isScriptLoading, characters, notes, scenes } = useScript();
  const { currentScriptId } = useCurrentScript();

  const areCharactersLoading = isScriptLoading;
  const areNotesLoading = isScriptLoading;
  const areScenesLoading = isScriptLoading;

  // Empty state when no script is loaded
  if (!currentScriptId) {
    return (
      <Card className="p-8 text-center">
        <Clapperboard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Script Selected</h3>
        <p className="text-muted-foreground mb-4">
          Create a new script or select an existing one to get started with ScriptScribbler.
        </p>
        {onCreate && (
          <Button onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Script
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold font-headline">
          Current Script: {isScriptLoading ? <Skeleton className="h-9 w-48 inline-block" /> : script?.title}
        </h2>
        <div className="text-lg text-muted-foreground italic">
          {isScriptLoading ? <Skeleton className="h-6 w-96" /> : (script?.logline || 'No logline has been set for this script yet.')}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Scenes"
          value={scenes?.length || 0}
          icon={<Clapperboard className="h-4 w-4 text-muted-foreground" />}
          isLoading={areScenesLoading}
        />
        <StatCard
          title="Characters"
          value={characters?.length || 0}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          isLoading={areCharactersLoading}
        />
        <StatCard
          title="Notes"
          value={notes?.length || 0}
          icon={<StickyNote className="h-4 w-4 text-muted-foreground" />}
          isLoading={areNotesLoading}
        />
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
              {areCharactersLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="space-y-4">
                  {characters && characters.length > 0 ? (
                    characters.slice(0, 5).map((char) => (
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
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No characters added yet.</div>
                  )}
                  {characters && characters.length > 5 && (
                    <Button variant="link" className="p-0 h-auto" onClick={() => setView('characters')}>
                      View all {characters.length} characters...
                    </Button>
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
              {areNotesLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="space-y-4">
                  {notes && notes.length > 0 ? (
                    notes.slice(0, 3).map((note) => (
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
                  {notes && notes.length > 3 && (
                    <Button variant="link" className="p-0 h-auto" onClick={() => setView('notes')}>
                      View all {notes.length} notes...
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
