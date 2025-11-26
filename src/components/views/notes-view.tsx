'use client';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Upload, Image as ImageIcon, Loader2, StickyNote, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Remove Textarea import — replaced with RichTextEditor
// import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/rich-text-editor';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useCurrentScript } from '@/context/current-script-context';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import AiFab from '../ai-fab';
import { runAiGenerateNote } from '@/app/actions';
import DOMPurify from 'isomorphic-dompurify';
import { cleanObject } from '@/lib/firestore-utils';

const NOTE_CATEGORIES = {
  Plot: 'bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800/50',
  Character: 'bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800/50',
  Dialogue: 'bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800/50',
  Research: 'bg-purple-100 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800/50',
  Theme: 'bg-pink-100 border-pink-200 dark:bg-pink-900/30 dark:border-pink-800/50',
  Scene: 'bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800/50',
  General: 'bg-gray-100 border-gray-200 dark:bg-gray-900/30 dark:border-gray-800/50',
};

export type NoteCategory = keyof typeof NOTE_CATEGORIES;

export interface Note {
  id?: string;
  title: string;
  content: string; // HTML string saved from the rich editor
  category: NoteCategory;
  color?: string; // optional inline color hex
  imageUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

function NoteDialog({
  note,
  onSave,
  open,
  onOpenChange,
  isGenerating,
}: {
  note: Note | null;
  onSave: (note: Note) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isGenerating: boolean;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<string>(''); // HTML content
  const [category, setCategory] = useState<NoteCategory>('General');
  const [imageUrl, setImageUrl] = useState('');
  const [color, setColor] = useState<string>('#fff7ed'); // default gentle background
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(note?.title || '');
      // If note.content exists but is raw text (legacy), convert it to simple paragraph HTML
      setContent(note?.content ? note.content : '');
      setCategory(note?.category || 'General');
      setImageUrl(note?.imageUrl || '');
      setColor(note?.color || '#fff7ed');
    }
  }, [open, note]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!title) {
      toast({ variant: 'destructive', title: 'Title Required', description: 'Please enter a title for the note.' });
      return;
    }
    setIsSaving(true);
    // The content is HTML; sanitize it prior to saving as a precaution (server should also validate).
    const sanitized = DOMPurify.sanitize(content || '');
    await onSave({
      ...(note || {}),
      id: note?.id,
      title,
      content: sanitized,
      category,
      color,
      imageUrl,
    });
    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">{note ? 'Edit Note' : 'Add New Note'}</DialogTitle>
          <DialogDescription>{note ? 'Edit your note details.' : 'Create a new note to organize your ideas.'}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              {isGenerating ? <Skeleton className="h-10 w-full" /> : <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note Title" />}
            </div>

            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="category">Category</Label>
                {isGenerating ? <Skeleton className="h-10 w-full" /> : (
                  <Select value={category} onValueChange={(value) => setCategory(value as NoteCategory)}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(NOTE_CATEGORIES).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label htmlFor="color">Note color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="color"
                    type="color"
                    title="Choose note color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 p-0 border rounded"
                  />
                  <div className="text-sm text-muted-foreground">Pick a background color</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              {isGenerating ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div
                  className="rounded border p-2"
                  style={{
                    backgroundColor: color,
                  }}
                >
                  <RichTextEditor value={content} onChange={(val) => setContent(val)} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Image</Label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-md border border-dashed flex items-center justify-center bg-muted overflow-hidden">
                  {imageUrl ? (
                    <Image src={imageUrl} alt="Note image" width={96} height={96} className="object-cover w-full h-full" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Image
                  </Button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
              </div>
            </div>

          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function NotesView() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currentScriptId } = useCurrentScript();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [createPromptOpen, setCreatePromptOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<NoteCategory>('General');
  const [newColor, setNewColor] = useState('#fff7ed');

  const notesCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'notes') : null),
    [firestore, user, currentScriptId]
  );

  const { data: notes, isLoading } = useCollection<Note>(notesCollection);

  const handleOpenDialog = (note: Note | null) => {
    setEditingNote(note);
    setDialogOpen(true);
  };

  const handleStartCreate = () => {
    setNewTitle('');
    setNewCategory('General');
    setNewColor('#fff7ed');
    setCreatePromptOpen(true);
  };

  const handleConfirmCreatePrompt = () => {
    const createdNote: Note = {
      title: newTitle || 'Untitled Note',
      content: '',
      category: newCategory,
      color: newColor,
    };
    setCreatePromptOpen(false);
    setEditingNote(createdNote);
    setDialogOpen(true);
  };

  const handleSaveNote = async (noteToSave: Note) => {
    if (!notesCollection) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot save note: no firestore collection available.' });
      return;
    }
    try {
      if (noteToSave.id) {
        // Update existing note - merge to preserve existing fields
        const d = doc(notesCollection as any, noteToSave.id);
        const updateData = cleanObject({ ...noteToSave, updatedAt: serverTimestamp() });
        await setDoc(d, updateData, { merge: true });
      } else {
        // Create new note - exclude id field and remove undefined values
        const { id, ...noteData } = noteToSave;
        const docData = cleanObject({
          ...noteData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        const added = await addDoc(notesCollection as any, docData);
        noteToSave.id = added.id;
      }
      toast({ title: 'Saved', description: 'Note saved successfully.' });
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Save failed', description: err?.message || 'Could not save note.' });
    }
  };

  const handleGenerateNote = async () => {
    setIsGenerating(true);
    const result = await runAiGenerateNote({ prompt: 'A surprising plot twist idea.' });

    if (result.error || !result.data) {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Could not generate a note.' });
      setIsGenerating(false);
    } else {
      const { id, createdAt, updatedAt, ...generatedData } = result.data as Note;
      setEditingNote(generatedData);
      setDialogOpen(true);
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Notes</h1>
        <div className="flex items-center gap-2">
          <Button onClick={handleStartCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Note
          </Button>
          <AiFab
            actions={['openChat']}
            customActions={[{
                label: 'Generate Note Idea',
                icon: <Sparkles className="mr-2 h-4 w-4" />,
                onClick: handleGenerateNote,
                isLoading: isGenerating,
            }]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : !currentScriptId ? (
        <Card className="p-8 text-center">
          <StickyNote className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Project Selected</h3>
          <p className="text-muted-foreground">
            Please select or create a project from the Dashboard to add notes.
          </p>
        </Card>
      ) : notes && notes.length === 0 ? (
        <Card className="p-8 text-center">
          <StickyNote className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Notes Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first note to organize your ideas, research, and plot points.
          </p>
          <Button onClick={handleStartCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Note
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {notes && notes.map((note) => {
            // sanitize HTML for preview (shorten to a snippet)
            const raw = note.content || '';
            const sanitized = DOMPurify.sanitize(raw);
            // Optionally create a short excerpt by stripping tags:
            const excerpt = sanitized.replace(/<\/?[^>]+(>|$)/g, '').slice(0, 400);
            return (
              <Card
                key={note.id}
                onClick={() => handleOpenDialog(note)}
                className={cn('flex flex-col shadow-sm hover:shadow-lg transition-shadow cursor-pointer', NOTE_CATEGORIES[note.category])}
                style={{ backgroundColor: note.color || undefined }}
              >
                {note.imageUrl && (
                  <div className="aspect-video w-full overflow-hidden border-b">
                    <Image src={note.imageUrl} alt={note.title} width={300} height={169} className="object-cover w-full h-full" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="font-headline text-lg flex justify-between items-start">
                    <span className="line-clamp-2 text-lg">{note.title}</span>
                    <Badge variant="secondary" className="flex-shrink-0 ml-2">{note.category}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  {/* Render a sanitized excerpt as plain text to keep the card simple */}
                  <p className="text-base text-foreground/90 whitespace-pre-wrap line-clamp-6">{excerpt}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ... create prompt dialog and editor dialog from earlier ... */}

      <Dialog open={createPromptOpen} onOpenChange={setCreatePromptOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-headline">New Note</DialogTitle>
            <DialogDescription>Give the note a title and choose a color. You can edit the content after creating it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="new-title">Title</Label>
              <Input id="new-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Note title" />
            </div>
            <div>
              <Label htmlFor="new-category">Category</Label>
              <Select value={newCategory} onValueChange={(v) => setNewCategory(v as NoteCategory)}>
                <SelectTrigger id="new-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(NOTE_CATEGORIES).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-color">Color</Label>
              <input id="new-color" type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-12 h-12 p-0 border rounded" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCreatePromptOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmCreatePrompt} disabled={!newTitle}>
              Create & Open
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NoteDialog note={editingNote} onSave={handleSaveNote} open={dialogOpen} onOpenChange={setDialogOpen} isGenerating={isGenerating} />
    </div>
  );
}
