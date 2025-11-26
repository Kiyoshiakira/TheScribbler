'use client';

/**
 * AI Helper Panel Component
 * 
 * Provides UI for AI-assisted features like:
 * - Rewrite suggestions
 * - Text continuation
 * - Summarization
 * - Text expansion
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, RefreshCw, ListPlus, FileText, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  runAiHelperRewrite,
  runAiHelperContinue,
  runAiHelperSummarize,
  runAiHelperExpand,
  getAiProviderStatus,
  type AiProviderStatus,
} from '@/app/ai-helper-actions';

export interface AIHelperProps {
  /** Selected text to operate on */
  selectedText?: string;
  /** Callback when AI generates new text */
  onTextGenerated?: (text: string, operation: string) => void;
  /** Callback when user accepts the generated text */
  onAccept?: (text: string) => void;
}

type OperationType = 'rewrite' | 'continue' | 'summarize' | 'expand';

export default function AIHelper({ selectedText, onTextGenerated, onAccept }: AIHelperProps) {
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [pendingOperation, setPendingOperation] = useState<OperationType | null>(null);
  const [providerStatus, setProviderStatus] = useState<AiProviderStatus | null>(null);

  // Rewrite options
  const [rewriteStyle, setRewriteStyle] = useState<string>('clear and engaging');

  // Continue options
  const [continueLength, setContinueLength] = useState<number>(200);

  // Summarize options
  const [summaryFormat, setSummaryFormat] = useState<'paragraph' | 'bullets' | 'brief'>('paragraph');

  // Expand options
  const [expansionFactor, setExpansionFactor] = useState<number>(2);

  useEffect(() => {
    // Load consent status from localStorage
    const consent = localStorage.getItem('ai-helper-consent');
    setHasConsented(consent === 'true');

    // Load provider status
    loadProviderStatus();
  }, []);

  useEffect(() => {
    // Update input when selected text changes
    if (selectedText) {
      setInput(selectedText);
    }
  }, [selectedText]);

  async function loadProviderStatus() {
    const status = await getAiProviderStatus();
    setProviderStatus(status);
  }

  function handleConsentAccept() {
    localStorage.setItem('ai-helper-consent', 'true');
    setHasConsented(true);
    setShowConsentDialog(false);

    // Execute pending operation
    if (pendingOperation) {
      executeOperation(pendingOperation);
      setPendingOperation(null);
    }
  }

  function handleConsentDecline() {
    setShowConsentDialog(false);
    setPendingOperation(null);
  }

  function requestOperation(operation: OperationType) {
    if (!hasConsented) {
      setPendingOperation(operation);
      setShowConsentDialog(true);
      return;
    }

    executeOperation(operation);
  }

  async function executeOperation(operation: OperationType) {
    if (!input.trim()) {
      toast({
        variant: 'destructive',
        title: 'No Text Provided',
        description: 'Please enter or select some text to process.',
      });
      return;
    }

    setIsLoading(true);
    setResult('');

    try {
      let response;

      switch (operation) {
        case 'rewrite':
          response = await runAiHelperRewrite({
            text: input,
            style: rewriteStyle,
            tone: 'appropriate',
          });
          break;
        case 'continue':
          response = await runAiHelperContinue({
            text: input,
            maxLength: continueLength,
          });
          break;
        case 'summarize':
          response = await runAiHelperSummarize({
            text: input,
            format: summaryFormat,
          });
          break;
        case 'expand':
          response = await runAiHelperExpand({
            text: input,
            expansionFactor,
          });
          break;
      }

      if (response.error) {
        toast({
          variant: 'destructive',
          title: 'AI Operation Failed',
          description: response.error,
        });
      } else if (response.data) {
        setResult(response.data.text);
        onTextGenerated?.(response.data.text, operation);

        toast({
          title: 'AI Suggestion Ready',
          description: `${operation.charAt(0).toUpperCase() + operation.slice(1)} completed successfully.`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Unexpected Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
      // Reload provider status to update usage
      loadProviderStatus();
    }
  }

  function handleAccept() {
    if (result) {
      onAccept?.(result);
      toast({
        title: 'Text Accepted',
        description: 'The AI-generated text has been applied.',
      });
      setResult('');
    }
  }

  if (!providerStatus?.isConfigured) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Assist
          </CardTitle>
          <CardDescription>AI features are not configured</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To use AI features, please configure your API key in the settings.
              Currently, only Google AI (Gemini) is supported.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Assist
          </CardTitle>
          <CardDescription>
            Use AI to rewrite, continue, summarize, or expand your text
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Usage Info */}
          {providerStatus && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Provider: {providerStatus.providerName} | Usage: {providerStatus.usageCount}/{providerStatus.usageLimit}
                {providerStatus.remainingUsage < 10 && (
                  <span className="text-yellow-600"> - Low remaining usage!</span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Input Textarea */}
          <div className="space-y-2">
            <Label htmlFor="ai-input">Text to Process</Label>
            <Textarea
              id="ai-input"
              placeholder="Enter or select text to process with AI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={6}
              disabled={isLoading}
            />
          </div>

          {/* Operation Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Select value={rewriteStyle} onValueChange={setRewriteStyle} disabled={isLoading}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clear and engaging">Clear & Engaging</SelectItem>
                    <SelectItem value="more concise">More Concise</SelectItem>
                    <SelectItem value="more descriptive">More Descriptive</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => requestOperation('rewrite')}
                disabled={isLoading || !input.trim()}
                className="w-full"
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Rewrite
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Select 
                  value={continueLength.toString()} 
                  onValueChange={(v) => setContinueLength(parseInt(v))} 
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">~100 words</SelectItem>
                    <SelectItem value="200">~200 words</SelectItem>
                    <SelectItem value="300">~300 words</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => requestOperation('continue')}
                disabled={isLoading || !input.trim()}
                className="w-full"
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ListPlus className="w-4 h-4 mr-2" />
                )}
                Continue
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Select value={summaryFormat} onValueChange={(v) => setSummaryFormat(v as 'paragraph' | 'bullets' | 'brief')} disabled={isLoading}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paragraph">Paragraph</SelectItem>
                    <SelectItem value="bullets">Bullets</SelectItem>
                    <SelectItem value="brief">Brief</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => requestOperation('summarize')}
                disabled={isLoading || !input.trim()}
                className="w-full"
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Summarize
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Select 
                  value={expansionFactor.toString()} 
                  onValueChange={(v) => setExpansionFactor(parseInt(v))} 
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2x Length</SelectItem>
                    <SelectItem value="3">3x Length</SelectItem>
                    <SelectItem value="4">4x Length</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => requestOperation('expand')}
                disabled={isLoading || !input.trim()}
                className="w-full"
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Expand
              </Button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-2 mt-4 p-4 bg-muted rounded-md">
              <div className="flex items-center justify-between">
                <Label>AI Suggestion</Label>
                <Button onClick={handleAccept} size="sm">
                  Accept
                </Button>
              </div>
              <div className="text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                {result}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consent Dialog */}
      <AlertDialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable AI Features?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                AI features will send your text to external AI services (currently Google AI) for processing.
              </p>
              <p className="font-semibold">Privacy Notice:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your text will be sent to the selected AI provider</li>
                <li>This is an opt-in feature you can disable anytime</li>
                <li>Usage is limited to prevent excessive API calls</li>
                <li>Your API key is stored locally in your browser</li>
              </ul>
              <p>
                Do you consent to using AI features?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleConsentDecline}>Decline</AlertDialogCancel>
            <AlertDialogAction onClick={handleConsentAccept}>Accept & Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
