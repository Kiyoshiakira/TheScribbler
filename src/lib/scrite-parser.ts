import { XMLParser } from 'fast-xml-parser';

export type NoteCategory = 'Plot' | 'Character' | 'Dialogue' | 'Research' | 'Theme' | 'Scene' | 'General';

export interface ParsedNote {
  id: number;
  title: string;
  content: string;
  category: NoteCategory;
  imageUrl?: string;
}

export interface ParsedCharacter {
    id?: string;
    name: string;
    description: string;
    scenes: number;
    profile?: string;
    imageUrl?: string;
}

export interface ParsedScriteFile {
  script: string;
  characters: ParsedCharacter[];
  notes: ParsedNote[];
  scenes: { number: number; setting: string; description: string; time: number }[];
}

const mapScriteCategoryToNoteCategory = (scriteCategory: string): NoteCategory => {
    const mapping: { [key: string]: NoteCategory } = {
        'Plot Point': 'Plot',
        'Character Note': 'Character',
        'Dialogue Note': 'Dialogue',
        'Research Note': 'Research',
        'Thematic Note': 'Theme',
        'Scene Note': 'Scene',
        'General Note': 'General',
    };
    return mapping[scriteCategory] || 'General';
}


export const parseScriteFile = (xmlData: string): ParsedScriteFile => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });
  const jsonObj = parser.parse(xmlData);

  const scriteDocument = jsonObj['scrite-document'];

  // 1. Parse Script Content
  const content = scriteDocument?.content || '';

  // 2. Parse Characters
  const characters: ParsedCharacter[] = [];
  let characterList = scriteDocument?.characters?.character;
  if (characterList) {
    if (!Array.isArray(characterList)) {
        characterList = [characterList];
    }
    characterList.forEach((char: any) => {
      characters.push({
        name: char['@_name'] || 'Unnamed',
        description: char['@_description'] || '',
        scenes: 0, // Scrite doesn't directly store scene count per character this way
        profile: char['@_bio'] || '',
      });
    });
  }

  // 3. Parse Notes
  const notes: ParsedNote[] = [];
  let notesList = scriteDocument?.notebook?.note;
  if (notesList) {
    if (!Array.isArray(notesList)) {
        notesList = [notesList];
    }
    notesList.forEach((note: any, index: number) => {
      notes.push({
        id: Date.now() + index,
        title: note['@_title'] || 'Untitled Note',
        content: note['#text'] || '',
        category: mapScriteCategoryToNoteCategory(note['@_category']),
      });
    });
  }

  // 4. Parse Scenes (basic structure)
  const scenes: ParsedScriteFile['scenes'] = [];
  // Scrite scenes are derived from scene headings in the content.
  // A more advanced parser would be needed. For now, we return an empty array.
  
  return {
    script: content,
    characters,
    notes,
    scenes,
  };
};
