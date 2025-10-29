'use client';
import AppLayout from "@/components/layout/AppLayout";
import CharactersView from "@/components/views/characters-view";

export default function CharactersPage() {
    return (
        <AppLayout activeView="characters">
            <CharactersView />
        </AppLayout>
    )
}
