'use client';
import { useState } from 'react';
import { getAiSuggestions, getAiDeepAnalysis } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, Sparkles, Wand2, Bot, Users, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AiDeepAnalysisOutput } from '@/ai/flows/ai-deep-analysis';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

interface AiAssistantProps {
  scriptContent: string;
}

interface AnalysisItem {
  point: string;
  suggestion: string;
}

const AnalysisSection = ({ title, items, icon }: { title: string, items: AnalysisItem[], icon: React.ReactNode }) => (
    <AccordionItem value={title}>
        <AccordionTrigger className='text-sm font-semibold'>
            <div className='flex items-center gap-2'>
                {icon}
                {title}
            </div>
        </AccordionTrigger>
        <AccordionContent>
            <ul className="space-y-4 pt-2">
                {items.map((item, index) => (
                <li key={index} className="text-sm flex flex-col gap-2 p-3 bg-muted/50 rounded-md">
                    <p className='font-semibold'>{item.point}</p>
                    <p className='text-muted-foreground'>{item.suggestion}</p>
                </li>
                ))}
            </ul>
        </AccordionContent>
    </AccordionItem>
);

export default function AiAssistant({ scriptContent }: AiAssistantProps) {
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AiDeepAnalysisOutput | null>(null);
  const { toast } = useToast();

  const handleGetSuggestions = async () => {
    setIsSuggestionsLoading(true);
    setSuggestions([]);
    const result = await getAiSuggestions({ screenplay: scriptContent });
    setIsSuggestionsLoading(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else if (result.data) {
      setSuggestions(result.data.suggestions);
    }
  };

  const handleGetAnalysis = async () => {
    setIsAnalysisLoading(true);
    setAnalysis(null);
    const result = await getAiDeepAnalysis({ screenplay: scriptContent });
    setIsAnalysisLoading(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else if (result.data) {
      setAnalysis(result.data);
    }
  };


  return (
    <Card className="h-full flex flex-col shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span>AI Assistant</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <Tabs defaultValue="suggestions">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="analysis">Deep Analysis</TabsTrigger>
          </TabsList>
          <TabsContent value="suggestions" className="mt-4">
            <div className="flex flex-col gap-4">
                <Button onClick={handleGetSuggestions} disabled={isSuggestionsLoading}>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    {isSuggestionsLoading ? 'Thinking...' : 'Suggest Improvements'}
                </Button>
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Suggestions</p>
                    <ScrollArea className="h-[calc(100vh-25rem)] rounded-md border p-4">
                        {isSuggestionsLoading && (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-4/5" />
                        </div>
                        )}
                        {!isSuggestionsLoading && suggestions.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-8">
                            Click the button to get quick AI-powered suggestions.
                        </div>
                        )}
                        <ul className="space-y-3">
                        {suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm flex gap-3">
                            <Lightbulb className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span>{suggestion}</span>
                            </li>
                        ))}
                        </ul>
                    </ScrollArea>
                </div>
            </div>
          </TabsContent>
          <TabsContent value="analysis" className="mt-4">
            <div className="flex flex-col gap-4">
                <Button onClick={handleGetAnalysis} disabled={isAnalysisLoading}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {isAnalysisLoading ? 'Analyzing...' : 'Run Deep Analysis'}
                </Button>
                 <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Analysis Results</p>
                    <ScrollArea className="h-[calc(100vh-25rem)] rounded-md border">
                        {isAnalysisLoading && (
                            <div className="space-y-4 p-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-4/5" />
                            </div>
                        )}
                        {!isAnalysisLoading && !analysis && (
                            <div className="text-center text-sm text-muted-foreground py-8 px-4">
                                Run a deep analysis to get structured feedback on plot, characters, and dialogue.
                            </div>
                        )}
                        {analysis && (
                            <Accordion type="multiple" defaultValue={['Plot', 'Characters', 'Dialogue']} className="w-full px-4">
                                {analysis.plotAnalysis.length > 0 && (
                                    <AnalysisSection title="Plot" items={analysis.plotAnalysis} icon={<Bot className='w-4 h-4 text-primary' />} />
                                )}
                                {analysis.characterAnalysis.length > 0 && (
                                    <AnalysisSection title="Characters" items={analysis.characterAnalysis} icon={<Users className='w-4 h-4 text-primary' />} />
                                )}
                                {analysis.dialogueAnalysis.length > 0 && (
                                    <AnalysisSection title="Dialogue" items={analysis.dialogueAnalysis} icon={<MessageSquare className='w-4 h-4 text-primary' />} />
                                )}
                            </Accordion>
                        )}
                    </ScrollArea>
                </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
