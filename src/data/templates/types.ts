/**
 * Template types and interfaces for document templates and snippets
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'script' | 'story' | 'general';
  content: string;
  placeholders: string[]; // Array of placeholder names like ['Title', 'Author', 'Genre']
}

export interface Snippet {
  id: string;
  name: string;
  description: string;
  content: string;
  placeholders: string[];
  createdAt: number;
  updatedAt: number;
  storageType?: 'local' | 'cloud'; // Optional for backward compatibility
}

export interface PlaceholderValue {
  placeholder: string;
  value: string;
}
