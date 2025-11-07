
'use client';
import {
  Book,
  ChevronDown,
  Download,
  FileJson,
  LogOut,
  Settings,
  Upload,
  User as UserIcon,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '../ui/sidebar';
import { GoogleDocIcon } from '../ui/icons';
import { useAuth, useUser, useFirestore, FirestorePermissionError, errorEmitter, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Skeleton } from '../ui/skeleton';
import { useScript } from '@/context/script-context';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';
import { parseScriteFile, ParsedScriteData } from '@/lib/scrite-parser';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import JSZip from 'jszip';
import { useCurrentScript } from '@/context/current-script-context';
import type { View } from './AppLayout';
import { runAiReformatScript } from '@/app/actions';
import { useGooglePicker } from '@/hooks/use-google-picker';
import { cn } from '@/lib/utils';
import { parseScreenplay } from '@/lib/screenplay-parser';
import { exportToFountain } from '@/lib/export-fountain';
import { exportToPlainText } from '@/lib/export-txt';
import { exportToFinalDraft } from '@/lib/export-fdx';
import { exportToPDF } from '@/lib/export-pdf';
import { exportToGoogleDocs, getGoogleDocsUrl } from '@/lib/export-google-docs';


interface AppHeaderProps {
  activeView: View;
  setView: (view: View | 'settings' | 'profile-edit') => void;
}

export default function AppHeader({ activeView, setView }: AppHeaderProps) {
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { script, characters, scenes, notes, setScriptTitle, isScriptLoading, saveStatus } = useScript();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentScriptId, setCurrentScriptId } = useCurrentScript();

  const userProfileRef = useMemoFirebase(() => {
    if (user && firestore) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [user, firestore]);
  const { data: userProfile } = useDoc(userProfileRef);

  const handleSignOut = async () => {
    if (auth) {
        await signOut(auth);
        setCurrentScriptId(null);
        router.push('/login');
    }
  };

    const processImportedContent = async (title: string, content: string, subCollections?: Omit<ParsedScriteData, 'title' | 'rawScript'>) => {
        if (!firestore || !user) return;
        const { dismiss, update } = toast({
            id: 'import-toast',
            title: 'Saving Script...',
            description: 'Adding the new script to your collection.',
        });
        
        try {
            const batch = writeBatch(firestore);
            const newScriptRef = doc(collection(firestore, 'users', user.uid, 'scripts'));
            
            batch.set(newScriptRef, {
                title: title,
                content: content,
                authorId: user.uid,
                createdAt: serverTimestamp(),
                lastModified: serverTimestamp(),
            });

            if (subCollections) {
                if (subCollections.characters) {
                    const charactersCol = collection(newScriptRef, 'characters');
                    subCollections.characters.forEach((char: any) => {
                        const { id, ...charData } = char;
                        batch.set(doc(charactersCol), {
                            ...charData,
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                        });
                    });
                }
                if (subCollections.scenes) {
                    const scenesCol = collection(newScriptRef, 'scenes');
                    subCollections.scenes.forEach((scene: any) => {
                        const { id, ...sceneData } = scene;
                        batch.set(doc(scenesCol), {
                            ...sceneData,
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                        });
                    });
                }
                if (subCollections.notes) {
                    const notesCol = collection(newScriptRef, 'notes');
                    subCollections.notes.forEach((note: any) => {
                        const { id, ...noteData } = note;
                        batch.set(doc(notesCol), {
                            ...noteData,
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                        });
                    });
                }
            }

            await batch.commit().catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: `users/${user.uid}/scripts`,
                    operation: 'write',
                    requestResourceData: { script: "Batch write for import" },
                });
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            });

            dismiss();
            toast({
                title: 'Import Successful',
                description: `"${title}" has been added to your scripts.`,
            });
            setCurrentScriptId(newScriptRef.id);
            setView('dashboard');
        } catch (error: any) {
             console.error("Error processing imported content:", error);
             dismiss();
             if (!(error instanceof FirestorePermissionError)) {
                toast({
                    variant: 'destructive',
                    title: 'Import Failed',
                    description: error.message || 'An unknown error occurred during import.',
                });
             }
        }
    }


    const { openPicker } = useGooglePicker({
        onFilePicked: async (fileName, fileContent) => {
            const { dismiss, update } = toast({
                id: 'gdoc-reformat-toast',
                title: 'Reformatting Script...',
                description: 'AI is cleaning up the script format.'
            });

            const reformatResult = await runAiReformatScript({ rawScript: fileContent });
            dismiss();

            if (reformatResult.error || !reformatResult.data) {
                toast({
                    variant: 'destructive',
                    title: 'Reformatting Failed',
                    description: 'Falling back to raw text import.'
                });
                processImportedContent(fileName, fileContent);
            } else {
                processImportedContent(fileName, reformatResult.data.formattedScript);
            }
        },
    });


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.scrite')) {
      handleScriteImport(file);
    } else if (file.name.endsWith('.scribbler')) {
      handleScribblerImport(file);
    } else {
      toast({
        variant: 'destructive',
        title: 'Unsupported File Type',
        description: 'Please select a .scrite or .scribbler file.',
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const handleScribblerImport = async (file: File) => {
    if (!firestore || !user) return;
    const { dismiss, update } = toast({
      id: 'scribbler-import-toast',
      title: 'Importing Scribbler File...',
      description: 'Reading the project archive.',
    });
    
    try {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        
        const projectFile = zip.file('project.json');
        if (!projectFile) throw new Error('Invalid .scribbler file: project.json not found.');
        
        update({ id: 'scribbler-import-toast', description: 'Parsing project data...' });
        const projectData = JSON.parse(await projectFile.async('string'));
        
        const importedCharacters = zip.file('characters.json') ? JSON.parse(await zip.file('characters.json')!.async('string')) : [];
        const importedScenes = zip.file('scenes.json') ? JSON.parse(await zip.file('scenes.json')!.async('string')) : [];
        const importedNotes = zip.file('notes.json') ? JSON.parse(await zip.file('notes.json')!.async('string')) : [];
        
        update({ id: 'scribbler-import-toast', title: 'Saving to Database...', description: 'Writing new script and sub-collections.' });
        
        await processImportedContent(
            projectData.title || 'Untitled Scribbler Import',
            projectData.content || '',
            { characters: importedCharacters, scenes: importedScenes, notes: importedNotes }
        );

        dismiss();

    } catch (error) {
        console.error('Scribbler import failed:', error);
        dismiss();
        if (!(error instanceof FirestorePermissionError)) {
            toast({
                variant: 'destructive',
                title: 'Import Failed',
                description: error instanceof Error ? error.message : 'An unknown error occurred during import.',
            });
        }
    }
  }


  const handleScriteImport = async (file: File) => {
    if (!user) return;
    const { dismiss, update } = toast({ id: 'scrite-import-toast', title: 'Importing Scrite File...', description: 'Parsing file...' });

    try {
        const arrayBuffer = await file.arrayBuffer();
        const parsedData = await parseScriteFile(arrayBuffer);
        
        update({ id: 'scrite-import-toast', description: 'Reformatting script with AI...' });
        
        // Call AI to reformat the extracted script
        const reformatResult = await runAiReformatScript({ rawScript: parsedData.rawScript });
        
        let formattedScript = parsedData.rawScript; // Fallback to raw script
        
        if (reformatResult.data?.formattedScript) {
            formattedScript = reformatResult.data.formattedScript;
        } else if (reformatResult.error) {
            console.warn('AI reformatting failed, using raw script:', reformatResult.error);
        }
        
        update({ id: 'scrite-import-toast', title: 'Saving to Database...', description: 'Writing new script and sub-collections.' });
        
        await processImportedContent(parsedData.title, formattedScript, {
            characters: parsedData.characters,
            scenes: parsedData.scenes,
            notes: parsedData.notes,
        });

        dismiss();

    } catch (error) {
       console.error("--- DEBUG: Scrite Import Failed ---", error);
       dismiss();
       toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: error instanceof Error ? error.message : 'An unknown error occurred during import.',
      });
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  const handleExport = async () => {
    if (!script) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No active script to export.' });
      return;
    }

    const zip = new JSZip();

    const meta = {
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0', // This could come from package.json
      scriptTitle: script.title,
    };
    zip.file('meta.json', JSON.stringify(meta, null, 2));

    const projectData = {
      title: script.title,
      logline: script.logline || '',
      content: script.content,
    };
    zip.file('project.json', JSON.stringify(projectData, null, 2));

    // Now include characters, scenes, and notes
    if (characters) {
      // We remove the ID because it will be reassigned on import
      zip.file('characters.json', JSON.stringify(characters.map(({ id, ...rest }) => rest), null, 2));
    }
    if (scenes) {
      zip.file('scenes.json', JSON.stringify(scenes.map(({ id, ...rest }) => rest), null, 2));
    }
    if (notes) {
      zip.file('notes.json', JSON.stringify(notes.map(({ id, ...rest }) => rest), null, 2));
    }

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${script.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.scribbler`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({ title: 'Export Successful', description: 'Your project has been downloaded.' });
    } catch (error) {
      console.error("Error generating zip file:", error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate the project file.' });
    }
  };

  const handleExportFountain = async () => {
    if (!script) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No active script to export.' });
      return;
    }

    try {
      const scriptDoc = parseScreenplay(script.content);
      const fountainText = exportToFountain(scriptDoc, script.title);
      
      const blob = new Blob([fountainText], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${script.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.fountain`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({ title: 'Export Successful', description: 'Fountain file has been downloaded.' });
    } catch (error) {
      console.error('Error exporting to Fountain:', error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate the Fountain file.' });
    }
  };

  const handleExportPlainText = async () => {
    if (!script) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No active script to export.' });
      return;
    }

    try {
      const scriptDoc = parseScreenplay(script.content);
      const plainText = exportToPlainText(scriptDoc, script.title);
      
      const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${script.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({ title: 'Export Successful', description: 'Text file has been downloaded.' });
    } catch (error) {
      console.error('Error exporting to plain text:', error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate the text file.' });
    }
  };

  const handleExportFinalDraft = async () => {
    if (!script) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No active script to export.' });
      return;
    }

    try {
      const scriptDoc = parseScreenplay(script.content);
      const fdxXml = exportToFinalDraft(scriptDoc, script.title);
      
      const blob = new Blob([fdxXml], { type: 'application/xml;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${script.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.fdx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({ title: 'Export Successful', description: 'Final Draft file has been downloaded.' });
    } catch (error) {
      console.error('Error exporting to Final Draft:', error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate the Final Draft file.' });
    }
  };

  const handleExportPDF = async () => {
    if (!script) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No active script to export.' });
      return;
    }

    try {
      const scriptDoc = parseScreenplay(script.content);
      await exportToPDF(scriptDoc, script.title);
      
      // The PDF export opens the print dialog, so we show a different message
      toast({ 
        title: 'PDF Export', 
        description: 'Print dialog opened. Choose "Save as PDF" as your destination.' 
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate the PDF.' });
    }
  };

  const handleExportGoogleDocs = async () => {
    if (!script) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No active script to export.' });
      return;
    }

    if (!auth?.currentUser) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Please sign in to export to Google Docs.' });
      return;
    }

    const { dismiss } = toast({
      title: 'Exporting to Google Docs...',
      description: 'Creating your screenplay in Google Docs.',
    });

    try {
      // Get Firebase ID token (user must have Google authentication configured)
      const idToken = await auth.currentUser.getIdToken();
      
      const scriptDoc = parseScreenplay(script.content);
      const documentId = await exportToGoogleDocs(scriptDoc, script.title, idToken);
      const docsUrl = getGoogleDocsUrl(documentId);
      
      dismiss();
      toast({ 
        title: 'Export Successful', 
        description: 'Your screenplay has been created in Google Docs.',
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open(docsUrl, '_blank')}
          >
            Open
          </Button>
        ),
      });
    } catch (error) {
      console.error('Error exporting to Google Docs:', error);
      dismiss();
      
      // Provide helpful error messages
      const errorMessage = error instanceof Error ? error.message : 'Could not create Google Doc.';
      const isAuthError = errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('authorization');
      
      toast({ 
        variant: 'destructive', 
        title: 'Export Failed', 
        description: isAuthError 
          ? 'Google Docs export requires proper OAuth configuration. Please use the Fountain or PDF export as an alternative.'
          : errorMessage
      });
    }
  };


  const UserMenu = () => {
    if (!user) {
      return <Skeleton className="h-10 w-10 rounded-full" />;
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer border-2 border-transparent hover:border-primary transition-colors">
            <AvatarImage src={userProfile?.photoURL || user.photoURL || undefined} alt={user.displayName || 'User'} />
            <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="font-bold truncate">{user.displayName}</p>
            <p className="text-xs text-muted-foreground font-normal truncate">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
           <DropdownMenuItem onClick={() => setView('profile')}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
            </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setView('settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };
  
  const SaveStatusIndicator = () => {
    if (!currentScriptId || !saveStatus || saveStatus === 'idle') return null;

    let content;
    if (saveStatus === 'saving') {
      content = (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      );
    } else { // 'saved'
      content = (
        <>
          <CheckCircle className="h-3 w-3" />
          <span>Saved</span>
        </>
      );
    }
    
    return (
      <div className={cn(
        "flex items-center gap-1.5 text-xs text-muted-foreground transition-opacity duration-300",
        saveStatus === 'saving' && 'animate-pulse'
      )}>
        {content}
      </div>
    );
  }

  const isProfileOrDashboard = activeView === 'profile' || activeView === 'dashboard';

  return (
    <>
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger className="flex md:hidden" aria-label="Toggle sidebar" />
      <div className="flex flex-1 items-center gap-2 min-w-0">
        {isProfileOrDashboard ? (
             <h1 className="text-xl font-bold font-headline truncate">
                {activeView === 'profile' ? 'My Profile' : 'Dashboard'}
             </h1>
        ) : (
          <>
            <Book className="h-6 w-6 text-muted-foreground hidden sm:block" />
            {(isScriptLoading || !script) && currentScriptId ? (
                <Skeleton className="h-7 w-64" />
            ) : (
                <Input
                  key={script?.id}
                  defaultValue={script?.title}
                  onBlur={(e) => setScriptTitle(e.target.value)}
                  className="text-lg md:text-xl font-semibold border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 font-headline min-w-0"
                />
            )}
            <SaveStatusIndicator />
          </>
        )}
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".scrite,.scribbler"
        />
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <Upload className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Import</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={triggerFileSelect}>
                    <FileJson className="h-4 w-4 mr-2" />
                    Import .scrite or .scribbler file
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={openPicker}>
                    <GoogleDocIcon className="h-4 w-4 mr-2" />
                    Import from Google Docs
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Download className="h-4 w-4 md:mr-2" />
              <span className='hidden md:inline'>Export</span>
              <ChevronDown className="h-4 w-4 ml-0 md:ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
             <DropdownMenuItem onClick={handleExport}>
                <FileJson className="h-4 w-4 mr-2" />
                Export as .scribbler
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportFountain}>
                <Download className="h-4 w-4 mr-2" />
                Export as Fountain
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPlainText}>
                <Download className="h-4 w-4 mr-2" />
                Export as Plain Text (.txt)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportFinalDraft}>
                <Download className="h-4 w-4 mr-2" />
                Export as Final Draft (.fdx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export as PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportGoogleDocs}>
                <GoogleDocIcon className="h-4 w-4 mr-2" />
                Export to Google Docs (Alternative)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <UserMenu />
      </div>
    </header>
    </>
  );
}
