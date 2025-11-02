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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettings, type AiModel } from '@/context/settings-context';
import { Skeleton } from './ui/skeleton';
import { Separator } from './ui/separator';
import { useUser } from '@/firebase';
import { useCurrentScript } from '@/context/current-script-context';
import { useScript } from '@/context/script-context';
import { runAiDiagnoseAppHealth } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVAILABLE_MODELS: { value: AiModel; label: string; description: string }[] = [
  {
    value: 'gemini-1.5-pro-latest',
    label: 'Gemini 1.5 Pro',
    description: 'Highest-quality model for complex reasoning.',
  },
  {
    value: 'gemini-1.5-flash-latest',
    label: 'Gemini 1.5 Flash',
    description: 'Fast and cost-effective for most tasks.',
  },
];

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, setAiModel, isSettingsLoading } = useSettings();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Hooks to gather context data for debugging
  const userState = useUser();
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
        settings: settings,
        userContext: {
            isUserLoading: userState.isUserLoading,
            user: userState.user ? { uid: userState.user.uid, email: userState.user.email, displayName: userState.user.displayName } : null,
            userError: userState.userError?.message,
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
    
    const diagnosisResult = await runAiDiagnoseAppHealth({ appState: JSON.stringify(debugState, null, 2), model: settings.aiModel });
    
    let logContent = `============ ScriptScribbler Debug Log ============\n`;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Settings</DialogTitle>
          <DialogDescription>
            Customize your ScriptScribbler experience.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="ai-model-select">AI Model</Label>
            {isSettingsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={settings.aiModel}
                onValueChange={(value: AiModel) => setAiModel(value)}
              >
                <SelectTrigger id="ai-model-select">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map(model => (
                    <SelectItem key={model.value} value={model.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{model.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {model.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              The AI model used for generation, analysis, and other AI features.
            </p>
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
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
