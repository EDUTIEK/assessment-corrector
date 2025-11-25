import { useApiStore } from '@/store/api';
import { useChangesStore } from "@/store/changes";
import { useCommentsStore } from "@/store/comments";
import { useCorrectionsStore } from "@/store/corrections";
import { useCriteriaStore } from "@/store/criteria";
import { useEssayStore } from "@/store/essay";
import { useItemsStore } from "@/store/items";
import { useLayoutStore } from "@/store/layout";
import { useLevelsStore } from "@/store/levels";
import { usePagesStore } from "@/store/pages";
import { usePointsStore } from "@/store/points";
import { usePreferencesStore } from "@/store/preferences";
import { useResourcesStore } from "@/store/resources";
import { useSettingsStore } from "@/store/settings";
import { useSnippetsStore } from "@/store/snippets";
import { useSummariesStore } from "@/store/summaries";
import { useTasksStore } from "@/store/tasks";

/**
 * Service locator for pinia stores
 */
export const stores = {
    api: () => useApiStore(),
    changes: () => useChangesStore(),
    comments: () => useCommentsStore(),
    corrections: () => useCorrectionsStore(),
    criteria: () => useCriteriaStore(),
    essay: () => useEssayStore(),
    items: () => useItemsStore(),
    layout: () => useLayoutStore(),
    levels: () => useLevelsStore(),
    pages: () => usePagesStore(),
    points: () => usePointsStore(),
    preferences: () => usePreferencesStore(),
    resources: () => useResourcesStore(),
    settings: () => useSettingsStore(),
    snippets: () => useSnippetsStore(),
    summaries: () => useSummariesStore(),
    tasks: () => useTasksStore()
}

/**
 * Clear all data of the stores
 */
export async function clearAllStores() {
    for (const key of Object.values(stores)) {
        const store = key();
        store.clearStorage();
    }
}