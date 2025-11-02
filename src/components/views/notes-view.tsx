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
import { Textarea } from '@/components/ui/textarea';
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
import { useSettings } from '@/context/settings-context';


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
  content: string;
  category: NoteCategory;
  imageUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

function NoteDialog({ note, onSave, open, onOpenChange, isGenerating }: { note: Note | null, onSave: (note: Note) => void, open: boolean, onOpenChange: (open: boolean) => void, isGenerating: boolean }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<NoteCategory>('General');
    const [imageUrl, setImageUrl] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setTitle(note?.title || '');
            setContent(note?.content || '');
            setCategory(note?.category || 'General');
            setImageUrl(note?.imageUrl || '');
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
        await onSave({
            ...(note || {}),
            id: note?.id,
            title,
            content,
            category,
            imageUrl
        });
        setIsSaving(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline">{note ? 'Edit Note' : 'Add New Note'}</DialogTitle>
                    <DialogDescription>
                        {note ? 'Edit your note details.' : 'Create a new note to organize your ideas.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        {isGenerating ? <Skeleton className='h-10 w-full' /> : <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note Title" />}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                         {isGenerating ? <Skeleton className='h-10 w-full' /> : (
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
                    <div className="space-y-2">
                        <Label htmlFor="content">Content</Label>
                        {isGenerating ? <Skeleton className='h-24 w-full' /> : <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Jot down your thoughts..." />}
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
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" /> Upload Image
                            </Button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Note
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
  const { settings } = useSettings();

  const notesCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'notes') : null),
    [firestore, user, currentScriptId]
  );
  
  const { data: notes, isLoading } = useCollection<Note>(notesCollection);

  const handleOpenDialog = (note: Note | null) => {
    setEditingNote(note);
    setDialogOpen(true);
  }

  const handleSaveNote = async (noteToSave: Note) => {
    if (!notesCollection) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot save note: no active script.' });
      return;
    }
    
    const isNew = !noteToSave.id;
    const { id, createdAt, updatedAt, ...plainNoteData } = noteToSave;
    
    try {
        if (isNew) {
            const docData = { ...plainNoteData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
            await addDoc(notesCollection, docData).catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: notesCollection.path,
                    operation: 'create',
                    requestResourceData: docData,
                });
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            });
            toast({ title: 'Note Created', description: `"${noteToSave.title}" has been added.` });
        } else {
            const noteDocRef = doc(notesCollection, noteToSave.id);
            const updateData = { ...plainNoteData, updatedAt: serverTimestamp() };
            await setDoc(noteDocRef, updateData, { merge: true }).catch((serverError) => {
                 const permissionError = new FirestorePermissionError({
                    path: noteDocRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            });
            toast({ title: 'Note Updated', description: `"${noteToSave.title}" has been updated.` });
        }
    } catch(error: any) {
         if (!(error instanceof FirestorePermissionError)) {
            console.error("Error saving note: ", error);
            toast({
                variant: 'destructive',
                title: 'Save Error',
                description: 'An unexpected error occurred while saving the note.',
            });
         }
    }
  };

  const handleGenerateNote = async () => {
    setIsGenerating(true);
    setEditingNote(null);
    
    const result = await runAiGenerateNote({ prompt: 'A surprising plot twist idea.', model: settings.aiModel });
    
    if(result.error || !result.data) {
        toast({ variant: 'destructive', title: 'Error', description: result.error || 'Could not generate a note.' });
        setIsGenerating(false);
    } else {
        const { id, createdAt, updatedAt, ...generatedData } = result.data as Note;
        setEditingNote(generatedData);
        setDialogOpen(true); // Open the dialog with the generated content
        setIsGenerating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Notes</h1>
        <Button onClick={() => handleOpenDialog(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Note
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {notes && notes.map((note) => (
            <Card 
                key={note.id} 
                onClick={() => handleOpenDialog(note)}
                className={cn('flex flex-col shadow-sm hover:shadow-lg transition-shadow cursor-pointer', NOTE_CATEGORIES[note.category])}
            >
                {note.imageUrl && (
                  <div className="aspect-video w-full overflow-hidden border-b">
                    <Image src={note.imageUrl} alt={note.title} width={300} height={169} className="object-cover w-full h-full" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="font-headline text-lg flex justify-between items-start">
                    <span className="line-clamp-2">{note.title}</span>
                    <Badge variant="secondary" className="flex-shrink-0 ml-2">{note.category}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap line-clamp-4">{note.content}</p>
                </CardContent>
            </Card>
        ))}
      </div>
      )}
      {!isLoading && notes && notes.length === 0 && (
         <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
            <StickyNote className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-medium">No Notes Yet</h3>
            <p className="mt-1 text-sm">Create your first note to start organizing your ideas.</p>
         </div>
      )}
      <AiFab
        actions={['openChat']}
        customActions={[{
            label: 'Generate Note Idea',
            icon: <Sparkles className="mr-2 h-4 w-4" />,
            onClick: handleGenerateNote,
            isLoading: isGenerating,
        }]}
       />
        <NoteDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            note={editingNote}
            onSave={handleSaveNote}
            isGenerating={isGenerating}
        />
    </div>
  );
}
