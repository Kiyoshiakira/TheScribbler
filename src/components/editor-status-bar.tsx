'use client';

import { useScript } from '@/context/script-context';
import { Badge } from './ui/badge';
import { estimateScriptMetrics } from '@/lib/screenplay-parser';
import { useMemo } from 'react';
import { Scroll, Timer, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScriptBlockType } from '@/lib/editor-types';

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
            <div className="flex items-center justify-center h-10 px-4 text-xs text-muted-foreground rounded-lg border bg-card gap-6 max-w-sm mx-auto">
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
            </div>
        </div>
    );
}
