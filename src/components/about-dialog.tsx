'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">About The Scribbler</DialogTitle>
          <DialogDescription>
            Your comprehensive writing toolkit for scripts and stories
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* ScriptScribbler Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Image 
                  src="/images/scriptscribbler.png" 
                  alt="ScriptScribbler" 
                  width={80} 
                  height={80} 
                  className="object-contain rounded-md"
                />
                <div>
                  <h3 className="text-xl font-bold font-headline">ScriptScribbler</h3>
                  <p className="text-sm text-muted-foreground">Professional screenplay writing tool</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">
                ScriptScribbler is your complete solution for writing professional screenplays. 
                With industry-standard formatting, AI-powered writing assistance, and collaborative 
                features, you can focus on telling your story while we handle the technical details.
              </p>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Key Features:</h4>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li>Industry-standard screenplay formatting</li>
                  <li>Scene management and organization</li>
                  <li>Character development tools</li>
                  <li>AI-powered writing suggestions and editing</li>
                  <li>Logline and synopsis generation</li>
                  <li>Export to multiple formats (Fountain, Final Draft, PDF)</li>
                  <li>Real-time collaboration features</li>
                  <li>Import from Scrite and Google Docs</li>
                </ul>
              </div>
            </div>

            <Separator />

            {/* StoryScribbler Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Image 
                  src="/images/storyscribbler.png" 
                  alt="StoryScribbler" 
                  width={80} 
                  height={80} 
                  className="object-contain rounded-md"
                />
                <div>
                  <h3 className="text-xl font-bold font-headline">StoryScribbler</h3>
                  <p className="text-sm text-muted-foreground">Novel and long-form writing companion</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">
                StoryScribbler is designed for novelists and long-form writers who need powerful 
                organization and world-building tools. Plan, write, and refine your stories with 
                comprehensive features that grow with your creative process.
              </p>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Key Features:</h4>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li>Hierarchical outline and story structure</li>
                  <li>Chapter management with word count tracking</li>
                  <li>Character profiles and development</li>
                  <li>World-building tools for locations and cultures</li>
                  <li>Timeline creation for plot events</li>
                  <li>Flexible note-taking system</li>
                  <li>AI-powered writing assistance</li>
                  <li>Export and import capabilities</li>
                </ul>
              </div>
            </div>

            <Separator />

            {/* General Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold font-headline">About The Scribbler</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                The Scribbler combines professional-grade writing tools with modern AI assistance 
                to help you bring your creative vision to life. Whether you&apos;re writing the next 
                great screenplay or crafting an epic novel, our tools adapt to your workflow.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Switch between ScriptScribbler and StoryScribbler at any time using the dropdown 
                menu in the sidebar. Each tool is purpose-built for its specific writing format, 
                with all your projects accessible from a unified dashboard.
              </p>
            </div>

            {/* Version Info */}
            <div className="text-xs text-muted-foreground pt-4">
              <p>Version 0.1.0</p>
              <p className="mt-1">© 2024 The Scribbler. All rights reserved.</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
