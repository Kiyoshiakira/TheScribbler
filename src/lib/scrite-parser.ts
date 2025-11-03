
import JSZip from 'jszip';

// These interfaces are simplified representations of the Scrite JSON structure.
// They help in safely navigating the complex object.

interface ScriteSceneElement {
  type: 'Action' | 'Character' | 'Dialogue' | 'Parenthetical' | 'Transition' | 'Shot';
  text: string;
}

interface ScriteScene {
  heading?: {
    locationType?: string;
    location?: string;
    moment?: string;
  };
  synopsis?: string;
  elements?: ScriteSceneElement[];
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

// Final output interfaces remain the same
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
        // Remove excessive newlines and whitespace that can come from Quill
        return text.replace(/(\n\s*)+/g, '\n').trim();
    } catch (e) {
        return ''; // Return empty string on parse error
    }
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

  const title = jsonObj.screenplay?.title || 'Untitled Import';
  const scriptLines: string[] = [];
  const scenes: ParsedScene[] = [];
  let sceneCounter = 0;

  const structureElements = getAsArray(structure.elements) as ScriteStructureElement[];

  for (const structElem of structureElements) {
    const scene = structElem.scene;
    if (!scene) continue;

    sceneCounter++;
    const sceneParts: string[] = [];
    const heading = scene.heading;
    let sceneSetting = 'Untitled Scene';

    if (heading && heading.location && heading.moment) {
        sceneSetting = `${heading.locationType || 'INT.'} ${heading.location} - ${heading.moment}`;
        const sceneHeadingText = sceneSetting.toUpperCase();
        scriptLines.push(sceneHeadingText);
    }
    
    const sceneElements = getAsArray(scene.elements) as ScriteSceneElement[];
    if (sceneElements) {
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
    }

    scenes.push({
      id: scene.id,
      sceneNumber: sceneCounter,
      setting: sceneSetting,
      description: scene.synopsis || "No synopsis available.",
      time: Math.round(scene.wordCount / 20) / 10 || 1, // Rough estimate: 1 page/min, 200 words/page
    });
  }

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

  const script = scriptLines.join('\n\n').replace(/\n\n\n/g, '\n\n');

  return { title, script, characters, notes, scenes };
};
