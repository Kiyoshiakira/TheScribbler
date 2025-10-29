'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
  useSidebar
} from '@/components/ui/sidebar';
import {
  Film,
  Home,
  Bot,
  Users,
  Settings,
  BookText,
  Clapperboard,
  StickyNote,
  CaseSensitive,
} from 'lucide-react';
import type { View } from '@/app/page';
import type { ScriptElement } from '../script-editor';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';


interface AppSidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  activeScriptElement: ScriptElement | null;
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


export default function AppSidebar({ activeView, setActiveView, activeScriptElement }: AppSidebarProps) {
  const { state: sidebarState } = useSidebar();
  
  const formatElementName = (name: string | null) => {
    if (!name) return 'N/A';
    if (sidebarState === 'collapsed') {
      return name.split('-').map(word => word[0].toUpperCase()).join('');
    }
    return name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon" side="left">
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            <Logo />
            <h1 className="text-xl font-bold font-headline">ScriptSync</h1>
        </div>
      </SidebarHeader>
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
      <SidebarFooter>
        <div 
          className={cn(
            "p-2 space-y-2 transition-opacity duration-200", 
            !activeScriptElement && "opacity-0"
          )}
        >
            <SidebarSeparator />
            <div className="text-xs text-sidebar-foreground/70 px-2 font-medium [&[data-collapsed=true]]:text-center [&[data-collapsed=true]]:px-0" data-collapsed={sidebarState === 'collapsed'}>
                {sidebarState === 'collapsed' ? 'El.' : 'Active Element'}
            </div>
            <div className='px-2 flex items-center gap-2 [&[data-collapsed=true]]:justify-center' data-collapsed={sidebarState === 'collapsed'}>
              <CaseSensitive className="w-4 h-4 text-sidebar-primary flex-shrink-0" />
              <span className='font-semibold text-sm text-sidebar-foreground'>{formatElementName(activeScriptElement)}</span>
            </div>
        </div>
        <SidebarMenu className="p-2">
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
