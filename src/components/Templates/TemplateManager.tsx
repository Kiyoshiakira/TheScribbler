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
import { Template } from '@/data/templates';
import { Plus, Edit, Trash2, FileText, BookOpen, FileCode } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { sanitizeFirestorePayload } from '@/lib/firestore-utils';
import { defaultTemplates } from '@/data/templates';
import { 
  loadLocalTemplates, 
  saveLocalTemplates, 
  isLocalTemplate 
} from '@/lib/template-storage';

interface TemplateManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Extracts placeholders from template content ({{placeholder}})
 */
function extractPlaceholders(content: string): string[] {
  const matches = content.match(/{{(\w+)}}/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(2, -2)))];
}

/**
 * TemplateManager component for managing custom templates
 */
export function TemplateManager({ open, onOpenChange }: TemplateManagerProps) {
  const [localTemplates, setLocalTemplates] = useState<Template[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general' as 'script' | 'story' | 'general',
    content: '',
  });

  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  // Firestore collection for user templates (optional cloud storage)
  const templatesCollection = useMemoFirebase(
    () => (user && firestore ? collection(firestore, 'users', user.uid, 'templates') : null),
    [firestore, user]
  );

  const { data: cloudTemplates } = useCollection<Template>(templatesCollection);

  // Load local templates on mount
  useEffect(() => {
    setLocalTemplates(loadLocalTemplates());
  }, []);

  // Combine local and cloud custom templates (exclude default templates)
  const customTemplates = [...localTemplates, ...(cloudTemplates || [])];

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setFormData({ name: '', description: '', category: 'general', content: '' });
    setIsEditing(true);
  };

  const handleEdit = (template: Template) => {
    // Don't allow editing default templates
    if (defaultTemplates.find(t => t.id === template.id)) {
      toast({
        title: 'Cannot Edit',
        description: 'Default templates cannot be edited. Create a custom template instead.',
        variant: 'destructive',
      });
      return;
    }

    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      content: template.content,
    });
    setIsEditing(true);
  };

  const handleDelete = (template: Template) => {
    // Don't allow deleting default templates
    if (defaultTemplates.find(t => t.id === template.id)) {
      toast({
        title: 'Cannot Delete',
        description: 'Default templates cannot be deleted.',
        variant: 'destructive',
      });
      return;
    }

    setDeletingTemplate(template);
  };

  const confirmDelete = async () => {
    if (!deletingTemplate) return;

    try {
      if (!isLocalTemplate(deletingTemplate) && templatesCollection) {
        // Delete from Firestore
        await deleteDoc(doc(templatesCollection, deletingTemplate.id));
        toast({
          title: 'Template Deleted',
          description: 'Cloud template deleted successfully',
        });
      } else {
        // Delete from local storage
        const updated = localTemplates.filter(t => t.id !== deletingTemplate.id);
        setLocalTemplates(updated);
        saveLocalTemplates(updated);
        toast({
          title: 'Template Deleted',
          description: 'Local template deleted successfully',
        });
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }

    setDeletingTemplate(null);
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

    try {
      if (editingTemplate) {
        // Update existing template
        const isLocal = isLocalTemplate(editingTemplate);
        
        if (!isLocal && templatesCollection) {
          // Update in Firestore
          const templateData = sanitizeFirestorePayload({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            content: formData.content,
            placeholders,
            updatedAt: serverTimestamp(),
          });
          await updateDoc(doc(templatesCollection, editingTemplate.id), templateData);
          toast({
            title: 'Template Updated',
            description: 'Cloud template updated successfully',
          });
        } else {
          // Update in local storage
          const updated = localTemplates.map(t =>
            t.id === editingTemplate.id
              ? { ...t, ...formData, placeholders }
              : t
          );
          setLocalTemplates(updated);
          saveLocalTemplates(updated);
          toast({
            title: 'Template Updated',
            description: 'Local template updated successfully',
          });
        }
      } else {
        // Create new template
        if (user && templatesCollection) {
          // Save to Firestore if user is logged in
          const templateData = sanitizeFirestorePayload({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            content: formData.content,
            placeholders,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          await addDoc(templatesCollection, templateData);
          toast({
            title: 'Template Created',
            description: 'Cloud template created successfully',
          });
        } else {
          // Save to local storage
          const newTemplate: Template = {
            id: `custom-local-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            ...formData,
            placeholders,
          };
          const updated = [...localTemplates, newTemplate];
          setLocalTemplates(updated);
          saveLocalTemplates(updated);
          toast({
            title: 'Template Created',
            description: 'Local template created successfully',
          });
        }
      }

      setIsEditing(false);
      setEditingTemplate(null);
      setFormData({ name: '', description: '', category: 'general', content: '' });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setEditingTemplate(null);
    setFormData({ name: '', description: '', category: 'general', content: '' });
    onOpenChange(false);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'script':
        return <FileCode className="h-4 w-4" />;
      case 'story':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'script':
        return 'bg-blue-500/10 text-blue-500';
      case 'story':
        return 'bg-purple-500/10 text-purple-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <>
      <Dialog open={open && !isEditing} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Template Manager</DialogTitle>
            <DialogDescription>
              Manage your custom templates. Default templates are read-only.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              {customTemplates.length} custom template{customTemplates.length !== 1 ? 's' : ''}
              {user && ` (${cloudTemplates?.length || 0} cloud, ${localTemplates.length} local)`}
            </div>
            <Button onClick={handleCreateNew} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            {customTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No custom templates yet</p>
                <p className="text-sm text-muted-foreground">Create your first custom template to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {customTemplates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <Badge 
                              variant="secondary" 
                              className={getCategoryColor(template.category)}
                            >
                              {getCategoryIcon(template.category)}
                            </Badge>
                          </div>
                          <CardDescription>{template.description}</CardDescription>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(template)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-20">
                        {template.content}
                      </pre>
                      {template.placeholders.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Placeholders: {template.placeholders.join(', ')}
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
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              Use {'{{'} PlaceholderName {'}'} syntax for placeholders that will be filled when using the template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., My Custom Template"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this template"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: 'script' | 'story' | 'general') => 
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="script">Script</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder={'Enter template content with {{placeholders}}...'}
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
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTemplate} onOpenChange={() => setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingTemplate?.name}&quot;? This action cannot be undone.
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
