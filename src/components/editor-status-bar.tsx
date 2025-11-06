'use client';

import { useScript } from '@/context/script-context';
import { Badge } from './ui/badge';
import { estimateScriptMetrics } from '@/lib/screenplay-parser';
import { useMemo } from 'react';
import { Scroll, Timer, Type, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScriptBlockType } from '@/lib/editor-types';
import { useAiWritingAssist } from '@/hooks/use-ai-writing-assist';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const getBlockTypeLabel = (type: ScriptBlockType): string => {
    switch (type) {
        case ScriptBlockType.SCENE_HEADING: return 'Scene Heading';
        case ScriptBlockType.ACTION: return 'Action';
        case ScriptBlockType.CHARACTER: return 'Character';
        case ScriptBlockType.PARENTHETICAL: return 'Parenthetical';
        case ScriptBlockType.DIALOGUE: return 'Dialogue';
        case ScriptBlockType.TRANSITION: return 'Transition';
        case ScriptBlockType.SHOT: return 'Shot';
        default: return 'Unknown';
    }
}

export default function EditorStatusBar() {
    const { document, activeBlockId } = useScript();
    const { config, toggleEnabled } = useAiWritingAssist();
    
    // Check if AI is available by checking the environment variable set in next.config.ts
    const isAiEnabled = process.env.NEXT_PUBLIC_AI_ENABLED === 'true';

    const metrics = useMemo(() => {
        if (!document) return { pageCount: 0, charCount: 0, wordCount: 0, estimatedMinutes: 0 };
        return estimateScriptMetrics(document);
    }, [document]);

    const activeBlock = useMemo(() => {
        if (!document || !activeBlockId) return null;
        return document.blocks.find(b => b.id === activeBlockId);
    }, [document, activeBlockId]);

    return (
        <div className="w-full mt-4">
            <div className="flex items-center justify-center h-10 px-4 text-xs text-muted-foreground rounded-lg border bg-card gap-6 max-w-2xl mx-auto">
                <div className="flex items-center gap-1.5" title="Page Count">
                <Scroll className="w-3.5 h-3.5" />
                <span>{metrics.pageCount} pgs</span>
                </div>
                <div className="flex items-center gap-1.5" title="Estimated Time">
                <Timer className="w-3.5 h-3.5" />
                <span>~{metrics.estimatedMinutes} min</span>
                </div>
                <div className="flex items-center gap-1.5" title="Character Count">
                <Type className="w-3.5 h-3.5" />
                <span>{metrics.charCount.toLocaleString()} chars</span>
                </div>
                {activeBlock && (
                    <Badge variant="outline" className="transition-all duration-200">
                        {getBlockTypeLabel(activeBlock.type)}
                    </Badge>
                )}
                {isAiEnabled && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={config.enabled ? "default" : "ghost"}
                                    size="sm"
                                    className="h-7 text-xs gap-1.5"
                                    onClick={toggleEnabled}
                                >
                                    <Sparkles className={cn("w-3.5 h-3.5", config.enabled && "text-yellow-500")} />
                                    <span>AI Assist</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{config.enabled ? 'AI writing assistance is ON' : 'AI writing assistance is OFF'}</p>
                                <p className="text-xs text-muted-foreground">Right-click selected text for AI editing</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
        </div>
    );
}
