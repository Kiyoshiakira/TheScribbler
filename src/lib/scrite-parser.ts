
import JSZip from 'jszip';

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

export interface ParsedScriteData {
  title: string;
  rawScript: string;
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
    } catch {
        return '';
    }
};

/**
 * Parses a .scrite file and extracts content into a structured object.
 * @param fileData The ArrayBuffer content of the .scrite file.
 * @returns A promise that resolves to the parsed data with raw script content.
 */
export const parseScriteFile = async (fileData: ArrayBuffer): Promise<ParsedScriteData> => {
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

    // Add scene heading in proper Fountain format
    if (scene.heading && scene.heading.location && scene.heading.moment) {
        sceneSetting = `${scene.heading.locationType || 'INT.'} ${scene.heading.location} - ${scene.heading.moment}`;
        const sceneHeadingText = sceneSetting.toUpperCase();
        // Ensure blank line before scene heading (except for first scene)
        if (scriptLines.length > 0) {
            scriptLines.push(''); // Blank line before scene heading
        }
        scriptLines.push(sceneHeadingText);
        scriptLines.push(''); // Blank line after scene heading
    }
    
    const sceneElements = getAsArray(scene.elements) as ScriteSceneElement[];
    let previousElementType: string | null = null;
    
    sceneElements.forEach((element) => {
        const text = parseQuillDelta(element.text || '');
        if (!text && element.type !== 'Action') return;

        // Add spacing based on Fountain rules
        const isCharacterAfterNonParenthetical = 
            element.type === 'Character' && 
            previousElementType !== 'Parenthetical' && 
            previousElementType !== 'Character';
        const isTransition = element.type === 'Transition' && previousElementType !== null;
        const isActionAfterDialogueOrTransition = 
            element.type === 'Action' && 
            (previousElementType === 'Dialogue' || previousElementType === 'Transition');
        
        const needsBlankLineBefore = 
            isCharacterAfterNonParenthetical || 
            isTransition || 
            isActionAfterDialogueOrTransition;

        if (needsBlankLineBefore && scriptLines.length > 0 && scriptLines[scriptLines.length - 1] !== '') {
            scriptLines.push(''); // Add blank line for separation
        }

        switch(element.type) {
            case 'Action':
                scriptLines.push(text);
                break;
            case 'Character':
                // Character names must be uppercase and left-aligned (Fountain handles centering)
                scriptLines.push(text.toUpperCase());
                break;
            case 'Parenthetical':
                // Ensure parentheses are present on both sides
                let parenthetical = text;
                if (!parenthetical.startsWith('(')) {
                    parenthetical = '(' + parenthetical;
                }
                if (!parenthetical.endsWith(')')) {
                    parenthetical = parenthetical + ')';
                }
                scriptLines.push(parenthetical);
                break;
            case 'Dialogue':
                scriptLines.push(text);
                break;
            case 'Transition':
                // Transitions should be uppercase
                // Standard transitions (ending with :) are used as-is
                // Others get > prefix to mark as forced transitions
                const transition = text.toUpperCase();
                const formattedTransition = transition.endsWith(':') ? transition : `> ${transition}`;
                scriptLines.push(formattedTransition);
                break;
            case 'Shot':
                scriptLines.push(text.toUpperCase());
                break;
            default:
                return;
        }
        
        previousElementType = element.type;
    });

    scenes.push({
      id: scene.id,
      sceneNumber: sceneCounter,
      setting: sceneSetting,
      description: scene.synopsis || "No synopsis available.",
      time: Math.round((scene.wordCount || 0) / 150) || 1, // Estimate ~150 words/min
    });
  }

  // Join lines with single newlines, the blank lines are already in the array
  const rawScript = scriptLines.join('\n').replace(/\n{3,}/g, '\n\n');

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

  return { title, rawScript, characters, notes, scenes };
};
