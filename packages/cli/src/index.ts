#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { newCommand } from './commands/new';
import { listCommand } from './commands/list';
import { exportCommand } from './commands/export';
import { importCommand } from './commands/import';
import { syncCommand } from './commands/sync';
import { loginCommand } from './commands/login';

const program = new Command();

program
  .name('thescribbler')
  .description('CLI tool for TheScribbler - create, edit, and sync documents locally')
  .version('0.1.0');

// Register commands
program
  .command('login')
  .description('Authenticate with TheScribbler')
  .action(loginCommand);

program
  .command('new [title]')
  .description('Create a new document')
  .option('-l, --logline <logline>', 'Add a logline to the document')
  .option('-c, --content <content>', 'Initial content for the document')
  .action(newCommand);

program
  .command('list')
  .description('List all documents')
  .option('-f, --format <format>', 'Output format (table|json)', 'table')
  .action(listCommand);

program
  .command('export <documentId>')
  .description('Export a document to a local file')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Export format (md|txt|fountain)', 'md')
  .action(exportCommand);

program
  .command('import <file>')
  .description('Import a local file to TheScribbler')
  .option('-t, --title <title>', 'Document title')
  .option('-l, --logline <logline>', 'Document logline')
  .action(importCommand);

program
  .command('sync [documentId]')
  .description('Sync local changes with remote (or sync all if no ID provided)')
  .option('-d, --direction <direction>', 'Sync direction (push|pull|both)', 'both')
  .action(syncCommand);

// Error handling
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s'), program.args.join(' '));
  console.log(chalk.yellow('See --help for a list of available commands.'));
  process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
