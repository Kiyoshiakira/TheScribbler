
import JSZip from 'jszip';

// Internal interfaces for parsing the Scrite JSON structure
interface ScriteSceneElement {
  type: 'Action' | 'Character' | 'Dialogue' | 'Parenthetical' | 'Transition' | 'Shot';
  text: string | QuillDelta; // Can be a string or a Quill Delta-like object
}

interface QuillDelta {
  ops?: Array<{ insert?: string }>;
}

interface ScriteScene {
  id: string;
  heading?: {
    locationType?: string;
    location?: string;
    moment?: string;
    enabled?: boolean;
  };
  synopsis?: string;
  comments?: string;
  elements?: ScriteSceneElement[];
  wordCount?: number;
  notes?: ScriteSceneNotes;
}

interface ScriteSceneNotes {
  color?: string;
  id?: string;
  notes?: ScriteNote[];
}

interface ScriteStructureElement {
  scene?: ScriteScene;
}

interface ScriteScreenplayElement {
  sceneID: string;
  userSceneNumber?: string;
  omitted?: boolean;
  breakType?: number;
  breakTitle?: string;
  breakSubtitle?: string;
  elementType?: string;
}

interface ScriteCharacter {
  name?: string;
  summary?: string | QuillDelta; // Can be string or Quill Delta
  designation?: string;
}

interface ScriteNote {
  title?: string;
  content?: string | QuillDelta; // Can be string or Quill Delta
  color?: string;
}

interface ScriteTitlePage {
  title?: string;
  subtitle?: string;
  author?: string;
  authorValue?: string;
  basedOn?: string;
  contact?: string;
  address?: string;
  email?: string;
  phoneNumber?: string;
  website?: string;
  version?: string;
  logline?: string;
  elements?: ScriteScreenplayElement[];
}

// Interfaces for the final parsed data
export type NoteCategory = 'Plot' | 'Character' | 'Dialogue' | 'Research' | 'Theme' | 'Scene' | 'General';

export interface ParsedNote {
  id?: string;
  title: string;
  content: string;
  category: NoteCategory;
  color?: string; // Optional hex color from Scrite
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

const getAsArray = <T>(obj: T | T[] | null | undefined): T[] => {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    return [obj];
};

const parseQuillDelta = (delta: string | QuillDelta | null | undefined): string => {
    if (!delta) return '';
    if (typeof delta === 'string') return delta.trim();
    try {
        let text = '';
        if (delta.ops) {
            text = delta.ops.map((op) => op.insert || '').join('');
        }
        return text.replace(/(\n\s*)+/g, '\n').trim();
    } catch {
        return '';
    }
};

/**
 * Generates the Fountain title page from Scrite screenplay metadata.
 * Following Fountain standard: https://fountain.io/syntax/#title-page
 */
const generateTitlePage = (screenplay: ScriteTitlePage): string[] => {
    const titlePageLines: string[] = [];
    
    if (screenplay.title) {
        titlePageLines.push(`Title: ${screenplay.title}`);
    }
    if (screenplay.subtitle) {
        titlePageLines.push(`Credit: ${screenplay.subtitle}`);
    }
    if (screenplay.author || screenplay.authorValue) {
        titlePageLines.push(`Author: ${screenplay.author || screenplay.authorValue}`);
    }
    if (screenplay.basedOn) {
        titlePageLines.push(`Source: ${screenplay.basedOn}`);
    }
    if (screenplay.version) {
        titlePageLines.push(`Draft date: ${screenplay.version}`);
    }
    if (screenplay.contact) {
        titlePageLines.push(`Contact: ${screenplay.contact}`);
    }
    if (screenplay.address) {
        titlePageLines.push(`   ${screenplay.address}`);
    }
    if (screenplay.email) {
        titlePageLines.push(`   ${screenplay.email}`);
    }
    if (screenplay.phoneNumber) {
        titlePageLines.push(`   ${screenplay.phoneNumber}`);
    }
    if (screenplay.website) {
        titlePageLines.push(`   ${screenplay.website}`);
    }
    if (screenplay.logline) {
        titlePageLines.push(`Notes: ${screenplay.logline}`);
    }
    
    return titlePageLines;
};

/**
 * Parses a .scrite file and extracts content into a structured object.
 * 
 * This parser follows the Scrite structure where:
 * - screenplay.elements defines the canonical order of scenes
 * - structure.elements contains the scene data keyed by scene ID
 * - Title page metadata comes from screenplay fields
 * - Notes can come from structure.notes or scene-level notes
 * 
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
    throw new Error('Invalid Scrite JSON structure: structure not found.');
  }

  const screenplay = (jsonObj.screenplay as ScriteTitlePage) || {};
  const title = screenplay.title || 'Untitled Scrite Import';
  const scriptLines: string[] = [];
  const scenes: ParsedScene[] = [];
  const notes: ParsedNote[] = [];
  
  // Step 1: Generate title page (goes at the very top)
  const titlePageLines = generateTitlePage(screenplay);
  if (titlePageLines.length > 0) {
    scriptLines.push(...titlePageLines);
    scriptLines.push(''); // Blank line after title page
  }
  
  // Step 2: Build scene map from structure.elements for O(1) lookup
  const sceneMap = new Map<string, ScriteScene>();
  const structureElements = getAsArray(structure.elements) as ScriteStructureElement[];
  for (const structElem of structureElements) {
    if (structElem.scene) {
      sceneMap.set(structElem.scene.id, structElem.scene);
    }
  }
  
  // Step 3: Extract global notes from structure.notes
  // Notes in Scrite are stored in a nested structure: structure.notes.notes[]
  const globalNotes = structure.notes;
  if (globalNotes && globalNotes.notes && Array.isArray(globalNotes.notes)) {
    for (const note of globalNotes.notes as ScriteNote[]) {
      notes.push({
        title: note.title || 'Untitled Note',
        content: parseQuillDelta(note.content) || '',
        category: 'General',
        color: note.color
      });
    }
  }
  
  // Step 4: Process scenes in screenplay.elements order (the canonical order)
  const screenplayElements = getAsArray(screenplay.elements) as ScriteScreenplayElement[];
  let sceneCounter = 0;
  
  for (const spElement of screenplayElements) {
    // Handle act/episode breaks (these are structural markers, not scenes)
    if (spElement.elementType === 'BreakElementType' || (spElement.breakType !== undefined && spElement.breakType >= 0)) {
      if (spElement.breakTitle || spElement.breakSubtitle) {
        scriptLines.push('');
        const breakText = [spElement.breakTitle, spElement.breakSubtitle].filter(Boolean).join(' - ');
        scriptLines.push(`# ${breakText}`);
        scriptLines.push('');
      }
      continue;
    }
    
    const scene = sceneMap.get(spElement.sceneID);
    if (!scene) continue;
    
    // Handle omitted scenes - add a comment in the script
    // Use the userSceneNumber from the screenplay element for accurate numbering
    if (spElement.omitted) {
      if (scene.heading && scene.heading.location) {
        const heading = `${scene.heading.locationType || 'INT.'} ${scene.heading.location} - ${scene.heading.moment || 'DAY'}`;
        scriptLines.push('');
        scriptLines.push(`/* OMITTED: ${heading.toUpperCase()} #${spElement.userSceneNumber || 'X'}# */`);
      }
      continue;
    }
    
    sceneCounter++;
    let sceneSetting = 'Untitled Scene';

    // Add scene heading in proper Fountain format with scene number
    if (scene.heading && scene.heading.location) {
      sceneSetting = `${scene.heading.locationType || 'INT.'} ${scene.heading.location} - ${scene.heading.moment || 'DAY'}`;
      const sceneHeadingText = sceneSetting.toUpperCase();
      
      // Ensure blank line before scene heading
      if (scriptLines.length > 0 && scriptLines[scriptLines.length - 1] !== '') {
        scriptLines.push(''); // Blank line before scene heading
      }
      
      // Add scene number if available (Fountain format: #number#)
      const sceneNumber = spElement.userSceneNumber || String(sceneCounter);
      scriptLines.push(`${sceneHeadingText} #${sceneNumber}#`);
      
      // Add synopsis as Fountain synopsis if available
      if (scene.synopsis) {
        scriptLines.push(`= ${scene.synopsis}`);
      }
      
      scriptLines.push(''); // Blank line after scene heading/synopsis
    }
    
    // Extract scene-level notes (add to notes collection for side panel, not inline in script)
    // Scene notes are stored in scene.notes.notes[] array
    if (scene.notes && scene.notes.notes && Array.isArray(scene.notes.notes)) {
      for (const note of scene.notes.notes as ScriteNote[]) {
        notes.push({
          title: note.title || `Scene ${sceneCounter} Note`,
          content: parseQuillDelta(note.content) || '',
          category: 'Scene',
          color: note.color
        });
      }
    }
    
    // Add scene comments as a note if present
    if (scene.comments) {
      notes.push({
        title: `Scene ${sceneCounter} Comments`,
        content: scene.comments,
        category: 'Scene'
      });
    }
    
    // Process scene elements
    const sceneElements = getAsArray(scene.elements) as ScriteSceneElement[];
    let previousElementType: string | null = null;
    
    sceneElements.forEach((element) => {
      const text = parseQuillDelta(element.text);
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
        case 'Parenthetical': {
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
        }
        case 'Dialogue':
          scriptLines.push(text);
          break;
        case 'Transition': {
          // Transitions should be uppercase
          // Standard transitions (ending with :) are used as-is
          // Others get > prefix to mark as forced transitions
          const transition = text.toUpperCase();
          const formattedTransition = transition.endsWith(':') ? transition : `> ${transition}`;
          scriptLines.push(formattedTransition);
          break;
        }
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

  // Parse characters from structure
  const characters: ParsedCharacter[] = (getAsArray(structure.characters) as ScriteCharacter[]).map(c => ({
    name: c.name || 'Unknown',
    description: parseQuillDelta(c.summary) || c.designation || 'No description.',
    scenes: 0,
  }));

  return { title, rawScript, characters, notes, scenes };
};
