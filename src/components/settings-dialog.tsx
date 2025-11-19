'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useSettings } from '@/context/settings-context';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useCurrentScript } from '@/context/current-script-context';
import { useScript } from '@/context/script-context';
import { runAiDiagnoseAppHealth } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, isSettingsLoading, setProjectLinkingMode } = useSettings();
  const [isExporting, setIsExporting] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const { toast } = useToast();

  const { user } = useUser();
  const firestore = useFirestore();
  const currentScriptState = useCurrentScript();
  const scriptState = useScript();

  const handleExportDebugLog = async () => {
    setIsExporting(true);
    toast({
        title: 'Generating Debug Log...',
        description: 'Gathering application state and running AI diagnosis.',
    });

    const debugState = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        userContext: {
            isUserLoading: user?.isUserLoading,
            user: user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null,
            userError: user?.userError?.message,
        },
        currentScriptContext: {
            isCurrentScriptLoading: currentScriptState.isCurrentScriptLoading,
            currentScriptId: currentScriptState.currentScriptId,
        },
        scriptContext: {
            isScriptLoading: scriptState.isScriptLoading,
            saveStatus: scriptState.saveStatus,
            script: scriptState.script ? { id: scriptState.script.id, title: scriptState.script.title, logline: scriptState.script.logline, contentLenth: scriptState.script.content.length } : null,
            document: scriptState.document ? { blockCount: scriptState.document.blocks.length } : null,
            characters: scriptState.characters?.map(c => c.id),
            scenes: scriptState.scenes?.map(s => s.id),
            notes: scriptState.notes?.map(n => n.id),
            comments: scriptState.comments?.map(c => c.id),
        }
    };
    
    const diagnosisResult = await runAiDiagnoseAppHealth({ appState: JSON.stringify(debugState, null, 2) });
    
    let logContent = `============ The Scribbler Debug Log ============\n`;
    logContent += `Generated at: ${debugState.timestamp}\n\n`;
    
    logContent += `============ AI Health Diagnosis ============\n`;
    if (diagnosisResult.error) {
        logContent += `Error during diagnosis: ${diagnosisResult.error}\n`;
    } else {
        logContent += `${diagnosisResult.data?.diagnosis || 'No diagnosis returned.'}\n`;
    }
    logContent += `\n`;

    logContent += `============ Raw Application State ============\n`;
    logContent += JSON.stringify(debugState, null, 2);

    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scriptscribbler_debug_${new Date().toISOString()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setIsExporting(false);
     toast({
        title: 'Debug Log Exported',
        description: 'The log file has been downloaded.',
    });
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) {
        toast({ variant: 'destructive', title: 'Feedback cannot be empty.' });
        return;
    }
    if (!firestore || !user) {
        toast({ variant: 'destructive', title: 'You must be logged in to submit feedback.' });
        return;
    }

    setIsSubmittingFeedback(true);
    try {
        const feedbackCollectionRef = collection(firestore, 'feedback');
        const feedbackData = {
            userId: user.uid,
            feedback: feedbackText,
            submittedAt: serverTimestamp(),
            url: window.location.href,
        };
        await addDoc(feedbackCollectionRef, feedbackData).catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: feedbackCollectionRef.path,
                operation: 'create',
                requestResourceData: feedbackData
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });

        toast({
            title: 'Feedback Submitted',
            description: 'Thank you for helping us improve The Scribbler!',
        });
        setFeedbackText('');
        onOpenChange(false);
    } catch (error) {
        if (!(error instanceof FirestorePermissionError)) {
             toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: 'Could not submit your feedback. Please try again.',
            });
        }
    } finally {
        setIsSubmittingFeedback(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">Settings</DialogTitle>
          <DialogDescription>
            Customize your experience with The Scribbler.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="py-4 space-y-6">
            <div className="space-y-3">
              <Label>Project Linking Mode</Label>
              <p className="text-sm text-muted-foreground">
                Choose whether to work on the same project in both ScriptScribbler and StoryScribbler, or maintain separate projects for each.
              </p>
              <RadioGroup 
                value={settings.projectLinkingMode || 'shared'} 
                onValueChange={(value) => setProjectLinkingMode(value as 'shared' | 'separate')}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="shared" id="shared-mode" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="shared-mode" className="font-medium cursor-pointer">
                      Single Shared Project
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Work on the same project across both ScriptScribbler and StoryScribbler. When you switch tools, you'll continue working on the same script/story.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="separate" id="separate-mode" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="separate-mode" className="font-medium cursor-pointer">
                      Separate Projects
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Maintain different projects for ScriptScribbler and StoryScribbler. Each tool will remember its own active project independently.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>AI Model</Label>
              <div className='p-3 border rounded-md bg-muted/50 text-sm text-muted-foreground'>
                  The application is configured to use the <strong>gemini-2.5-flash</strong> model for all AI operations.
              </div>
            </div>

            <Separator />
              
            <div className="space-y-2">
              <Label htmlFor="feedback-textarea">Provide Feedback</Label>
              <p className='text-sm text-muted-foreground'>
                  What do you think of the editor? Would you prefer a single-document feel or a block-based experience? Let us know!
              </p>
              <Textarea 
                  id="feedback-textarea"
                  placeholder="I think the editor should..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
              />
              <div className='flex justify-end'>
                  <Button onClick={handleFeedbackSubmit} disabled={isSubmittingFeedback} variant="secondary">
                      {isSubmittingFeedback && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Feedback
                  </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Debugging</Label>
              <div className='flex items-center justify-between p-3 border rounded-md bg-muted/50'>
                  <p className="text-sm text-muted-foreground">
                      Export a debug log with current app state and an AI health check.
                  </p>
                  <Button variant="secondary" onClick={handleExportDebugLog} disabled={isExporting}>
                      {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Export
                  </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
