import JSZip from 'jszip';

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
  script: string;
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
    if (!delta || !delta.ops) return '';
    return delta.ops.map((op: any) => op.insert || '').join('').trim();
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

  // 1. Parse Script Content and Scenes
  let scriptContent = '';
  const scenes: ParsedScene[] = [];
  const scenesFromStructure = getAsArray(structure.elements);
  let sceneCounter = 0;


  scenesFromStructure.forEach((sceneContainer: any) => {
    if (sceneContainer.scene?.elements) {
      sceneCounter++;
      let sceneText = '';
      const sceneElements = getAsArray(sceneContainer.scene.elements);
      const heading = sceneContainer.scene.heading;
      let sceneSetting = 'Untitled Scene';

      if (heading && heading.location && heading.moment) {
        sceneSetting = `${heading.locationType || 'EXT.'} ${heading.location} - ${heading.moment}`;
        sceneText += sceneSetting.toUpperCase() + '\n\n';
      }
      
      sceneElements.forEach((element: any) => {
        let text = element.text || '';
        text = text.replace(/<[^>]*>?/gm, ''); // Strip any HTML tags if present

        switch(element.type) {
            case 'Action':
                sceneText += text + '\n\n';
                break;
            case 'Character':
                sceneText += `\t${text.toUpperCase()}\n`;
                break;

            case 'Parenthetical':
                sceneText += `\t${text}\n`;
                break;
            case 'Dialogue':
                 sceneText += `\t\t${text}\n\n`;
                break;
             case 'Transition':
                sceneText += `\t\t\t\t\t\t${text.toUpperCase()}\n\n`;
                break;
            default:
                sceneText += text + '\n';
        }
      });

      const wordCount = sceneText.trim().split(/\s+/).filter(Boolean).length;
      const estimatedTime = Math.round((wordCount / 160) * 10) / 10; // Approx 160 words per minute
      
      scenes.push({
        sceneNumber: sceneCounter,
        setting: sceneSetting,
        description: sceneContainer.scene.synopsis || 'No synopsis available.',
        time: estimatedTime,
      });

      scriptContent += sceneText;
    }
  });

  // 2. Parse Characters
  const characters: ParsedCharacter[] = [];
  const characterList = getAsArray(structure.characters);
  
  characterList.forEach((char: any) => {
    const description = char.summary ? parseQuillDelta(char.summary) : (char.designation || '');
    characters.push({
      name: char.name || 'Unnamed',
      description: description.split('\n')[0], 
      scenes: 0, 
      profile: description, 
    });
  });

  // 3. Parse Notes
  const notes: ParsedNote[] = [];
  const notesList = getAsArray(jsonObj.screenplay?.notes?.['#data']);
  
  if (notesList) {
    notesList.forEach((note: any) => {
      if(note.type === 'TextNoteType' && note.content){
         notes.push({
            title: note.title || 'Untitled Note',
            content: parseQuillDelta(note.content),
            category: 'General', 
        });
      }
    });
  }
  
  return {
    script: scriptContent.trim(),
    characters,
    notes,
    scenes,
  };
};
