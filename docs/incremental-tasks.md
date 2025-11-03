# Incremental Implementation Tasks

This document tracks features that have been partially implemented. The initial UI or backend logic is in place, but the full functionality requires further, incremental work. This helps keep track of what's "done" for a given step versus what is still needed to make the feature complete.

---

## 1. Find & Replace Logic

-   **Task Reference:** `editorimprovements.md` - Task 15.
-   **Current Status:** The UI has been fully implemented in `src/components/find-replace-dialog.tsx` and is accessible from the `EditorView`.
-   **Next Steps (Incremental Implementation):**
    1.  **Implement Search State:** Add state management (e.g., in a new `useFindReplace` hook or directly within `ScriptContext`) to hold the search term, replacement term, current match index, and total matches.
    2.  **Implement Search Logic:** Create a function that iterates through the `ScriptDocument` blocks to find all occurrences of the search term. This function should be able to update the match count and index.
    3.  **Wire up UI Buttons:** Connect the "Find Next," "Replace," and "Replace All" buttons to the new logic.
        -   "Find Next" should cycle through the found matches, highlighting the current one in the editor.
        -   "Replace" should replace the currently highlighted match and then automatically find the next one.
        -   "Replace All" should iterate through all matches and replace them.
    4.  **Implement Highlighting:** Devise a mechanism to visually highlight the active search result within the `ScriptBlockComponent`. This might involve a new context or passing down the active match ID.
