'use client';
import 'regenerator-runtime/runtime';
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PlayCircle, Wifi, Users, Copy, Check } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { cn } from '@/lib/utils';
import CollabHub from './collab-hub';
import { generateRoomId } from '@/services/collab/utils';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

function CollabSessionStarter({ onStartSession }: { onStartSession: (sessionType: 'persistent' | 'live', roomId: string) => void }) {
  const [sessionType, setSessionType] = useState<'persistent' | 'live'>('persistent');
  const [roomId, setRoomId] = useState(generateRoomId());
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    toast({
      title: 'Room ID Copied',
      description: 'Share this ID with collaborators to join the session.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <h3 className="text-lg font-semibold font-headline mb-4">Start a Collaboration Session</h3>
      
      <RadioGroup
        defaultValue="persistent"
        className="grid grid-cols-2 gap-4 mb-6"
        onValueChange={(value: 'persistent' | 'live') => setSessionType(value)}
      >
        <Label htmlFor="persistent-session" className="cursor-pointer">
          <Card className={cn(
            "p-4 border-2 transition-colors",
            sessionType === 'persistent' ? 'border-primary' : 'border-border'
          )}>
            <CardContent className="p-0 flex flex-col items-center gap-2">
              <Users className="w-8 h-8 text-primary" />
              <p className="font-semibold">Persistent</p>
              <p className="text-xs text-muted-foreground">
                Collaborators can join and edit anytime.
              </p>
            </CardContent>
          </Card>
          <RadioGroupItem value="persistent" id="persistent-session" className="sr-only" />
        </Label>

        <Label htmlFor="live-session" className="cursor-pointer">
          <Card className={cn(
            "p-4 border-2 transition-colors",
            sessionType === 'live' ? 'border-primary' : 'border-border'
          )}>
            <CardContent className="p-0 flex flex-col items-center gap-2">
              <Wifi className="w-8 h-8 text-accent" />
              <p className="font-semibold">Live</p>
              <p className="text-xs text-muted-foreground">
                For active, real-time sessions you control.
              </p>
            </CardContent>
          </Card>
          <RadioGroupItem value="live" id="live-session" className="sr-only" />
        </Label>
      </RadioGroup>

      <div className="w-full mb-6 space-y-2">
        <Label htmlFor="room-id" className="text-sm font-medium">
          Room ID (share with collaborators)
        </Label>
        <div className="flex gap-2">
          <Input
            id="room-id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter or generate room ID"
            className="font-mono text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyRoomId}
            title="Copy room ID"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Share this Room ID with team members to collaborate in real-time
        </p>
      </div>

      <Button size="lg" className="w-full" onClick={() => onStartSession(sessionType, roomId)}>
        <PlayCircle className="mr-2 h-5 w-5" />
        Start Session
      </Button>
    </div>
  );
}


export default function CollabAssistant() {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionType, setSessionType] = useState<'persistent' | 'live'>('persistent');
  const [roomId, setRoomId] = useState('');

  const handleStartSession = (type: 'persistent' | 'live', room: string) => {
    setSessionType(type);
    setRoomId(room);
    setSessionActive(true);
  };

  if (!sessionActive) {
    return <CollabSessionStarter onStartSession={handleStartSession} />;
  }

  return <CollabHub sessionType={sessionType} roomId={roomId} />;
}
