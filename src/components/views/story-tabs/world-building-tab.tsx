'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Loader2, MapPin, Upload, Globe, Sparkles } from 'lucide-react';
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
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface WorldElement {
  id?: string;
  name: string;
  type: string;
  description: string;
  significance: string;
  imageUrl?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

const WORLD_TYPES = ['Location', 'Culture', 'Technology', 'Magic System', 'Organization', 'Historical Event', 'Other'];

export default function WorldBuildingTab() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currentScriptId } = useCurrentScript();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<WorldElement | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const worldCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'worldBuilding') : null),
    [firestore, user, currentScriptId]
  );

  const { data: worldElements, isLoading } = useCollection<WorldElement>(worldCollection);

  const handleOpenDialog = (element: WorldElement | null = null) => {
    if (element) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = element;
      setEditingElement(rest);
    } else {
      setEditingElement({
        name: '',
        type: 'Location',
        description: '',
        significance: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSaveElement = async (elementToSave: WorldElement) => {
    if (!worldCollection) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot save world element: no active script.' });
      return;
    }

    const isNew = !elementToSave.id;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...plainData } = elementToSave;

    try {
      if (isNew) {
        const docData = sanitizeFirestorePayload({ ...plainData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        await addDoc(worldCollection, docData).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: worldCollection.path,
            operation: 'create',
            requestResourceData: docData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });
      } else {
        const elementDocRef = doc(worldCollection, id);
        const updateData = sanitizeFirestorePayload({ ...plainData, updatedAt: serverTimestamp() });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        await setDoc(elementDocRef, updateData, { merge: true }).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: elementDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });
      }
      toast({
        title: isNew ? 'World Element Created' : 'World Element Updated',
        description: `${elementToSave.name} has been saved.`,
      });
      setDialogOpen(false);
    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
        console.error('Error saving world element:', error);
        toast({
          variant: 'destructive',
          title: 'Save Error',
          description: 'An unexpected error occurred while saving the world element.',
        });
      }
    }
  };

  const handleDeleteElement = async (element: WorldElement) => {
    if (!worldCollection || !element.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot delete world element.' });
      return;
    }

    if (!confirm(`Delete "${element.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const elementRef = doc(worldCollection, element.id);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      await deleteDoc(elementRef).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: elementRef.path,
          operation: 'delete',
          requestResourceData: {},
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });

      toast({
        title: 'World Element Deleted',
        description: `${element.name} has been deleted.`,
      });
    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
        console.error('Error deleting world element:', error);
        toast({
          variant: 'destructive',
          title: 'Delete Error',
          description: 'An unexpected error occurred while deleting the world element.',
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const filteredElements = worldElements?.filter(
    (element) => filterType === 'all' || element.type === filterType
  ) || [];

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold font-headline">World Building</h2>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {WORLD_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Element
        </Button>
      </div>

      {filteredElements.length === 0 ? (
        <Card className="p-8 text-center">
          <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {filterType === 'all'
              ? 'No world elements yet. Create your first world element to build your story universe.'
              : `No ${filterType} elements found. Try a different filter or create a new element.`}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredElements.map((element) => (
            <Card
              key={element.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleOpenDialog(element)}
            >
              {element.imageUrl && (
                <div className="aspect-video w-full overflow-hidden">
                  <Image
                    src={element.imageUrl}
                    alt={element.name}
                    width={400}
                    height={225}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex-1">{element.name}</CardTitle>
                  <Badge variant="secondary">{element.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-3">{element.description}</p>
                {element.significance && (
                  <p className="text-xs text-muted-foreground italic">
                    Significance: {element.significance}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <WorldElementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        element={editingElement}
        onSave={handleSaveElement}
        onDelete={handleDeleteElement}
      />
    </div>
  );
}

function WorldElementDialog({
  open,
  onOpenChange,
  element,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  element: WorldElement | null;
  onSave: (element: WorldElement) => void;
  onDelete: (element: WorldElement) => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Location');
  const [description, setDescription] = useState('');
  const [significance, setSignificance] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setName(element?.name || '');
      setType(element?.type || 'Location');
      setDescription(element?.description || '');
      setSignificance(element?.significance || '');
      setImageUrl(element?.imageUrl || '');
    }
  }, [open, element]);

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

  const handleAISuggest = async () => {
    if (!name || !type) {
      toast({
        variant: 'destructive',
        title: 'Input Required',
        description: 'Please provide a name and type to get AI suggestions.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const suggestion = `For ${type} "${name}":\n\n- Physical characteristics and appearance\n- History and origins\n- Cultural or practical significance\n- Notable features or customs\n- Connections to other story elements`;
      
      setDescription(prev => prev ? `${prev}\n\n${suggestion}` : suggestion);
      
      toast({
        title: 'AI Suggestions Added',
        description: 'AI suggestions for world-building have been added.',
      });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        variant: 'destructive',
        title: 'AI Suggestion Failed',
        description: 'Failed to generate suggestions.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!name) {
      toast({ variant: 'destructive', title: 'Name Required', description: 'Please enter a name for the world element.' });
      return;
    }
    setIsSaving(true);
    await onSave({
      ...(element || {}),
      id: element?.id,
      name,
      type,
      description,
      significance,
      imageUrl,
    });
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">{element?.id ? 'Edit World Element' : 'Add World Element'}</DialogTitle>
          <DialogDescription>
            {element?.id ? 'Edit your world element details.' : 'Create a new world element for your story universe.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Element Name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {WORLD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAISuggest}
                disabled={isGenerating}
                title="Get AI suggestions"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of this element..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="significance">Significance to Story</Label>
            <Textarea
              id="significance"
              value={significance}
              onChange={(e) => setSignificance(e.target.value)}
              placeholder="Why is this important to your story?"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Image</Label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 rounded-md border border-dashed flex items-center justify-center bg-muted overflow-hidden">
                {imageUrl ? (
                  <Image src={imageUrl} alt="World element" width={128} height={128} className="object-cover w-full h-full" />
                ) : (
                  <MapPin className="w-8 h-8 text-muted-foreground" />
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
        <DialogFooter className="flex justify-between">
          {element?.id && (
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(element);
                onOpenChange(false);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Element
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
