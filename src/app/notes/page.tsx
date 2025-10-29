'use client';
import AppLayout from "@/components/layout/AppLayout";
import NotesView from "@/components/views/notes-view";

export default function NotesPage() {
    return (
        <AppLayout activeView="notes">
            <NotesView />
        </AppLayout>
    )
}
