'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Download, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ImportScritePage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    header?: Record<string, unknown>;
    fountain?: string;
    error?: string;
    filename?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.scrite')) {
      setResult({
        success: false,
        error: 'Please select a .scrite file',
      });
      return;
    }

    processFile(file);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setResult(null);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Content = e.target?.result as string;

        // Call API
        const response = await fetch('/api/import-scrite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: file.name,
            content: base64Content,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setResult({
            success: true,
            header: data.header,
            fountain: data.fountain,
            filename: file.name.replace('.scrite', '.fountain'),
          });
        } else {
          setResult({
            success: false,
            error: data.error || 'Unknown error occurred',
          });
        }

        setIsProcessing(false);
      };

      reader.onerror = () => {
        setResult({
          success: false,
          error: 'Failed to read file',
        });
        setIsProcessing(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result?.fountain || !result?.filename) return;

    const blob = new Blob([result.fountain], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Scrite to Fountain Converter</h1>
          <p className="text-muted-foreground">
            Upload a .scrite file to convert it to Fountain format. Preview the results and download the .fountain file.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload .scrite File</CardTitle>
            <CardDescription>
              Select a Scrite screenplay file to extract and convert to Fountain format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept=".scrite"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="space-y-4">
              <Button
                onClick={handleUploadClick}
                disabled={isProcessing}
                className="w-full sm:w-auto"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Choose .scrite File
                  </>
                )}
              </Button>

              {result && (
                <div className="space-y-4">
                  {result.success ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Conversion Successful</AlertTitle>
                      <AlertDescription>
                        Your Scrite file has been converted to Fountain format. Preview below and download when ready.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Conversion Failed</AlertTitle>
                      <AlertDescription>{result.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {result?.success && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Download Fountain File</CardTitle>
                <CardDescription>
                  Download the converted screenplay in Fountain format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleDownload} className="w-full sm:w-auto">
                    <Download className="h-4 w-4" />
                    Download {result.filename}
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
                    <Upload className="h-4 w-4" />
                    Upload Another File
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  View the extracted Scrite header and converted Fountain text
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="fountain" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="fountain">
                      <FileText className="h-4 w-4 mr-2" />
                      Fountain Text
                    </TabsTrigger>
                    <TabsTrigger value="header">
                      <FileText className="h-4 w-4 mr-2" />
                      Header JSON
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="fountain" className="mt-4">
                    <div className="bg-muted rounded-md p-4 overflow-auto max-h-[600px]">
                      <pre className="text-sm font-mono whitespace-pre-wrap">
                        {result.fountain}
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="header" className="mt-4">
                    <div className="bg-muted rounded-md p-4 overflow-auto max-h-[600px]">
                      <pre className="text-sm font-mono whitespace-pre-wrap">
                        {JSON.stringify(result.header, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>About This Tool</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              This tool converts Scrite screenplay files to Fountain format, a plain-text screenplay format that&apos;s widely supported.
            </p>
            <h4>Conversion Details:</h4>
            <ul>
              <li>Scene headings, action, character names, dialogue, parentheticals, and transitions are converted to Fountain format</li>
              <li>The converter uses conservative mapping for common element types</li>
              <li>Elements that cannot be confidently mapped are included as commented JSON blocks to prevent data loss</li>
              <li>The resulting .fountain file can be imported into most screenplay software</li>
            </ul>
            <h4>Next Steps:</h4>
            <ul>
              <li>Download the .fountain file using the button above</li>
              <li>Import the file into your preferred screenplay editor</li>
              <li>Use the Fountain text with print exporters to generate PDFs</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
