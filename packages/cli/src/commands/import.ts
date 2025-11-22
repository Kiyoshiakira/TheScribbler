import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { requireAuth } from '../config';
import { apiClient } from '../api-client';

interface ImportCommandOptions {
  title?: string;
  logline?: string;
}

export async function importCommand(
  filePath: string,
  options?: ImportCommandOptions
): Promise<void> {
  try {
    requireAuth();

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(chalk.red('Error:'), `File not found: ${filePath}`);
      process.exit(1);
    }

    const spinner = ora('Reading file...').start();

    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');

    // Determine title from filename if not provided
    let title = options?.title;
    if (!title) {
      const basename = path.basename(filePath, path.extname(filePath));
      title = basename.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }

    spinner.text = 'Creating document...';

    const result = await apiClient.createDocument(title, content, options?.logline);

    if (result.success && result.data) {
      spinner.succeed('Document imported successfully!');
      console.log();
      console.log(chalk.green('✓ Document ID:'), result.data.id);
      console.log(chalk.green('✓ Title:'), result.data.title);
      console.log(chalk.green('✓ Source:'), path.resolve(filePath));
      console.log(chalk.green('✓ Size:'), `${content.length} characters`);
    } else {
      spinner.fail('Failed to import document');
      console.error(chalk.red('Error:'), result.error || 'Unknown error');
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
