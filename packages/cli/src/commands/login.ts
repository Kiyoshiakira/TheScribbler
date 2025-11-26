import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import axios from 'axios';
import { setToken, setApiUrl } from '../config';
import { apiClient } from '../api-client';

export async function loginCommand(): Promise<void> {
  console.log(chalk.blue('🔐 TheScribbler CLI Login'));
  console.log();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiUrl',
      message: 'API URL:',
      default: 'http://localhost:9002',
    },
    {
      type: 'input',
      name: 'token',
      message: 'Firebase Auth Token (ID Token):',
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'Token is required';
        }
        return true;
      },
    },
  ]);

  const spinner = ora('Verifying token...').start();

  try {
    // Set the API URL temporarily for verification
    setApiUrl(answers.apiUrl);

    const result = await apiClient.verifyToken(answers.token);

    if (result.success && result.data) {
      spinner.succeed('Authentication successful!');
      setToken(answers.token, result.data.userId);
      console.log(chalk.green(`✓ Logged in as user: ${result.data.userId}`));
      console.log();
      console.log(chalk.yellow('Token saved. You can now use other CLI commands.'));
    } else {
      spinner.fail('Authentication failed');
      console.error(chalk.red('Error:'), result.error || 'Invalid token');
      process.exit(1);
    }
  } catch (error) {
    spinner.fail('Authentication failed');
    if (axios.isAxiosError(error)) {
      console.error(chalk.red('Error:'), error.message);
      if (error.response?.data?.error) {
        console.error(chalk.red('Details:'), error.response.data.error);
      }
    } else {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
    }
    process.exit(1);
  }
}

// Note: To get a Firebase ID token for CLI use:
// 1. Log in to TheScribbler web app
// 2. Open browser console and run: firebase.auth().currentUser.getIdToken()
// 3. Copy the token and use it with "thescribbler login"
