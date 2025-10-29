'use client';
import AppLayout from "@/components/layout/AppLayout";
import EditorView from "@/components/views/editor-view";

export default function EditorPage() {
    return (
        <AppLayout activeView="editor">
            <EditorView isStandalone={false} />
        </AppLayout>
    )
}
