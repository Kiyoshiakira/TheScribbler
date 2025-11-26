import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { requireAuth } from '../config';
import { apiClient } from '../api-client';

interface ExportCommandOptions {
  output?: string;
  format?: string;
}

export async function exportCommand(
  documentId: string,
  options?: ExportCommandOptions
): Promise<void> {
  try {
    requireAuth();

    const spinner = ora('Fetching document...').start();

    const result = await apiClient.getDocument(documentId);

    if (!result.success || !result.data) {
      spinner.fail('Failed to fetch document');
      console.error(chalk.red('Error:'), result.error || 'Document not found');
      process.exit(1);
    }

    spinner.text = 'Exporting document...';

    const doc = result.data;
    const format = options?.format || 'md';
    const extension = format === 'fountain' ? 'fountain' : format === 'txt' ? 'txt' : 'md';
    
    // Generate output filename
    let outputPath = options?.output;
    if (!outputPath) {
      // Sanitize filename while preserving readability
      const sanitizedTitle = doc.title
        .replace(/[<>:"/\\|?*]/g, '') // Remove filesystem-unsafe characters
        .replace(/\s+/g, '_') // Replace whitespace with underscores
        .toLowerCase()
        .substring(0, 100); // Limit length
      outputPath = `${sanitizedTitle}.${extension}`;
    }

    // Create content based on format
    let content = '';
    if (format === 'md') {
      content = `# ${doc.title}\n\n`;
      if (doc.logline) {
        content += `**Logline:** ${doc.logline}\n\n`;
      }
      content += `---\n\n${doc.content || ''}`;
    } else if (format === 'fountain') {
      content = `Title: ${doc.title}\n`;
      if (doc.logline) {
        content += `Credit: ${doc.logline}\n`;
      }
      content += `\n${doc.content || ''}`;
    } else {
      // txt format
      content = `${doc.title}\n`;
      if (doc.logline) {
        content += `${doc.logline}\n`;
      }
      content += `\n${doc.content || ''}`;
    }

    // Write to file
    fs.writeFileSync(outputPath, content, 'utf-8');

    spinner.succeed('Document exported successfully!');
    console.log();
    console.log(chalk.green('✓ File:'), path.resolve(outputPath));
    console.log(chalk.green('✓ Format:'), format);
    console.log(chalk.green('✓ Size:'), `${content.length} characters`);
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
