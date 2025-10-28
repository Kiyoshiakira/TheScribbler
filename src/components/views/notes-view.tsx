'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Upload, Image as ImageIcon } from 'lucide-react';
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
  DialogTrigger,
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


const NOTE_CATEGORIES = {
  Plot: 'bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800/50',
  Character: 'bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800/50',
  Dialogue: 'bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800/50',
  Research: 'bg-purple-100 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800/50',
  Theme: 'bg-pink-100 border-pink-200 dark:bg-pink-900/30 dark:border-pink-800/50',
  Scene: 'bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800/50',
  General: 'bg-gray-100 border-gray-200 dark:bg-gray-900/30 dark:border-gray-800/50',
};

type NoteCategory = keyof typeof NOTE_CATEGORIES;

interface Note {
  id: number;
  title: string;
  content: string;
  category: NoteCategory;
  imageUrl?: string;
}

const initialNotes: Note[] = [
  {
    id: 1,
    title: 'Plot Idea: Twist Ending',
    content: 'What if the protagonist, Jane, has been imagining Leo all along? He is a manifestation of her creative side that she suppressed to become a lawyer.',
    category: 'Plot',
  },
  {
    id: 2,
    title: 'Character Backstory: Leo',
    content: 'Leo comes from a family of famous architects, but he rebelled to pursue his passion for art. This creates a conflict when his family disapproves of his relationship with Jane.',
    category: 'Character',
  },
  {
    id: 3,
    title: 'Dialogue Snippet',
    content: 'Jane: "You see art in everything."\nLeo: "And you see arguments in everything. Maybe that\'s why we fit."',
    category: 'Dialogue',
  },
  {
    id: 4,
    title: 'Location Research: Coffee Shop',
    content: 'Need to find a coffee shop with a specific aesthetic: a mix of modern industrial and cozy, with large windows. Maybe a real location in Brooklyn?',
    category: 'Research',
  },
    {
    id: 5,
    title: 'Theme: Art vs. Commerce',
    content: 'Explore the central theme through Jane and Leo\'s careers. She is all about logic and commerce, he is about passion and art. Their relationship forces them to confront their own choices.',
    category: 'Theme',
  },
  {
    id: 6,
    title: 'Scene Idea: The Argument',
    content: 'A major argument erupts when Jane\'s boss offers Leo a lucrative but soulless corporate art commission. It brings their core conflict to a head.',
    category: 'Scene',
  },
];

function NoteDialog({ note, onSave, trigger }: { note?: Note | null, onSave: (note: Note) => void, trigger: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState(note?.title || '');
    const [content, setContent] = useState(note?.content || '');
    const [category, setCategory] = useState<NoteCategory>(note?.category || 'General');
    const [imageUrl, setImageUrl] = useState(note?.imageUrl || '');
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    React.useEffect(() => {
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

    const handleSave = () => {
        if (!title) {
            toast({ variant: 'destructive', title: 'Title Required', description: 'Please enter a title for the note.' });
            return;
        }
        onSave({
            id: note?.id || Date.now(),
            title,
            content,
            category,
            imageUrl
        });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
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
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note Title" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
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
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="content">Content</Label>
                        <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Jot down your thoughts..." />
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
                    <Button onClick={handleSave}>Save Note</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function NotesView() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);

  const handleSaveNote = (noteToSave: Note) => {
    const existingIndex = notes.findIndex(n => n.id === noteToSave.id);
    if (existingIndex > -1) {
        const updatedNotes = [...notes];
        updatedNotes[existingIndex] = noteToSave;
        setNotes(updatedNotes);
    } else {
        setNotes([noteToSave, ...notes]);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Notes</h1>
        <NoteDialog
            onSave={handleSaveNote}
            trigger={
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Note
                </Button>
            }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {notes.map((note) => (
          <NoteDialog
            key={note.id}
            note={note}
            onSave={handleSaveNote}
            trigger={
              <Card className={cn('flex flex-col shadow-sm hover:shadow-lg transition-shadow cursor-pointer', NOTE_CATEGORIES[note.category])}>
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
            }
          />
        ))}
      </div>
    </div>
  );
}
