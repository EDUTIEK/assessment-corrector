import { useApiStore } from '@/store/api';
import { useChangesStore } from "@/store/changes";
import { useCommentsStore } from "@/store/comments";
import { useConfigStore } from "@/store/config";
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
import { useTemplateStore } from "@/store/templates";
import { useUserStore } from "@/store/user";
import { useAssessmentsStore } from '@/store/assessments';

/**
 * Service locator for pinia stores
 */

const startStores = {
    api: () => useApiStore(),
    assessments: () => useAssessmentsStore(),
    config: () => useConfigStore(),
    user: () => useUserStore()
}

const assessmentStores = {
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
    tasks: () => useTasksStore(),
    templates: () => useTemplateStore(),
}

export const stores = Object.assign({}, startStores, assessmentStores);

async function clearStores(stores) {
    for (const key of Object.values(stores)) {
        const store = key();
        await store.clearStorage();
    }
}

/**
 * Clear all data of the assessments related stores
 */
export async function clearAssessmentStores() {
    await clearStores(assessmentStores);
}

/**
 * Clear all data of all stores
 */
export async function clearAllStores() {
    await clearStores(startStores);
    await clearStores(assessmentStores);
}