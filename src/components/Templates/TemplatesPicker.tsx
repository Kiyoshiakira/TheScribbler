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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { defaultTemplates, Template, PlaceholderValue } from '@/data/templates';
import { FileText, BookOpen, FileCode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { 
  loadLocalTemplates, 
  deduplicateTemplates 
} from '@/lib/template-storage';

interface TemplatesPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelect: (content: string) => void;
  category?: 'script' | 'story' | 'general' | 'all';
}

/**
 * Replaces placeholders in template content with provided values
 */
function replacePlaceholders(content: string, values: PlaceholderValue[]): string {
  let result = content;
  values.forEach(({ placeholder, value }) => {
    // Replace all occurrences of {{placeholder}} with value
    const regex = new RegExp(`{{${placeholder}}}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
}

/**
 * TemplatesPicker component for selecting and customizing document templates
 */
export function TemplatesPicker({ open, onOpenChange, onTemplateSelect, category = 'all' }: TemplatesPickerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'select' | 'customize'>('select');
  const [localTemplates, setLocalTemplates] = useState<Template[]>([]);

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

  // Combine default templates with custom templates (local + cloud), with deduplication
  const customTemplates = deduplicateTemplates([...localTemplates, ...(cloudTemplates || [])]);
  const allTemplates = [...defaultTemplates, ...customTemplates];

  // Filter templates by category
  const filteredTemplates = category === 'all' 
    ? allTemplates 
    : allTemplates.filter(t => t.category === category);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    // Initialize placeholder values with empty strings
    const initialValues: Record<string, string> = {};
    template.placeholders.forEach(placeholder => {
      initialValues[placeholder] = '';
    });
    setPlaceholderValues(initialValues);
    setStep('customize');
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    const values: PlaceholderValue[] = selectedTemplate.placeholders.map(placeholder => ({
      placeholder,
      value: placeholderValues[placeholder] || '',
    }));

    const content = replacePlaceholders(selectedTemplate.content, values);
    onTemplateSelect(content);
    handleClose();
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setPlaceholderValues({});
    setStep('select');
    onOpenChange(false);
  };

  const handleBack = () => {
    setStep('select');
    setSelectedTemplate(null);
    setPlaceholderValues({});
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' ? 'Choose a Template' : `Customize: ${selectedTemplate?.name}`}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' 
              ? 'Select a template to get started with your document'
              : 'Fill in the placeholders to customize your template'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge 
                        variant="secondary" 
                        className={getCategoryColor(template.category)}
                        aria-label={`Category: ${template.category}`}
                      >
                        {getCategoryIcon(template.category)}
                      </Badge>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {template.placeholders.length} placeholder{template.placeholders.length !== 1 ? 's' : ''}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {selectedTemplate?.placeholders.map((placeholder) => (
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
        )}

        <DialogFooter>
          {step === 'customize' && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === 'customize' && (
            <Button onClick={handleApplyTemplate}>
              Apply Template
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
