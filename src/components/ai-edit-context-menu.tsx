'use client';

import { useState, useEffect, useRef } from 'react';
import { Wand2, Sparkles, Check, MessageSquare, Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { runAiEditScript } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ScriptBlock } from '@/lib/editor-types';

interface AiEditContextMenuProps {
  selectedText: string;
  context: ScriptBlock[];
  onApplyEdit: (originalText: string, editedText: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

interface EditSuggestion {
  originalText: string;
  editedText: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export default function AiEditContextMenu({
  selectedText,
  context,
  onApplyEdit,
  onClose,
  position,
}: AiEditContextMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<EditSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleQuickEdit = async (instruction: string) => {
    setIsLoading(true);
    setShowSuggestions(true);

    try {
      const result = await runAiEditScript({
        instruction,
        targetText: selectedText,
        context,
      });

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
        onClose();
      } else if (result.data) {
        setSuggestions(result.data.suggestions);
        if (result.data.suggestions.length === 0) {
          toast({
            title: 'No Changes Needed',
            description: 'The AI thinks this text looks good!',
          });
          onClose();
        }
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get AI suggestions.',
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const applyEditSuggestion = (suggestion: EditSuggestion) => {
    onApplyEdit(suggestion.originalText, suggestion.editedText);
    toast({
      title: 'Edit Applied',
      description: 'The text has been updated.',
    });
    onClose();
  };

  const quickActions = [
    { label: 'Fix Spelling & Grammar', instruction: 'Fix any spelling and grammar errors', icon: <Check className="w-4 h-4" /> },
    { label: 'Improve Clarity', instruction: 'Make this text clearer and more concise', icon: <Sparkles className="w-4 h-4" /> },
    { label: 'Enhance Dialogue', instruction: 'Make this dialogue sound more natural and engaging', icon: <MessageSquare className="w-4 h-4" /> },
    { label: 'Polish Action', instruction: 'Improve this action description to be more visual and clear', icon: <Wand2 className="w-4 h-4" /> },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-popover border rounded-lg shadow-lg"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        maxWidth: '400px',
      }}
    >
      {!showSuggestions ? (
        <div className="p-2">
          <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
            AI Quick Edits
          </div>
          <div className="space-y-1">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleQuickEdit(action.instruction)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <span className="mr-2">{action.icon}</span>
                )}
                {action.label}
              </Button>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={onClose}
            >
              <X className="w-3 h-3 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 max-h-96 overflow-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground mt-2">Analyzing...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm font-semibold mb-2">AI Suggestions</div>
              {suggestions.map((suggestion, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        {suggestion.reason}
                      </div>
                      <div className="text-xs text-red-500 line-through">
                        {suggestion.originalText}
                      </div>
                      <div className="text-xs text-green-600">
                        {suggestion.editedText}
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSuggestions(suggestions.filter((_, i) => i !== index))}
                        >
                          Skip
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => applyEditSuggestion(suggestion)}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
