'use client';

import { useState, useCallback, useRef } from 'react';
import AiFab from '@/components/ai-fab';
import ScriptEditor from '@/components/script-editor';
import { Button } from '../ui/button';
import { Search, Plus, Maximize2, Minimize2, FileCode } from 'lucide-react';
import { FindReplaceDialog } from '../find-replace-dialog';
import { FindReplaceProvider } from '@/hooks/use-find-replace';
import EditorStatusBar from '../editor-status-bar';
import { useScript } from '@/context/script-context';
import { useSettings } from '@/context/settings-context';
import { ScriptBlockType } from '@/lib/editor-types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useCurrentScript } from '@/context/current-script-context';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useFullscreen } from '@/hooks/use-fullscreen';
import { cn } from '@/lib/utils';
import { sanitizeFirestorePayload } from '@/lib/firestore-utils';
import { SnippetManager } from '@/components/Snippets';

function EditorViewContent() {
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isSceneEditOpen, setIsSceneEditOpen] = useState(false);
  const [editingSceneNumber, setEditingSceneNumber] = useState<number | null>(null);
  const [sceneSettings, setSceneSettings] = useState({ setting: '', description: '', time: 5 });
  const [isSaving, setIsSaving] = useState(false);
  const [isSnippetManagerOpen, setIsSnippetManagerOpen] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  const { document, insertBlockAfter, scenes, script, setBlocks } = useScript();
  const { settings } = useSettings();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { currentScriptId } = useCurrentScript();
  const { isFullscreen, toggleFullscreen } = useFullscreen(editorContainerRef);
  
  // Check if AI features are enabled (default to true for backwards compatibility)
  const aiEnabled = settings.aiFeatureEnabled !== false;

  const scenesCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'scenes') : null),
    [firestore, user, currentScriptId]
  );

  const handleAddScene = () => {
    if (!document || document.blocks.length === 0) {
      return;
    }
    
    const lastBlock = document.blocks[document.blocks.length - 1];
    insertBlockAfter(lastBlock.id, 'INT. NEW LOCATION - DAY', ScriptBlockType.SCENE_HEADING);
  };

  const handleEditScene = useCallback((sceneNumber: number) => {
    const scene = scenes?.find(s => s.sceneNumber === sceneNumber);
    if (scene) {
      setSceneSettings({
        setting: scene.setting || '',
        description: scene.description || '',
        time: scene.time || 5,
      });
    } else {
      setSceneSettings({ setting: '', description: '', time: 5 });
    }
    setEditingSceneNumber(sceneNumber);
    setIsSceneEditOpen(true);
  }, [scenes]);

  const handleSaveScene = async () => {
    if (!scenesCollection || !editingSceneNumber) return;

    setIsSaving(true);
    try {
      const scene = scenes?.find(s => s.sceneNumber === editingSceneNumber);
      
      if (scene?.id) {
        const sceneDocRef = doc(scenesCollection, scene.id);
        const sceneData = sanitizeFirestorePayload({
          setting: sceneSettings.setting,
          description: sceneSettings.description,
          time: sceneSettings.time,
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        await setDoc(sceneDocRef, sceneData, { merge: true }).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: sceneDocRef.path,
            operation: 'update',
            requestResourceData: sceneData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });
        
        toast({
          title: 'Scene Updated',
          description: `Scene ${editingSceneNumber} has been updated.`,
        });
      }
      
      setIsSceneEditOpen(false);
    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
        toast({
          variant: 'destructive',
          title: 'Save Error',
          description: 'An error occurred while saving the scene.',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSnippetInsert = useCallback((content: string) => {
    if (!script || !document) return;
    
    // Insert snippet at the end of the current content
    if (document.blocks.length === 0) {
      // Handle empty document - create a first block
      setBlocks([{
        id: `block-${Date.now()}`,
        type: ScriptBlockType.ACTION,
        text: content,
      }]);
    } else {
      const lastBlock = document.blocks[document.blocks.length - 1];
      insertBlockAfter(lastBlock.id, content, ScriptBlockType.ACTION);
    }
  }, [script, document, insertBlockAfter, setBlocks]);

  // Handle case when no project is selected
  if (!currentScriptId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <FileCode className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold font-headline mb-2">No Project Selected</h2>
          <p className="text-muted-foreground">
            Please select or create a project from the Dashboard to start writing your script.
          </p>
        </div>
      </div>
    );
  }

  return (
      <div 
        ref={editorContainerRef}
        className={cn(
          "relative h-full w-full flex flex-col",
          isFullscreen && "bg-background"
        )}
      >
        <div className="flex-shrink-0 flex justify-end gap-2 p-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen"}
            >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="mr-2 h-4 w-4" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Fullscreen
                  </>
                )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsFindOpen(true)}>
                <Search className="mr-2 h-4 w-4" />
                Find & Replace
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsSnippetManagerOpen(true)}>
                <FileCode className="mr-2 h-4 w-4" />
                Snippets
            </Button>
        </div>
        <div className="flex-1 overflow-y-auto pb-24">
          <ScriptEditor isStandalone={false} onEditScene={handleEditScene} />
          
          {/* Add Scene Button - Below the editor content */}
          <div className="max-w-3xl mx-auto px-4 py-6 flex justify-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleAddScene}
              className="w-full max-w-md"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Scene
            </Button>
          </div>
        </div>
        <EditorStatusBar />
        {aiEnabled && <AiFab />}
        <FindReplaceDialog open={isFindOpen} onOpenChange={setIsFindOpen} />
        <SnippetManager 
          open={isSnippetManagerOpen} 
          onOpenChange={setIsSnippetManagerOpen}
          onSnippetInsert={handleSnippetInsert}
        />
        
        {/* Scene Edit Dialog */}
        <Dialog open={isSceneEditOpen} onOpenChange={setIsSceneEditOpen}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit Scene {editingSceneNumber}</DialogTitle>
              <DialogDescription>
                Update the scene details below.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="setting">Setting</Label>
                  <Input
                    id="setting"
                    value={sceneSettings.setting}
                    onChange={(e) => setSceneSettings({ ...sceneSettings, setting: e.target.value })}
                    placeholder="e.g., INT. COFFEE SHOP - DAY"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={sceneSettings.description}
                    onChange={(e) => setSceneSettings({ ...sceneSettings, description: e.target.value })}
                    placeholder="Brief description of what happens in this scene..."
                    rows={4}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Estimated Time (minutes)</Label>
                  <Input
                    id="time"
                    type="number"
                    value={sceneSettings.time}
                    onChange={(e) => setSceneSettings({ ...sceneSettings, time: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSceneEditOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSaveScene} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Scene'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  )
}


export default function EditorView() {
  return (
    <FindReplaceProvider>
      <EditorViewContent />
    </FindReplaceProvider>
  );
}
