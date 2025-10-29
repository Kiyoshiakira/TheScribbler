'use client';
import { useState } from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
  SidebarContent
} from '@/components/ui/sidebar';
import {
  Settings,
  BookText,
  Clapperboard,
  StickyNote,
  Users,
  CaseSensitive,
  Clock,
  NotebookPen,
} from 'lucide-react';
import type { View } from '@/app/page';
import type { ScriptElement } from '../script-editor';
import { cn } from '@/lib/utils';
import { useScript } from '@/context/script-context';
import { Skeleton } from '../ui/skeleton';
import { SettingsDialog } from '../settings-dialog';

interface AppSidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  activeScriptElement: ScriptElement | null;
  wordCount: number;
  estimatedMinutes: number;
}

export const Logo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-8 w-8 text-primary"
  >
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
    <path d="M12 4v16" />
  </svg>
);


export default function AppSidebar({
  activeView,
  setActiveView,
  activeScriptElement,
  wordCount,
  estimatedMinutes,
}: AppSidebarProps) {
  const { state: sidebarState } = useSidebar();
  const { isScriptLoading } = useScript();
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  const formatElementName = (name: string | null) => {
    if (!name) return 'N/A';
    if (sidebarState === 'collapsed') {
      return name.split('-').map(word => word[0].toUpperCase()).join('');
    }
    return name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  const ScriptInfo = () => {
    // Hide this entire section if the view is not 'editor' to prevent flashing
    if (activeView !== 'editor') {
      return null;
    }
     return (
     <div className={cn("p-2 space-y-2 transition-opacity duration-200")}>
        <SidebarSeparator />
        <div className="text-xs text-sidebar-foreground/70 px-2 font-medium [&[data-collapsed=true]]:text-center [&[data-collapsed=true]]:px-0" data-collapsed={sidebarState === 'collapsed'}>
            {sidebarState === 'collapsed' ? 'Info' : 'Script Info'}
        </div>
         <div className='px-2 flex items-center justify-between text-sm' data-collapsed={sidebarState === 'collapsed'}>
            <div className='flex items-center gap-2'>
              <Clock className="w-4 h-4 text-sidebar-primary flex-shrink-0" />
              <span className='font-semibold text-sidebar-foreground'>{estimatedMinutes} min</span>
            </div>
            <span className='text-sidebar-foreground/70'>{wordCount} words</span>
        </div>
        <div 
          className={cn(
            "space-y-2 transition-opacity duration-200", 
            !activeScriptElement && "opacity-0"
          )}
        >
            <div className='px-2 flex items-center gap-2 [&[data-collapsed=true]]:justify-center' data-collapsed={sidebarState === 'collapsed'}>
              <CaseSensitive className="w-4 h-4 text-sidebar-primary flex-shrink-0" />
              <span className='font-semibold text-sm text-sidebar-foreground'>{formatElementName(activeScriptElement)}</span>
            </div>
        </div>
    </div>
  );
  }

  return (
    <>
    <Sidebar variant="sidebar" collapsible="icon" side="left">
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            <Logo />
            <h1 className="text-xl font-bold font-headline">ScriptScribbler</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="flex-1 overflow-y-auto p-2">
            <SidebarMenuItem>
            <SidebarMenuButton
                onClick={() => setActiveView('editor')}
                isActive={activeView === 'editor'}
                tooltip="Editor"
            >
                <BookText />
                <span>Editor</span>
            </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
            <SidebarMenuButton
                onClick={() => setActiveView('logline')}
                isActive={activeView === 'logline'}
                tooltip="Logline"
            >
                <NotebookPen />
                <span>Logline</span>
            </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
            <SidebarMenuButton
                onClick={() => setActiveView('scenes')}
                isActive={activeView === 'scenes'}
                tooltip="Scenes"
            >
                <Clapperboard />
                <span>Scenes</span>
            </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
            <SidebarMenuButton
                onClick={() => setActiveView('characters')}
                isActive={activeView === 'characters'}
                tooltip="Characters"
            >
                <Users />
                <span>Characters</span>
            </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
            <SidebarMenuButton
                onClick={() => setActiveView('notes')}
                isActive={activeView === 'notes'}
                tooltip="Notes"
            >
                <StickyNote />
                <span>Notes</span>
            </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
        {isScriptLoading && activeView === 'editor' ? (
          <div className='p-2 space-y-2'><Skeleton className='h-24 w-full' /></div>
        ) : (
          <ScriptInfo />
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="p-2">
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings" onClick={() => setSettingsDialogOpen(true)}>
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
    <SettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} />
    </>
  );
}
