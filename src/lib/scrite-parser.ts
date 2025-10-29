import JSZip from 'jszip';
import type { ScriptLine, ScriptElement } from '@/components/script-editor';

export type NoteCategory = 'Plot' | 'Character' | 'Dialogue' | 'Research' | 'Theme' | 'Scene' | 'General';

export interface ParsedNote {
  id?: string;
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

export interface ParsedScene {
  id?: string;
  sceneNumber: number;
  setting: string;
  description: string;
  time: number;
}


export interface ParsedScriteFile {
  title: string;
  script: string;
  lines: ScriptLine[];
  characters: ParsedCharacter[];
  notes: ParsedNote[];
  scenes: ParsedScene[];
}

// A helper to safely get an array from a JSON object property
const getAsArray = (obj: any) => {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    return [obj];
};

// A helper to parse Quill Delta format to plain text
const parseQuillDelta = (delta: any): string => {
    if (!delta) return '';
    if (typeof delta === 'string') return delta; // Already plain text
    if (delta.ops) {
        return delta.ops.map((op: any) => op.insert || '').join('').trim();
    }
    return '';
};


export const parseScriteFile = async (fileData: ArrayBuffer): Promise<ParsedScriteFile> => {
  const zip = await JSZip.loadAsync(fileData);
  
  const headerFile = zip.file('_header.json');
  if (!headerFile) {
    const fileList = Object.keys(zip.files).join(', ');
    throw new Error(`Invalid .scrite file: _header.json not found. Files in archive: [${fileList}]`);
  }
  
  const headerData = await headerFile.async('string');
  const jsonObj = JSON.parse(headerData);

  const structure = jsonObj.structure;
  if (!structure) {
    throw new Error('Invalid Scrite JSON structure: <structure> tag not found.');
  }

  // Get title from metadata
  const title = jsonObj.screenplay?.title || 'Untitled Import';


  // 1. Parse Script Content and Scenes
  const scriptLines: ScriptLine[] = [];
  const scenes: ParsedScene[] = [];
  const scenesFromStructure = getAsArray(structure.elements);
  let sceneCounter = 0;
  let lineCounter = 0;

  scenesFromStructure.forEach((sceneContainer: any) => {
    if (sceneContainer.scene) {
      sceneCounter++;
      let sceneTextContent = '';
      const sceneElements = getAsArray(sceneContainer.scene.elements);
      const heading = sceneContainer.scene.heading;
      let sceneSetting = 'Untitled Scene';
      
      // Add Scene Heading
      if (heading && heading.location && heading.moment) {
        sceneSetting = `${heading.locationType || 'INT.'} ${heading.location} - ${heading.moment}`;
        const sceneHeadingText = sceneSetting.toUpperCase();
        scriptLines.push({ id: `line-${lineCounter++}`, type: 'scene-heading', text: sceneHeadingText });
        sceneTextContent += sceneHeadingText + '\n\n';
      }
      
      // Add Scene Elements
      if (sceneElements) {
        sceneElements.forEach((element: any) => {
            let text = parseQuillDelta(element.text || '');
            if (!text && element.type !== 'Action') return; // Allow empty action lines

            let type: ScriptElement;

            switch(element.type) {
                case 'Action':
                    type = 'action';
                    sceneTextContent += text + '\n\n';
                    break;
                case 'Character':
                    type = 'character';
                    text = text.toUpperCase();
                    sceneTextContent += text + '\n';
                    break;
                case 'Parenthetical':
                     type = 'parenthetical';
                     text = `(${text})`;
                     sceneTextContent += text + '\n';
                    break;
                case 'Dialogue':
                    type = 'dialogue';
                    sceneTextContent += text + '\n\n';
                    break;
                case 'Transition':
                    type = 'transition';
                    text = text.toUpperCase();
                    sceneTextContent += text + '\n\n';
                    break;
                default:
                    // Default to action if type is unknown
                    type = 'action';
                    sceneTextContent += text + '\n\n';
                    break;
            }
             scriptLines.push({ id: `line-${lineCounter++}`, type, text });
        });
      }

      const wordCount = sceneTextContent.trim().split(/\s+/).filter(Boolean).length;
      let estimatedTime = isNaN(wordCount) || wordCount === 0 ? 0 : Math.round((wordCount / 160) * 10) / 10;
      
      scenes.push({
        sceneNumber: sceneCounter,
        setting: sceneSetting,
        description: parseQuillDelta(sceneContainer.scene.synopsis) || 'No synopsis available.',
        time: estimatedTime,
      });
    }
  });

  // 2. Parse Characters
  const characters: ParsedCharacter[] = [];
  const characterList = getAsArray(structure.characters);
  
  characterList.forEach((char: any) => {
    const summaryText = char.summary ? parseQuillDelta(char.summary) : '';
    const designationText = char.designation || '';
    const description = summaryText || designationText;

    if (char.name) {
        characters.push({
            name: char.name,
            description: description.split('\n')[0] || 'No description.', // Provide a fallback
            scenes: 0, // This will be calculated later
            profile: description || 'No profile available.', // Provide a fallback
        });
    }
  });

  // 3. Parse Notes
  const notes: ParsedNote[] = [];
  const notesList = getAsArray(jsonObj.screenplay?.notes?.['#data']);
  
  if (notesList) {
    notesList.forEach((note: any) => {
      if(note.type === 'TextNoteType' && note.content){
         const content = parseQuillDelta(note.content);
         if (content) {
            notes.push({
                title: note.title || 'Untitled Note',
                content: content,
                category: 'General', 
            });
         }
      }
    });
  }
  
  return {
    title,
    script: scriptLines.map(l => l.text).join('\n'),
    lines: scriptLines,
    characters,
    notes,
    scenes,
  };
};
