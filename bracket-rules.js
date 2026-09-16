const STORAGE_KEY = "admin_bracket_shuffle_rules";

export const DEFAULT_BRACKET_RULES = {
    separateSameContingentFirstRound: true,
    balanceContingents: true,
    bottomHeavyContingents: true,
    balanceBracketSides: true,
    separateSameClub: true,
    separateSeeds: true,
    distributeByes: true,
    festivalSpreadContingents: true,
    validateDuplicates: true,
    warnWhenRuleCannotBeMet: true,
    allowReshuffle: true,
    lockApprovedDraw: true
};

export function loadBracketShuffleRules() {
    try {
        const savedRules = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        return { ...DEFAULT_BRACKET_RULES, ...(savedRules && typeof savedRules === "object" ? savedRules : {}) };
    } catch (error) {
        return { ...DEFAULT_BRACKET_RULES };
    }
}

export function saveBracketShuffleRules(rules) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_BRACKET_RULES, ...rules }));
}

export function getBracketShuffleRules(rules) {
    return { ...DEFAULT_BRACKET_RULES, ...rules };
}
