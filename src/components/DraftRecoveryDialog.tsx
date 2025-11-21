/**
 * Draft Recovery Dialog
 * 
 * Displays when unsaved drafts are found in local storage.
 * Allows users to recover or discard drafts.
 */

'use client';

import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { saveManager, Draft } from '@/utils/saveManager';
import { formatDistance } from 'date-fns';

export interface DraftRecoveryDialogProps {
  /**
   * Draft ID to check for recovery
   */
  draftId: string;
  
  /**
   * Callback when user chooses to recover the draft
   */
  onRecover: (content: string, metadata?: Draft['metadata']) => void;
  
  /**
   * Callback when user chooses to discard the draft
   */
  onDiscard?: () => void;
  
  /**
   * Whether to check for draft on mount (default: true)
   */
  autoCheck?: boolean;
}

export function DraftRecoveryDialog({
  draftId,
  onRecover,
  onDiscard,
  autoCheck = true,
}: DraftRecoveryDialogProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    if (!autoCheck || !draftId) {
      return;
    }

    const checkForDraft = async () => {
      try {
        const savedDraft = await saveManager.getDraft(draftId);
        
        // Check if draft exists (content can be empty string)
        if (savedDraft && savedDraft.content !== undefined) {
          setDraft(savedDraft);
          setOpen(true);
        }
      } catch (error) {
        console.error('[DraftRecoveryDialog] Error checking for draft:', error);
      }
    };

    checkForDraft();
  }, [draftId, autoCheck]);

  const handleRecover = async () => {
    if (draft) {
      onRecover(draft.content, draft.metadata);
      setOpen(false);
      
      // Optionally delete the draft after recovery
      try {
        await saveManager.deleteDraft(draftId);
      } catch (error) {
        console.error('[DraftRecoveryDialog] Error deleting draft after recovery:', error);
      }
    }
  };

  const handleDiscard = async () => {
    setOpen(false);
    
    if (onDiscard) {
      onDiscard();
    }
    
    // Delete the draft
    try {
      await saveManager.deleteDraft(draftId);
    } catch (error) {
      console.error('[DraftRecoveryDialog] Error deleting draft:', error);
    }
  };

  if (!draft) {
    return null;
  }

  const draftAge = formatDistance(draft.timestamp, Date.now(), { addSuffix: true });
  const wordCount = draft.content.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Recover Unsaved Draft?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              We found an unsaved draft from {draftAge}.
            </p>
            {draft.metadata?.title && (
              <p className="font-medium">
                Title: {draft.metadata.title}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </p>
            <p className="text-sm">
              Would you like to recover this draft or start fresh?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDiscard}>
            Discard Draft
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleRecover}>
            Recover Draft
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DraftRecoveryDialog;
