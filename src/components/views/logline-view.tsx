'use client';

import { useState, useEffect } from "react";
import { useScript } from "@/context/script-context";
import { runAiGenerateLogline } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, NotebookPen } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function LoglineView() {
    const { script, setScriptLogline, isScriptLoading } = useScript();
    const [logline, setLogline] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (script?.logline) {
            setLogline(script.logline);
        } else {
            setLogline('');
        }
    }, [script?.logline]);

    const handleGenerate = async () => {
        if (!script?.content) {
            toast({
                variant: "destructive",
                title: "Script is empty",
                description: "Cannot generate a logline from an empty script.",
            });
            return;
        }
        setIsGenerating(true);
        const result = await runAiGenerateLogline({ screenplay: script.content });
        setIsGenerating(false);

        if (result.error || !result.data) {
            toast({
                variant: "destructive",
                title: "Failed to generate logline",
                description: result.error || "An unknown error occurred.",
            });
        } else {
            setLogline(result.data.logline);
            toast({
                title: "Logline Generated",
                description: "The AI has created a new logline suggestion.",
            });
        }
    }

    const handleSave = () => {
        setScriptLogline(logline);
        toast({
            title: "Logline Saved",
            description: "Your script's logline has been updated.",
        });
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold font-headline">Logline</h1>
                <p className="text-muted-foreground">
                    A logline is a one-sentence summary of your story. Use the AI to generate one based on your script, or write your own.
                </p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <NotebookPen className="w-5 h-5 text-primary" />
                        Script Logline
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isScriptLoading ? (
                        <div className="space-y-2">
                           <Skeleton className="h-24 w-full" />
                        </div>
                     ) : (
                        <Textarea 
                            placeholder="A protagonist wants a goal, but faces an obstacle."
                            className="min-h-[120px] text-base"
                            value={logline}
                            onChange={(e) => setLogline(e.target.value)}
                        />
                     )}
                     <div className="flex justify-end gap-2">
                         <Button variant="outline" onClick={handleGenerate} disabled={isGenerating || isScriptLoading}>
                            {isGenerating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Generate with AI
                        </Button>
                        <Button onClick={handleSave} disabled={isScriptLoading}>Save Logline</Button>
                     </div>
                </CardContent>
            </Card>
        </div>
    )
}
