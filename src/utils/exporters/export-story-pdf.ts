/**
 * @fileoverview Export story content to PDF format using browser's print functionality
 */

export interface Chapter {
  title: string;
  summary?: string;
  content: string;
  order: number;
  wordCount?: number;
}

export interface StoryData {
  title: string;
  logline?: string;
  chapters?: Chapter[];
}

/**
 * Exports story data to PDF using the browser's print dialog
 * @param data The story data to export
 * @returns A promise that resolves when the print dialog is opened
 */
export async function exportStoryToPDF(data: StoryData): Promise<void> {
  // Create an HTML representation of the story
  const html = generateStoryHTML(data);
  
  // Create a hidden iframe for PDF generation
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('Failed to access iframe document');
  }

  // Write the HTML to the iframe
  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Use the browser's print API to generate PDF
  return new Promise<void>((resolve, reject) => {
    let cleaned = false;
    
    const cleanup = () => {
      if (!cleaned && document.body.contains(iframe)) {
        cleaned = true;
        document.body.removeChild(iframe);
      }
    };

    try {
      // Wait for content to load
      setTimeout(() => {
        try {
          iframe.contentWindow?.print();
          
          // Clean up after a delay
          setTimeout(cleanup, 1000);
          
          resolve();
        } catch (printError) {
          cleanup();
          reject(printError);
        }
      }, 100);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

/**
 * Generates HTML with proper formatting for PDF generation
 */
function generateStoryHTML(data: StoryData): string {
  const sections: string[] = [];

  // Title page
  sections.push(`
    <div class="title-page">
      <h1 class="main-title">${escapeHTML(data.title)}</h1>
      ${data.logline ? `<p class="logline">${escapeHTML(data.logline)}</p>` : ''}
    </div>
  `);

  // Chapters
  if (data.chapters && data.chapters.length > 0) {
    const sortedChapters = [...data.chapters].sort((a, b) => a.order - b.order);
    
    sortedChapters.forEach((chapter, index) => {
      sections.push(`
        <div class="chapter${index > 0 ? ' page-break' : ''}">
          <h2 class="chapter-title">Chapter ${index + 1}: ${escapeHTML(chapter.title)}</h2>
          ${chapter.summary ? `<p class="chapter-summary">${escapeHTML(chapter.summary)}</p>` : ''}
          <div class="chapter-content">
            ${chapter.content.split('\n').filter(p => p.trim()).map(p => 
              `<p class="content-paragraph">${escapeHTML(p)}</p>`
            ).join('\n            ')}
          </div>
        </div>
      `);
    });
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(data.title)}</title>
  <style>
    @page {
      size: 8.5in 11in;
      margin: 1in;
    }
    
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    
    .title-page {
      text-align: center;
      margin-bottom: 3in;
      page-break-after: always;
    }
    
    .main-title {
      font-size: 24pt;
      font-weight: bold;
      margin-top: 3in;
      margin-bottom: 0.5in;
    }
    
    .logline {
      font-size: 14pt;
      font-style: italic;
      color: #333;
      max-width: 6in;
      margin: 0 auto;
    }
    
    .chapter {
      margin-bottom: 2em;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    .chapter-title {
      font-size: 18pt;
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 0.5em;
    }
    
    .chapter-summary {
      font-style: italic;
      color: #555;
      margin-bottom: 1em;
    }
    
    .chapter-content {
      text-align: justify;
    }
    
    .content-paragraph {
      margin: 0 0 1em 0;
      text-indent: 2em;
    }
    
    .content-paragraph:first-child {
      text-indent: 0;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  ${sections.join('\n  ')}
</body>
</html>`;
}

/**
 * Escapes HTML special characters
 */
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
