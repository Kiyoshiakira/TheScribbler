'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { runAiWritingAssist } from '@/app/actions';
import { ScriptBlock } from '@/lib/editor-types';
import { useToast } from '@/hooks/use-toast';

interface AiWritingSuggestionsProps {
  currentBlock: ScriptBlock;
  cursorPosition: number;
  precedingBlocks: ScriptBlock[];
  onAcceptSuggestion: (suggestion: string) => void;
  isEnabled: boolean;
}

interface WritingSuggestion {
  suggestion: string;
  type: 'completion' | 'next-line' | 'continuation';
  confidence: number;
}

export default function AiWritingSuggestions({
  currentBlock,
  cursorPosition,
  precedingBlocks,
  onAcceptSuggestion,
  isEnabled,
}: AiWritingSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<WritingSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Check if AI is available by checking the environment variable set in next.config.ts
  const isAiEnabled = process.env.NEXT_PUBLIC_AI_ENABLED === 'true';

  useEffect(() => {
    if (!isEnabled || !isAiEnabled) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Only fetch suggestions if there's meaningful content
    const hasContent = currentBlock.text.trim().length > 3;
    
    if (!hasContent) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce the AI request to avoid too many calls
    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      
      try {
        const result = await runAiWritingAssist({
          currentBlock,
          cursorPosition,
          precedingBlocks: precedingBlocks.slice(-5), // Only send last 5 blocks for context
          assistType: 'complete',
        });

        if (result.data && result.data.suggestions.length > 0) {
          setSuggestions(result.data.suggestions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error fetching AI writing suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
        toast({
          variant: 'destructive',
          title: 'AI Suggestions Failed',
          description: 'Failed to fetch writing suggestions. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    }, 2000); // Wait 2 seconds after user stops typing

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [currentBlock.text, cursorPosition, isEnabled, isAiEnabled]);

  const handleAcceptSuggestion = (suggestion: WritingSuggestion) => {
    onAcceptSuggestion(suggestion.suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleDismiss = () => {
    setShowSuggestions(false);
    setSuggestions([]);
  };

  if (!showSuggestions && !isLoading) {
    return null;
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute top-0 right-0 z-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md border">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>AI thinking...</span>
          </div>
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <Card className="mt-2 border-primary/50">
          <CardContent className="p-3">
            <div className="flex items-start gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs font-semibold text-muted-foreground">AI Suggestions</div>
            </div>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="space-y-1">
                  <div className="text-sm text-foreground/90 p-2 bg-muted/50 rounded">
                    {suggestion.suggestion}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Confidence: {Math.round(suggestion.confidence * 100)}%
                    </div>
                    <div className="flex gap-2">
                      {index === 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={handleDismiss}
                        >
                          Dismiss All
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => handleAcceptSuggestion(suggestion)}
                      >
                        Use This
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
              Press Tab to accept first suggestion, Esc to dismiss
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
