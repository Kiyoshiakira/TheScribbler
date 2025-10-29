'use client';
import AppLayout from "@/components/layout/AppLayout";
import DashboardView from "@/components/views/dashboard-view";

export default function DashboardPage() {
    return (
        <AppLayout activeView="dashboard">
            <DashboardView />
        </AppLayout>
    )
}
