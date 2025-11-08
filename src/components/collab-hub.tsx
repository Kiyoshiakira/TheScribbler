'use client';
import 'regenerator-runtime/runtime';
import { useState, useRef, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Mic, Square, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface ChatMessage {
  sender: 'me' | 'other';
  name: string;
  avatar: string;
  text: string;
}

const placeholderMessages: ChatMessage[] = [
    { sender: 'other', name: 'Leo', avatar: PlaceHolderImages.find(i => i.id === 'user1')?.imageUrl || '', text: "Hey, did you see the change I made to Scene 5? I think it flows better now." },
    { sender: 'me', name: 'Jane', avatar: PlaceHolderImages.find(i => i.id === 'user2')?.imageUrl || '', text: "Just saw it! Looks great. Good call on cutting that line of dialogue." },
    { sender: 'other', name: 'Leo', avatar: PlaceHolderImages.find(i => i.id === 'user1')?.imageUrl || '', text: "Thanks! I'm thinking about the ending. What if we add a twist?" },
];

const placeholderNotifications = [
    { user: { name: 'Leo', avatar: PlaceHolderImages.find(i => i.id === 'user1')?.imageUrl || '' }, action: 'edited Scene 5', time: '5m ago' },
    { user: { name: 'Alex', avatar: PlaceHolderImages.find(i => i.id === 'user3')?.imageUrl || '' }, action: 'added a new character: "DR. ARIS"', time: '2h ago' },
    { user: { name: 'Leo', avatar: PlaceHolderImages.find(i => i.id === 'user1')?.imageUrl || '' }, action: 'resolved a comment in Scene 2', time: '1d ago' },
    { user: { name: 'Jane', avatar: PlaceHolderImages.find(i => i.id === 'user2')?.imageUrl || '' }, action: 'updated the script logline', time: '1d ago' },
];


export default function CollabHub() {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(placeholderMessages);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isManuallyTyping, setIsManuallyTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    // Only update input from transcript when actively listening, transcript has content,
    // and user is not manually typing
    if (listening && transcript && !isManuallyTyping) {
      setChatInput(transcript);
    }
  }, [transcript, listening, isManuallyTyping]);

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

    const userMessage: ChatMessage = { sender: 'me', text: chatInput, name: 'Jane', avatar: PlaceHolderImages.find(i => i.id === 'user2')?.imageUrl || '' };
    setChatHistory(prev => [...prev, userMessage]);
    setChatInput('');
  };

  const handleVoiceToggle = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      setIsManuallyTyping(false);
    } else {
      resetTranscript();
      setIsManuallyTyping(false);
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  const handleVoiceConnectToggle = () => {
    setIsVoiceConnected(prev => !prev);
  };

  const ChatView = () => (
    <div className="h-full flex flex-col min-h-0">
      <ScrollArea className="flex-1 rounded-md border p-2" ref={scrollAreaRef}>
        <div className="space-y-2">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={cn(
                'flex items-start gap-2',
                msg.sender === 'me' ? 'justify-end' : ''
              )}
            >
              {msg.sender === 'other' && (
                <Avatar className="w-7 h-7">
                  <AvatarImage src={msg.avatar} alt={msg.name} />
                  <AvatarFallback>{msg.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'p-2 rounded-lg max-w-[220px]',
                  msg.sender === 'me'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                 {msg.sender === 'other' && <p className="text-xs font-bold mb-0.5">{msg.name}</p>}
                <p className="text-xs whitespace-pre-wrap">{msg.text}</p>
              </div>
              {msg.sender === 'me' && (
                 <Avatar className="w-7 h-7">
                  <AvatarImage src={msg.avatar} alt={msg.name} />
                  <AvatarFallback>{msg.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="mt-2 flex items-center gap-2">
        <Input
          ref={inputRef}
          placeholder={listening ? 'Listening...' : 'Send a message...'}
          value={chatInput}
          onChange={e => {
            setChatInput(e.target.value);
            setIsManuallyTyping(true);
          }}
          onKeyDown={e => e.key === 'Enter' && handleSendChat()}
          onBlur={() => setIsManuallyTyping(false)}
          disabled={isChatLoading}
          className="text-sm h-8"
        />
        {browserSupportsSpeechRecognition && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleVoiceToggle}
            disabled={isChatLoading}
            className="h-8 w-8"
          >
            {listening ? (
              <Square className="w-3 h-3 text-red-500 fill-red-500" />
            ) : (
              <Mic className="w-3 h-3" />
            )}
          </Button>
        )}
        <Button
          onClick={handleSendChat}
          disabled={isChatLoading || !chatInput.trim()}
          size="sm"
          className="h-8"
        >
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );

  const NotificationsView = () => (
    <ScrollArea className="h-full rounded-md border p-1.5">
        <div className="space-y-2">
            {placeholderNotifications.map((note, index) => (
                <div key={index} className="flex items-start gap-2 p-1.5 hover:bg-muted/50 rounded-md">
                     <Avatar className="w-7 h-7">
                        <AvatarImage src={note.user.avatar} alt={note.user.name} />
                        <AvatarFallback>{note.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="text-xs">
                            <span className="font-semibold">{note.user.name}</span> {note.action}
                        </p>
                        <p className="text-xs text-muted-foreground">{note.time}</p>
                    </div>
                </div>
            ))}
        </div>
    </ScrollArea>
  );

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
        <div className='flex items-center justify-between pr-1.5 gap-2'>
            <TabsList className="h-8">
            <TabsTrigger value="chat" className="text-xs px-3">Chat</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs px-3">Activity</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-1.5">
                <Button variant={isVoiceConnected ? "destructive" : "outline"} size="sm" onClick={handleVoiceConnectToggle} className="h-7 text-xs px-2">
                    <Phone className="mr-1.5 h-3 w-3" />
                    {isVoiceConnected ? 'Disconnect' : 'Voice'}
                </Button>
            </div>
        </div>
        <TabsContent value="chat" className="flex-1 mt-2 min-h-0">
          <ChatView />
        </TabsContent>
        <TabsContent value="notifications" className="flex-1 mt-2 min-h-0">
          <NotificationsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
