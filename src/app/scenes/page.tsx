'use client';
import AppLayout from "@/components/layout/AppLayout";
import ScenesView from "@/components/views/scenes-view";

export default function ScenesPage() {
    return (
        <AppLayout activeView="scenes">
            <ScenesView />
        </AppLayout>
    )
}
