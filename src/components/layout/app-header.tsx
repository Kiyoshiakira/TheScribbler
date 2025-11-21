
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
  Info,
  History,
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
import { useAuth, useUser, useFirestore, FirestorePermissionError, errorEmitter, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Skeleton } from '../ui/skeleton';
import { useScript } from '@/context/script-context';
import { useSettings } from '@/context/settings-context';
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
import { sanitizeFirestorePayload } from '@/lib/firestore-utils';
import { useTool } from '@/context/tool-context';
import { AboutDialog } from '@/components/about-dialog';
import { VersionHistory } from '@/components/VersionHistory/VersionHistory';
import { useState } from 'react';
import { exportToMarkdown, type StoryData } from '@/utils/exporters/export-markdown';
import { createDocxDocument } from '@/utils/exporters/export-docx';
import { Packer } from 'docx';
import { generateEpub } from '@/utils/exporters/export-epub';
import { exportStoryToPDF } from '@/utils/exporters/export-story-pdf';
import { importMarkdownFile } from '@/utils/exporters/import-markdown';
import { importDocxFile } from '@/utils/exporters/import-docx';

// Story Scribbler interfaces
interface OutlineItem {
  id?: string;
  title: string;
  description: string;
  order: number;
  parentId?: string;
}

interface Chapter {
  id?: string;
  title: string;
  summary: string;
  content: string;
  order: number;
  wordCount?: number;
}

interface StoryCharacter {
  id?: string;
  name: string;
  role: string;
  description: string;
  imageUrl?: string;
}

interface WorldElement {
  id?: string;
  name: string;
  type: string;
  description: string;
}

interface TimelineEvent {
  id?: string;
  title: string;
  description: string;
  timeframe: string;
  category: string;
}

interface StoryNote {
  id?: string;
  title: string;
  content: string;
  category: string;
}

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
  const { settings } = useSettings();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentScriptId, setCurrentScriptId } = useCurrentScript();
  const { currentTool } = useTool();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (user && firestore) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [user, firestore]);
  const { data: userProfile } = useDoc(userProfileRef);

  // Story Scribbler collections
  const outlineCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'outline') : null),
    [firestore, user, currentScriptId]
  );
  const chaptersCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'chapters') : null),
    [firestore, user, currentScriptId]
  );
  const storyCharactersCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'storyCharacters') : null),
    [firestore, user, currentScriptId]
  );
  const worldBuildingCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'worldBuilding') : null),
    [firestore, user, currentScriptId]
  );
  const timelineCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'timeline') : null),
    [firestore, user, currentScriptId]
  );
  const storyNotesCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'storyNotes') : null),
    [firestore, user, currentScriptId]
  );

  const { data: outlineItems } = useCollection<OutlineItem>(outlineCollection);
  const { data: chapters } = useCollection<Chapter>(chaptersCollection);
  const { data: storyCharacters } = useCollection<StoryCharacter>(storyCharactersCollection);
  const { data: worldElements } = useCollection<WorldElement>(worldBuildingCollection);
  const { data: timelineEvents } = useCollection<TimelineEvent>(timelineCollection);
  const { data: storyNotes } = useCollection<StoryNote>(storyNotesCollection);

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
            title: 'Saving Script...',
            description: 'Adding the new script to your collection.',
        });
        
        try {
            const batch = writeBatch(firestore);
            const newScriptRef = doc(collection(firestore, 'users', user.uid, 'scripts'));
            
            // Sanitize the script data to remove any undefined values
            const scriptData = sanitizeFirestorePayload({
                title: title,
                content: content,
                logline: '', // Initialize logline as empty string instead of leaving it undefined
                authorId: user.uid,
                createdAt: serverTimestamp(),
                lastModified: serverTimestamp(),
            });
            
            batch.set(newScriptRef, scriptData);

            let totalItems = 1; // Count the script itself
            
            if (subCollections) {
                if (subCollections.characters) {
                    const charactersCol = collection(newScriptRef, 'characters');
                    update({
                        title: 'Importing...',
                        description: `Adding ${subCollections.characters.length} character(s)...`,
                    });
                    subCollections.characters.forEach((char: any) => {
                        const { id, ...charData } = char;
                        // Sanitize character data to remove undefined values
                        const sanitizedCharData = sanitizeFirestorePayload({
                            ...charData,
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                        });
                        batch.set(doc(charactersCol), sanitizedCharData);
                    });
                    totalItems += subCollections.characters.length;
                }
                if (subCollections.scenes) {
                    const scenesCol = collection(newScriptRef, 'scenes');
                    update({
                        title: 'Importing...',
                        description: `Adding ${subCollections.scenes.length} scene(s)...`,
                    });
                    subCollections.scenes.forEach((scene: any) => {
                        const { id, ...sceneData } = scene;
                        // Sanitize scene data to remove undefined values
                        const sanitizedSceneData = sanitizeFirestorePayload({
                            ...sceneData,
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                        });
                        batch.set(doc(scenesCol), sanitizedSceneData);
                    });
                    totalItems += subCollections.scenes.length;
                }
                if (subCollections.notes) {
                    const notesCol = collection(newScriptRef, 'notes');
                    update({
                        title: 'Importing...',
                        description: `Adding ${subCollections.notes.length} note(s)...`,
                    });
                    subCollections.notes.forEach((note: any) => {
                        const { id, ...noteData } = note;
                        // Sanitize note data to remove undefined values
                        const sanitizedNoteData = sanitizeFirestorePayload({
                            ...noteData,
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                        });
                        batch.set(doc(notesCol), sanitizedNoteData);
                    });
                    totalItems += subCollections.notes.length;
                }
            }

            update({
                title: 'Importing...',
                description: `Committing ${totalItems} item(s) to database...`,
            });

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
                description: `"${title}" with ${totalItems} item(s) has been added to your scripts.`,
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
    } else if (file.name.endsWith('.story')) {
      handleStoryImport(file);
    } else if (file.name.endsWith('.md')) {
      handleMarkdownImport(file);
    } else if (file.name.endsWith('.docx')) {
      handleDocxImport(file);
    } else {
      toast({
        variant: 'destructive',
        title: 'Unsupported File Type',
        description: 'Please select a .scrite, .scribbler, .story, .md, or .docx file.',
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const handleScribblerImport = async (file: File) => {
    if (!firestore || !user) return;
    const { dismiss, update } = toast({
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

  const handleStoryImport = async (file: File) => {
    if (!firestore || !user) return;
    const { dismiss, update } = toast({
      title: 'Importing Story File...',
      description: 'Reading the story archive.',
    });
    
    try {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        
        const projectFile = zip.file('project.json');
        if (!projectFile) throw new Error('Invalid .story file: project.json not found.');
        
        update({ id: 'story-import-toast', description: 'Parsing story data...' });
        const projectData = JSON.parse(await projectFile.async('string'));
        
        const importedOutline = zip.file('outline.json') ? JSON.parse(await zip.file('outline.json')!.async('string')) : [];
        const importedChapters = zip.file('chapters.json') ? JSON.parse(await zip.file('chapters.json')!.async('string')) : [];
        const importedStoryCharacters = zip.file('storyCharacters.json') ? JSON.parse(await zip.file('storyCharacters.json')!.async('string')) : [];
        const importedWorldBuilding = zip.file('worldBuilding.json') ? JSON.parse(await zip.file('worldBuilding.json')!.async('string')) : [];
        const importedTimeline = zip.file('timeline.json') ? JSON.parse(await zip.file('timeline.json')!.async('string')) : [];
        const importedStoryNotes = zip.file('storyNotes.json') ? JSON.parse(await zip.file('storyNotes.json')!.async('string')) : [];
        
        update({ id: 'story-import-toast', title: 'Saving to Database...', description: 'Writing new story and sub-collections.' });
        
        const batch = writeBatch(firestore);
        const newStoryRef = doc(collection(firestore, 'users', user.uid, 'scripts'));
        
        // Sanitize the story data
        const storyData = sanitizeFirestorePayload({
            title: projectData.title || 'Untitled Story Import',
            content: projectData.content || '',
            logline: projectData.logline || '',
            authorId: user.uid,
            createdAt: serverTimestamp(),
            lastModified: serverTimestamp(),
        });
        
        batch.set(newStoryRef, storyData);

        let totalItems = 1; // Count the story itself

        // Import Story Scribbler specific collections with progress tracking
        if (importedOutline.length > 0) {
            update({ id: 'story-import-toast', description: `Adding ${importedOutline.length} outline item(s)...` });
            const outlineCol = collection(newStoryRef, 'outline');
            importedOutline.forEach((item: any) => {
                const sanitizedData = sanitizeFirestorePayload({
                    ...item,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                batch.set(doc(outlineCol), sanitizedData);
            });
            totalItems += importedOutline.length;
        }
        if (importedChapters.length > 0) {
            update({ id: 'story-import-toast', description: `Adding ${importedChapters.length} chapter(s)...` });
            const chaptersCol = collection(newStoryRef, 'chapters');
            importedChapters.forEach((chapter: any) => {
                const sanitizedData = sanitizeFirestorePayload({
                    ...chapter,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                batch.set(doc(chaptersCol), sanitizedData);
            });
            totalItems += importedChapters.length;
        }
        if (importedStoryCharacters.length > 0) {
            update({ id: 'story-import-toast', description: `Adding ${importedStoryCharacters.length} character(s)...` });
            const storyCharsCol = collection(newStoryRef, 'storyCharacters');
            importedStoryCharacters.forEach((char: any) => {
                const sanitizedData = sanitizeFirestorePayload({
                    ...char,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                batch.set(doc(storyCharsCol), sanitizedData);
            });
            totalItems += importedStoryCharacters.length;
        }
        if (importedWorldBuilding.length > 0) {
            update({ id: 'story-import-toast', description: `Adding ${importedWorldBuilding.length} world element(s)...` });
            const worldCol = collection(newStoryRef, 'worldBuilding');
            importedWorldBuilding.forEach((element: any) => {
                const sanitizedData = sanitizeFirestorePayload({
                    ...element,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                batch.set(doc(worldCol), sanitizedData);
            });
            totalItems += importedWorldBuilding.length;
        }
        if (importedTimeline.length > 0) {
            update({ id: 'story-import-toast', description: `Adding ${importedTimeline.length} timeline event(s)...` });
            const timelineCol = collection(newStoryRef, 'timeline');
            importedTimeline.forEach((event: any) => {
                const sanitizedData = sanitizeFirestorePayload({
                    ...event,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                batch.set(doc(timelineCol), sanitizedData);
            });
            totalItems += importedTimeline.length;
        }
        if (importedStoryNotes.length > 0) {
            update({ id: 'story-import-toast', description: `Adding ${importedStoryNotes.length} note(s)...` });
            const storyNotesCol = collection(newStoryRef, 'storyNotes');
            importedStoryNotes.forEach((note: any) => {
                const sanitizedData = sanitizeFirestorePayload({
                    ...note,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                batch.set(doc(storyNotesCol), sanitizedData);
            });
            totalItems += importedStoryNotes.length;
        }

        update({ id: 'story-import-toast', description: `Committing ${totalItems} item(s) to database...` });

        await batch.commit().catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: `users/${user.uid}/scripts`,
                operation: 'write',
                requestResourceData: { story: "Batch write for story import" },
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });

        dismiss();
        toast({
            title: 'Import Successful',
            description: `"${projectData.title || 'Untitled Story'}" with ${totalItems} item(s) has been added to your stories.`,
        });
        setCurrentScriptId(newStoryRef.id);
        setView('dashboard');

    } catch (error) {
        console.error('Story import failed:', error);
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


  const handleMarkdownImport = async (file: File) => {
    if (!firestore || !user) return;

    const { dismiss, update } = toast({
      title: 'Importing Markdown File...',
      description: 'Parsing file...',
    });

    try {
      const parsedData = await importMarkdownFile(file);
      
      update({ title: 'Saving to Database...', description: 'Creating story and chapters...' });

      const batch = writeBatch(firestore);
      const newStoryRef = doc(collection(firestore, 'users', user.uid, 'scripts'));

      // Create the story document
      const storyData = sanitizeFirestorePayload({
        title: parsedData.title,
        logline: parsedData.logline || '',
        content: '',
        authorId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(newStoryRef, storyData);

      // Add chapters
      if (parsedData.chapters && parsedData.chapters.length > 0) {
        const chaptersCol = collection(newStoryRef, 'chapters');
        parsedData.chapters.forEach((chapter) => {
          const chapterData = sanitizeFirestorePayload({
            ...chapter,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          batch.set(doc(chaptersCol), chapterData);
        });
      }

      await batch.commit().catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: `users/${user.uid}/scripts`,
          operation: 'write',
          requestResourceData: { story: "Batch write for markdown import" },
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });

      dismiss();
      toast({
        title: 'Import Successful',
        description: `"${parsedData.title}" has been imported with ${parsedData.chapters.length} chapter(s).`,
      });
      setCurrentScriptId(newStoryRef.id);
      setView('chapters');

    } catch (error) {
      console.error('Markdown import failed:', error);
      dismiss();
      if (!(error instanceof FirestorePermissionError)) {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: error instanceof Error ? error.message : 'An unknown error occurred during import.',
        });
      }
    }
  };

  const handleDocxImport = async (file: File) => {
    if (!firestore || !user) return;

    const { dismiss, update } = toast({
      title: 'Importing DOCX File...',
      description: 'Parsing file...',
    });

    try {
      const parsedData = await importDocxFile(file);
      
      update({ title: 'Saving to Database...', description: 'Creating story and chapters...' });

      const batch = writeBatch(firestore);
      const newStoryRef = doc(collection(firestore, 'users', user.uid, 'scripts'));

      // Create the story document
      const storyData = sanitizeFirestorePayload({
        title: parsedData.title,
        logline: parsedData.logline || '',
        content: '',
        authorId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(newStoryRef, storyData);

      // Add chapters
      if (parsedData.chapters && parsedData.chapters.length > 0) {
        const chaptersCol = collection(newStoryRef, 'chapters');
        parsedData.chapters.forEach((chapter) => {
          const chapterData = sanitizeFirestorePayload({
            ...chapter,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          batch.set(doc(chaptersCol), chapterData);
        });
      }

      await batch.commit().catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: `users/${user.uid}/scripts`,
          operation: 'write',
          requestResourceData: { story: "Batch write for DOCX import" },
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });

      dismiss();
      toast({
        title: 'Import Successful',
        description: `"${parsedData.title}" has been imported with ${parsedData.chapters.length} chapter(s).`,
      });
      setCurrentScriptId(newStoryRef.id);
      setView('chapters');

    } catch (error) {
      console.error('DOCX import failed:', error);
      dismiss();
      if (!(error instanceof FirestorePermissionError)) {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: error instanceof Error ? error.message : 'An unknown error occurred during import.',
        });
      }
    }
  };


  const handleScriteImport = async (file: File) => {
    if (!user) return;
    const { dismiss, update } = toast({ title: 'Importing Scrite File...', description: 'Parsing file...' });

    try {
        const arrayBuffer = await file.arrayBuffer();
        const parsedData = await parseScriteFile(arrayBuffer);
        
        update({ description: 'Reformatting script with AI...' });
        
        // Call AI to reformat the extracted script
        const reformatResult = await runAiReformatScript({ rawScript: parsedData.rawScript });
        
        let formattedScript = parsedData.rawScript; // Fallback to raw script
        
        if (reformatResult.data?.formattedScript) {
            formattedScript = reformatResult.data.formattedScript;
        } else if (reformatResult.error) {
            console.warn('AI reformatting failed, using raw script:', reformatResult.error);
        }
        
        update({ title: 'Saving to Database...', description: 'Writing new script and sub-collections.' });
        
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

  const handleStoryExport = async () => {
    if (!script) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No active story to export.' });
      return;
    }

    const zip = new JSZip();

    const meta = {
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      storyTitle: script.title,
      fileType: 'story',
    };
    zip.file('meta.json', JSON.stringify(meta, null, 2));

    const projectData = {
      title: script.title,
      logline: script.logline || '',
      content: script.content,
    };
    zip.file('project.json', JSON.stringify(projectData, null, 2));

    // Include Story Scribbler specific collections
    if (outlineItems && outlineItems.length > 0) {
      zip.file('outline.json', JSON.stringify(outlineItems.map(({ id, ...rest }) => rest), null, 2));
    }
    if (chapters && chapters.length > 0) {
      zip.file('chapters.json', JSON.stringify(chapters.map(({ id, ...rest }) => rest), null, 2));
    }
    if (storyCharacters && storyCharacters.length > 0) {
      zip.file('storyCharacters.json', JSON.stringify(storyCharacters.map(({ id, ...rest }) => rest), null, 2));
    }
    if (worldElements && worldElements.length > 0) {
      zip.file('worldBuilding.json', JSON.stringify(worldElements.map(({ id, ...rest }) => rest), null, 2));
    }
    if (timelineEvents && timelineEvents.length > 0) {
      zip.file('timeline.json', JSON.stringify(timelineEvents.map(({ id, ...rest }) => rest), null, 2));
    }
    if (storyNotes && storyNotes.length > 0) {
      zip.file('storyNotes.json', JSON.stringify(storyNotes.map(({ id, ...rest }) => rest), null, 2));
    }

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${script.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.story`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({ title: 'Export Successful', description: 'Your story has been downloaded.' });
    } catch (error) {
      console.error("Error generating zip file:", error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate the story file.' });
    }
  };

  // Story Scribbler export handlers
  const handleStoryExportMarkdown = async () => {
    if (!script) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No active story to export.' });
      return;
    }

    try {
      const storyData: StoryData = {
        title: script.title,
        logline: script.logline,
        chapters: chapters?.map(({ id, ...rest }: any) => {
          const { createdAt, updatedAt, ...chapter } = rest;
          return chapter;
        }),
        outline: outlineItems?.map(({ id, ...rest }) => rest),
        characters: storyCharacters?.map(({ id, ...rest }) => rest),
        worldElements: worldElements?.map(({ id, ...rest }) => rest),
        timeline: timelineEvents?.map(({ id, ...rest }) => rest),
        notes: storyNotes?.map(({ id, ...rest }) => rest),
      };

      const markdown = exportToMarkdown(storyData, true);
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${script.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({ title: 'Export Successful', description: 'Markdown file has been downloaded.' });
    } catch (error) {
      console.error('Error exporting to Markdown:', error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate the Markdown file.' });
    }
  };

  const handleStoryExportDocx = async () => {
    if (!script) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No active story to export.' });
      return;
    }

    try {
      const storyData: StoryData = {
        title: script.title,
        logline: script.logline,
        chapters: chapters?.map(({ id, ...rest }: any) => {
          const { createdAt, updatedAt, ...chapter } = rest;
          return chapter;
        }),
        outline: outlineItems?.map(({ id, ...rest }) => rest),
        characters: storyCharacters?.map(({ id, ...rest }) => rest),
        worldElements: worldElements?.map(({ id, ...rest }) => rest),
        timeline: timelineEvents?.map(({ id, ...rest }) => rest),
        notes: storyNotes?.map(({ id, ...rest }) => rest),
      };

      const doc = createDocxDocument(storyData, true);
      const blob = await Packer.toBlob(doc);
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${script.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({ title: 'Export Successful', description: 'DOCX file has been downloaded.' });
    } catch (error) {
      console.error('Error exporting to DOCX:', error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate the DOCX file.' });
    }
  };

  const handleStoryExportEpub = async () => {
    if (!script) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No active story to export.' });
      return;
    }

    try {
      const storyData: StoryData = {
        title: script.title,
        logline: script.logline,
        chapters: chapters?.map(({ id, ...rest }: any) => {
          const { createdAt, updatedAt, ...chapter } = rest;
          return chapter;
        }),
      };

      const epubResult = await generateEpub(storyData, user?.displayName || 'Unknown Author');
      // In browser, epub-gen-memory returns a Blob directly
      const blob = epubResult instanceof Blob ? epubResult : new Blob([epubResult], { type: 'application/epub+zip' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${script.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.epub`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({ title: 'Export Successful', description: 'EPUB file has been downloaded.' });
    } catch (error) {
      console.error('Error exporting to EPUB:', error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate the EPUB file.' });
    }
  };

  const handleStoryExportPDF = async () => {
    if (!script) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No active story to export.' });
      return;
    }

    try {
      const storyData: StoryData = {
        title: script.title,
        logline: script.logline,
        chapters: chapters?.map(({ id, ...rest }: any) => {
          const { createdAt, updatedAt, ...chapter } = rest;
          return chapter;
        }),
      };

      await exportStoryToPDF(storyData);
      
      toast({ 
        title: 'PDF Export', 
        description: 'Print dialog opened. Choose "Save as PDF" as your destination.' 
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not generate the PDF.' });
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
          <DropdownMenuItem onClick={() => setAboutOpen(true)}>
            <Info className="mr-2 h-4 w-4" />
            <span>About</span>
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
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b-2 bg-background/95 px-4 backdrop-blur-md shadow-sm sm:px-6">
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
            accept=".scrite,.scribbler,.story,.md,.docx"
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
                    {currentTool === 'StoryScribbler' 
                      ? 'Import .story, .md, or .docx file'
                      : 'Import .scrite or .scribbler file'}
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
            {currentTool === 'StoryScribbler' ? (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">Quick Export</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleStoryExport}>
                  <FileJson className="h-4 w-4 mr-2" />
                  Export as .story (Default)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">All Formats</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleStoryExportMarkdown}>
                  <Download className="h-4 w-4 mr-2" />
                  Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleStoryExportDocx}>
                  <Download className="h-4 w-4 mr-2" />
                  Word Document (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleStoryExportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleStoryExportEpub}>
                  <Download className="h-4 w-4 mr-2" />
                  EPUB (.epub)
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">Quick Export</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => {
                  const format = settings.exportFormat || 'pdf';
                  switch(format) {
                    case 'pdf': handleExportPDF(); break;
                    case 'fountain': handleExportFountain(); break;
                    case 'finalDraft': handleExportFinalDraft(); break;
                    case 'plainText': handleExportPlainText(); break;
                    case 'scribbler': handleExport(); break;
                    case 'googleDocs': handleExportGoogleDocs(); break;
                    default: handleExportPDF();
                  }
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as {
                    settings.exportFormat === 'fountain' ? 'Fountain' :
                    settings.exportFormat === 'finalDraft' ? 'Final Draft' :
                    settings.exportFormat === 'plainText' ? 'Plain Text' :
                    settings.exportFormat === 'scribbler' ? 'Scribbler' :
                    settings.exportFormat === 'googleDocs' ? 'Google Docs' :
                    'PDF'
                  } (Default)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">All Formats</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleExport}>
                  <FileJson className="h-4 w-4 mr-2" />
                  .scribbler
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportFountain}>
                  <Download className="h-4 w-4 mr-2" />
                  Fountain
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPlainText}>
                  <Download className="h-4 w-4 mr-2" />
                  Plain Text (.txt)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportFinalDraft}>
                  <Download className="h-4 w-4 mr-2" />
                  Final Draft (.fdx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportGoogleDocs}>
                  <GoogleDocIcon className="h-4 w-4 mr-2" />
                  Google Docs (Alternative)
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {currentTool === 'ScriptScribbler' && currentScriptId && (
          <Button
            variant="outline"
            onClick={() => setVersionHistoryOpen(true)}
            className="hidden sm:flex"
          >
            <History className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">History</span>
          </Button>
        )}
        <UserMenu />
      </div>
    </header>
    <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    <VersionHistory open={versionHistoryOpen} onOpenChange={setVersionHistoryOpen} />
    </>
  );
}
