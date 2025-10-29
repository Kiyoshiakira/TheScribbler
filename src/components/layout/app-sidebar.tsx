'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  BookText,
  Clapperboard,
  StickyNote,
  Users,
  NotebookPen,
  LayoutDashboard,
} from 'lucide-react';
import type { ScriptElement } from '../script-editor';
import { cn } from '@/lib/utils';
import { useScript } from '@/context/script-context';
import { Skeleton } from '../ui/skeleton';

interface AppSidebarProps {
  activeView: 'dashboard' | 'editor' | 'scenes' | 'characters' | 'notes' | 'logline' | 'profile';
  activeScriptElement?: ScriptElement | null;
  wordCount?: number;
  estimatedMinutes?: number;
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
}: AppSidebarProps) {
  const { isScriptLoading } = useScript();
  const pathname = usePathname();
  const isProfilePage = activeView === 'profile';

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/editor', label: 'Editor', icon: BookText },
    { href: '/logline', label: 'Logline', icon: NotebookPen },
    { href: '/scenes', label: 'Scenes', icon: Clapperboard },
    { href: '/characters', label: 'Characters', icon: Users },
    { href: '/notes', label: 'Notes', icon: StickyNote },
  ];

  return (
    <Sidebar variant="sidebar" collapsible="icon" side="left">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 p-2">
            <Logo />
            <h1 className="text-xl font-bold font-headline">ScriptScribbler</h1>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="flex-1 overflow-y-auto p-2">
            {menuItems.map(item => (
                <SidebarMenuItem key={item.href}>
                    <Link href={isProfilePage ? '#' : item.href} passHref legacyBehavior>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith(item.href) && !isProfilePage}
                            tooltip={item.label}
                            aria-disabled={isProfilePage}
                            className={cn(isProfilePage && "cursor-not-allowed opacity-50")}
                        >
                            <a>
                                <item.icon />
                                <span>{item.label}</span>
                            </a>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
        {isScriptLoading && !isProfilePage ? (
          <div className='p-2 space-y-2'><Skeleton className='h-24 w-full' /></div>
        ) : (
          null
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="p-2">
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
