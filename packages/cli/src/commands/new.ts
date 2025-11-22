import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { requireAuth } from '../config';
import { apiClient } from '../api-client';

interface NewCommandOptions {
  logline?: string;
  content?: string;
}

export async function newCommand(
  title?: string,
  options?: NewCommandOptions
): Promise<void> {
  try {
    requireAuth();

    let documentTitle = title;
    let logline = options?.logline;
    let content = options?.content || '';

    // If title not provided, ask for it
    if (!documentTitle) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Document title:',
          validate: (input) => {
            if (!input || input.trim().length === 0) {
              return 'Title is required';
            }
            return true;
          },
        },
        {
          type: 'input',
          name: 'logline',
          message: 'Logline (optional):',
        },
      ]);

      documentTitle = answers.title;
      logline = answers.logline || logline;
    }

    const spinner = ora('Creating document...').start();

    const result = await apiClient.createDocument(documentTitle!, content, logline);

    if (result.success && result.data) {
      spinner.succeed('Document created successfully!');
      console.log();
      console.log(chalk.green('✓ Document ID:'), result.data.id);
      console.log(chalk.green('✓ Title:'), result.data.title);
      if (result.data.logline) {
        console.log(chalk.green('✓ Logline:'), result.data.logline);
      }
      console.log();
      console.log(
        chalk.yellow(`Use "thescribbler export ${result.data.id}" to download this document`)
      );
    } else {
      spinner.fail('Failed to create document');
      console.error(chalk.red('Error:'), result.error || 'Unknown error');
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
