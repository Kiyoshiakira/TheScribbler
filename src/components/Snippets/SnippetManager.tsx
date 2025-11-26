'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Snippet, PlaceholderValue } from '@/data/templates';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { sanitizeFirestorePayload } from '@/lib/firestore-utils';

interface SnippetManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSnippetInsert?: (content: string) => void;
}

/**
 * Extracts placeholders from snippet content ({{placeholder}})
 */
function extractPlaceholders(content: string): string[] {
  const matches = content.match(/{{(\w+)}}/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(2, -2)))];
}

/**
 * Replaces placeholders in snippet content with provided values
 */
function replacePlaceholders(content: string, values: PlaceholderValue[]): string {
  let result = content;
  values.forEach(({ placeholder, value }) => {
    const regex = new RegExp(`{{${placeholder}}}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
}

/**
 * Local storage key for snippets
 */
const LOCAL_STORAGE_KEY = 'scribbler-snippets';

/**
 * Check if a snippet is stored locally (vs cloud/Firestore)
 */
function isLocalSnippet(snippet: Snippet): boolean {
  return snippet.storageType === 'local' || snippet.id.startsWith('local-');
}

/**
 * Load snippets from local storage
 */
function loadLocalSnippets(): Snippet[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading snippets from local storage:', error);
    return [];
  }
}

/**
 * Save snippets to local storage
 */
function saveLocalSnippets(snippets: Snippet[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snippets));
  } catch (error) {
    console.error('Error saving snippets to local storage:', error);
  }
}

/**
 * SnippetManager component for managing reusable text snippets
 */
export function SnippetManager({ open, onOpenChange, onSnippetInsert }: SnippetManagerProps) {
  const [localSnippets, setLocalSnippets] = useState<Snippet[]>([]);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [deletingSnippet, setDeletingSnippet] = useState<Snippet | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
  });

  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  // Firestore collection for user snippets (optional cloud storage)
  const snippetsCollection = useMemoFirebase(
    () => (user && firestore ? collection(firestore, 'users', user.uid, 'snippets') : null),
    [firestore, user]
  );

  const { data: cloudSnippets } = useCollection<Snippet>(snippetsCollection);

  // Load local snippets on mount
  useEffect(() => {
    setLocalSnippets(loadLocalSnippets());
  }, []);

  // Combine local and cloud snippets
  const allSnippets = [...localSnippets, ...(cloudSnippets || [])];

  const handleCreateNew = () => {
    setEditingSnippet(null);
    setFormData({ name: '', description: '', content: '' });
    setIsEditing(true);
  };

  const handleEdit = (snippet: Snippet) => {
    setEditingSnippet(snippet);
    setFormData({
      name: snippet.name,
      description: snippet.description,
      content: snippet.content,
    });
    setIsEditing(true);
  };

  const handleDelete = (snippet: Snippet) => {
    setDeletingSnippet(snippet);
  };

  const confirmDelete = async () => {
    if (!deletingSnippet) return;

    try {
      // Check if it's a cloud snippet using helper function
      if (!isLocalSnippet(deletingSnippet) && snippetsCollection) {
        // Delete from Firestore
        await deleteDoc(doc(snippetsCollection, deletingSnippet.id));
        toast({
          title: 'Snippet Deleted',
          description: 'Cloud snippet deleted successfully',
        });
      } else {
        // Delete from local storage
        const updated = localSnippets.filter(s => s.id !== deletingSnippet.id);
        setLocalSnippets(updated);
        saveLocalSnippets(updated);
        toast({
          title: 'Snippet Deleted',
          description: 'Local snippet deleted successfully',
        });
      }
    } catch (error) {
      console.error('Error deleting snippet:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete snippet',
        variant: 'destructive',
      });
    }

    setDeletingSnippet(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name and content are required',
        variant: 'destructive',
      });
      return;
    }

    const placeholders = extractPlaceholders(formData.content);
    const now = Date.now();

    try {
      if (editingSnippet) {
        // Update existing snippet
        const isLocal = isLocalSnippet(editingSnippet);
        
        if (!isLocal && snippetsCollection) {
          // Update in Firestore
          const snippetData = sanitizeFirestorePayload({
            name: formData.name,
            description: formData.description,
            content: formData.content,
            placeholders,
            updatedAt: serverTimestamp(),
          });
          await updateDoc(doc(snippetsCollection, editingSnippet.id), snippetData);
          toast({
            title: 'Snippet Updated',
            description: 'Cloud snippet updated successfully',
          });
        } else {
          // Update in local storage
          const updated = localSnippets.map(s =>
            s.id === editingSnippet.id
              ? { ...s, ...formData, placeholders, updatedAt: now }
              : s
          );
          setLocalSnippets(updated);
          saveLocalSnippets(updated);
          toast({
            title: 'Snippet Updated',
            description: 'Local snippet updated successfully',
          });
        }
      } else {
        // Create new snippet
        if (user && snippetsCollection) {
          // Save to Firestore if user is logged in
          const snippetData = sanitizeFirestorePayload({
            name: formData.name,
            description: formData.description,
            content: formData.content,
            placeholders,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          await addDoc(snippetsCollection, snippetData);
          toast({
            title: 'Snippet Created',
            description: 'Cloud snippet created successfully',
          });
        } else {
          // Save to local storage
          const newSnippet: Snippet = {
            id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...formData,
            placeholders,
            createdAt: now,
            updatedAt: now,
            storageType: 'local',
          };
          const updated = [...localSnippets, newSnippet];
          setLocalSnippets(updated);
          saveLocalSnippets(updated);
          toast({
            title: 'Snippet Created',
            description: 'Local snippet created successfully',
          });
        }
      }

      setIsEditing(false);
      setEditingSnippet(null);
      setFormData({ name: '', description: '', content: '' });
    } catch (error) {
      console.error('Error saving snippet:', error);
      toast({
        title: 'Error',
        description: 'Failed to save snippet',
        variant: 'destructive',
      });
    }
  };

  const handleInsert = (snippet: Snippet) => {
    if (snippet.placeholders.length === 0) {
      // No placeholders, insert directly
      onSnippetInsert?.(snippet.content);
      toast({
        title: 'Snippet Inserted',
        description: `"${snippet.name}" inserted successfully`,
      });
    } else {
      // Has placeholders, show customization dialog
      setSelectedSnippet(snippet);
      const initialValues: Record<string, string> = {};
      snippet.placeholders.forEach(placeholder => {
        initialValues[placeholder] = '';
      });
      setPlaceholderValues(initialValues);
      setIsInserting(true);
    }
  };

  const handleApplyInsert = () => {
    if (!selectedSnippet) return;

    const values: PlaceholderValue[] = selectedSnippet.placeholders.map(placeholder => ({
      placeholder,
      value: placeholderValues[placeholder] || '',
    }));

    const content = replacePlaceholders(selectedSnippet.content, values);
    onSnippetInsert?.(content);
    
    toast({
      title: 'Snippet Inserted',
      description: `"${selectedSnippet.name}" inserted successfully`,
    });

    setIsInserting(false);
    setSelectedSnippet(null);
    setPlaceholderValues({});
  };

  const handleClose = () => {
    setIsEditing(false);
    setEditingSnippet(null);
    setFormData({ name: '', description: '', content: '' });
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open && !isEditing && !isInserting} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Snippet Manager</DialogTitle>
            <DialogDescription>
              Manage your reusable text snippets. Snippets can include placeholders like {'{{Name}}'}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              {allSnippets.length} snippet{allSnippets.length !== 1 ? 's' : ''}
              {user && ` (${cloudSnippets?.length || 0} cloud, ${localSnippets.length} local)`}
            </div>
            <Button onClick={handleCreateNew} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Snippet
            </Button>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            {allSnippets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No snippets yet</p>
                <p className="text-sm text-muted-foreground">Create your first snippet to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {allSnippets.map((snippet) => (
                  <Card key={snippet.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{snippet.name}</CardTitle>
                          <CardDescription>{snippet.description}</CardDescription>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleInsert(snippet)}
                          >
                            Insert
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(snippet)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(snippet)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-20">
                        {snippet.content}
                      </pre>
                      {snippet.placeholders.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Placeholders: {snippet.placeholders.join(', ')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Create Dialog */}
      <Dialog open={isEditing} onOpenChange={() => setIsEditing(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSnippet ? 'Edit Snippet' : 'Create Snippet'}</DialogTitle>
            <DialogDescription>
              Use {'{{PlaceholderName}}'} syntax for placeholders that will be filled when inserting the snippet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Scene Description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this snippet"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter snippet content with {{placeholders}}..."
                rows={10}
              />
            </div>

            {formData.content && extractPlaceholders(formData.content).length > 0 && (
              <div className="text-sm text-muted-foreground">
                Detected placeholders: {extractPlaceholders(formData.content).join(', ')}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingSnippet ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Insert with Placeholders Dialog */}
      <Dialog open={isInserting} onOpenChange={() => setIsInserting(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customize Snippet: {selectedSnippet?.name}</DialogTitle>
            <DialogDescription>
              Fill in the placeholders below before inserting the snippet.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-4">
              {selectedSnippet?.placeholders.map((placeholder) => (
                <div key={placeholder} className="space-y-2">
                  <Label htmlFor={placeholder}>{placeholder}</Label>
                  <Input
                    id={placeholder}
                    value={placeholderValues[placeholder] || ''}
                    onChange={(e) => setPlaceholderValues({
                      ...placeholderValues,
                      [placeholder]: e.target.value,
                    })}
                    placeholder={`Enter ${placeholder.toLowerCase()}...`}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInserting(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyInsert}>
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingSnippet} onOpenChange={() => setDeletingSnippet(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Snippet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingSnippet?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
