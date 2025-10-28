'use client';
import { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { getAiSuggestions, getAiDeepAnalysis, runAiAgent } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, Sparkles, Wand2, Bot, Users, MessageSquare, Mic, Send, Square } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AiDeepAnalysisOutput } from '@/ai/flows/ai-deep-analysis';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';


interface AiAssistantProps {
  scriptContent: string;
}

interface AnalysisItem {
  point: string;
  suggestion: string;
}

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
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

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    setChatInput(transcript);
  }, [transcript]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [chatHistory]);

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
  
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = { sender: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    const result = await runAiAgent({
        request: chatInput,
        script: scriptContent
    });

    setIsChatLoading(false);
    
    if (result.error) {
        const aiMessage: ChatMessage = { sender: 'ai', text: result.error };
        setChatHistory(prev => [...prev, aiMessage]);
    } else if (result.data) {
        const aiMessage: ChatMessage = { sender: 'ai', text: result.data.response };
        setChatHistory(prev => [...prev, aiMessage]);
    }
  };
  
  const handleVoiceToggle = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
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
        <Tabs defaultValue="suggestions" className='flex-1 flex flex-col'>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="analysis">Deep Analysis</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
          <TabsContent value="suggestions" className="mt-4 flex-1">
            <div className="flex flex-col gap-4 h-full">
                <Button onClick={handleGetSuggestions} disabled={isSuggestionsLoading}>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    {isSuggestionsLoading ? 'Thinking...' : 'Suggest Improvements'}
                </Button>
                <div className="flex-1 flex flex-col">
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
          <TabsContent value="analysis" className="mt-4 flex-1">
            <div className="flex flex-col gap-4 h-full">
                <Button onClick={handleGetAnalysis} disabled={isAnalysisLoading}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {isAnalysisLoading ? 'Analyzing...' : 'Run Deep Analysis'}
                </Button>
                 <div className="flex-1 flex flex-col">
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
          <TabsContent value="chat" className="mt-4 flex-1 flex flex-col h-full">
            <ScrollArea className="flex-1 rounded-md border p-4" ref={scrollAreaRef}>
                <div className='space-y-4'>
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={cn('flex items-start gap-3', msg.sender === 'user' ? 'justify-end' : '')}>
                            {msg.sender === 'ai' && (
                                <Avatar className='w-8 h-8'>
                                    <AvatarFallback><Sparkles className='w-4 h-4'/></AvatarFallback>
                                </Avatar>
                            )}
                            <div className={cn(
                                'p-3 rounded-lg max-w-sm', 
                                msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}>
                                <p className='text-sm whitespace-pre-wrap'>{msg.text}</p>
                            </div>
                             {msg.sender === 'user' && (
                                <Avatar className='w-8 h-8'>
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                    {isChatLoading && (
                        <div className='flex items-start gap-3'>
                            <Avatar className='w-8 h-8'>
                                <AvatarFallback><Sparkles className='w-4 h-4'/></AvatarFallback>
                            </Avatar>
                            <div className='p-3 rounded-lg bg-muted'>
                                <Skeleton className='h-4 w-24' />
                            </div>
                        </div>
                    )}
                     {!isChatLoading && chatHistory.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-8 px-4">
                           Chat with the AI to edit your script, add characters, and more.
                        </div>
                    )}
                </div>
            </ScrollArea>
            <div className='mt-4 flex items-center gap-2'>
                <Input 
                    placeholder={listening ? 'Listening...' : 'Ask the AI to make a change...'}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                    disabled={isChatLoading}
                />
                {browserSupportsSpeechRecognition && (
                    <Button variant='outline' size='icon' onClick={handleVoiceToggle} disabled={isChatLoading}>
                        {listening ? <Square className='w-4 h-4 text-red-500 fill-red-500' /> : <Mic className='w-4 h-4'/>}
                    </Button>
                )}
                <Button onClick={handleSendChat} disabled={isChatLoading || !chatInput.trim()}>
                    <Send className='w-4 h-4' />
                </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
