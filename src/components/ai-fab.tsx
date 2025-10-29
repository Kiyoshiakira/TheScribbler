'use client';

import { useState, useContext, ReactNode, useEffect } from 'react';
import {
  Sparkles,
  Lightbulb,
  Wand2,
  MessageSquare,
  Loader2,
  Bot,
  Users,
  SearchCheck,
  Check,
  X,
} from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { ScriptContext, useScript } from '@/context/script-context';
import { getAiSuggestions, getAiDeepAnalysis, getAiProofreadSuggestions } from '@/app/actions';
import type { AiDeepAnalysisOutput } from '@/ai/flows/ai-deep-analysis';
import type { ProofreadSuggestion } from '@/app/page';
import AiAssistant from './ai-assistant';
import { Skeleton } from './ui/skeleton';

interface AnalysisItem {
    point: string;
    suggestion: string;
}

export type AiFabAction = 
    | 'suggestImprovements'
    | 'deepAnalysis'
    | 'proofread'
    | 'openChat'
    | 'custom';

interface AiFabProps {
    actions?: AiFabAction[];
    customActions?: CustomAction[];
}

interface CustomAction {
    label: string;
    icon: ReactNode;
    onClick: () => void;
    isLoading?: boolean;
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

const PROOFREAD_STATUS_MESSAGES = [
    "Analyzing script for formatting...",
    "Checking grammar and spelling...",
    "Verifying continuity...",
    "Finalizing suggestions...",
];

export default function AiFab({ actions = ['suggestImprovements', 'deepAnalysis', 'proofread', 'openChat'], customActions = [] }: AiFabProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [suggestionsDialogOpen, setSuggestionsDialogOpen] = useState(false);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [proofreadDialogOpen, setProofreadDialogOpen] = useState(false);

  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [isProofreading, setIsProofreading] = useState(false);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AiDeepAnalysisOutput | null>(null);
  const [proofreadSuggestions, setProofreadSuggestions] = useState<ProofreadSuggestion[]>([]);

  const { toast } = useToast();
  const { lines, setLines: setScriptLines } = useScript();
  const scriptContent = lines.map(l => l.text).join('\n');
  
  const [proofreadStatus, setProofreadStatus] = useState(PROOFREAD_STATUS_MESSAGES[0]);

  useEffect(() => {
    let statusInterval: NodeJS.Timeout;
    if (isProofreading) {
      let i = 0;
      statusInterval = setInterval(() => {
        i = (i + 1) % PROOFREAD_STATUS_MESSAGES.length;
        setProofreadStatus(PROOFREAD_STATUS_MESSAGES[i]);
      }, 2000);
    }
    return () => clearInterval(statusInterval);
  }, [isProofreading]);


  const handleGetSuggestions = async () => {
    setIsSuggestionsLoading(true);
    setSuggestions([]);
    setSuggestionsDialogOpen(true);
    setPopoverOpen(false);
    const result = await getAiSuggestions({ screenplay: scriptContent });
    setIsSuggestionsLoading(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
      setSuggestionsDialogOpen(false);
    } else if (result.data) {
      setSuggestions(result.data.suggestions);
    }
  };

  const handleGetAnalysis = async () => {
    setIsAnalysisLoading(true);
    setAnalysis(null);
    setAnalysisDialogOpen(true);
    setPopoverOpen(false);
    const result = await getAiDeepAnalysis({ screenplay: scriptContent });
    setIsAnalysisLoading(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
      setAnalysisDialogOpen(false);
    } else if (result.data) {
      setAnalysis(result.data);
    }
  };

  const openProofreadDialogWithSuggestions = (suggestions: ProofreadSuggestion[]) => {
      setProofreadSuggestions(suggestions);
      setProofreadDialogOpen(true);
      setChatDialogOpen(false); // Close chat dialog if it's open
  }

  const handleGetProofread = async () => {
    setIsProofreading(true);
    setProofreadStatus(PROOFREAD_STATUS_MESSAGES[0]);
    setProofreadSuggestions([]);
    setProofreadDialogOpen(true);
    setPopoverOpen(false);
    const result = await getAiProofreadSuggestions({ script: scriptContent });
    setIsProofreading(false);

    if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
        setProofreadDialogOpen(false);
    } else if (result.data) {
        setProofreadSuggestions(result.data.suggestions);
         if (result.data.suggestions.length === 0) {
            // No need to toast here, the dialog will show the "no errors" message
        }
    }
  }

  const handleOpenChat = () => {
    setChatDialogOpen(true);
    setPopoverOpen(false);
  };
  
  const applySuggestion = (suggestion: ProofreadSuggestion) => {
    const newContent = scriptContent.replace(suggestion.originalText, suggestion.correctedText);
    setScriptLines(newContent);
    toast({
        title: 'Suggestion Applied',
        description: 'The script has been updated with the correction.',
    });
    setProofreadSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const dismissSuggestion = (suggestion: ProofreadSuggestion) => {
    setProofreadSuggestions(proofreadSuggestions.filter(s => s !== suggestion));
  };

  const actionComponents = {
    suggestImprovements: (
        <Button
            key="suggest"
            variant="ghost"
            className="justify-start"
            onClick={handleGetSuggestions}
            disabled={isSuggestionsLoading}
        >
            {isSuggestionsLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
            <Lightbulb className="mr-2 h-4 w-4" />
            )}
            <span>Suggest Improvements</span>
        </Button>
    ),
    deepAnalysis: (
         <Button
            key="analyze"
            variant="ghost"
            className="justify-start"
            onClick={handleGetAnalysis}
            disabled={isAnalysisLoading}
        >
            {isAnalysisLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
            <Wand2 className="mr-2 h-4 w-4" />
            )}
            <span>Deep Analysis</span>
        </Button>
    ),
    proofread: (
        <Button
            key="proofread"
            variant="ghost"
            className="justify-start"
            onClick={handleGetProofread}
            disabled={isProofreading}
        >
            {isProofreading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
            <SearchCheck className="mr-2 h-4 w-4" />
            )}
            <span>Proofread Script</span>
        </Button>
    ),
    openChat: (
        <Button
            key="chat"
            variant="ghost"
            className="justify-start"
            onClick={handleOpenChat}
            >
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Open AI Chat</span>
        </Button>
    )
  }


  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className="rounded-full w-14 h-14 shadow-lg fixed bottom-8 right-8 z-50"
          >
            <Sparkles className="w-6 h-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2 mb-2" side="top" align="end">
          <div className="grid gap-2">
            {actions.map(action => actionComponents[action as keyof typeof actionComponents])}
            {customActions.map((action, index) => (
                 <Button
                    key={`custom-${index}`}
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                        action.onClick();
                        setPopoverOpen(false);
                    }}
                    disabled={action.isLoading}
                >
                    {action.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : action.icon}
                    <span>{action.label}</span>
                </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Suggestions Dialog */}
      <Dialog open={suggestionsDialogOpen} onOpenChange={setSuggestionsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" /> AI Suggestions
            </DialogTitle>
            <DialogDescription>
              Here are some quick suggestions to improve your script.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] -mx-6 px-6">
             <div className="space-y-4 py-4">
                {isSuggestionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                ) : suggestions.length > 0 ? (
                <ul className="space-y-3">
                {suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm flex gap-3 p-3 bg-muted/50 rounded-md">
                    <Lightbulb className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>{suggestion}</span>
                    </li>
                ))}
                </ul>
                ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                    The AI didn't have any suggestions at this time.
                </div>
                )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Analysis Dialog */}
      <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" /> Deep Analysis Results
            </DialogTitle>
             <DialogDescription>
              Structured feedback on plot, characters, and dialogue.
            </DialogDescription>
          </DialogHeader>
           <ScrollArea className="max-h-[60vh] -mx-6 px-6">
                {isAnalysisLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : analysis ? (
                    <Accordion type="multiple" defaultValue={['Plot', 'Characters', 'Dialogue']} className="w-full py-4">
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
                ) : (
                    <div className="text-center text-sm text-muted-foreground py-8 px-4">
                        The AI couldn't generate an analysis. Please try again.
                    </div>
                )}
            </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Proofread Dialog */}
      <Dialog open={proofreadDialogOpen} onOpenChange={setProofreadDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2"><Sparkles className='w-5 h-5 text-primary' /> AI Proofreader</DialogTitle>
            <DialogDescription>
              Review the suggestions below. You can apply or dismiss each correction.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] -mx-6 px-6">
            <div className="space-y-4 py-4">
                {isProofreading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
                        <h3 className="mt-4 text-lg font-medium">Proofreading...</h3>
                        <p>{proofreadStatus}</p>
                    </div>
                ) : proofreadSuggestions.length > 0 ? (
                    proofreadSuggestions.map((suggestion, index) => (
                        <Card key={index} className="overflow-hidden">
                        <CardHeader className="bg-muted/50 p-4">
                            <CardTitle className="text-sm font-semibold">{suggestion.explanation}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 text-sm">
                            <p className="text-red-500 line-through mb-2">"{suggestion.originalText}"</p>
                            <p className="text-green-600">"{suggestion.correctedText}"</p>
                        </CardContent>
                        <CardFooter className="bg-muted/50 p-2 flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => dismissSuggestion(suggestion)}>
                            <X className="w-4 h-4 mr-2" />
                            Dismiss
                            </Button>
                            <Button size="sm" onClick={() => applySuggestion(suggestion)}>
                            <Check className="w-4 h-4 mr-2" />
                            Apply
                            </Button>
                        </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <Check className="w-12 h-12 mx-auto text-green-500" />
                        <h3 className="mt-4 text-lg font-medium">No errors found!</h3>
                        <p>The proofreader didn't find any suggestions to make.</p>
                    </div>
                )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
        <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Assistant Chat
            </DialogTitle>
             <DialogDescription>
              Chat with the AI to edit your script, add characters, and more.
            </DialogDescription>
          </DialogHeader>
          <div className='flex-1 min-h-0'>
            <AiAssistant openProofreadDialog={openProofreadDialogWithSuggestions} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
