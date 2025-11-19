'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Book, 
  FileText, 
  Users, 
  MapPin, 
  Clock, 
  StickyNote,
  ListTree
} from 'lucide-react';
import OutlineTab from './story-tabs/outline-tab';
import ChaptersTab from './story-tabs/chapters-tab';
import StoryCharactersTab from './story-tabs/story-characters-tab';
import WorldBuildingTab from './story-tabs/world-building-tab';
import TimelineTab from './story-tabs/timeline-tab';
import StoryNotesTab from './story-tabs/story-notes-tab';
import type { View } from '../layout/AppLayout';

type StoryTab = 'outline' | 'chapters' | 'characters' | 'world' | 'timeline' | 'story-notes';

interface StoryScribblerViewProps {
  activeView: View;
  setView: (view: View) => void;
}

export default function StoryScribblerView({ activeView, setView }: StoryScribblerViewProps) {
  // Map view names to tab values
  const viewToTab = (view: View): StoryTab => {
    switch (view) {
      case 'outline': return 'outline';
      case 'chapters': return 'chapters';
      case 'characters': return 'characters';
      case 'world': return 'world';
      case 'timeline': return 'timeline';
      case 'story-notes': return 'story-notes';
      default: return 'outline'; // Default to outline for Story Scribbler
    }
  };

  // Map tab values to view names
  const tabToView = (tab: string): View => {
    switch (tab) {
      case 'outline': return 'outline';
      case 'chapters': return 'chapters';
      case 'characters': return 'characters';
      case 'world': return 'world';
      case 'timeline': return 'timeline';
      case 'notes': return 'story-notes';
      default: return 'outline';
    }
  };

  const activeTab = viewToTab(activeView);

  const handleTabChange = (tab: string) => {
    setView(tabToView(tab));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <Book className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Story Scribbler</h1>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-6 mb-4">
          <TabsTrigger value="outline" className="flex items-center gap-2">
            <ListTree className="h-4 w-4" />
            <span className="hidden sm:inline">Outline</span>
          </TabsTrigger>
          <TabsTrigger value="chapters" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Chapters</span>
          </TabsTrigger>
          <TabsTrigger value="characters" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Characters</span>
          </TabsTrigger>
          <TabsTrigger value="world" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">World</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            <span className="hidden sm:inline">Notes</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="outline" className="h-full m-0">
            <OutlineTab />
          </TabsContent>
          <TabsContent value="chapters" className="h-full m-0">
            <ChaptersTab />
          </TabsContent>
          <TabsContent value="characters" className="h-full m-0">
            <StoryCharactersTab />
          </TabsContent>
          <TabsContent value="world" className="h-full m-0">
            <WorldBuildingTab />
          </TabsContent>
          <TabsContent value="timeline" className="h-full m-0">
            <TimelineTab />
          </TabsContent>
          <TabsContent value="notes" className="h-full m-0">
            <StoryNotesTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
