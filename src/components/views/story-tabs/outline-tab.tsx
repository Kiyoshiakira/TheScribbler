'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical, Loader2 } from 'lucide-react';
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

interface OutlineItem {
  id?: string;
  title: string;
  description: string;
  order: number;
  parentId?: string;
  expanded?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export default function OutlineTab() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currentScriptId } = useCurrentScript();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OutlineItem | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const outlineCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'outline') : null),
    [firestore, user, currentScriptId]
  );

  const { data: outlineItems, isLoading } = useCollection<OutlineItem>(outlineCollection);

  const handleOpenDialog = (item: OutlineItem | null = null) => {
    if (item) {
      const { createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = item;
      setEditingItem(rest);
    } else {
      setEditingItem({
        title: '',
        description: '',
        order: outlineItems?.length || 0,
      });
    }
    setDialogOpen(true);
  };

  const handleSaveItem = async (itemToSave: OutlineItem) => {
    if (!outlineCollection) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot save outline item: no active script.' });
      return;
    }

    const isNew = !itemToSave.id;
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...plainData } = itemToSave;

    try {
      if (isNew) {
        const docData = { ...plainData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        await addDoc(outlineCollection, docData).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: outlineCollection.path,
            operation: 'create',
            requestResourceData: docData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });
      } else {
        const itemDocRef = doc(outlineCollection, id);
        const updateData = { ...plainData, updatedAt: serverTimestamp() };
        await setDoc(itemDocRef, updateData, { merge: true }).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: itemDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });
      }
      toast({
        title: isNew ? 'Outline Item Created' : 'Outline Item Updated',
        description: `${itemToSave.title} has been saved.`,
      });
      setDialogOpen(false);
    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
        console.error('Error saving outline item:', error);
        toast({
          variant: 'destructive',
          title: 'Save Error',
          description: 'An unexpected error occurred while saving the outline item.',
        });
      }
    }
  };

  const handleDeleteItem = async (item: OutlineItem) => {
    if (!outlineCollection || !item.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot delete outline item.' });
      return;
    }

    if (!confirm(`Delete "${item.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const itemRef = doc(outlineCollection, item.id);
      await deleteDoc(itemRef).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: itemRef.path,
          operation: 'delete',
          requestResourceData: {},
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });

      toast({
        title: 'Outline Item Deleted',
        description: `${item.title} has been deleted.`,
      });
    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
        console.error('Error deleting outline item:', error);
        toast({
          variant: 'destructive',
          title: 'Delete Error',
          description: 'An unexpected error occurred while deleting the outline item.',
        });
      }
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const renderOutlineItem = (item: OutlineItem, level: number = 0) => {
    const hasChildren = outlineItems?.some(i => i.parentId === item.id);
    const isExpanded = expandedItems.has(item.id || '');

    return (
      <div key={item.id} className="mb-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-4">
            <div className="flex items-center gap-2">
              <div style={{ marginLeft: `${level * 20}px` }} className="flex items-center gap-2 flex-1">
                {hasChildren && (
                  <button
                    onClick={() => toggleExpanded(item.id || '')}
                    className="hover:bg-accent rounded p-1"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                )}
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base flex-1">{item.title}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenDialog(item)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteItem(item)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {item.description && (
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-muted-foreground" style={{ marginLeft: `${level * 20 + 24}px` }}>
                {item.description}
              </p>
            </CardContent>
          )}
        </Card>
        {hasChildren && isExpanded && (
          <div className="mt-2">
            {outlineItems
              ?.filter(i => i.parentId === item.id)
              .sort((a, b) => a.order - b.order)
              .map(child => renderOutlineItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const topLevelItems = outlineItems?.filter(item => !item.parentId).sort((a, b) => a.order - b.order) || [];

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold font-headline">Story Outline</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {topLevelItems.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No outline items yet. Create your first outline item to structure your story.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {topLevelItems.map(item => renderOutlineItem(item))}
        </div>
      )}

      <OutlineItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        onSave={handleSaveItem}
        parentItems={outlineItems || []}
      />
    </div>
  );
}

function OutlineItemDialog({
  open,
  onOpenChange,
  item,
  onSave,
  parentItems,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: OutlineItem | null;
  onSave: (item: OutlineItem) => void;
  parentItems: OutlineItem[];
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setTitle(item?.title || '');
      setDescription(item?.description || '');
    }
  }, [open, item]);

  const handleSave = async () => {
    if (!title) {
      toast({ variant: 'destructive', title: 'Title Required', description: 'Please enter a title for the outline item.' });
      return;
    }
    setIsSaving(true);
    await onSave({
      ...(item || {}),
      id: item?.id,
      title,
      description,
      order: item?.order || 0,
    });
    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{item?.id ? 'Edit Outline Item' : 'Add Outline Item'}</DialogTitle>
          <DialogDescription>
            {item?.id ? 'Edit your outline item details.' : 'Create a new outline item for your story structure.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Act I: The Beginning" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this section of your story..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
