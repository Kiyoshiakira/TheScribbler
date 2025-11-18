'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Loader2, Clock, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useCurrentScript } from '@/context/current-script-context';
import { collection, addDoc, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TimelineEvent {
  id?: string;
  title: string;
  description: string;
  timeframe: string;
  category: string;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

const EVENT_CATEGORIES = ['Plot', 'Character', 'World', 'Flashback', 'Foreshadowing', 'Other'];

export default function TimelineTab() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currentScriptId } = useCurrentScript();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const timelineCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'timeline') : null),
    [firestore, user, currentScriptId]
  );

  const { data: timelineEvents, isLoading } = useCollection<TimelineEvent>(timelineCollection);

  const handleOpenDialog = (event: TimelineEvent | null = null) => {
    if (event) {
      const { createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = event;
      setEditingEvent(rest);
    } else {
      setEditingEvent({
        title: '',
        description: '',
        timeframe: '',
        category: 'Plot',
        order: timelineEvents?.length || 0,
      });
    }
    setDialogOpen(true);
  };

  const handleSaveEvent = async (eventToSave: TimelineEvent) => {
    if (!timelineCollection) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot save timeline event: no active script.' });
      return;
    }

    const isNew = !eventToSave.id;
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...plainData } = eventToSave;

    try {
      if (isNew) {
        const docData = { ...plainData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        await addDoc(timelineCollection, docData).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: timelineCollection.path,
            operation: 'create',
            requestResourceData: docData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });
      } else {
        const eventDocRef = doc(timelineCollection, id);
        const updateData = { ...plainData, updatedAt: serverTimestamp() };
        await setDoc(eventDocRef, updateData, { merge: true }).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: eventDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });
      }
      toast({
        title: isNew ? 'Timeline Event Created' : 'Timeline Event Updated',
        description: `${eventToSave.title} has been saved.`,
      });
      setDialogOpen(false);
    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
        console.error('Error saving timeline event:', error);
        toast({
          variant: 'destructive',
          title: 'Save Error',
          description: 'An unexpected error occurred while saving the timeline event.',
        });
      }
    }
  };

  const handleDeleteEvent = async (event: TimelineEvent) => {
    if (!timelineCollection || !event.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot delete timeline event.' });
      return;
    }

    if (!confirm(`Delete "${event.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const eventRef = doc(timelineCollection, event.id);
      await deleteDoc(eventRef).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: eventRef.path,
          operation: 'delete',
          requestResourceData: {},
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });

      toast({
        title: 'Timeline Event Deleted',
        description: `${event.title} has been deleted.`,
      });
    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
        console.error('Error deleting timeline event:', error);
        toast({
          variant: 'destructive',
          title: 'Delete Error',
          description: 'An unexpected error occurred while deleting the timeline event.',
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const filteredEvents = timelineEvents?.filter(
    (event) => filterCategory === 'all' || event.category === filterCategory
  ).sort((a, b) => a.order - b.order) || [];

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold font-headline">Timeline</h2>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {EVENT_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      {filteredEvents.length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {filterCategory === 'all'
              ? 'No timeline events yet. Create your first event to track your story chronology.'
              : `No ${filterCategory} events found. Try a different filter or create a new event.`}
          </p>
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-8">
            {filteredEvents.map((event, index) => (
              <div key={event.id} className="relative pl-16">
                <div className="absolute left-6 top-2 w-5 h-5 rounded-full bg-primary border-4 border-background" />
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{event.category}</Badge>
                          {event.timeframe && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.timeframe}
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(event)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteEvent(event)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      <TimelineEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        onSave={handleSaveEvent}
      />
    </div>
  );
}

function TimelineEventDialog({
  open,
  onOpenChange,
  event,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: TimelineEvent | null;
  onSave: (event: TimelineEvent) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [category, setCategory] = useState('Plot');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setTitle(event?.title || '');
      setDescription(event?.description || '');
      setTimeframe(event?.timeframe || '');
      setCategory(event?.category || 'Plot');
    }
  }, [open, event]);

  const handleSave = async () => {
    if (!title) {
      toast({ variant: 'destructive', title: 'Title Required', description: 'Please enter a title for the event.' });
      return;
    }
    setIsSaving(true);
    await onSave({
      ...(event || {}),
      id: event?.id,
      title,
      description,
      timeframe,
      category,
      order: event?.order || 0,
    });
    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{event?.id ? 'Edit Timeline Event' : 'Add Timeline Event'}</DialogTitle>
          <DialogDescription>
            {event?.id ? 'Edit your timeline event details.' : 'Create a new timeline event for your story.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event Title" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeframe">Timeframe</Label>
              <Input
                id="timeframe"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                placeholder="e.g., Day 1, Year 2050"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happens in this event?"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
