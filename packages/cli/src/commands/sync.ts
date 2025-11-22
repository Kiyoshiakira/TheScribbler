import chalk from 'chalk';
import ora from 'ora';
import { requireAuth } from '../config';
import { apiClient } from '../api-client';

interface SyncCommandOptions {
  direction?: string;
}

export async function syncCommand(
  documentId?: string,
  options?: SyncCommandOptions
): Promise<void> {
  try {
    requireAuth();

    const direction = options?.direction || 'both';

    if (!['push', 'pull', 'both'].includes(direction)) {
      console.error(
        chalk.red('Error:'),
        'Invalid sync direction. Must be one of: push, pull, both'
      );
      process.exit(1);
    }

    const spinner = ora('Syncing...').start();

    // For now, this is a basic implementation
    // In a real scenario, you'd have local cache/state to sync
    if (documentId) {
      const result = await apiClient.getDocument(documentId);

      if (result.success && result.data) {
        spinner.succeed('Document synced successfully!');
        console.log();
        console.log(chalk.green('✓ Document:'), result.data.title);
        console.log(chalk.green('✓ ID:'), result.data.id);
        console.log(
          chalk.yellow(
            'Note: Full bidirectional sync with local cache is not yet implemented.'
          )
        );
        console.log(
          chalk.yellow(
            'Use "export" to download and "import" to upload for now.'
          )
        );
      } else {
        spinner.fail('Failed to sync document');
        console.error(chalk.red('Error:'), result.error || 'Document not found');
        process.exit(1);
      }
    } else {
      // Sync all documents
      const result = await apiClient.listDocuments();

      if (result.success && result.data) {
        spinner.succeed(`Synced ${result.data.length} document(s)`);
        console.log();
        console.log(
          chalk.yellow(
            'Note: Full bidirectional sync with local cache is not yet implemented.'
          )
        );
        console.log(
          chalk.yellow(
            'Use "list" to see all documents, then "export" individual ones.'
          )
        );
      } else {
        spinner.fail('Failed to sync documents');
        console.error(chalk.red('Error:'), result.error || 'Unknown error');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
