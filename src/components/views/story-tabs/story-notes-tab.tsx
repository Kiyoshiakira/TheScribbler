'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Loader2, BookOpen, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useCurrentScript } from '@/context/current-script-context';
import { collection, addDoc, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { sanitizeFirestorePayload } from '@/lib/firestore-utils';
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

interface StoryNote {
  id?: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

const NOTE_CATEGORIES = ['Ideas', 'Research', 'Plot', 'Character', 'Setting', 'Themes', 'Dialogue', 'General'];

export default function StoryNotesTab() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currentScriptId } = useCurrentScript();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<StoryNote | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const notesCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'storyNotes') : null),
    [firestore, user, currentScriptId]
  );

  const { data: notes, isLoading } = useCollection<StoryNote>(notesCollection);

  const handleOpenDialog = (note: StoryNote | null = null) => {
    if (note) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = note;
      setEditingNote(rest);
    } else {
      setEditingNote({
        title: '',
        content: '',
        category: 'General',
        tags: [],
      });
    }
    setDialogOpen(true);
  };

  const handleSaveNote = async (noteToSave: StoryNote) => {
    if (!notesCollection) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot save note: no active script.' });
      return;
    }

    const isNew = !noteToSave.id;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...plainData } = noteToSave;

    try {
      if (isNew) {
        const docData = sanitizeFirestorePayload({ ...plainData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        await addDoc(notesCollection, docData).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: notesCollection.path,
            operation: 'create',
            requestResourceData: docData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });
      } else {
        const noteDocRef = doc(notesCollection, id);
        const updateData = sanitizeFirestorePayload({ ...plainData, updatedAt: serverTimestamp() });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        await setDoc(noteDocRef, updateData, { merge: true }).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: noteDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });
      }
      toast({
        title: isNew ? 'Note Created' : 'Note Updated',
        description: `${noteToSave.title} has been saved.`,
      });
      setDialogOpen(false);
    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
        console.error('Error saving note:', error);
        toast({
          variant: 'destructive',
          title: 'Save Error',
          description: 'An unexpected error occurred while saving the note.',
        });
      }
    }
  };

  const handleDeleteNote = async (note: StoryNote) => {
    if (!notesCollection || !note.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot delete note.' });
      return;
    }

    if (!confirm(`Delete "${note.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const noteRef = doc(notesCollection, note.id);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      await deleteDoc(noteRef).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: noteRef.path,
          operation: 'delete',
          requestResourceData: {},
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });

      toast({
        title: 'Note Deleted',
        description: `${note.title} has been deleted.`,
      });
    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
        console.error('Error deleting note:', error);
        toast({
          variant: 'destructive',
          title: 'Delete Error',
          description: 'An unexpected error occurred while deleting the note.',
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  // Handle case when no project is selected
  if (!currentScriptId) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-headline">Story Notes</h2>
        </div>
        <Card className="p-8 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Project Selected</h3>
          <p className="text-muted-foreground">
            Please select or create a project from the Dashboard to manage story notes.
          </p>
        </Card>
      </div>
    );
  }

  const filteredNotes = notes?.filter(
    (note) => filterCategory === 'all' || note.category === filterCategory
  ) || [];

  // Check if there are any notes at all
  const hasNoNotes = !notes || notes.length === 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold font-headline">Story Notes</h2>
          {!hasNoNotes && (
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {NOTE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </div>

      {hasNoNotes ? (
        <Card className="p-8 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Story Notes Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first note to capture ideas and information.
          </p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Note
          </Button>
        </Card>
      ) : filteredNotes.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No {filterCategory} notes found. Try a different filter or create a new note.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleOpenDialog(note)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex-1 line-clamp-2">{note.title}</CardTitle>
                  <Badge variant="secondary" className="flex-shrink-0 ml-2">
                    {note.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{note.content}</p>
                {note.tags && note.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {note.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{note.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <StoryNoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        note={editingNote}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
      />
    </div>
  );
}

function StoryNoteDialog({
  open,
  onOpenChange,
  note,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: StoryNote | null;
  onSave: (note: StoryNote) => void;
  onDelete: (note: StoryNote) => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [tagsInput, setTagsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setTitle(note?.title || '');
      setContent(note?.content || '');
      setCategory(note?.category || 'General');
      setTagsInput(note?.tags?.join(', ') || '');
    }
  }, [open, note]);

  const handleAIExpand = async () => {
    if (!title && !content) {
      toast({
        variant: 'destructive',
        title: 'Input Required',
        description: 'Please provide a title or some content to expand with AI.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const expansion = `\n\n[AI Expansion for ${category}]\n\nBased on "${title}":\n- Additional details and context\n- Related ideas and connections\n- Questions to consider\n- Potential story applications\n\n(This is a placeholder for AI-generated content)`;
      
      setContent(prev => prev + expansion);
      
      toast({
        title: 'AI Expansion Added',
        description: 'AI-generated content has been added to your note.',
      });
    } catch (error) {
      console.error('Error expanding note:', error);
      toast({
        variant: 'destructive',
        title: 'AI Expansion Failed',
        description: 'Failed to expand note.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!title) {
      toast({ variant: 'destructive', title: 'Title Required', description: 'Please enter a title for the note.' });
      return;
    }
    setIsSaving(true);
    
    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    await onSave({
      ...(note || {}),
      id: note?.id,
      title,
      content,
      category,
      tags,
    });
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">{note?.id ? 'Edit Note' : 'Add Note'}</DialogTitle>
          <DialogDescription>
            {note?.id ? 'Edit your story note details.' : 'Create a new note to capture ideas and information.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note Title" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {NOTE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Content</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAIExpand}
                disabled={isGenerating}
                title="Expand with AI"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note content here..."
              rows={10}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g., fantasy, magic system, worldbuilding"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          {note?.id && (
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(note);
                onOpenChange(false);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
