'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useScript } from '@/context/script-context';
import { DocumentVersion } from '@/lib/editor-types';
import { generateDiff } from '@/utils/diff';
import { formatDistanceToNow } from 'date-fns';

interface VersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VersionHistory({ open, onOpenChange }: VersionHistoryProps) {
  const { versions, script, restoreVersion } = useScript();
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const handleRestore = async (versionId: string) => {
    await restoreVersion(versionId);
    onOpenChange(false);
  };

  const handleViewDiff = (version: DocumentVersion) => {
    setSelectedVersion(version);
    setShowDiff(true);
  };

  const handleBack = () => {
    setShowDiff(false);
    setSelectedVersion(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    
    try {
      // Handle Firestore Timestamp
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown date';
    }
  };

  const renderDiff = () => {
    if (!selectedVersion || !script) return null;

    const diff = generateDiff(selectedVersion.content, script.content);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button onClick={handleBack} variant="outline" size="sm">
            ← Back to versions
          </Button>
          <div className="flex gap-2">
            <Badge variant="secondary">
              +{diff.addedLines} lines
            </Badge>
            <Badge variant="secondary">
              -{diff.removedLines} lines
            </Badge>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Comparing with current version
            </CardTitle>
            <CardDescription>
              Version from {formatTimestamp(selectedVersion.timestamp)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {diff.changes.map((change, index) => {
                  const lines = change.value.split('\n').filter((line, idx, arr) => 
                    // Skip the last empty line from split
                    idx < arr.length - 1 || line !== ''
                  );
                  
                  return lines.map((line, lineIndex) => (
                    <div
                      key={`${index}-${lineIndex}`}
                      className={
                        change.added
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100'
                          : change.removed
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100'
                          : ''
                      }
                    >
                      {change.added && '+ '}
                      {change.removed && '- '}
                      {!change.added && !change.removed && '  '}
                      {line}
                    </div>
                  ));
                })}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => handleRestore(selectedVersion.id)}>
            Restore this version
          </Button>
        </div>
      </div>
    );
  };

  const renderVersionList = () => {
    if (!versions || versions.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No version history available yet. Versions are created automatically when you save your script.
        </div>
      );
    }

    return (
      <ScrollArea className="h-[500px]">
        <div className="space-y-4 pr-4">
          {versions.map((version, index) => (
            <Card key={version.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {version.title || 'Untitled'}
                    </CardTitle>
                    <CardDescription>
                      Saved {formatTimestamp(version.timestamp)}
                      {index === 0 && (
                        <Badge variant="default" className="ml-2">
                          Latest
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                </div>
                {version.logline && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {version.logline}
                  </p>
                )}
                {version.note && (
                  <p className="text-sm italic text-muted-foreground mt-2">
                    Note: {version.note}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleViewDiff(version)}
                    variant="outline"
                    size="sm"
                    disabled={index === 0}
                  >
                    View changes
                  </Button>
                  <Button
                    onClick={() => handleRestore(version.id)}
                    variant="default"
                    size="sm"
                    disabled={index === 0}
                  >
                    Restore
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">
            Version History
          </DialogTitle>
          <DialogDescription>
            {showDiff 
              ? 'Review changes and restore a previous version'
              : 'View and restore previous versions of your script'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {showDiff ? renderDiff() : renderVersionList()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
