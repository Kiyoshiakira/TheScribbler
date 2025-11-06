/**
 * scriteImporter.ts
 * 
 * Lightweight wrapper around the existing scrite-parser that extracts:
 * 1. The raw header JSON from the .scrite file
 * 2. The converted Fountain text
 * 
 * This is used by the import-scrite API and page for preview/download functionality.
 */

import JSZip from 'jszip';
import { parseScriteFile } from './scrite-parser';

export interface ScriteImportResult {
  success: boolean;
  headerJson?: Record<string, unknown>;
  fountainText?: string;
  error?: string;
}

/**
 * Imports a .scrite file and returns the header JSON and Fountain conversion.
 * @param fileData The ArrayBuffer content of the .scrite file
 * @returns Promise with header JSON and Fountain text
 */
export async function importScriteFile(fileData: ArrayBuffer): Promise<ScriteImportResult> {
  try {
    // Load the zip file
    const zip = await JSZip.loadAsync(fileData);
    
    // Try to find the header file (Scrite uses _header.json)
    const headerFile = zip.file('_header.json') || zip.file('header.json') || zip.file('header');
    
    if (!headerFile) {
      return {
        success: false,
        error: 'Invalid .scrite file: header not found (tried _header.json, header.json, header)',
      };
    }
    
    // Extract and parse the header JSON
    const headerContent = await headerFile.async('string');
    const headerJson = JSON.parse(headerContent);
    
    // Use the existing parser to convert to Fountain
    const parsedData = await parseScriteFile(fileData);
    
    // The rawScript from parseScriteFile is already in Fountain format
    const fountainText = parsedData.rawScript;
    
    return {
      success: true,
      headerJson,
      fountainText,
    };
  } catch (error) {
    console.error('Error importing Scrite file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during import',
    };
  }
}
