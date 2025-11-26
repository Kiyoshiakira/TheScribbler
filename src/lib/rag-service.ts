/**
 * @fileoverview RAG (Retrieval-Augmented Generation) Service
 * 
 * This service implements semantic search and chunk retrieval for long documents.
 * It helps pass only the most relevant sections to the LLM, saving tokens and
 * improving relevance.
 */

import { SemanticDocument, SemanticBlock } from './semantic-document-model';

/**
 * A chunk of the document for RAG processing
 */
export interface DocumentChunk {
  /** Unique identifier for this chunk */
  id: string;
  
  /** Block IDs included in this chunk */
  blockIds: string[];
  
  /** The text content of this chunk */
  text: string;
  
  /** Scene number(s) this chunk belongs to */
  sceneNumbers: number[];
  
  /** Characters mentioned in this chunk */
  characters: string[];
  
  /** Metadata about this chunk */
  metadata: {
    startIndex: number;
    endIndex: number;
    wordCount: number;
    type: 'scene' | 'sequence' | 'context';
  };
}

/**
 * Configuration for chunking strategy
 */
export interface ChunkingConfig {
  /** Maximum number of blocks per chunk */
  maxBlocksPerChunk?: number;
  
  /** Chunk by scene boundaries (default: true) */
  chunkByScene?: boolean;
  
  /** Overlap between chunks in blocks */
  overlapBlocks?: number;
  
  /** Maximum word count per chunk */
  maxWordsPerChunk?: number;
}

/**
 * Result from a semantic search
 */
export interface SearchResult {
  /** The matched chunks, ordered by relevance */
  chunks: DocumentChunk[];
  
  /** Relevance scores (0-1) for each chunk */
  scores: number[];
  
  /** Combined text of top chunks */
  combinedText: string;
  
  /** Total number of chunks searched */
  totalChunks: number;
}

/**
 * Create document chunks from a semantic document
 */
export function createDocumentChunks(
  doc: SemanticDocument,
  config: ChunkingConfig = {}
): DocumentChunk[] {
  const {
    maxBlocksPerChunk = 20,
    chunkByScene = true,
    overlapBlocks = 3,
    // maxWordsPerChunk reserved for future word-based chunking
  } = config;
  
  const chunks: DocumentChunk[] = [];
  
  if (chunkByScene && doc.sceneStructure) {
    // Chunk by scenes
    doc.sceneStructure.forEach((scene, sceneIndex) => {
      const sceneBlocks = doc.blocks.filter(b => scene.blockIds.includes(b.id));
      
      // If scene is too large, split it further
      if (sceneBlocks.length > maxBlocksPerChunk) {
        let startIdx = 0;
        while (startIdx < sceneBlocks.length) {
          const endIdx = Math.min(startIdx + maxBlocksPerChunk, sceneBlocks.length);
          const chunkBlocks = sceneBlocks.slice(startIdx, endIdx);
          
          chunks.push(createChunkFromBlocks(
            chunkBlocks,
            `scene-${sceneIndex}-part-${Math.floor(startIdx / maxBlocksPerChunk)}`,
            'sequence'
          ));
          
          startIdx = endIdx - overlapBlocks; // Add overlap
        }
      } else {
        chunks.push(createChunkFromBlocks(sceneBlocks, `scene-${sceneIndex}`, 'scene'));
      }
    });
  } else {
    // Chunk by fixed size
    let startIdx = 0;
    let chunkIndex = 0;
    
    while (startIdx < doc.blocks.length) {
      const endIdx = Math.min(startIdx + maxBlocksPerChunk, doc.blocks.length);
      const chunkBlocks = doc.blocks.slice(startIdx, endIdx);
      
      chunks.push(createChunkFromBlocks(chunkBlocks, `chunk-${chunkIndex}`, 'context'));
      
      startIdx = endIdx - overlapBlocks;
      chunkIndex++;
    }
  }
  
  return chunks;
}

/**
 * Create a single chunk from blocks
 */
function createChunkFromBlocks(
  blocks: SemanticBlock[],
  id: string,
  type: DocumentChunk['metadata']['type']
): DocumentChunk {
  const text = blocks.map(b => b.text).join('\n\n');
  const wordCount = text.split(/\s+/).length;
  const sceneNumbers = Array.from(
    new Set(blocks.map(b => b.metadata.sceneNumber).filter(Boolean) as number[])
  );
  const characters = Array.from(
    new Set(
      blocks.flatMap(b => [
        b.metadata.characterId,
        ...(b.metadata.characterIds || [])
      ]).filter(Boolean) as string[]
    )
  );
  
  return {
    id,
    blockIds: blocks.map(b => b.id),
    text,
    sceneNumbers,
    characters,
    metadata: {
      startIndex: blocks[0].metadata.index,
      endIndex: blocks[blocks.length - 1].metadata.index,
      wordCount,
      type,
    },
  };
}

/**
 * Perform semantic search on document chunks
 * This is a simple keyword-based implementation. In production, you'd use
 * embedding-based similarity search with a vector database.
 */
export function searchChunks(
  chunks: DocumentChunk[],
  query: string,
  topK: number = 3
): SearchResult {
  const queryTerms = extractKeyTerms(query);
  
  // Score each chunk
  const scoredChunks = chunks.map(chunk => {
    const score = calculateRelevanceScore(chunk, queryTerms, query);
    return { chunk, score };
  });
  
  // Sort by score and take top K
  scoredChunks.sort((a, b) => b.score - a.score);
  const topChunks = scoredChunks.slice(0, topK);
  
  const resultChunks = topChunks.map(sc => sc.chunk);
  const scores = topChunks.map(sc => sc.score);
  const combinedText = resultChunks.map(c => c.text).join('\n\n---\n\n');
  
  return {
    chunks: resultChunks,
    scores,
    combinedText,
    totalChunks: chunks.length,
  };
}

/**
 * Extract key terms from a query
 */
function extractKeyTerms(query: string): string[] {
  // Remove common words and extract significant terms
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  ]);
  
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 2 && !commonWords.has(term));
}

/**
 * Calculate relevance score for a chunk
 */
function calculateRelevanceScore(
  chunk: DocumentChunk,
  queryTerms: string[],
  originalQuery: string
): number {
  const chunkTextLower = chunk.text.toLowerCase();
  let score = 0;
  
  // Exact phrase match gets highest score
  if (chunkTextLower.includes(originalQuery.toLowerCase())) {
    score += 10;
  }
  
  // Term frequency scoring
  queryTerms.forEach(term => {
    const termRegex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = chunkTextLower.match(termRegex);
    if (matches) {
      score += matches.length * 2;
    }
  });
  
  // Character name matches
  queryTerms.forEach(term => {
    if (chunk.characters.some(char => char.toLowerCase().includes(term))) {
      score += 3;
    }
  });
  
  // Boost recent chunks slightly (recency bias)
  score += chunk.metadata.startIndex * 0.01;
  
  return score;
}

/**
 * Get relevant context for a specific edit operation
 */
export function getRelevantContext(
  doc: SemanticDocument,
  query: string,
  blockId?: string,
  maxTokens: number = 2000
): SearchResult {
  // Create chunks from document
  const chunks = createDocumentChunks(doc, {
    maxBlocksPerChunk: 15,
    chunkByScene: true,
    overlapBlocks: 2,
  });
  
  // If blockId is provided, include that block's scene as context
  const contextChunks: DocumentChunk[] = [];
  
  if (blockId) {
    const block = doc.blocks.find(b => b.id === blockId);
    if (block && block.metadata.sceneNumber) {
      const sceneChunk = chunks.find(c => 
        c.sceneNumbers.includes(block.metadata.sceneNumber!)
      );
      if (sceneChunk) {
        contextChunks.push(sceneChunk);
      }
    }
  }
  
  // Search for relevant chunks
  const searchResults = searchChunks(chunks, query, 3);
  
  // Combine with context chunks, removing duplicates
  const allChunks = [
    ...contextChunks,
    ...searchResults.chunks.filter(c => !contextChunks.some(cc => cc.id === c.id)),
  ];
  
  // Estimate token count (rough: 1 token ≈ 4 characters)
  let combinedText = '';
  const includedChunks: DocumentChunk[] = [];
  let tokenCount = 0;
  
  for (const chunk of allChunks) {
    const chunkTokens = Math.ceil(chunk.text.length / 4);
    if (tokenCount + chunkTokens <= maxTokens) {
      includedChunks.push(chunk);
      combinedText += (combinedText ? '\n\n---\n\n' : '') + chunk.text;
      tokenCount += chunkTokens;
    } else {
      break;
    }
  }
  
  return {
    chunks: includedChunks,
    scores: searchResults.scores.slice(0, includedChunks.length),
    combinedText,
    totalChunks: chunks.length,
  };
}

/**
 * Get story notes context (for Story Scribbler)
 */
export function getStoryNotesContext(
  notes: Array<{ title: string; content: string; category: string }>,
  query: string,
  maxNotes: number = 5
): string {
  // Score notes by relevance
  const queryTerms = extractKeyTerms(query);
  const scoredNotes = notes.map(note => {
    let score = 0;
    const noteText = `${note.title} ${note.content}`.toLowerCase();
    
    queryTerms.forEach(term => {
      const matches = noteText.match(new RegExp(`\\b${term}\\b`, 'gi'));
      if (matches) {
        score += matches.length;
      }
    });
    
    return { note, score };
  });
  
  // Sort and take top notes
  scoredNotes.sort((a, b) => b.score - a.score);
  const topNotes = scoredNotes.slice(0, maxNotes);
  
  return topNotes
    .map(({ note }) => `[${note.category}] ${note.title}\n${note.content}`)
    .join('\n\n---\n\n');
}
