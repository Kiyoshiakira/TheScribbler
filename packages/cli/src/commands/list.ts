import chalk from 'chalk';
import ora from 'ora';
import { requireAuth } from '../config';
import { apiClient } from '../api-client';

interface ListCommandOptions {
  format?: string;
}

export async function listCommand(options?: ListCommandOptions): Promise<void> {
  try {
    requireAuth();

    const spinner = ora('Fetching documents...').start();

    const result = await apiClient.listDocuments();

    if (result.success && result.data) {
      spinner.stop();

      if (result.data.length === 0) {
        console.log(chalk.yellow('No documents found.'));
        console.log(chalk.blue('Create a new document with "thescribbler new"'));
        return;
      }

      const format = options?.format || 'table';

      if (format === 'json') {
        console.log(JSON.stringify(result.data, null, 2));
      } else {
        // Table format
        console.log();
        console.log(chalk.bold('Your Documents:'));
        console.log();

        result.data.forEach((doc, index) => {
          console.log(chalk.cyan(`${index + 1}. ${doc.title}`));
          console.log(chalk.gray(`   ID: ${doc.id}`));
          if (doc.logline) {
            console.log(chalk.gray(`   Logline: ${doc.logline}`));
          }
          const lastModified = doc.lastModified?.toDate?.() || new Date(doc.lastModified);
          console.log(chalk.gray(`   Last Modified: ${lastModified.toLocaleString()}`));
          console.log();
        });

        console.log(chalk.blue(`Total: ${result.data.length} document(s)`));
      }
    } else {
      spinner.fail('Failed to fetch documents');
      console.error(chalk.red('Error:'), result.error || 'Unknown error');
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
