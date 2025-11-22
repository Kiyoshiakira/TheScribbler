import Conf from 'conf';

interface Config {
  apiUrl: string;
  token?: string;
  userId?: string;
}

const config = new Conf<Config>({
  projectName: 'thescribbler-cli',
  defaults: {
    apiUrl: process.env.THESCRIBBLER_API_URL || 'http://localhost:9002',
  },
});

export function getConfig(): Config {
  return {
    apiUrl: config.get('apiUrl'),
    token: config.get('token'),
    userId: config.get('userId'),
  };
}

export function setToken(token: string, userId: string): void {
  config.set('token', token);
  config.set('userId', userId);
}

export function clearToken(): void {
  config.delete('token');
  config.delete('userId');
}

export function setApiUrl(url: string): void {
  config.set('apiUrl', url);
}

export function isAuthenticated(): boolean {
  return !!config.get('token');
}

export function requireAuth(): { token: string; userId: string } {
  const token = config.get('token');
  const userId = config.get('userId');
  
  if (!token || !userId) {
    throw new Error(
      'Not authenticated. Please run "thescribbler login" first.'
    );
  }
  
  return { token, userId };
}
