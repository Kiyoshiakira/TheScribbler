'use client';
import 'regenerator-runtime/runtime'; // Direct import to fix speech recognition error
import { useState, useEffect, useRef } from 'react';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';
import { runAiAgent } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Mic, Send, Square, AlertTriangle } from 'lucide-react';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { cn } from '@/lib/utils';
import { useScript } from '@/context/script-context';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useCurrentScript } from '@/context/current-script-context';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';


interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

// This type is defined in ai-fab but we need it here as well.
// In a larger app, this would be in a shared types file.
interface ProofreadSuggestion {
    originalText: string;
    correctedText: string;
    explanation: string;
}

interface AiAssistantProps {
    openProofreadDialog: (suggestions: ProofreadSuggestion[]) => void;
}

const isAiEnabled = process.env.NEXT_PUBLIC_AI_ENABLED === 'true';


export default function AiAssistant({ openProofreadDialog }: AiAssistantProps) {
  const { document, setBlocks } = useScript();
  const scriptContent = document?.blocks.map(b => b.text).join('\n\n') || '';
  const { toast } = useToast();

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { user } = useUser();
  const firestore = useFirestore();
  const { currentScriptId } = useCurrentScript();

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
  }, [chatHistory, isChatLoading]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = { sender: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsChatLoading(true);

    const result = await runAiAgent({
      request: currentInput,
      script: scriptContent,
    });

    setIsChatLoading(false);

    if (result.error) {
      const aiMessage: ChatMessage = { sender: 'ai', text: result.error };
      setChatHistory(prev => [...prev, aiMessage]);
    } else if (result.data) {
      const aiMessage: ChatMessage = {
        sender: 'ai',
        text: result.data.response,
      };
      setChatHistory(prev => [...prev, aiMessage]);

      if (result.data.modifiedScript) {
        // This is a significant change. We need to re-parse the script.
        // In a real app, we'd use the structured output from the parser.
        // For now, we'll just split by lines.
        const newBlocks = result.data.modifiedScript.split('\n\n').map((line, index) => ({ id: `block-${index}-${Date.now()}`, text: line, type: 'action' as const }));
        setBlocks(newBlocks);

        toast({
          title: 'Script Updated',
          description: 'The AI has updated the script content.',
        });
      }

      if (result.data.toolResult?.type === 'character' && user && currentScriptId && firestore) {
        const charData = result.data.toolResult.data;
        const characterToSave = {
          name: charData.name,
          profile: charData.profile,
          description: charData.profile.split('\n')[0],
          scenes: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const charactersCollectionRef = collection(firestore, `users/${user.uid}/scripts/${currentScriptId}/characters`);
        
        addDoc(charactersCollectionRef, characterToSave)
          .then(() => {
             toast({
              title: 'Character Created',
              description: `${charData.name} has been added to your characters list.`,
            });
          })
          .catch(serverError => {
            const permissionError = new FirestorePermissionError({
              path: charactersCollectionRef.path,
              operation: 'create',
              requestResourceData: characterToSave,
            });
            errorEmitter.emit('permission-error', permissionError);
          });
      }
      
      if (result.data.toolResult?.type === 'proofread') {
          const suggestions = result.data.toolResult.data.suggestions;
          if (suggestions && suggestions.length > 0) {
            openProofreadDialog(suggestions);
          }
      }
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

  if (!isAiEnabled) {
    return (
        <div className="h-full flex flex-col min-h-0 items-center justify-center text-center text-muted-foreground p-4">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">AI Features Disabled</h3>
            <p className="text-sm">
                To enable the AI assistant, please set the GEMINI_API_KEY in your project's environment variables.
            </p>
        </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
        <ScrollArea className="flex-1 rounded-md border p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3',
                  msg.sender === 'user' ? 'justify-end' : ''
                )}
              >
                {msg.sender === 'ai' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      <Sparkles className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'p-3 rounded-lg max-w-sm',
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
                {msg.sender === 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isChatLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    <Sparkles className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-lg bg-muted">
                  <Skeleton className="h-4 w-24" />
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
        <div className="mt-4 flex items-center gap-2">
          <Input
            placeholder={listening ? 'Listening...' : 'Ask the AI...'}
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendChat()}
            disabled={isChatLoading}
          />
          {browserSupportsSpeechRecognition && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleVoiceToggle}
              disabled={isChatLoading}
            >
              {listening ? (
                <Square className="w-4 h-4 text-red-500 fill-red-500" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          )}
          <Button
            onClick={handleSendChat}
            disabled={isChatLoading || !chatInput.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
    </div>
  );
}
