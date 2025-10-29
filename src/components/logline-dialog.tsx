'use client';

import { useState, useEffect } from "react";
import { useScript } from "@/context/script-context";
import { aiGenerateLogline } from "@/app/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface LoglineDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LoglineDialog({ open, onOpenChange }: LoglineDialogProps) {
    const { script, setScriptLogline, lines } = useScript();
    const scriptContent = lines.map(l => l.text).join('\n');
    const [logline, setLogline] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if(open && script?.logline) {
            setLogline(script.logline);
        } else if (open && !script?.logline) {
            setLogline('');
        }
    }, [open, script?.logline])

    const handleGenerate = async () => {
        setIsGenerating(true);
        const result = await aiGenerateLogline({ screenplay: scriptContent });
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
        onOpenChange(false);
    }


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="font-headline">Edit Logline</DialogTitle>
                    <DialogDescription>
                        Generate a new logline with AI or edit the current one. This is a one-sentence summary of your story.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                     {isGenerating ? (
                        <div className="space-y-2">
                           <Skeleton className="h-6 w-1/3" />
                           <Skeleton className="h-20 w-full" />
                        </div>
                     ) : (
                        <Textarea 
                            placeholder="A protagonist wants a goal, but faces an obstacle."
                            className="min-h-[100px] text-base"
                            value={logline}
                            onChange={(e) => setLogline(e.target.value)}
                        />
                     )}
                     <div className="flex justify-end">
                         <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                            {isGenerating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Generate with AI
                        </Button>
                     </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Logline</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
