'use client';
import { useState } from 'react';
import {
  Book,
  ChevronDown,
  Download,
  FileJson,
  LogOut,
  Settings,
  Upload,
  User as UserIcon,
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
import { parseScriteFile } from '@/lib/scrite-parser';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import JSZip from 'jszip';
import { useCurrentScript } from '@/context/current-script-context';
import type { View } from './AppLayout';
import { runAiReformatScript } from '@/app/actions';


interface AppHeaderProps {
  activeView: View;
  setView: (view: View | 'settings' | 'profile-edit') => void;
}

export default function AppHeader({ activeView, setView }: AppHeaderProps) {
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { script, characters, scenes, notes, setScriptTitle, isScriptLoading } = useScript();
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

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const handleScribblerImport = async (file: File) => {
    if (!firestore || !user) return;
    
    try {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        
        const projectFile = zip.file('project.json');
        if (!projectFile) throw new Error('Invalid .scribbler file: project.json not found.');

        const projectData = JSON.parse(await projectFile.async('string'));
        
        const importedCharacters = zip.file('characters.json') ? JSON.parse(await zip.file('characters.json')!.async('string')) : [];
        const importedScenes = zip.file('scenes.json') ? JSON.parse(await zip.file('scenes.json')!.async('string')) : [];
        const importedNotes = zip.file('notes.json') ? JSON.parse(await zip.file('notes.json')!.async('string')) : [];

        const batch = writeBatch(firestore);

        const newScriptRef = doc(collection(firestore, 'users', user.uid, 'scripts'));
        batch.set(newScriptRef, {
            title: projectData.title || 'Untitled Scribbler Import',
            content: projectData.content || '',
            logline: projectData.logline || '',
            authorId: user.uid,
            createdAt: serverTimestamp(),
            lastModified: serverTimestamp(),
        });
        
        const charactersCol = collection(newScriptRef, 'characters');
        importedCharacters.forEach((char: any) => batch.set(doc(charactersCol), { ...char, id: undefined }));
        
        const scenesCol = collection(newScriptRef, 'scenes');
        importedScenes.forEach((scene: any) => batch.set(doc(scenesCol), { ...scene, id: undefined }));

        const notesCol = collection(newScriptRef, 'notes');
        importedNotes.forEach((note: any) => batch.set(doc(notesCol), { ...note, id: undefined }));

        await batch.commit().catch(serverError => {
            const permissionError = new FirestorePermissionError({
              path: `users/${user.uid}/scripts`,
              operation: 'write', 
              requestResourceData: {
                  script: "Batch write for Scribbler import",
                  characterCount: importedCharacters.length,
                  sceneCount: importedScenes.length,
                  noteCount: importedNotes.length
              },
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });

        toast({
          title: 'Import Successful',
          description: `"${projectData.title}" has been added to your scripts.`,
        });
        setView('profile');

    } catch (error) {
        console.error('Scribbler import failed:', error);
        toast({
            variant: 'destructive',
            title: 'Import Failed',
            description: error instanceof Error ? error.message : 'An unknown error occurred during import.',
        });
    }
  }


  const handleScriteImport = (file: File) => {
    if (!firestore || !user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;

      try {
        toast({ title: 'Importing Scrite File...', description: 'Parsing and analyzing the file.' });
        const parsedData = await parseScriteFile(arrayBuffer);
        
        toast({ title: 'Reformatting Script...', description: 'AI is cleaning up the script format.' });
        const reformatResult = await runAiReformatScript({ rawScript: parsedData.script });
        
        if (reformatResult.error || !reformatResult.data) {
            throw new Error(reformatResult.error || 'AI reformatting failed.');
        }

        const formattedScript = reformatResult.data.formattedScript;

        const batch = writeBatch(firestore);

        const newScriptRef = doc(collection(firestore, 'users', user.uid, 'scripts'));
        const scriptTitle = parsedData.title;
        
        batch.set(newScriptRef, {
            title: scriptTitle,
            content: formattedScript,
            authorId: user.uid,
            createdAt: serverTimestamp(),
            lastModified: serverTimestamp(),
        });
        
        const charactersCollectionRef = collection(newScriptRef, 'characters');
        parsedData.characters.forEach(char => {
            const newCharRef = doc(charactersCollectionRef);
            batch.set(newCharRef, { ...char, scenes: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        });

        const notesCollectionRef = collection(newScriptRef, 'notes');
        parsedData.notes.forEach(note => {
            const newNoteRef = doc(notesCollectionRef);
            batch.set(newNoteRef, note);
        });

        const scenesCollectionRef = collection(newScriptRef, 'scenes');
        parsedData.scenes.forEach(scene => {
            const newSceneRef = doc(scenesCollectionRef);
            batch.set(newSceneRef, scene);
        });
        
        await batch.commit().catch(serverError => {
            const permissionError = new FirestorePermissionError({
              path: `users/${user.uid}/scripts`,
              operation: 'write', 
              requestResourceData: {
                  script: "Batch write for Scrite import",
                  characterCount: parsedData.characters.length,
                  noteCount: parsedData.notes.length,
                  sceneCount: parsedData.scenes.length
              },
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });

        toast({
          title: 'Import Successful',
          description: `"${scriptTitle}" has been added to your scripts.`,
        });
        setView('profile');

      } catch (error) {
         console.error('--- DEBUG: Import Parsing Failed ---', error);
         toast({
            variant: 'destructive',
            title: 'Import Failed',
            description: error instanceof Error ? error.message : 'An unknown error occurred during import.',
        });
      }
    };
    reader.onerror = () => {
        toast({
            variant: 'destructive',
            title: 'Import Failed',
            description: 'There was an error reading the file.',
        });
    }
    reader.readAsArrayBuffer(file);
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
      appVersion: '1.0.0',
      scriptTitle: script.title,
    };
    zip.file('meta.json', JSON.stringify(meta, null, 2));

    const projectData = {
      title: script.title,
      logline: script.logline || '',
      content: script.content,
    };
    zip.file('project.json', JSON.stringify(projectData, null, 2));

    if (characters) {
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

  const isProfileView = activeView === 'profile';

  return (
    <>
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger className="flex md:hidden" />
      <div className="flex flex-1 items-center gap-2 min-w-0">
        {isProfileView ? (
             <h1 className="text-xl font-bold font-headline truncate">My Profile</h1>
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
                    Import from file...
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <GoogleDocIcon className="h-4 w-4 mr-2" />
                    Import from Google Docs
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={isProfileView}>
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
            <DropdownMenuItem>
                <GoogleDocIcon className="h-4 w-4 mr-2" />
                Export to Google Docs
            </DropdownMenuItem>
            <DropdownMenuItem>Export as PDF</DropdownMenuItem>
            <DropdownMenuItem>Export as Fountain</DropdownMenuItem>
            <DropdownMenuItem>Export as Final Draft</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <UserMenu />
      </div>
    </header>
    </>
  );
}
