import { XMLParser } from 'fast-xml-parser';
import JSZip from 'jszip';

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


export const parseScriteFile = async (fileData: ArrayBuffer): Promise<ParsedScriteFile> => {
  const zip = await JSZip.loadAsync(fileData);
  
  let contentXmlFile: JSZip.JSZipObject | null = null;
  const headerFile = zip.file('_header.json');

  if (headerFile) {
    const headerData = await headerFile.async('string');
    const headerJson = JSON.parse(headerData);
    // Scrite's header often contains a 'documentPath' pointing to the main content
    if (headerJson.documentPath) {
      contentXmlFile = zip.file(headerJson.documentPath);
    }
  }

  // Fallback if header doesn't exist or doesn't contain the path
  if (!contentXmlFile) {
    const xmlFiles = zip.file(/\.xml$/);
    if (xmlFiles.length > 0) {
      contentXmlFile = xmlFiles[0];
    }
  }

  if (!contentXmlFile) {
    // If we still can't find it, throw a detailed error
    const fileList = Object.keys(zip.files).join(', ');
    throw new Error(`Invalid .scrite file: Could not find main XML content. Files in archive: [${fileList}]`);
  }

  const xmlData = await contentXmlFile.async('string');

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    processEntities: false,
    ignorePiTags: true,
  });
  
  // Pre-process the XML to remove the <?xml ... ?> declaration
  const cleanedXmlData = xmlData.replace(/<\?xml[^>]*\?>/g, '').trim();
  const jsonObj = parser.parse(cleanedXmlData);
  const scriteDocument = jsonObj['scrite-document'];

  if (!scriteDocument) {
    throw new Error('Invalid Scrite XML structure: <scrite-document> tag not found.');
  }

  // 1. Parse Script Content
  const content = scriteDocument?.content || '';

  // 2. Parse Characters
  const characters: ParsedCharacter[] = [];
  let characterList = scriteDocument?.characters?.character;
  if (characterList) {
    if (!Array.isArray(characterList)) {
        characterList = [characterList]; // Ensure it's an array for consistency
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
        notesList = [notesList]; // Ensure it's an array
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
