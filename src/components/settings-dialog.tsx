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
import type { ThemeMode, FontSize, LineHeight } from '@/context/settings-context';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useCurrentScript } from '@/context/current-script-context';
import { useScript } from '@/context/script-context';
import { runAiDiagnoseAppHealth } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Moon, Sun, Monitor, Eye } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { sanitizeFirestorePayload } from '@/lib/firestore-utils';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { 
    settings, 
    setProjectLinkingMode,
    setTheme,
    setExportFormat,
    setEditorFontSize,
    setFontSize,
    setLineHeight,
    setAiFeatureEnabled,
    setProfilePublic,
    setScriptSharingDefault,
    setLanguage,
    setAiProvider,
    setAiUsageLimit,
  } = useSettings();
  const [isExporting, setIsExporting] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const { toast } = useToast();

  const { user, isUserLoading, userError } = useUser();
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
            isUserLoading,
            user: user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null,
            userError: userError?.message,
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
        const feedbackData = sanitizeFirestorePayload({
            userId: user.uid,
            feedback: feedbackText,
            submittedAt: serverTimestamp(),
            url: window.location.href,
        });
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">Settings</DialogTitle>
          <DialogDescription>
            Customize your experience with The Scribbler.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1 -mx-6 px-6 mt-4">
            {/* General Settings Tab */}
            <TabsContent value="general" className="space-y-6 mt-0">
              {/* Export Format Selection */}
              <div className="space-y-3">
                <Label htmlFor="export-format" className="text-base font-semibold">Default Export Format</Label>
                <p className="text-sm text-muted-foreground">
                  Choose the default format when exporting your scripts.
                </p>
                <Select 
                  value={settings.exportFormat || 'pdf'} 
                  onValueChange={(value) => setExportFormat(value as any)}
                >
                  <SelectTrigger id="export-format">
                    <SelectValue placeholder="Select default export format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="fountain">Fountain</SelectItem>
                    <SelectItem value="finalDraft">Final Draft (.fdx)</SelectItem>
                    <SelectItem value="plainText">Plain Text (.txt)</SelectItem>
                    <SelectItem value="scribbler">Scribbler (.scribbler)</SelectItem>
                    <SelectItem value="googleDocs">Google Docs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Language Selection */}
              <div className="space-y-3">
                <Label htmlFor="language" className="text-base font-semibold">Language</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred language for the interface (feature coming soon).
                </p>
                <Select 
                  value={settings.language || 'en'} 
                  onValueChange={(value) => setLanguage(value as any)}
                  disabled
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Appearance Settings Tab */}
            <TabsContent value="appearance" className="space-y-6 mt-0">
              {/* Theme Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred color theme for the application.
                </p>
                <RadioGroup 
                  value={settings.theme || 'system'} 
                  onValueChange={(value) => setTheme(value as ThemeMode)}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="light" id="theme-light" />
                    <Sun className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="theme-light" className="flex-1 cursor-pointer font-normal">
                      Light
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="dark" id="theme-dark" />
                    <Moon className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="theme-dark" className="flex-1 cursor-pointer font-normal">
                      Dark
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="high-contrast" id="theme-high-contrast" />
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="theme-high-contrast" className="flex-1 cursor-pointer font-normal">
                      High Contrast
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="system" id="theme-system" />
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="theme-system" className="flex-1 cursor-pointer font-normal">
                      System/Auto
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Font Size Selection */}
              <div className="space-y-3">
                <Label htmlFor="font-size" className="text-base font-semibold">UI Font Size</Label>
                <p className="text-sm text-muted-foreground">
                  Adjust the text size across the application interface.
                </p>
                <Select 
                  value={settings.fontSize || 'base'} 
                  onValueChange={(value) => setFontSize(value as FontSize)}
                >
                  <SelectTrigger id="font-size">
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Small (14px)</SelectItem>
                    <SelectItem value="base">Medium (16px)</SelectItem>
                    <SelectItem value="lg">Large (18px)</SelectItem>
                    <SelectItem value="xl">Extra Large (20px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Line Height Selection */}
              <div className="space-y-3">
                <Label htmlFor="line-height" className="text-base font-semibold">Line Height</Label>
                <p className="text-sm text-muted-foreground">
                  Adjust the spacing between lines of text for better readability.
                </p>
                <Select 
                  value={settings.lineHeight || 'normal'} 
                  onValueChange={(value) => setLineHeight(value as LineHeight)}
                >
                  <SelectTrigger id="line-height">
                    <SelectValue placeholder="Select line height" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tight">Tight (1.4)</SelectItem>
                    <SelectItem value="normal">Normal (1.6)</SelectItem>
                    <SelectItem value="relaxed">Relaxed (1.8)</SelectItem>
                    <SelectItem value="loose">Loose (2.0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="p-3 border rounded-md bg-muted/50 space-y-2">
                <p className="text-sm font-semibold">Accessibility Features</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>High contrast mode for better visibility</li>
                  <li>Keyboard navigation support throughout the app</li>
                  <li>Focus indicators on all interactive elements</li>
                  <li>Screen reader compatible with ARIA labels</li>
                  <li>Responsive design for all devices</li>
                </ul>
              </div>
            </TabsContent>

            {/* Editor Settings Tab */}
            <TabsContent value="editor" className="space-y-6 mt-0">
              {/* Editor Font Size */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Editor Font Size</Label>
                <p className="text-sm text-muted-foreground">
                  Adjust the text size in the script editor ({settings.editorFontSize || 16}px).
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-12">12px</span>
                  <Slider
                    value={[settings.editorFontSize || 16]}
                    onValueChange={([value]) => setEditorFontSize(value)}
                    min={12}
                    max={24}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-12">24px</span>
                </div>
              </div>

              <Separator />

              {/* AI Features Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="ai-features" className="text-base font-semibold">AI Features</Label>
                    <p className="text-sm text-muted-foreground">
                      Show or hide AI-powered tools and suggestions in the editor.
                    </p>
                  </div>
                  <Switch
                    id="ai-features"
                    checked={settings.aiFeatureEnabled !== false}
                    onCheckedChange={setAiFeatureEnabled}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Privacy Settings Tab */}
            <TabsContent value="privacy" className="space-y-6 mt-0">
              {/* Profile Visibility */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="profile-public" className="text-base font-semibold">Public Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      Make your profile visible to other users.
                    </p>
                  </div>
                  <Switch
                    id="profile-public"
                    checked={settings.profilePublic !== false}
                    onCheckedChange={setProfilePublic}
                  />
                </div>
              </div>

              <Separator />

              {/* Script Sharing Default */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Default Script Sharing</Label>
                <p className="text-sm text-muted-foreground">
                  Choose the default visibility for new scripts you create.
                </p>
                <RadioGroup 
                  value={settings.scriptSharingDefault || 'private'} 
                  onValueChange={(value) => setScriptSharingDefault(value as 'public' | 'private')}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="private" id="sharing-private" />
                    <div className="flex-1">
                      <Label htmlFor="sharing-private" className="font-medium cursor-pointer">
                        Private
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        New scripts are only visible to you by default.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="public" id="sharing-public" />
                    <div className="flex-1">
                      <Label htmlFor="sharing-public" className="font-medium cursor-pointer">
                        Public
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        New scripts are visible to all users by default.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>

            {/* Advanced Settings Tab */}
            <TabsContent value="advanced" className="space-y-6 mt-0">
              {/* Project Linking Mode */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Project Linking Mode</Label>
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
                <Label>AI Provider</Label>
                <p className="text-sm text-muted-foreground">
                    Select which AI service to use for AI-assisted features.
                </p>
                <Select 
                  value={settings.aiProvider || 'google-ai'} 
                  onValueChange={(value) => setAiProvider(value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google-ai">Google AI (Gemini)</SelectItem>
                    <SelectItem value="openai" disabled>OpenAI (Coming Soon)</SelectItem>
                    <SelectItem value="local" disabled>Local Model (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>AI Usage Limit</Label>
                <p className="text-sm text-muted-foreground">
                    Maximum number of AI operations per session. Prevents excessive API usage. (Current: {settings.aiUsageLimit || 100})
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-12">10</span>
                  <Slider
                    value={[settings.aiUsageLimit || 100]}
                    onValueChange={([value]) => setAiUsageLimit(value)}
                    min={10}
                    max={500}
                    step={10}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-12">500</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>AI Model</Label>
                <div className='p-3 border rounded-md bg-muted/50 text-sm text-muted-foreground'>
                    The application is configured to use the <strong>gemini-2.0-flash-exp</strong> model for all AI operations.
                </div>
              </div>

              <Separator />
                
              <div className="space-y-2">
                <Label>API Key Configuration</Label>
                <div className='p-3 border rounded-md bg-muted/50 space-y-2'>
                    <p className="text-sm text-muted-foreground">
                        API keys are configured via environment variables for security.
                    </p>
                    <p className="text-sm">
                        <strong>Google AI:</strong> Set <code className="px-1 py-0.5 bg-background rounded">GEMINI_API_KEY</code> in your <code className="px-1 py-0.5 bg-background rounded">.env.local</code> file.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                        See <code>docs/AI_INTEGRATION.md</code> for detailed configuration instructions.
                    </p>
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
            </TabsContent>
          </ScrollArea>
        </Tabs>
        <DialogFooter className="mt-4">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
