'use client';
import AppLayout from "@/components/layout/AppLayout";
import LoglineView from "@/components/views/logline-view";

export default function LoglinePage() {
    return (
        <AppLayout activeView="logline">
            <LoglineView />
        </AppLayout>
    )
}
