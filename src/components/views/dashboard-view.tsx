
'use client';

import { useState } from "react";
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useCurrentScript } from "@/context/current-script-context";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, Sparkles, FileText, Link2, Unlink, Clapperboard, Book } from 'lucide-react';
import { Badge } from "../ui/badge";
import type { View, DashboardPanelType } from "../layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useTool } from "@/context/tool-context";
import { useSettings } from "@/context/settings-context";
import { sanitizeFirestorePayload } from '@/lib/firestore-utils';
import { TemplatesPicker, TemplateManager } from '@/components/Templates';
import { ScriptDashboardPanel, StoryDashboardPanel } from './dashboard-panels';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

interface DashboardViewProps {
  setView: (view: View) => void;
  activePanel?: DashboardPanelType;
  setActivePanel?: (panel: DashboardPanelType) => void;
}

export default function DashboardView({ setView, activePanel, setActivePanel }: DashboardViewProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { currentScriptId, setCurrentScriptId } = useCurrentScript();
    const { toast } = useToast();
    const { currentTool } = useTool();
    const { settings } = useSettings();
    const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
    const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);

    const projectLinkingMode = settings.projectLinkingMode || 'shared';
    
    // Use activePanel from props or default based on currentTool
    const effectivePanel = activePanel ?? (currentTool === 'StoryScribbler' ? 'story' : 'script');

    // Handler for panel toggle - creates a new project based on the effective panel type
    const handlePanelChange = (panel: string) => {
        if (setActivePanel) {
            setActivePanel(panel as DashboardPanelType);
        }
    };
    
    const handleCreateNewProject = async () => {
        if (!firestore || !user) return;
        
        // Determine project type based on effective panel (not currentTool)
        const isStory = effectivePanel === 'story';
        const projectType = isStory ? 'story' : 'script';
        
        try {
            const scriptsCollectionRef = collection(firestore, 'users', user.uid, 'scripts');
            const projectData = sanitizeFirestorePayload({
                title: isStory ? 'Untitled Story' : 'Untitled Script',
                content: isStory 
                    ? 'Chapter 1\n\nYour story begins here...'
                    : 'SCENE 1\n\nINT. ROOM - DAY\n\nA new story begins.',
                logline: '',
                projectType,
                authorId: user.uid,
                createdAt: serverTimestamp(),
                lastModified: serverTimestamp(),
            });
            const newDoc = await addDoc(scriptsCollectionRef, projectData).catch(() => {
                const permissionError = new FirestorePermissionError({
                    path: scriptsCollectionRef.path,
                    operation: 'create',
                    requestResourceData: projectData
                });
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            });
            toast({
                title: isStory ? 'Story Created' : 'Script Created',
                description: isStory 
                    ? 'A new untitled story has been added to your collection.'
                    : 'A new untitled script has been added to your collection.',
            });
            setCurrentScriptId(newDoc.id);
            setView(isStory ? 'outline' : 'editor');
        } catch (error) {
            console.error('Error creating new project:', error);
            if (!(error instanceof FirestorePermissionError)) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: `Could not create a new ${projectType}.`,
                });
            }
        }
    };

    const handleStartWithAI = async () => {
        if (!firestore || !user) return;
        
        const isStory = effectivePanel === 'story';
        const projectType = isStory ? 'story' : 'script';
        
        try {
            const scriptsCollectionRef = collection(firestore, 'users', user.uid, 'scripts');
            const projectData = sanitizeFirestorePayload({
                title: isStory ? 'AI-Assisted Story' : 'AI-Assisted Script',
                content: isStory 
                    ? 'Chapter 1\n\nA blank page awaits. The AI assistant stands ready to help craft your story.\n\n(Click the AI assistant button in the bottom right to start collaborating)'
                    : 'INT. WRITER\'S ROOM - DAY\n\nA blank page awaits. The AI assistant stands ready to help craft your story.\n\n(Click the AI assistant button in the bottom right to start collaborating)',
                logline: isStory ? 'An AI-assisted story waiting to be written' : 'An AI-assisted screenplay waiting to be written',
                projectType,
                authorId: user.uid,
                createdAt: serverTimestamp(),
                lastModified: serverTimestamp(),
            });
            const newDoc = await addDoc(scriptsCollectionRef, projectData).catch(() => {
                const permissionError = new FirestorePermissionError({
                    path: scriptsCollectionRef.path,
                    operation: 'create',
                    requestResourceData: projectData
                });
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            });
            toast({
                title: isStory ? 'AI-Assisted Story Created' : 'AI-Assisted Script Created',
                description: `Open the AI assistant to start creating your ${projectType}.`,
            });
            setCurrentScriptId(newDoc.id);
            setView(isStory ? 'outline' : 'editor');
        } catch (error) {
            console.error('Error creating AI project:', error);
            if (!(error instanceof FirestorePermissionError)) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: `Could not create a new ${projectType}.`,
                });
            }
        }
    };

    const handleTemplateSelect = async (content: string) => {
        if (!firestore || !user) return;
        
        const isStory = effectivePanel === 'story';
        const projectType = isStory ? 'story' : 'script';
        
        try {
            const scriptsCollectionRef = collection(firestore, 'users', user.uid, 'scripts');
            const projectData = sanitizeFirestorePayload({
                title: isStory ? 'Untitled Story' : 'Untitled Document',
                content: content,
                logline: '',
                projectType,
                authorId: user.uid,
                createdAt: serverTimestamp(),
                lastModified: serverTimestamp(),
            });
            const newDoc = await addDoc(scriptsCollectionRef, projectData).catch(() => {
                const permissionError = new FirestorePermissionError({
                    path: scriptsCollectionRef.path,
                    operation: 'create',
                    requestResourceData: projectData
                });
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            });
            toast({
                title: isStory ? 'Story Created' : 'Document Created',
                description: `A new ${projectType} from template has been created.`,
            });
            setCurrentScriptId(newDoc.id);
            setView(isStory ? 'outline' : 'editor');
        } catch (error) {
            console.error('Error creating document from template:', error);
            if (!(error instanceof FirestorePermissionError)) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: `Could not create ${projectType} from template.`,
                });
            }
        }
    };


    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Segmented Control for Dashboard Panel */}
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
                <Tabs value={effectivePanel} onValueChange={handlePanelChange} className="w-auto">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="script" className="flex items-center gap-2">
                            <Clapperboard className="h-4 w-4" />
                            Script
                        </TabsTrigger>
                        <TabsTrigger value="story" className="flex items-center gap-2">
                            <Book className="h-4 w-4" />
                            Story
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Create New Project Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <CardTitle className="font-headline text-2xl">
                                {effectivePanel === 'story' ? 'Start a New Story' : 'Start a New Script'}
                            </CardTitle>
                            <CardDescription>
                                {effectivePanel === 'story' 
                                    ? 'Begin crafting your next story with outline, chapters, and world-building tools.'
                                    : 'Begin your next masterpiece from scratch or let our AI give you a starting point.'}
                            </CardDescription>
                        </div>
                        <Badge variant={projectLinkingMode === 'shared' ? 'default' : 'secondary'} className="flex items-center gap-1.5 shrink-0">
                            {projectLinkingMode === 'shared' ? (
                                <>
                                    <Link2 className="h-3 w-3" />
                                    <span>Shared Project</span>
                                </>
                            ) : (
                                <>
                                    <Unlink className="h-3 w-3" />
                                    <span>Separate Projects</span>
                                </>
                            )}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="w-full" onClick={handleCreateNewProject}>
                        <Plus className="mr-2 h-5 w-5" />
                        {effectivePanel === 'story' ? 'Create New Story' : 'Create New Script'}
                    </Button>
                    <Button size="lg" variant="secondary" className="w-full" onClick={handleStartWithAI}>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Start with AI
                    </Button>
                    <Button size="lg" variant="outline" className="w-full" onClick={() => setIsTemplatePickerOpen(true)}>
                        <FileText className="mr-2 h-5 w-5" />
                        Start with Template
                    </Button>
                </CardContent>
            </Card>

            <TemplatesPicker
                open={isTemplatePickerOpen}
                onOpenChange={setIsTemplatePickerOpen}
                onTemplateSelect={handleTemplateSelect}
                category={effectivePanel === 'story' ? 'story' : 'all'}
            />

            <TemplateManager
                open={isTemplateManagerOpen}
                onOpenChange={setIsTemplateManagerOpen}
            />

            {/* Quick action for managing templates */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Manage Your Content</CardTitle>
                    <CardDescription>
                        Create and organize custom templates and snippets for faster writing
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                    <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setIsTemplateManagerOpen(true)}
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        Manage Templates
                    </Button>
                </CardContent>
            </Card>

            {/* Render the appropriate dashboard panel based on effectivePanel */}
            {effectivePanel === 'story' ? (
                <StoryDashboardPanel setView={setView} onCreate={handleCreateNewProject} />
            ) : (
                <ScriptDashboardPanel setView={setView} onCreate={handleCreateNewProject} />
            )}
        </div>
    )
}
