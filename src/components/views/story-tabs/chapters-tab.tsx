'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Loader2, FileText, Edit, Maximize2, Minimize2, Sparkles } from 'lucide-react';
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
import { useFullscreen } from '@/hooks/use-fullscreen';
import { cn } from '@/lib/utils';

interface Chapter {
  id?: string;
  title: string;
  summary: string;
  content: string;
  order: number;
  wordCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export default function ChaptersTab() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currentScriptId } = useCurrentScript();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  const chaptersCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'chapters') : null),
    [firestore, user, currentScriptId]
  );

  const { data: chapters, isLoading } = useCollection<Chapter>(chaptersCollection);

  const handleOpenDialog = (chapter: Chapter | null = null) => {
    if (chapter) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = chapter;
      setEditingChapter(rest);
    } else {
      setEditingChapter({
        title: '',
        summary: '',
        content: '',
        order: chapters?.length || 0,
        wordCount: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleSaveChapter = async (chapterToSave: Chapter) => {
    if (!chaptersCollection) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot save chapter: no active script.' });
      return;
    }

    const isNew = !chapterToSave.id;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...plainData } = chapterToSave;

    // Calculate word count
    const wordCount = plainData.content.trim().split(/\s+/).filter(word => word.length > 0).length;
    const dataWithWordCount = { ...plainData, wordCount };

    try {
      if (isNew) {
        const docData = { ...dataWithWordCount, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        await addDoc(chaptersCollection, docData).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: chaptersCollection.path,
            operation: 'create',
            requestResourceData: docData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });
      } else {
        const chapterDocRef = doc(chaptersCollection, id);
        const updateData = { ...dataWithWordCount, updatedAt: serverTimestamp() };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        await setDoc(chapterDocRef, updateData, { merge: true }).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: chapterDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });
      }
      toast({
        title: isNew ? 'Chapter Created' : 'Chapter Updated',
        description: `${chapterToSave.title} has been saved.`,
      });
      setDialogOpen(false);
    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
        console.error('Error saving chapter:', error);
        toast({
          variant: 'destructive',
          title: 'Save Error',
          description: 'An unexpected error occurred while saving the chapter.',
        });
      }
    }
  };

  const handleDeleteChapter = async (chapter: Chapter) => {
    if (!chaptersCollection || !chapter.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot delete chapter.' });
      return;
    }

    if (!confirm(`Delete "${chapter.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const chapterRef = doc(chaptersCollection, chapter.id);
      await deleteDoc(chapterRef).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: chapterRef.path,
          operation: 'delete',
          requestResourceData: {},
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });

      toast({
        title: 'Chapter Deleted',
        description: `${chapter.title} has been deleted.`,
      });
    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
        console.error('Error deleting chapter:', error);
        toast({
          variant: 'destructive',
          title: 'Delete Error',
          description: 'An unexpected error occurred while deleting the chapter.',
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
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const sortedChapters = [...(chapters || [])].sort((a, b) => a.order - b.order);
  const totalWords = sortedChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold font-headline">Chapters</h2>
          <p className="text-sm text-muted-foreground">
            {sortedChapters.length} chapters • {totalWords.toLocaleString()} words
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Chapter
        </Button>
      </div>

      {sortedChapters.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No chapters yet. Create your first chapter to start writing your story.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedChapters.map((chapter, index) => (
            <Card key={chapter.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2">Chapter {index + 1}</Badge>
                    <CardTitle className="text-lg">{chapter.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{chapter.summary}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{chapter.wordCount || 0} words</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDialog(chapter)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteChapter(chapter)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ChapterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        chapter={editingChapter}
        onSave={handleSaveChapter}
      />
    </div>
  );
}

function ChapterDialog({
  open,
  onOpenChange,
  chapter,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapter: Chapter | null;
  onSave: (chapter: Chapter) => void;
}) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isFullscreen, toggleFullscreen } = useFullscreen(contentAreaRef);

  useEffect(() => {
    if (open) {
      setTitle(chapter?.title || '');
      setSummary(chapter?.summary || '');
      setContent(chapter?.content || '');
    }
  }, [open, chapter]);

  const handleAIAssist = async () => {
    if (!summary && !title) {
      toast({
        variant: 'destructive',
        title: 'Input Required',
        description: 'Please provide a title or summary to get AI writing assistance.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Simple AI prompt for now - in production, you'd call an actual AI service
      const prompt = `Based on the chapter titled "${title}" with summary: "${summary}", suggest some content ideas or continuation for the story.`;
      
      // Placeholder for AI generation
      const suggestion = `\n\n[AI Suggestion based on "${title}"]\n\nConsider developing the following elements:\n- Character development moments\n- Plot progression\n- Setting descriptions\n- Dialogue exchanges\n\n(Note: This is a placeholder. Connect to the actual AI service for real suggestions.)`;
      
      setContent(prev => prev + suggestion);
      
      toast({
        title: 'AI Assistance Added',
        description: 'AI suggestions have been added to your content. Review and edit as needed.',
      });
    } catch (error) {
      console.error('Error with AI assistance:', error);
      toast({
        variant: 'destructive',
        title: 'AI Assistance Failed',
        description: 'Failed to generate AI suggestions.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!title) {
      toast({ variant: 'destructive', title: 'Title Required', description: 'Please enter a title for the chapter.' });
      return;
    }
    setIsSaving(true);
    await onSave({
      ...(chapter || {}),
      id: chapter?.id,
      title,
      summary,
      content,
      order: chapter?.order || 0,
    });
    setIsSaving(false);
  };

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">{chapter?.id ? 'Edit Chapter' : 'Add Chapter'}</DialogTitle>
          <DialogDescription>
            {chapter?.id ? 'Edit your chapter details and content.' : 'Create a new chapter for your story.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Chapter Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Beginning" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary of what happens in this chapter..."
              rows={2}
            />
          </div>
          <div 
            ref={contentAreaRef}
            className={cn(
              "space-y-2",
              isFullscreen && "bg-background p-4"
            )}
          >
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Content</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAIAssist}
                  disabled={isGenerating}
                  title="Get AI writing suggestions"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
                <span className="text-xs text-muted-foreground">{wordCount} words</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your chapter content here..."
              rows={isFullscreen ? 30 : 12}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Chapter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
