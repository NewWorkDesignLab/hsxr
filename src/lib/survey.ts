export const UEQ_POSITIVE_RIGHT = [
    true, true, false, false, false, true, true, true, false, false, true, false, true,
    true, true, true, false, false, false, true, false, true, false, false, false, true,
]; // per UEQ item: true when the right-hand term is the positive pole

export const UEQ_SCALES = [
    { key: "attractiveness", items: [1, 12, 14, 16, 24, 25] },
    { key: "perspicuity", items: [2, 4, 13, 21] },
    { key: "efficiency", items: [9, 20, 22, 23] },
    { key: "dependability", items: [8, 11, 17, 19] },
    { key: "stimulation", items: [5, 6, 7, 18] },
    { key: "novelty", items: [3, 10, 15, 26] },
]; // official UEQ scale-to-item mapping (1-based item numbers)

export const LIKERT_GROUPS = [
    [1, 2, 3, 4, 5, 6, 7, 8],
    [9, 10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22],
    [23, 24, 25],
]; // likert items grouped as in the paper questionnaire

export const UEQ_COUNT = UEQ_POSITIVE_RIGHT.length; // number of UEQ word pairs
export const LIKERT_COUNT = 25; // number of 1-5 agreement statements
export const NPS_MAX = 10; // recommendation scale runs 1..NPS_MAX

export const CHOICES = {
    own_headset: { labels: "form_yesno", count: 5 },
    monthly_price: { labels: "form_price_m", count: 6 },
    platform: { labels: "form_yesno", count: 5 },
    workshop_price: { labels: "form_price_w", count: 6 },
    headset_glasses: { labels: "form_yesno", count: 5 },
    headset_quest: { labels: "form_yesno", count: 5 },
} as const; // single-choice questions, label key prefix and option count

export type ChoiceKey = keyof typeof CHOICES;

export interface SurveyAnswers {
    ueq: number[];
    likert: number[];
    nps: number;
    reason: string | null;
    own_headset: number;
    monthly_price: number;
    platform: number;
    workshop_price: number;
    headset_glasses: number;
    headset_quest: number;
}

export const REASON_MAX = 2000; // max characters for the free-text answer

/** Range helper returning [1..n]. */
export function range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i + 1);
}

/** Parses an integer answer within [1, max] or returns null. */
function intIn(value: unknown, max: number): number | null {
    const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
    return Number.isInteger(n) && n >= 1 && n <= max ? n : null;
}

/** Validates raw form fields into a complete answer set, or null if anything is missing or out of range. */
export function parseAnswers(raw: Record<string, unknown>): SurveyAnswers | null {
    const ueq = range(UEQ_COUNT).map((i) => intIn(raw[`ueq${i}`], 7));
    const likert = range(LIKERT_COUNT).map((i) => intIn(raw[`l${i}`], 5));
    const nps = intIn(raw.nps, NPS_MAX);
    if (ueq.includes(null) || likert.includes(null) || nps === null) return null;

    const choices = {} as Record<ChoiceKey, number>;
    for (const [key, def] of Object.entries(CHOICES) as [ChoiceKey, (typeof CHOICES)[ChoiceKey]][]) {
        const v = intIn(raw[key], def.count);
        if (v === null) return null;
        choices[key] = v;
    }

    const reason = typeof raw.reason === "string" ? raw.reason.trim() : "";
    if (reason.length > REASON_MAX) return null;

    return {
        ueq: ueq as number[],
        likert: likert as number[],
        nps,
        reason: reason || null,
        ...choices,
    };
}

/** Maps a raw 1-7 UEQ answer to the -3..+3 scale with positive meaning good. */
export function ueqScore(item: number, raw: number): number {
    return UEQ_POSITIVE_RIGHT[item - 1] ? raw - 4 : 4 - raw;
}
