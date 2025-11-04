
import JSZip from 'jszip';
import { runAiReformatScript } from '@/app/actions';

// Internal interfaces for parsing the Scrite JSON structure
interface ScriteSceneElement {
  type: 'Action' | 'Character' | 'Dialogue' | 'Parenthetical' | 'Transition' | 'Shot';
  text: any; // Can be a string or a Quill Delta-like object
}

interface ScriteScene {
  id: string;
  heading?: {
    locationType?: string;
    location?: string;
    moment?: string;
  };
  synopsis?: string;
  elements?: ScriteSceneElement[];
  wordCount?: number;
}

interface ScriteStructureElement {
  scene?: ScriteScene;
}

interface ScriteCharacter {
  name?: string;
  summary?: any; // Can be string or Quill Delta
  designation?: string;
}

interface ScriteNote {
  title?: string;
  content?: any; // Can be string or Quill Delta
}

// Interfaces for the final parsed data
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
  id: string;
  sceneNumber: number;
  setting: string;
  description: string;
  time: number; // Estimated time in minutes
}

export interface ParsedAndFormattedData {
  title: string;
  formattedScript: string;
  characters: ParsedCharacter[];
  notes: ParsedNote[];
  scenes: ParsedScene[];
}

const getAsArray = (obj: any): any[] => {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    return [obj];
};

const parseQuillDelta = (delta: any): string => {
    if (!delta) return '';
    if (typeof delta === 'string') return delta.trim();
    try {
        let text = '';
        if (delta.ops) {
            text = delta.ops.map((op: any) => op.insert || '').join('');
        } else if (typeof delta === 'string') {
            const parsed = JSON.parse(delta);
            if (parsed.ops) {
                text = parsed.ops.map((op: any) => op.insert || '').join('');
            }
        }
        return text.replace(/(\n\s*)+/g, '\n').trim();
    } catch (e) {
        return '';
    }
};

/**
 * Parses a .scrite file, extracts content, reformats it via AI, and returns a structured object.
 * @param fileData The ArrayBuffer content of the .scrite file.
 * @returns A promise that resolves to the parsed and formatted data.
 */
export const parseAndReformatScriteFile = async (fileData: ArrayBuffer): Promise<ParsedAndFormattedData> => {
  const zip = await JSZip.loadAsync(fileData);
  
  const headerFile = zip.file('_header.json');
  if (!headerFile) {
    throw new Error('Invalid .scrite file: _header.json not found.');
  }
  
  const headerData = await headerFile.async('string');
  const jsonObj = JSON.parse(headerData);

  const structure = jsonObj.structure;
  if (!structure) {
    throw new Error('Invalid Scrite JSON structure: <structure> tag not found.');
  }

  const title = jsonObj.screenplay?.title || 'Untitled Scrite Import';
  const scriptLines: string[] = [];
  const scenes: ParsedScene[] = [];
  let sceneCounter = 0;

  const structureElements = getAsArray(structure.elements) as ScriteStructureElement[];

  for (const structElem of structureElements) {
    const scene = structElem.scene;
    if (!scene) continue;

    sceneCounter++;
    let sceneSetting = 'Untitled Scene';

    if (scene.heading && scene.heading.location && scene.heading.moment) {
        sceneSetting = `${scene.heading.locationType || 'INT.'} ${scene.heading.location} - ${scene.heading.moment}`;
        const sceneHeadingText = sceneSetting.toUpperCase();
        scriptLines.push(sceneHeadingText);
    }
    
    const sceneElements = getAsArray(scene.elements) as ScriteSceneElement[];
    sceneElements.forEach(element => {
        let text = parseQuillDelta(element.text || '');
        if (!text && element.type !== 'Action') return;

        let line = '';
        switch(element.type) {
            case 'Action':        line = text; break;
            case 'Character':     line = `\n${text.toUpperCase()}`; break;
            case 'Parenthetical': line = `(${text})`; break;
            case 'Dialogue':      line = text; break;
            case 'Transition':    line = `\n${text.toUpperCase()}`; break;
            case 'Shot':          line = text.toUpperCase(); break;
            default:              return;
        }
        scriptLines.push(line);
    });

    scenes.push({
      id: scene.id,
      sceneNumber: sceneCounter,
      setting: sceneSetting,
      description: scene.synopsis || "No synopsis available.",
      time: Math.round((scene.wordCount || 0) / 150) || 1, // Estimate ~150 words/min
    });
  }

  const rawScript = scriptLines.join('\n\n').replace(/\n{3,}/g, '\n\n');

  // Call AI to reformat the extracted script
  const reformatResult = await runAiReformatScript({ rawScript });
  if (reformatResult.error || !reformatResult.data) {
    throw new Error('Failed to reformat script content during import.');
  }
  const formattedScript = reformatResult.data.formattedScript;

  const characters: ParsedCharacter[] = (getAsArray(structure.characters) as ScriteCharacter[]).map(c => ({
    name: c.name || 'Unknown',
    description: parseQuillDelta(c.summary) || c.designation || 'No description.',
    scenes: 0,
  }));
  
  const notes: ParsedNote[] = (getAsArray(structure.notes?.notes) as ScriteNote[]).map(n => ({
      title: n.title || 'Untitled Note',
      content: parseQuillDelta(n.content) || '',
      category: 'General'
  }));

  return { title, formattedScript, characters, notes, scenes };
};
