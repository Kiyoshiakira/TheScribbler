/**
 * @fileoverview Diff utility for comparing document versions
 * Uses the 'diff' library to generate textual differences between versions
 */

import { diffLines, Change } from 'diff';

export interface DiffResult {
  changes: Change[];
  addedLines: number;
  removedLines: number;
}

/**
 * Generate a diff between two text versions
 * @param oldText - The original text
 * @param newText - The new text to compare
 * @returns A DiffResult containing the changes and statistics
 */
export function generateDiff(oldText: string, newText: string): DiffResult {
  const changes = diffLines(oldText, newText);
  
  let addedLines = 0;
  let removedLines = 0;
  
  changes.forEach((change) => {
    if (change.added) {
      addedLines += change.count || 0;
    } else if (change.removed) {
      removedLines += change.count || 0;
    }
  });
  
  return {
    changes,
    addedLines,
    removedLines,
  };
}

/**
 * Format a diff as a unified diff string (similar to git diff)
 * @param changes - The changes from diffLines
 * @returns A formatted string representation
 */
export function formatDiffAsUnified(changes: Change[]): string {
  let result = '';
  
  changes.forEach((change) => {
    const lines = change.value.split('\n');
    lines.forEach((line, index) => {
      // Skip the last empty line from split
      if (index === lines.length - 1 && line === '') return;
      
      if (change.added) {
        result += `+ ${line}\n`;
      } else if (change.removed) {
        result += `- ${line}\n`;
      } else {
        result += `  ${line}\n`;
      }
    });
  });
  
  return result;
}
