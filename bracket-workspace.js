import { onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { get, ref, set, update } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
import { auth, rtdb } from "./firebase-config.js";
import { getBracketShuffleRules, loadBracketShuffleRules, saveBracketShuffleRules } from "./bracket-rules.js";

export function getBracketDbKey(category, className) {
    const raw = `${category || "Open"}__${normalizeClassName(className)}`.trim();
    return raw.replace(/[.#$\[\]\/]/g, "_");
}

let currentUser = null;
let resolveAuthReady;
const authReady = new Promise(resolve => { resolveAuthReady = resolve; });

onAuthStateChanged(auth, async user => {
    currentUser = user;
    if (!user) {
        try {
            await signInAnonymously(auth);
        } catch (e) {
            console.warn("Autentikasi anonim workspace:", e);
        }
    }
    if (resolveAuthReady) {
        resolveAuthReady(user);
        resolveAuthReady = null;
    }
});

function showCloudSyncStatus(message, type = "success") {
    const cloudStatus = document.getElementById("bracket-cloud-status");
    if (!cloudStatus) return;
    const colors = {
        success: { bg: "#eaf4f2", color: "#086b61", border: "#c2e4dd" },
        warning: { bg: "#fef9e7", color: "#8d6b0d", border: "#faeaaf" },
        info: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" }
    };
    const c = colors[type] || colors.info;
    cloudStatus.innerHTML = `<span class="clash-pill" style="background:${c.bg}; color:${c.color}; border:1px solid ${c.border}; font-weight: 600;">${escapeHtml(message)}</span>`;
}

const categorySelect = document.getElementById("bracket-category-select");
const classSelect = document.getElementById("bracket-class-select");
const participantBody = document.getElementById("bracket-participant-body");
const selectedClassLabel = document.getElementById("bracket-selected-class");
const participantCountLabel = document.getElementById("bracket-participant-count");
const contingentSummary = document.getElementById("bracket-contingent-summary");
const statusLabel = document.getElementById("bracket-status");
const inlineBracketBoard = document.getElementById("inline-bracket-board");
const inlineBracketCount = document.getElementById("inline-bracket-count");
const inlineBracketTitle = document.getElementById("inline-bracket-title");
const festivalPreview = document.getElementById("festival-preview");
const festivalPreviewCount = document.getElementById("festival-preview-count");
const festivalMatchBody = document.getElementById("festival-match-body");
const rulesDialog = document.getElementById("bracket-rules-dialog");
const rulesStatus = document.getElementById("bracket-rules-status");
const clashStatusContainer = document.getElementById("bracket-clash-status");
const swapBanner = document.getElementById("bracket-swap-banner");
const swapBannerName = document.getElementById("swap-banner-name");
const swapBannerSlot = document.getElementById("swap-banner-slot");
const btnCancelSwap = document.getElementById("btn-cancel-swap");
const btnSmartShuffle = document.getElementById("btn-smart-shuffle");
const btnResetOrder = document.getElementById("btn-reset-order");
const btnSaveBracket = document.getElementById("btn-save-bracket");
const btnExportExcel = document.getElementById("btn-export-excel");
const bracketClassSaveBadge = document.getElementById("bracket-class-save-badge");
const festivalPreviewTabs = document.getElementById("festival-preview-tabs");
const bracketParticipantListPanel = document.getElementById("bracket-participant-list-panel");

let cloudBaganMap = {};
const STORAGE_CUSTOM_ORDERS = "admin_bracket_custom_orders_v2";
const participantsByCategory = { Open: [], Festival: [] };
let rules = loadBracketShuffleRules();
let selectedSwapItem = null; // { index, slot, name, contingent }
let activeFestivalTab = "participants";
const festivalPlacements = new Map();
let namaKejuaraan = '';

const SLOTS_R1 = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'];
const SLOTS_R2 = ['Q','R','S','T','U','V','W','X'];
const SLOTS_R3 = ['Y','Z','AA','AB'];
const SLOTS_R4 = ['AC','AD'];

// Slot layout ordered by Nomor Partai (Partai 1, Partai 2, Partai 3...)
export const ACTIVE_SLOT_LAYOUT_BY_COUNT = {
    2: ["AC", "AD"],
    3: ["AA", "AB", "AC"],
    4: ["Y", "Z", "AA", "AB"],
    5: ["W", "X", "Y", "Z", "AA"],
    6: ["Q", "R", "W", "X", "Z", "AA"],
    7: ["S", "T", "U", "V", "W", "X", "Y"],
    8: ["Q", "R", "S", "T", "U", "V", "W", "X"],
    9: ["O", "P", "Q", "R", "S", "T", "U", "V", "W"],
    10: ["G", "H", "O", "P", "Q", "R", "U", "V", "S", "W"],
    11: ["G", "H", "K", "L", "O", "P", "Q", "R", "S", "U", "W"],
    12: ["C", "D", "G", "H", "K", "L", "O", "P", "Q", "S", "U", "W"],
    13: ["C", "D", "G", "H", "K", "L", "M", "N", "O", "P", "Q", "S", "U"],
    14: ["C", "D", "E", "F", "G", "H", "K", "L", "M", "N", "O", "P", "Q", "U"],
    15: ["C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q"],
    16: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"]
};

const MATCH_PAIRINGS = [
    { roundId: "r1", round: "16 Besar", matchIdx: 0, slots: ["A", "B"] },
    { roundId: "r1", round: "16 Besar", matchIdx: 1, slots: ["C", "D"] },
    { roundId: "r1", round: "16 Besar", matchIdx: 2, slots: ["E", "F"] },
    { roundId: "r1", round: "16 Besar", matchIdx: 3, slots: ["G", "H"] },
    { roundId: "r1", round: "16 Besar", matchIdx: 4, slots: ["I", "J"] },
    { roundId: "r1", round: "16 Besar", matchIdx: 5, slots: ["K", "L"] },
    { roundId: "r1", round: "16 Besar", matchIdx: 6, slots: ["M", "N"] },
    { roundId: "r1", round: "16 Besar", matchIdx: 7, slots: ["O", "P"] },
    { roundId: "r2", round: "8 Besar",  matchIdx: 0, slots: ["Q", "R"] },
    { roundId: "r2", round: "8 Besar",  matchIdx: 1, slots: ["S", "T"] },
    { roundId: "r2", round: "8 Besar",  matchIdx: 2, slots: ["U", "V"] },
    { roundId: "r2", round: "8 Besar",  matchIdx: 3, slots: ["W", "X"] },
    { roundId: "r3", round: "Semi Final", matchIdx: 0, slots: ["Y", "Z"] },
    { roundId: "r3", round: "Semi Final", matchIdx: 1, slots: ["AA", "AB"] },
    { roundId: "r4", round: "Final",    matchIdx: 0, slots: ["AC", "AD"] }
];

function normalizeClassName(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim() || "Tanpa kelas";
}

function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function isTeamClass(className) {
    return /beregu|team|tim|regu/i.test(String(className || ""));
}

function getParticipantUniqueKey(participant) {
    if (!participant) return "";
    if (participant.id) return String(participant.id);
    const name = String(participant["NAMA LENGKAP"] || "").trim().toLowerCase();
    const contingent = String(participant.KONTINGEN || "").trim().toLowerCase();
    const cat = String(participant.kategori || "").trim().toLowerCase();
    return `${name}__${contingent}__${cat}`;
}

function getSavedOrdersMap() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_CUSTOM_ORDERS) || "{}");
    } catch {
        return {};
    }
}

export function isClassBaganSaved(category, className) {
    if (!className) return false;
    const dbKey = getBracketDbKey(category, className);
    if (cloudBaganMap[dbKey]) {
        const data = cloudBaganMap[dbKey];
        if (data && (data.bracket || (Array.isArray(data.customOrder) && data.customOrder.length > 0))) {
            return true;
        }
    }
    const ordersMap = getSavedOrdersMap();
    const localKey = `${category}__${normalizeClassName(className)}`;
    if (ordersMap[localKey] && ordersMap[localKey].length > 0) {
        return true;
    }
    return false;
}

export function updateBracketClassCounters() {
    const openGroups = new Set();
    participantsByCategory.Open.forEach(p => {
        openGroups.add(normalizeClassName(p["KELAS PERTANDINGAN"]));
    });
    const festivalGroups = new Set();
    participantsByCategory.Festival.forEach(p => {
        festivalGroups.add(normalizeClassName(p["KELAS PERTANDINGAN"]));
    });

    const openTotal = openGroups.size;
    let openSaved = 0;
    openGroups.forEach(className => {
        if (isClassBaganSaved("Open", className)) openSaved++;
    });
    const openPending = Math.max(0, openTotal - openSaved);

    const festivalTotal = festivalGroups.size;
    let festivalSaved = 0;
    festivalGroups.forEach(className => {
        if (isClassBaganSaved("Festival", className)) festivalSaved++;
    });
    const festivalPending = Math.max(0, festivalTotal - festivalSaved);

    const openCountEl = document.getElementById("bracket-open-class-count");
    if (openCountEl) {
        openCountEl.textContent = openPending;
        const small = openCountEl.parentElement.querySelector("small");
        if (small) {
            small.innerHTML = `kelas perlu bagan<span style="display:block; font-size:11px; color:#0a877d; font-weight:700; margin-top:2px;">(${openSaved} selesai / ${openTotal} total)</span>`;
        }
    }

    const festivalCountEl = document.getElementById("bracket-festival-class-count");
    if (festivalCountEl) {
        festivalCountEl.textContent = festivalPending;
        const small = festivalCountEl.parentElement.querySelector("small");
        if (small) {
            small.innerHTML = `kelas perlu bagan<span style="display:block; font-size:11px; color:#0a877d; font-weight:700; margin-top:2px;">(${festivalSaved} selesai / ${festivalTotal} total)</span>`;
        }
    }
}

async function saveCustomOrder(category, className, participants) {
    const ordersMap = getSavedOrdersMap();
    const key = `${category}__${normalizeClassName(className)}`;
    const orderedKeys = participants.map(p => getParticipantUniqueKey(p));
    ordersMap[key] = orderedKeys;
    localStorage.setItem(STORAGE_CUSTOM_ORDERS, JSON.stringify(ordersMap));

    // Sinkronisasi otomatis ke Firebase Realtime Database
    const dbKey = getBracketDbKey(category, className);
    if (!cloudBaganMap[dbKey]) cloudBaganMap[dbKey] = {};
    cloudBaganMap[dbKey].category = category;
    cloudBaganMap[dbKey].className = normalizeClassName(className);
    cloudBaganMap[dbKey].customOrder = orderedKeys;
    cloudBaganMap[dbKey].participantCount = participants.length;

    try {
        await authReady;
        await update(ref(rtdb, `bagan/${dbKey}`), {
            category,
            className: normalizeClassName(className),
            customOrder: orderedKeys,
            participantCount: participants.length,
            updatedAt: Date.now()
        });
        showCloudSyncStatus("☁️ Urutan Tersimpan di Cloud", "success");
    } catch (error) {
        console.warn("Gagal simpan urutan ke RTDB:", error);
        showCloudSyncStatus("💾 Tersimpan Lokal (Offline)", "warning");
    }

    updateBracketClassCounters();
    refreshClassOptionTitles();
    renderClassSaveBadge(className);
}

async function clearCustomOrder(category, className) {
    const ordersMap = getSavedOrdersMap();
    const key = `${category}__${normalizeClassName(className)}`;
    delete ordersMap[key];
    localStorage.setItem(STORAGE_CUSTOM_ORDERS, JSON.stringify(ordersMap));

    const dbKey = getBracketDbKey(category, className);
    if (cloudBaganMap[dbKey]) {
        cloudBaganMap[dbKey].customOrder = null;
        cloudBaganMap[dbKey].bracket = null;
    }

    try {
        await authReady;
        await update(ref(rtdb, `bagan/${dbKey}`), {
            customOrder: null,
            bracket: null,
            updatedAt: Date.now()
        });
        showCloudSyncStatus("↺ Urutan Direset di Cloud", "info");
    } catch (error) {
        console.warn("Gagal reset urutan di RTDB:", error);
    }

    updateBracketClassCounters();
    refreshClassOptionTitles();
    renderClassSaveBadge(className);
}

function getBaseParticipantsForClass(className) {
    const category = categorySelect.value;
    const classParticipants = participantsByCategory[category].filter(participant => normalizeClassName(participant["KELAS PERTANDINGAN"]) === className);
    if (category !== "Open" || !isTeamClass(className)) return classParticipants;

    const teamGroups = new Map();
    classParticipants.forEach(participant => {
        const contingent = String(participant.KONTINGEN || "Tanpa kontingen").trim();
        const key = contingent.toLocaleLowerCase("id-ID");
        if (!teamGroups.has(key)) teamGroups.set(key, []);
        teamGroups.get(key).push(participant);
    });

    return [...teamGroups.values()].map(members => {
        const firstMember = [...members].sort((first, second) => String(first["NAMA LENGKAP"] || "").localeCompare(String(second["NAMA LENGKAP"] || ""), "id", { sensitivity: "base" }))[0];
        return { ...firstMember, "NAMA LENGKAP": `${firstMember["NAMA LENGKAP"] || "Tim"} Cs` };
    });
}

function getOrderedParticipants(className) {
    const base = getBaseParticipantsForClass(className);
    const category = categorySelect.value;
    const ordersMap = getSavedOrdersMap();
    const key = `${category}__${normalizeClassName(className)}`;
    const savedKeys = ordersMap[key];

    if (!Array.isArray(savedKeys) || savedKeys.length === 0) {
        return base;
    }

    const mapByKey = new Map();
    base.forEach(p => {
        mapByKey.set(getParticipantUniqueKey(p), p);
    });

    const ordered = [];
    savedKeys.forEach(k => {
        if (mapByKey.has(k)) {
            ordered.push(mapByKey.get(k));
            mapByKey.delete(k);
        }
    });

    // Append any new or remaining participants
    mapByKey.forEach(p => ordered.push(p));
    return ordered;
}

function setStatus(message, type = "") {
    statusLabel.textContent = message;
    statusLabel.className = `status-message ${type}`.trim();
}

function getClassOptions() {
    const groups = new Map();
    participantsByCategory[categorySelect.value].forEach(participant => {
        const className = normalizeClassName(participant["KELAS PERTANDINGAN"]);
        groups.set(className, true);
    });
    return [...groups.keys()]
        .map(className => {
            const participants = getOrderedParticipants(className);
            return {
                className,
                participantCount: participants.length,
                hasContingentClash: detectContingentClashes(participants).clashes.length > 0
            };
        })
        .sort((first, second) => second.participantCount - first.participantCount || first.className.localeCompare(second.className, "id", { sensitivity: "base" }));
}

function renderClassSaveBadge(className) {
    if (!bracketClassSaveBadge) return;
    if (!className) {
        bracketClassSaveBadge.innerHTML = "";
        return;
    }
    const isSaved = isClassBaganSaved(categorySelect.value, className);
    if (isSaved) {
        bracketClassSaveBadge.innerHTML = `<span class="clash-pill is-safe" style="background:#eaf4f2; color:#087d72; border:1px solid #bce4dc; font-weight:700; font-size:11.5px; padding:3px 12px; border-radius:999px;">✅ Bagan Sudah Disimpan</span>`;
    } else {
        bracketClassSaveBadge.innerHTML = `<span class="clash-pill" style="background:#fff8e6; color:#b45309; border:1px solid #fde68a; font-weight:700; font-size:11.5px; padding:3px 12px; border-radius:999px;">⏳ Belum Disimpan (Perlu Disusun)</span>`;
    }
}

function refreshClassOptionTitles() {
    const cat = categorySelect.value;
    Array.from(classSelect.options).forEach(opt => {
        if (!opt.value) return;
        const saved = isClassBaganSaved(cat, opt.value);
        const statusPrefix = saved ? "✅ " : "⏳ ";
        const statusSuffix = saved ? " · [BAGAN SIAP]" : " · [BELUM ADA BAGAN]";
        const baseName = opt.value.toLocaleUpperCase("id-ID");
        const count = participantsByCategory[cat].filter(p => normalizeClassName(p["KELAS PERTANDINGAN"]) === opt.value).length;
        opt.textContent = `${statusPrefix}${baseName} · ${count} peserta${statusSuffix}`;
    });
}

function renderClassOptions() {
    const options = getClassOptions();
    const cat = categorySelect.value;
    const currentVal = classSelect.value;
    const assignments = JSON.parse(localStorage.getItem("admin_schedule_tatami_settings") || "{}");
    classSelect.innerHTML = options.length
        ? options.map(option => {
            const saved = isClassBaganSaved(cat, option.className);
            const statusPrefix = saved ? "✅ " : "⏳ ";
            const statusSuffix = saved ? " · [BAGAN SIAP]" : " · [BELUM ADA BAGAN]";
            const clashIcon = option.hasContingentClash && cat === "Festival" ? "⚠️ " : "";
            const clashText = option.hasContingentClash && cat === "Festival" ? " · Bentrok" : "";
            
            let tatamiText = "";
            const classKeyStr = `${cat}::${option.className}`;
            if (assignments[classKeyStr]) {
                const rawVal = String(assignments[classKeyStr]);
                if (/^\d+$/.test(rawVal)) {
                    tatamiText = `[TATAMI ${rawVal}] `;
                } else {
                    const m = rawVal.match(/^D(\d+)-T(\d+)$/);
                    if (m) tatamiText = `[HARI ${m[1]} - T${m[2]}] `;
                }
            } else {
                tatamiText = `[BELUM JADWAL] `;
            }

            return `<option value="${escapeHtml(option.className)}">${statusPrefix}${clashIcon}${tatamiText}${escapeHtml(option.className.toLocaleUpperCase("id-ID"))} · ${option.participantCount} peserta${statusSuffix}${clashText}</option>`;
        }).join("")
        : '<option value="">Belum ada kelas</option>';

    if (currentVal && Array.from(classSelect.options).some(opt => opt.value === currentVal)) {
        classSelect.value = currentVal;
    }
    cancelSwapSelection();
    renderParticipants();
    updateBracketClassCounters();
}

function refreshClassOptionWarnings() {
    if (categorySelect.value !== "Festival") return;
    refreshClassOptionTitles();
}

/**
 * Calculates match numbers (Partai 1, Partai 2...) exactly compatible with template_bagan.html
 */
function calculatePartaiMap(activeSlots) {
    const matchPartaiMap = {};
    const producesWinner = {};
    let counter = 1;

    const roundsOrder = [
        { id: 'r1', slots: SLOTS_R1, count: 8 },
        { id: 'r2', slots: SLOTS_R2, count: 4 },
        { id: 'r3', slots: SLOTS_R3, count: 2 },
        { id: 'r4', slots: SLOTS_R4, count: 1 }
    ];

    roundsOrder.forEach((r, rIndex) => {
        const isR4 = r.id === 'r4';
        const matchCount = r.count;

        for (let i = 0; i < matchCount; i++) {
            let slot1, slot2;
            if (isR4) {
                slot1 = SLOTS_R4[0];
                slot2 = SLOTS_R4[1];
            } else {
                slot1 = r.slots[i * 2];
                slot2 = r.slots[i * 2 + 1];
            }

            let s1Populated = activeSlots.includes(slot1);
            if (!s1Populated && rIndex > 0) {
                const prevRound = roundsOrder[rIndex - 1].id;
                s1Populated = producesWinner[`${prevRound}-${i * 2}`] || false;
            }

            let s2Populated = activeSlots.includes(slot2);
            if (!s2Populated && rIndex > 0) {
                const prevRound = roundsOrder[rIndex - 1].id;
                s2Populated = producesWinner[`${prevRound}-${i * 2 + 1}`] || false;
            }

            const matchKey = `${r.id}-${i}`;
            if (s1Populated && s2Populated) {
                matchPartaiMap[matchKey] = counter++;
                producesWinner[matchKey] = true;
            } else if (s1Populated || s2Populated) {
                producesWinner[matchKey] = true;
            } else {
                producesWinner[matchKey] = false;
            }
        }
    });

    return matchPartaiMap;
}

/**
 * Finds the first match details (Nomor Partai, Round, Corner) for a given slot
 */
function getSlotPartaiInfo(slot, activeSlots, matchPartaiMap) {
    const roundsOrder = [
        { id: 'r1', slots: SLOTS_R1, name: '16 Besar', count: 8 },
        { id: 'r2', slots: SLOTS_R2, name: '8 Besar', count: 4 },
        { id: 'r3', slots: SLOTS_R3, name: 'Semi Final', count: 2 },
        { id: 'r4', slots: SLOTS_R4, name: 'Final', count: 1 }
    ];

    for (let rIndex = 0; rIndex < roundsOrder.length; rIndex++) {
        const r = roundsOrder[rIndex];
        const isR4 = r.id === 'r4';
        for (let i = 0; i < r.count; i++) {
            const slot1 = isR4 ? SLOTS_R4[0] : r.slots[i * 2];
            const slot2 = isR4 ? SLOTS_R4[1] : r.slots[i * 2 + 1];

            if (slot === slot1 || slot === slot2) {
                const matchKey = `${r.id}-${i}`;
                const partaiNo = matchPartaiMap[matchKey];
                const isBlueCorner = slot === slot1;
                const isOpponentDirect = (slot === slot1 && activeSlots.includes(slot2)) || (slot === slot2 && activeSlots.includes(slot1));

                if (partaiNo) {
                    return {
                        partaiNo,
                        partaiText: `Partai ${partaiNo}`,
                        roundName: r.name,
                        corner: isBlueCorner ? 'Sudut Biru (Atas)' : 'Sudut Merah (Bawah)',
                        isDirectMatch: isOpponentDirect,
                        isSeed: false
                    };
                } else if (rIndex < roundsOrder.length - 1) {
                    // Seed / bye slot waiting for winner from previous round
                    const nextRound = roundsOrder[rIndex];
                    const nextMatchKey = `${nextRound.id}-${i}`;
                    const nextPartaiNo = matchPartaiMap[nextMatchKey];
                    return {
                        partaiNo: nextPartaiNo || null,
                        partaiText: nextPartaiNo ? `Partai ${nextPartaiNo} (BYE)` : `Lolos (${r.name})`,
                        roundName: r.name,
                        corner: isBlueCorner ? 'Sudut Biru (Atas)' : 'Sudut Merah (Bawah)',
                        isDirectMatch: false,
                        isSeed: true
                    };
                }
            }
        }
    }

    return {
        partaiNo: null,
        partaiText: "Bagan",
        roundName: "-",
        corner: "Peserta",
        isDirectMatch: false,
        isSeed: false
    };
}

function detectContingentClashes(participants) {
    const participantCount = Math.max(2, Math.min(16, participants.length || 2));
    const activeSlots = ACTIVE_SLOT_LAYOUT_BY_COUNT[participantCount] || ACTIVE_SLOT_LAYOUT_BY_COUNT[16];
    const slotToParticipant = new Map(activeSlots.map((slot, index) => [slot, participants[index]]));
    const matchPartaiMap = calculatePartaiMap(activeSlots);
    
    const clashes = [];
    const clashingSlots = new Set();
    const clashingParticipantIndexes = new Set();

    MATCH_PAIRINGS.forEach(pair => {
        const p1 = slotToParticipant.get(pair.slots[0]);
        const p2 = slotToParticipant.get(pair.slots[1]);
        if (p1 && p2) {
            const c1 = String(p1.KONTINGEN || "").trim().toLowerCase();
            const c2 = String(p2.KONTINGEN || "").trim().toLowerCase();
            if (c1 && c2 && c1 === c2 && c1 !== "-" && c1 !== "tanpa kontingen") {
                const idx1 = activeSlots.indexOf(pair.slots[0]);
                const idx2 = activeSlots.indexOf(pair.slots[1]);
                const matchKey = `${pair.roundId}-${pair.matchIdx}`;
                const partaiNo = matchPartaiMap[matchKey];
                clashes.push({
                    slots: pair.slots,
                    round: pair.round,
                    partaiNo,
                    contingent: p1.KONTINGEN,
                    p1: p1["NAMA LENGKAP"],
                    p2: p2["NAMA LENGKAP"],
                    idx1,
                    idx2
                });
                clashingSlots.add(pair.slots[0]);
                clashingSlots.add(pair.slots[1]);
                if (idx1 !== -1) clashingParticipantIndexes.add(idx1);
                if (idx2 !== -1) clashingParticipantIndexes.add(idx2);
            }
        }
    });

    return { clashes, clashingSlots, clashingParticipantIndexes, activeSlots, matchPartaiMap };
}

function updateClashStatusUI(clashResult) {
    if (!clashStatusContainer) return;
    const { clashes } = clashResult;
    if (clashes.length === 0) {
        clashStatusContainer.innerHTML = '<span class="clash-pill is-safe">✓ Semua kontingen aman (0 bentrok awal)</span>';
    } else {
        const clashDetails = clashes.map(c => `${c.partaiNo ? `Partai ${c.partaiNo}` : c.slots.join(' vs ')}: ${escapeHtml(c.contingent)}`).join(' | ');
        clashStatusContainer.innerHTML = `<span class="clash-pill is-clash" title="${clashDetails}">⚠️ ${clashes.length} Bentrok Kontingen (${escapeHtml(clashes[0].contingent)}${clashes.length > 1 ? ` +${clashes.length - 1}` : ''})</span>`;
    }
}

function renderParticipants() {
    const className = classSelect.value;
    const participants = getOrderedParticipants(className);
    const participantTable = document.querySelector(".bracket-participants-table");
    participantTable?.classList.toggle("festival-list-mode", categorySelect.value === "Festival");
    const participantCount = Math.max(2, Math.min(16, participants.length || 2));
    const activeSlots = ACTIVE_SLOT_LAYOUT_BY_COUNT[participantCount] || ACTIVE_SLOT_LAYOUT_BY_COUNT[16];
    const matchPartaiMap = calculatePartaiMap(activeSlots);

    selectedClassLabel.textContent = className ? `${className.toLocaleUpperCase("id-ID")} · ${categorySelect.value.toUpperCase()}` : "BELUM ADA KELAS DIPILIH";
    participantCountLabel.textContent = `${participants.length} peserta`;
    renderClassSaveBadge(className);
    renderContingentSummary(participants);
    inlineBracketTitle.textContent = `Bagan ${participantCount} Peserta`;

    const clashResult = detectContingentClashes(participants);
    updateClashStatusUI(clashResult);

    renderFestivalPreview(participants);

    if (!participants.length) {
        participantBody.innerHTML = '<tr><td colspan="6" class="empty-state">Belum ada peserta pada kelas ini.</td></tr>';
        renderInlineBracket(participants, clashResult, matchPartaiMap);
        return;
    }

    participantBody.innerHTML = participants.map((participant, index) => {
        const slot = activeSlots[index] || `Slot ${index + 1}`;
        const partaiInfo = getSlotPartaiInfo(slot, activeSlots, matchPartaiMap);
        const isClashing = clashResult.clashingParticipantIndexes.has(index);
        const isSelected = selectedSwapItem && selectedSwapItem.index === index;
        const name = escapeHtml(String(participant["NAMA LENGKAP"] || "-").toLocaleUpperCase("id-ID"));
        const contingent = escapeHtml(String(participant.KONTINGEN || "-").toLocaleUpperCase("id-ID"));
        const category = categorySelect.value.toUpperCase();

        const rowClasses = [
            isSelected ? 'is-row-selected' : '',
            isClashing ? 'is-row-clashing' : ''
        ].filter(Boolean).join(' ');

        return `
            <tr class="${rowClasses}" data-index="${index}">
                <td class="festival-partai-column">
                    <span class="partai-pill ${partaiInfo.isSeed ? 'is-bye' : ''}" title="${partaiInfo.roundName} · ${partaiInfo.corner}">
                        ${partaiInfo.partaiText}
                    </span>
                </td>
                <td class="col-num">${index + 1}</td>
                <td class="col-name">
                    <strong>${name}</strong>
                    ${isClashing ? '<span class="clash-tag-inline" title="Atlet dari kontingen ini langsung bertemu di partai pertama">⚠️ Bentrok Partai</span>' : ''}
                </td>
                <td>${category}</td>
                <td><span class="contingent-text">${contingent}</span></td>
                <td class="col-actions">
                    <div class="row-action-buttons">
                        <button type="button" class="btn-order-move" data-action="up" data-index="${index}" ${index === 0 ? 'disabled' : ''} title="Geser ke atas">▲</button>
                        <button type="button" class="btn-order-move" data-action="down" data-index="${index}" ${index === participants.length - 1 ? 'disabled' : ''} title="Geser ke bawah">▼</button>
                        <button type="button" class="btn-order-swap ${isSelected ? 'is-active' : ''}" data-action="swap" data-index="${index}" data-slot="${slot}" title="Pilih untuk tukar posisi">
                            ${isSelected ? 'Batal' : '⇄ Tukar'}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    renderInlineBracket(participants, clashResult, matchPartaiMap);
    attachTableActionEvents();
}

function renderContingentSummary(participants) {
    if (!contingentSummary) return;
    const counts = new Map();
    participants.forEach(participant => {
        const contingent = String(participant.KONTINGEN || "Tanpa kontingen").trim() || "Tanpa kontingen";
        counts.set(contingent, (counts.get(contingent) || 0) + 1);
    });
    const sortedCounts = [...counts.entries()].sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0], "id", { sensitivity: "base" }));
    contingentSummary.innerHTML = sortedCounts.length
        ? `<span class="contingent-summary-label">Peserta per kontingen</span>${sortedCounts.map(([contingent, count]) => `<span class="contingent-summary-card"><strong>${escapeHtml(contingent)}</strong><b>${count}</b><small>peserta</small></span>`).join("")}`
        : '<span class="settings-help">Belum ada data kontingen.</span>';
}

function renderFestivalPreview(participants) {
    const isFestival = categorySelect.value === "Festival";
    if (festivalPreview) festivalPreview.hidden = !isFestival;
    const inlinePreview = document.querySelector(".inline-bracket-preview");
    if (inlinePreview) inlinePreview.hidden = isFestival;
    if (festivalPreviewTabs) festivalPreviewTabs.hidden = !isFestival;
    updateFestivalTabPanels();
    if (!isFestival || !festivalMatchBody) return;

    festivalPreviewCount.textContent = `${participants.length} peserta`;
    const matches = [];
    for (let index = 0; index < participants.length; index += 2) {
        matches.push([participants[index], participants[index + 1]]);
    }
    const participantCell = participant => escapeHtml(String(participant?.["NAMA LENGKAP"] || "-").toLocaleUpperCase("id-ID"));
    const contingentCell = participant => escapeHtml(String(participant?.KONTINGEN || "-").toLocaleUpperCase("id-ID"));
    const placementButtons = participant => {
        const participantKey = escapeHtml(getParticipantUniqueKey(participant));
        const selectedPlacement = festivalPlacements.get(getParticipantUniqueKey(participant));
        return `<div class="festival-placement-buttons">
            <button type="button" class="festival-place-button ${selectedPlacement === "1" ? "is-selected" : ""}" aria-pressed="${selectedPlacement === "1"}" data-festival-placement="1" data-participant-key="${participantKey}">1</button>
            <button type="button" class="festival-place-button ${selectedPlacement === "2" ? "is-selected" : ""}" aria-pressed="${selectedPlacement === "2"}" data-festival-placement="2" data-participant-key="${participantKey}">2</button>
        </div>`;
    };
    festivalMatchBody.innerHTML = matches.length
        ? matches.map(([red, blue]) => `
            <tr>
                <td class="festival-corner red-corner">MERAH</td>
                <td>${participantCell(red)}</td>
                <td>${contingentCell(red)}</td>
                <td>${placementButtons(red)}</td>
                <td class="festival-vs-cell">VS</td>
                <td>${placementButtons(blue)}</td>
                <td>${participantCell(blue)}</td>
                <td>${contingentCell(blue)}</td>
                <td class="festival-corner blue-corner">BIRU</td>
            </tr>
        `).join("")
        : '<tr><td colspan="9" class="empty-state">Belum ada peserta.</td></tr>';
}

festivalMatchBody?.addEventListener("click", event => {
    const placementButton = event.target.closest("[data-festival-placement]");
    if (!placementButton) return;
    const participantKey = placementButton.dataset.participantKey;
    const placement = placementButton.dataset.festivalPlacement;
    festivalPlacements.set(participantKey, placement);
    festivalMatchBody.querySelectorAll(`.festival-place-button[data-participant-key="${CSS.escape(participantKey)}"]`).forEach(button => {
        const isSelected = button.dataset.festivalPlacement === placement;
        button.classList.toggle("is-selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
    });
});

function updateFestivalTabPanels() {
    const isFestival = categorySelect.value === "Festival";
    if (!isFestival) {
        if (bracketParticipantListPanel) bracketParticipantListPanel.hidden = false;
        if (festivalPreview) festivalPreview.hidden = true;
        return;
    }

    if (bracketParticipantListPanel) bracketParticipantListPanel.hidden = activeFestivalTab !== "participants";
    if (festivalPreview) festivalPreview.hidden = activeFestivalTab !== "preview";
    document.querySelectorAll(".festival-preview-tab").forEach(tab => {
        tab.classList.toggle("active", tab.dataset.festivalTab === activeFestivalTab);
    });
}

function attachTableActionEvents() {
    participantBody.querySelectorAll("button[data-action]").forEach(button => {
        button.addEventListener("click", (e) => {
            e.stopPropagation();
            const action = button.dataset.action;
            const index = parseInt(button.dataset.index, 10);
            const className = classSelect.value;
            const participants = [...getOrderedParticipants(className)];

            if (action === "up" && index > 0) {
                swapParticipantPositions(index, index - 1);
            } else if (action === "down" && index < participants.length - 1) {
                swapParticipantPositions(index, index + 1);
            } else if (action === "swap") {
                handleSwapTrigger(index, button.dataset.slot);
            }
        });
    });
}

function handleSwapTrigger(index, slot) {
    const className = classSelect.value;
    const participants = getOrderedParticipants(className);
    const participant = participants[index];
    if (!participant) return;

    if (selectedSwapItem && selectedSwapItem.index === index) {
        cancelSwapSelection();
        return;
    }

    if (selectedSwapItem) {
        // Execute swap
        const firstIndex = selectedSwapItem.index;
        swapParticipantPositions(firstIndex, index);
        cancelSwapSelection();
    } else {
        // Start selection
        selectedSwapItem = {
            index,
            slot: slot || `Slot ${index + 1}`,
            name: String(participant["NAMA LENGKAP"] || "Peserta"),
            contingent: String(participant.KONTINGEN || "")
        };
        updateSwapBannerUI();
        renderParticipants();
    }
}

function cancelSwapSelection() {
    selectedSwapItem = null;
    if (swapBanner) swapBanner.hidden = true;
    const selectedRows = participantBody.querySelectorAll(".is-row-selected");
    selectedRows.forEach(r => r.classList.remove("is-row-selected"));
    const selectedCards = inlineBracketBoard.querySelectorAll(".is-swap-source");
    selectedCards.forEach(c => c.classList.remove("is-swap-source"));
}

function updateSwapBannerUI() {
    if (!swapBanner) return;
    if (!selectedSwapItem) {
        swapBanner.hidden = true;
        return;
    }
    swapBanner.hidden = false;
    if (swapBannerName) swapBannerName.textContent = selectedSwapItem.name.toUpperCase();
    if (swapBannerSlot) swapBannerSlot.textContent = selectedSwapItem.slot;
}

function swapParticipantPositions(indexA, indexB) {
    const className = classSelect.value;
    const participants = [...getOrderedParticipants(className)];
    if (indexA < 0 || indexA >= participants.length || indexB < 0 || indexB >= participants.length) return;

    const temp = participants[indexA];
    participants[indexA] = participants[indexB];
    participants[indexB] = temp;

    saveCustomOrder(categorySelect.value, className, participants);
    refreshClassOptionWarnings();
    setStatus(`Posisi ${temp["NAMA LENGKAP"] || "Peserta"} berhasil ditukar!`, "success");
    renderParticipants();
}

function renderInlineBracket(participants, clashResult, matchPartaiMap) {
    if (!inlineBracketBoard) return;
    const participantCount = Math.max(2, Math.min(16, participants.length || 2));
    const activeSlots = ACTIVE_SLOT_LAYOUT_BY_COUNT[participantCount] || ACTIVE_SLOT_LAYOUT_BY_COUNT[16];
    const participantBySlot = new Map(activeSlots.map((slot, index) => [slot, { participant: participants[index], index }]));
    
    const clashingSlots = clashResult ? clashResult.clashingSlots : new Set();
    const partaiMap = matchPartaiMap || calculatePartaiMap(activeSlots);

    const rounds = [
        { id: "r1", title: "16 BESAR", items: [["A", "B"], ["C", "D"], ["E", "F"], ["G", "H"], ["I", "J"], ["K", "L"], ["M", "N"], ["O", "P"]] },
        { id: "r2", title: "8 BESAR",  items: [["Q", "R"], ["S", "T"], ["U", "V"], ["W", "X"]] },
        { id: "r3", title: "SEMI FINAL", items: [["Y", "Z"], ["AA", "AB"]] },
        { id: "r4", title: "FINAL",    items: [["AC", "AD"]] }
    ];

    inlineBracketCount.textContent = `${participants.length} peserta`;

    const metaSpan = document.getElementById("inline-bracket-event-meta");
    if (metaSpan) {
        let tatamiText = "";
        const classKeyStr = `${categorySelect.value}::${classSelect.value}`;
        const assignments = JSON.parse(localStorage.getItem("admin_schedule_tatami_settings") || "{}");
        if (assignments[classKeyStr]) {
            const rawVal = String(assignments[classKeyStr]);
            if (/^\d+$/.test(rawVal)) {
                tatamiText = `(HARI 1 - TATAMI ${rawVal})`;
            } else {
                const m = rawVal.match(/^D(\d+)-T(\d+)$/);
                if (m) tatamiText = `(HARI ${m[1]} - TATAMI ${m[2]})`;
            }
        }
        
        let metaText = namaKejuaraan ? namaKejuaraan.toUpperCase() : "KEJUARAAN KARATE";
        if (tatamiText) metaText += ` ${tatamiText}`;
        metaSpan.textContent = metaText;
    }

    inlineBracketBoard.innerHTML = rounds.map((round, roundIndex) => {
        const matchCards = round.items.map((match, matchIndex) => {
            const matchHasClash = clashingSlots.has(match[0]) && clashingSlots.has(match[1]);
            const matchKey = `${round.id}-${matchIndex}`;
            const partaiNo = partaiMap[matchKey];
            
            const rows = match.map(slot => {
                const entry = participantBySlot.get(slot);
                const isActive = activeSlots.includes(slot);
                
                if (entry && entry.participant) {
                    const participant = entry.participant;
                    const index = entry.index;
                    const isSelected = selectedSwapItem && selectedSwapItem.index === index;
                    const isSlotClashing = clashingSlots.has(slot);
                    const name = escapeHtml(String(participant["NAMA LENGKAP"] || "-").toLocaleUpperCase("id-ID"));
                    const contingent = escapeHtml(String(participant.KONTINGEN || "-").toLocaleUpperCase("id-ID"));
                    
                    const playerClasses = [
                        'inline-bracket-player',
                        'is-interactive-slot',
                        isSelected ? 'is-swap-source' : '',
                        isSlotClashing ? 'is-slot-clashing' : ''
                    ].filter(Boolean).join(' ');

                    return `
                        <div class="${playerClasses}" data-slot="${slot}" data-index="${index}" title="Klik untuk menukar posisi peserta ini">
                            <span>${slot}</span>
                            <div>
                                <strong>${name}</strong>
                                <small>${contingent}</small>
                            </div>
                            <span class="slot-swap-hint" aria-hidden="true">⇄</span>
                        </div>
                    `;
                }

                if (!isActive && roundIndex === 0) {
                    return `<div class="inline-bracket-empty is-bye"><span>${slot}</span><em>BYE</em></div>`;
                }

                const emptyText = roundIndex === 0 ? "—" : "Pemenang";
                return `<div class="inline-bracket-empty"><span>${slot}</span><em>${emptyText}</em></div>`;
            }).join("");

            return `
                <div class="inline-match-wrapper">
                    ${partaiNo ? `<div class="inline-match-partai-tag">Partai ${partaiNo}</div>` : ''}
                    <article class="inline-bracket-match ${matchHasClash ? 'has-contingent-clash' : ''}">${rows}</article>
                </div>
            `;
        }).join("");

        return `<div class="inline-bracket-round inline-bracket-round-${roundIndex + 1}"><h3>${round.title}</h3><div class="inline-bracket-matches">${matchCards}</div></div>`;
    }).join("");

    attachBracketSlotEvents();
}

function attachBracketSlotEvents() {
    inlineBracketBoard.querySelectorAll(".is-interactive-slot").forEach(card => {
        card.addEventListener("click", () => {
            const index = parseInt(card.dataset.index, 10);
            const slot = card.dataset.slot;
            handleSwapTrigger(index, slot);
        });
    });
}

function getContingentKey(participant) {
    return String(participant?.KONTINGEN || "Tanpa kontingen").trim().toLocaleLowerCase("id-ID");
}

function buildFestivalSpreadArrangement(participants) {
    const groups = new Map();
    participants.forEach(participant => {
        const key = getContingentKey(participant);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(participant);
    });

    const arrangement = [];
    while (groups.size) {
        const orderedGroups = [...groups.entries()].sort((first, second) => second[1].length - first[1].length);
        const [firstKey, firstGroup] = orderedGroups[0];
        const firstParticipant = firstGroup.shift();
        arrangement.push(firstParticipant);
        if (!firstGroup.length) groups.delete(firstKey);

        const nextGroups = [...groups.entries()].sort((first, second) => second[1].length - first[1].length);
        const [secondKey, secondGroup] = nextGroups.find(([key]) => key !== firstKey) || nextGroups[0] || [];
        if (secondGroup?.length) {
            arrangement.push(secondGroup.shift());
            if (!secondGroup.length) groups.delete(secondKey);
        }
    }

    return arrangement;
}

function smartShuffleParticipants() {
    const className = classSelect.value;
    const baseParticipants = [...getBaseParticipantsForClass(className)];
    if (baseParticipants.length === 0) {
        setStatus("Belum ada peserta.", "error");
        return;
    }
    if (baseParticipants.length === 1) {
        saveCustomOrder(categorySelect.value, className, baseParticipants);
        refreshClassOptionWarnings();
        renderParticipants();
        
        // Simpan langsung ke database jika 1 peserta (sebagai by-default siap)
        saveCurrentClassBracket();
        
        setStatus("Kelas hanya memiliki 1 peserta, otomatis tersimpan dan siap.", "success");
        return;
    }

    let bestArrangement = categorySelect.value === "Festival" && rules.festivalSpreadContingents
        ? buildFestivalSpreadArrangement(baseParticipants)
        : [...baseParticipants];
    let bestScore = Infinity;
    const maxTrials = 500;

    for (let trial = 0; trial < maxTrials; trial++) {
        // Fisher-Yates shuffle
        const candidate = [...baseParticipants];
        for (let i = candidate.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidate[i], candidate[j]] = [candidate[j], candidate[i]];
        }

        const clashResult = detectContingentClashes(candidate);
        let score = clashResult.clashes.length * 1000;

        if (categorySelect.value === "Festival" && rules.festivalSpreadContingents) {
            for (let index = 0; index < candidate.length - 1; index += 2) {
                const firstContingent = getContingentKey(candidate[index]);
                const secondContingent = getContingentKey(candidate[index + 1]);
                if (firstContingent === secondContingent) score += 500;
            }
        }

        // Balance sides if rule enabled
        if (rules.balanceBracketSides) {
            const mid = Math.ceil(candidate.length / 2);
            const topContingents = new Map();
            const botContingents = new Map();

            candidate.slice(0, mid).forEach(p => {
                const c = String(p.KONTINGEN || "").trim().toLowerCase();
                topContingents.set(c, (topContingents.get(c) || 0) + 1);
            });
            candidate.slice(mid).forEach(p => {
                const c = String(p.KONTINGEN || "").trim().toLowerCase();
                botContingents.set(c, (botContingents.get(c) || 0) + 1);
            });

            topContingents.forEach((topCount, c) => {
                if (c && c !== "-" && c !== "tanpa kontingen") {
                    const botCount = botContingents.get(c) || 0;
                    score += Math.abs(topCount - botCount) * 10;
                }
            });
        }

        if (score < bestScore) {
            bestScore = score;
            bestArrangement = candidate;
            if (bestScore === 0) break; // Found optimal clash-free arrangement
        }
    }

    if (categorySelect.value === "Festival" && rules.festivalSpreadContingents) {
        bestArrangement = buildFestivalSpreadArrangement(baseParticipants);
    }
    saveCustomOrder(categorySelect.value, className, bestArrangement);
    refreshClassOptionWarnings();
    cancelSwapSelection();
    renderParticipants();

    const finalClashes = detectContingentClashes(bestArrangement).clashes;
    if (finalClashes.length === 0) {
        const festivalMessage = categorySelect.value === "Festival" && rules.festivalSpreadContingents
            ? " Penyebaran kontingen Festival diprioritaskan."
            : "";
        setStatus(`Pengacakan pintar berhasil! Semua kontingen terpisah aman (0 bentrok).${festivalMessage}`, "success");
    } else {
        setStatus(`Pengacakan optimal selesai (${finalClashes.length} bentrok tidak terhindarkan karena dominasi kontingen).`, "error");
    }
}

function resetParticipantsOrder() {
    const className = classSelect.value;
    if (confirm("Kembalikan susunan peserta kelas ini ke urutan awal database?")) {
        clearCustomOrder(categorySelect.value, className);
        cancelSwapSelection();
        refreshClassOptionWarnings();
        renderParticipants();
        setStatus("Susunan peserta dikembalikan ke urutan database.", "success");
    }
}

async function syncAndOpenTemplateBagan() {
    const className = classSelect.value;
    const participants = getOrderedParticipants(className);
    const participantCount = Math.max(2, Math.min(16, participants.length || 2));
    const activeSlots = ACTIVE_SLOT_LAYOUT_BY_COUNT[participantCount] || ACTIVE_SLOT_LAYOUT_BY_COUNT[16];

    const bracket = {
        r1: Array.from({length: 8}, () => ({ p1: {n:"", c:"", s:""}, p2: {n:"", c:"", s:""}, winner: null })),
        r2: Array.from({length: 4}, () => ({ p1: {n:"", c:"", s:""}, p2: {n:"", c:"", s:""}, winner: null })),
        r3: Array.from({length: 2}, () => ({ p1: {n:"", c:"", s:""}, p2: {n:"", c:"", s:""}, winner: null })),
        r4: Array.from({length: 1}, () => ({ p1: {n:"", c:"", s:""}, p2: {n:"", c:"", s:""}, winner: null }))
    };

    const slotToParticipant = new Map(
        activeSlots.map((slot, index) => [slot, participants[index]]).filter(([_, p]) => p !== undefined)
    );

    // Fill R1
    bracket.r1.forEach((match, idx) => {
        const s1 = SLOTS_R1[idx * 2];
        const s2 = SLOTS_R1[idx * 2 + 1];
        if (slotToParticipant.has(s1)) {
            const p = slotToParticipant.get(s1);
            match.p1 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        } else if (!activeSlots.includes(s1)) {
            match.p1 = { n: "(BYE)", c: "-", s: "" };
        }

        if (slotToParticipant.has(s2)) {
            const p = slotToParticipant.get(s2);
            match.p2 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        } else if (!activeSlots.includes(s2)) {
            match.p2 = { n: "(BYE)", c: "-", s: "" };
        }
    });

    // Fill R2
    bracket.r2.forEach((match, idx) => {
        const s1 = SLOTS_R2[idx * 2];
        const s2 = SLOTS_R2[idx * 2 + 1];
        if (slotToParticipant.has(s1)) {
            const p = slotToParticipant.get(s1);
            match.p1 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
        if (slotToParticipant.has(s2)) {
            const p = slotToParticipant.get(s2);
            match.p2 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
    });

    // Fill R3
    bracket.r3.forEach((match, idx) => {
        const s1 = SLOTS_R3[idx * 2];
        const s2 = SLOTS_R3[idx * 2 + 1];
        if (slotToParticipant.has(s1)) {
            const p = slotToParticipant.get(s1);
            match.p1 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
        if (slotToParticipant.has(s2)) {
            const p = slotToParticipant.get(s2);
            match.p2 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
    });

    // Fill R4
    if (bracket.r4[0]) {
        if (slotToParticipant.has(SLOTS_R4[0])) {
            const p = slotToParticipant.get(SLOTS_R4[0]);
            bracket.r4[0].p1 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
        if (slotToParticipant.has(SLOTS_R4[1])) {
            const p = slotToParticipant.get(SLOTS_R4[1]);
            bracket.r4[0].p2 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
    }

    const dbKey = getBracketDbKey(categorySelect.value, className);
    try {
        localStorage.setItem('custom_bracket_participant_count', String(participantCount));
        localStorage.setItem('custom_bracket_active_slots', JSON.stringify(activeSlots));
        localStorage.setItem('custom_bracket_class_name', className);
        localStorage.setItem('custom_bracket_category', categorySelect.value);
        localStorage.setItem('custom_bracket_data_16_ad_v2', JSON.stringify(bracket));
    } catch (e) {
        console.warn("Could not write to localStorage for template_bagan", e);
    }

    // Simpan snapshot bagan ke Firebase Realtime Database
    if (!cloudBaganMap[dbKey]) cloudBaganMap[dbKey] = {};
    cloudBaganMap[dbKey].category = categorySelect.value;
    cloudBaganMap[dbKey].className = normalizeClassName(className);
    cloudBaganMap[dbKey].participantCount = participantCount;
    cloudBaganMap[dbKey].activeSlots = activeSlots;
    cloudBaganMap[dbKey].bracket = bracket;
    cloudBaganMap[dbKey].updatedAt = Date.now();

    try {
        await authReady;
        await update(ref(rtdb, `bagan/${dbKey}`), {
            category: categorySelect.value,
            className: normalizeClassName(className),
            participantCount,
            activeSlots,
            bracket,
            updatedAt: Date.now()
        });
        showCloudSyncStatus("☁️ Bagan Siap di Cloud", "success");
    } catch (error) {
        console.warn("Gagal simpan snapshot bagan ke RTDB:", error);
    }

    updateBracketClassCounters();
    refreshClassOptionTitles();
    renderClassSaveBadge(className);

    const url = `template_bagan.html?count=${participantCount}&class=${encodeURIComponent(className)}&cat=${encodeURIComponent(categorySelect.value)}`;
    window.open(url, "_blank", "noopener,noreferrer");
}

async function saveCurrentClassBracket() {
    const className = classSelect.value;
    if (!className) {
        setStatus("Pilih kelas terlebih dahulu.", "error");
        return;
    }

    const participants = getOrderedParticipants(className);
    const participantCount = Math.max(2, Math.min(16, participants.length || 2));
    const activeSlots = ACTIVE_SLOT_LAYOUT_BY_COUNT[participantCount] || ACTIVE_SLOT_LAYOUT_BY_COUNT[16];
    const category = categorySelect.value;
    const dbKey = getBracketDbKey(category, className);

    const bracket = {
        r1: Array.from({length: 8}, () => ({ p1: {n:"", c:"", s:""}, p2: {n:"", c:"", s:""}, winner: null })),
        r2: Array.from({length: 4}, () => ({ p1: {n:"", c:"", s:""}, p2: {n:"", c:"", s:""}, winner: null })),
        r3: Array.from({length: 2}, () => ({ p1: {n:"", c:"", s:""}, p2: {n:"", c:"", s:""}, winner: null })),
        r4: Array.from({length: 1}, () => ({ p1: {n:"", c:"", s:""}, p2: {n:"", c:"", s:""}, winner: null }))
    };
    const slotToParticipant = new Map(
        activeSlots.map((slot, index) => [slot, participants[index]]).filter(([_, p]) => p !== undefined)
    );

    bracket.r1.forEach((match, idx) => {
        const s1 = SLOTS_R1[idx * 2];
        const s2 = SLOTS_R1[idx * 2 + 1];
        if (slotToParticipant.has(s1)) {
            const p = slotToParticipant.get(s1);
            match.p1 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
        if (slotToParticipant.has(s2)) {
            const p = slotToParticipant.get(s2);
            match.p2 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
    });
    bracket.r2.forEach((match, idx) => {
        const s1 = SLOTS_R2[idx * 2];
        const s2 = SLOTS_R2[idx * 2 + 1];
        if (slotToParticipant.has(s1)) {
            const p = slotToParticipant.get(s1);
            match.p1 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
        if (slotToParticipant.has(s2)) {
            const p = slotToParticipant.get(s2);
            match.p2 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
    });
    bracket.r3.forEach((match, idx) => {
        const s1 = SLOTS_R3[idx * 2];
        const s2 = SLOTS_R3[idx * 2 + 1];
        if (slotToParticipant.has(s1)) {
            const p = slotToParticipant.get(s1);
            match.p1 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
        if (slotToParticipant.has(s2)) {
            const p = slotToParticipant.get(s2);
            match.p2 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
    });
    if (bracket.r4[0]) {
        if (slotToParticipant.has(SLOTS_R4[0])) {
            const p = slotToParticipant.get(SLOTS_R4[0]);
            bracket.r4[0].p1 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
        if (slotToParticipant.has(SLOTS_R4[1])) {
            const p = slotToParticipant.get(SLOTS_R4[1]);
            bracket.r4[0].p2 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
    }

    const orderedKeys = participants.map(p => getParticipantUniqueKey(p));
    const ordersMap = getSavedOrdersMap();
    ordersMap[`${category}__${normalizeClassName(className)}`] = orderedKeys;
    localStorage.setItem(STORAGE_CUSTOM_ORDERS, JSON.stringify(ordersMap));

    cloudBaganMap[dbKey] = {
        category,
        className: normalizeClassName(className),
        participantCount,
        activeSlots,
        customOrder: orderedKeys,
        bracket,
        updatedAt: Date.now()
    };

    try {
        await authReady;
        await update(ref(rtdb, `bagan/${dbKey}`), cloudBaganMap[dbKey]);
        showCloudSyncStatus("☁️ Tersimpan di Database", "success");
        setStatus(`Bagan kelas "${className}" berhasil disimpan ke database!`, "success");
    } catch (error) {
        console.warn("Gagal simpan ke RTDB:", error);
        showCloudSyncStatus("💾 Tersimpan Lokal (Offline)", "warning");
        setStatus(`Bagan kelas "${className}" tersimpan di browser lokal.`, "warning");
    }

    updateBracketClassCounters();
    refreshClassOptionTitles();
    renderClassSaveBadge(className);
}

async function generateAndSaveClassBracket(category, className) {
    const baseParticipants = participantsByCategory[category].filter(p => normalizeClassName(p["KELAS PERTANDINGAN"]) === className);
    if (baseParticipants.length === 0) return false;

    // 1. Smart Shuffle
    let bestArrangement = category === "Festival" && rules.festivalSpreadContingents
        ? buildFestivalSpreadArrangement(baseParticipants)
        : [...baseParticipants];
    let bestScore = Infinity;
    const maxTrials = 100; // slightly reduced for batch performance
    
    for (let trial = 0; trial < maxTrials; trial++) {
        const candidate = [...baseParticipants];
        for (let i = candidate.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidate[i], candidate[j]] = [candidate[j], candidate[i]];
        }
        
        const clashResult = detectContingentClashes(candidate);
        let score = clashResult.clashes.length * 1000;
        
        if (category === "Festival" && rules.festivalSpreadContingents) {
            for (let index = 0; index < candidate.length - 1; index += 2) {
                const firstContingent = getContingentKey(candidate[index]);
                const secondContingent = getContingentKey(candidate[index + 1]);
                if (firstContingent === secondContingent) score += 500;
            }
        }
        
        if (rules.balanceBracketSides) {
            const mid = Math.ceil(candidate.length / 2);
            const topContingents = new Map();
            const botContingents = new Map();
            
            candidate.slice(0, mid).forEach(p => {
                const c = String(p.KONTINGEN || "").trim().toLowerCase();
                topContingents.set(c, (topContingents.get(c) || 0) + 1);
            });
            candidate.slice(mid).forEach(p => {
                const c = String(p.KONTINGEN || "").trim().toLowerCase();
                botContingents.set(c, (botContingents.get(c) || 0) + 1);
            });
            
            topContingents.forEach((topCount, c) => {
                if (c && c !== "-" && c !== "tanpa kontingen") {
                    const botCount = botContingents.get(c) || 0;
                    score += Math.abs(topCount - botCount) * 10;
                }
            });
        }
        
        if (score < bestScore) {
            bestScore = score;
            bestArrangement = candidate;
            if (bestScore === 0) break;
        }
    }
    
    if (category === "Festival" && rules.festivalSpreadContingents) {
        bestArrangement = buildFestivalSpreadArrangement(baseParticipants);
    }
    
    // Save custom order to local storage
    const orderedKeys = bestArrangement.map(p => getParticipantUniqueKey(p));
    const ordersMap = getSavedOrdersMap();
    const localKey = `${category}__${normalizeClassName(className)}`;
    ordersMap[localKey] = orderedKeys;
    localStorage.setItem(STORAGE_CUSTOM_ORDERS, JSON.stringify(ordersMap));

    // 2. Generate Bracket Structure
    const participantCount = Math.max(2, Math.min(16, bestArrangement.length));
    const activeSlots = ACTIVE_SLOT_LAYOUT_BY_COUNT[participantCount] || ACTIVE_SLOT_LAYOUT_BY_COUNT[16];
    
    const bracket = {
        r1: Array.from({length: 8}, () => ({ p1: {n:"", c:"", s:""}, p2: {n:"", c:"", s:""}, winner: null })),
        r2: Array.from({length: 4}, () => ({ p1: {n:"", c:"", s:""}, p2: {n:"", c:"", s:""}, winner: null })),
        r3: Array.from({length: 2}, () => ({ p1: {n:"", c:"", s:""}, p2: {n:"", c:"", s:""}, winner: null })),
        r4: Array.from({length: 1}, () => ({ p1: {n:"", c:"", s:""}, p2: {n:"", c:"", s:""}, winner: null }))
    };
    
    const slotToParticipant = new Map(
        activeSlots.map((slot, index) => [slot, bestArrangement[index]]).filter(([_, p]) => p !== undefined)
    );
    
    bracket.r1.forEach((match, idx) => {
        const s1 = SLOTS_R1[idx * 2];
        const s2 = SLOTS_R1[idx * 2 + 1];
        if (slotToParticipant.has(s1)) {
            const p = slotToParticipant.get(s1);
            match.p1 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
        if (slotToParticipant.has(s2)) {
            const p = slotToParticipant.get(s2);
            match.p2 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
    });
    bracket.r2.forEach((match, idx) => {
        const s1 = SLOTS_R2[idx * 2];
        const s2 = SLOTS_R2[idx * 2 + 1];
        if (slotToParticipant.has(s1)) {
            const p = slotToParticipant.get(s1);
            match.p1 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
        if (slotToParticipant.has(s2)) {
            const p = slotToParticipant.get(s2);
            match.p2 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
    });
    bracket.r3.forEach((match, idx) => {
        const s1 = SLOTS_R3[idx * 2];
        const s2 = SLOTS_R3[idx * 2 + 1];
        if (slotToParticipant.has(s1)) {
            const p = slotToParticipant.get(s1);
            match.p1 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
        if (slotToParticipant.has(s2)) {
            const p = slotToParticipant.get(s2);
            match.p2 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
    });
    if (bracket.r4[0]) {
        if (slotToParticipant.has(SLOTS_R4[0])) {
            const p = slotToParticipant.get(SLOTS_R4[0]);
            bracket.r4[0].p1 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
        if (slotToParticipant.has(SLOTS_R4[1])) {
            const p = slotToParticipant.get(SLOTS_R4[1]);
            bracket.r4[0].p2 = { n: p["NAMA LENGKAP"] || "", c: p.KONTINGEN || "", s: "" };
        }
    }
    
    const dbKey = getBracketDbKey(category, className);
    cloudBaganMap[dbKey] = {
        category,
        className: normalizeClassName(className),
        participantCount: bestArrangement.length,
        activeSlots,
        customOrder: orderedKeys,
        bracket,
        updatedAt: Date.now()
    };
    
    try {
        await authReady;
        await update(ref(rtdb, `bagan/${dbKey}`), cloudBaganMap[dbKey]);
    } catch (error) {
        console.warn(`Gagal simpan ke RTDB untuk kelas ${className}:`, error);
    }
    
    return true;
}

async function runBatchBracketGeneration() {
    const dialog = document.getElementById("batch-bracket-dialog");
    const progContainer = document.getElementById("batch-progress-container");
    const progBar = document.getElementById("batch-progress-bar");
    const progPercent = document.getElementById("batch-progress-percent");
    const curClassLabel = document.getElementById("batch-current-class-label");
    const btnStart = document.getElementById("btn-start-batch");
    const btnCancel = document.getElementById("btn-cancel-batch");
    
    const targetMode = document.querySelector('input[name="batch-target"]:checked').value;
    const categoryMode = document.querySelector('input[name="batch-category"]:checked').value;
    
    let isCancelled = false;
    btnCancel.onclick = () => { isCancelled = true; };
    
    progContainer.style.display = "block";
    btnStart.disabled = true;
    btnCancel.style.display = "inline-block";
    
    const classesToProcess = [];
    const categoriesToScan = categoryMode === "all" ? ["Open", "Festival"] : [categorySelect.value];
    
    categoriesToScan.forEach(cat => {
        const groupSet = new Set();
        participantsByCategory[cat].forEach(p => {
            groupSet.add(normalizeClassName(p["KELAS PERTANDINGAN"]));
        });
        
        groupSet.forEach(cls => {
            if (targetMode === "missing") {
                if (!isClassBaganSaved(cat, cls)) {
                    classesToProcess.push({ cat, cls });
                }
            } else {
                classesToProcess.push({ cat, cls });
            }
        });
    });
    
    if (classesToProcess.length === 0) {
        curClassLabel.textContent = "Tidak ada kelas yang perlu diproses.";
        progPercent.textContent = "100%";
        progBar.style.width = "100%";
        btnStart.disabled = false;
        btnCancel.style.display = "none";
        return;
    }
    
    let successCount = 0;
    
    for (let i = 0; i < classesToProcess.length; i++) {
        if (isCancelled) {
            curClassLabel.textContent = "Dibatalkan.";
            break;
        }
        
        const { cat, cls } = classesToProcess[i];
        curClassLabel.textContent = `Memproses: ${cat} - ${cls} (${i + 1}/${classesToProcess.length})`;
        const pct = Math.round(((i) / classesToProcess.length) * 100);
        progPercent.textContent = `${pct}%`;
        progBar.style.width = `${pct}%`;
        
        // Jeda singkat agar antarmuka tidak freeze
        await new Promise(r => setTimeout(r, 50));
        
        const res = await generateAndSaveClassBracket(cat, cls);
        if (res) successCount++;
    }
    
    if (!isCancelled) {
        progPercent.textContent = "100%";
        progBar.style.width = "100%";
        curClassLabel.textContent = `Selesai! ${successCount} bagan berhasil dibuat.`;
    }
    
    btnStart.disabled = false;
    btnCancel.style.display = "none";
    updateBracketClassCounters();
    refreshClassOptionTitles();
    if (classSelect.value) {
        renderClassSaveBadge(classSelect.value);
        renderParticipants();
    }
}

function renderRules() {
    document.querySelectorAll("input[data-bracket-rule]").forEach(input => {
        input.checked = Boolean(rules[input.dataset.bracketRule]);
    });
}

async function loadParticipants() {
    try {
        const [participantsSnapshot, baganSnapshot, namaKejuaraanSnapshot, jadwalSnapshot] = await Promise.all([
            get(ref(rtdb, "peserta")),
            get(ref(rtdb, "bagan")).catch(() => null),
            get(ref(rtdb, "pengaturan/namaKejuaraan")).catch(() => null),
            get(ref(rtdb, "pengaturan/jadwal")).catch(() => null)
        ]);

        if (jadwalSnapshot && jadwalSnapshot.exists()) {
            const jadwalData = jadwalSnapshot.val();
            if (jadwalData.assignments) localStorage.setItem("admin_schedule_tatami_settings", JSON.stringify(jadwalData.assignments));
        }

        if (namaKejuaraanSnapshot && namaKejuaraanSnapshot.exists()) {
            namaKejuaraan = namaKejuaraanSnapshot.val()?.trim() || '';
        }

        const rawParticipants = participantsSnapshot.val() || {};
        Object.values(rawParticipants).forEach(participant => {
            const category = participant.kategori === "Open" ? "Open" : "Festival";
            participantsByCategory[category].push(participant);
        });

        // Sinkronkan custom orders dari Firebase RTDB jika ada
        if (baganSnapshot && baganSnapshot.exists()) {
            cloudBaganMap = baganSnapshot.val() || {};
            const ordersMap = getSavedOrdersMap();
            let updatedFromCloud = false;
            Object.values(cloudBaganMap).forEach(data => {
                if (data?.category && data?.className && Array.isArray(data.customOrder)) {
                    const localKey = `${data.category}__${normalizeClassName(data.className)}`;
                    if (!ordersMap[localKey] || ordersMap[localKey].length === 0) {
                        ordersMap[localKey] = data.customOrder;
                        updatedFromCloud = true;
                    }
                }
            });
            if (updatedFromCloud) {
                localStorage.setItem(STORAGE_CUSTOM_ORDERS, JSON.stringify(ordersMap));
            }
            showCloudSyncStatus("☁️ Cloud Terhubung", "success");
        }

        renderClassOptions();
        updateBracketClassCounters();
        setStatus("Data peserta siap digunakan.", "success");
    } catch (error) {
        setStatus(`Data peserta gagal dimuat: ${error.code || "permission-denied"}.`, "error");
    }
}

categorySelect.addEventListener("change", () => {
    activeFestivalTab = "participants";
    renderClassOptions();
    updateBracketClassCounters();
});
classSelect.addEventListener("change", () => {
    cancelSwapSelection();
    renderParticipants();
});

if (btnSmartShuffle) btnSmartShuffle.addEventListener("click", smartShuffleParticipants);
if (btnResetOrder) btnResetOrder.addEventListener("click", resetParticipantsOrder);
if (btnSaveBracket) btnSaveBracket.addEventListener("click", saveCurrentClassBracket);
const exportExcelModal = document.getElementById("export-excel-modal");
const excelExportClassList = document.getElementById("excel-export-class-list");
const exportPanelOpen = document.getElementById("export-panel-open");
const exportPanelFestival = document.getElementById("export-panel-festival");

const btnDownloadExcelOpen = document.getElementById("btn-download-excel-open");
const btnDownloadMasterOpen = document.getElementById("btn-download-master-open");
const btnCancelExcelOpen = document.getElementById("btn-cancel-excel-open");

const btnDownloadExcelFestival = document.getElementById("btn-download-excel-festival");
const btnCancelExcelFestival = document.getElementById("btn-cancel-excel-festival");

const excelExportSelectAll = document.getElementById("excel-export-select-all");
const excelExportCount = document.getElementById("excel-export-count");
const closeExportExcel = document.getElementById("close-export-excel");

function updateExcelSelectedCount() {
    if (!excelExportCount) return;
    const checkboxes = excelExportClassList.querySelectorAll(`input[type="checkbox"]:checked[data-category="${activeExportCategory}"]`);
    excelExportCount.textContent = `${checkboxes.length} Terpilih (Kategori ${activeExportCategory})`;
}

function getClassBaganStatus(category, className, currentCount) {
    const dbKey = getBracketDbKey(category, className);
    const ordersMap = getSavedOrdersMap();
    const localKey = `${category}__${normalizeClassName(className)}`;
    
    let savedCount = 0;
    let isSaved = false;
    let wasDownloaded = false;

    if (cloudBaganMap[dbKey] && cloudBaganMap[dbKey].customOrder) {
        savedCount = cloudBaganMap[dbKey].participantCount || cloudBaganMap[dbKey].customOrder.length;
        isSaved = cloudBaganMap[dbKey].customOrder.length > 0;
        wasDownloaded = Boolean(cloudBaganMap[dbKey].downloadedAt);
    } else if (ordersMap[localKey] && ordersMap[localKey].length > 0) {
        savedCount = ordersMap[localKey].length;
        isSaved = true;
    }
    
    if (!isSaved) return "not_ready";
    if (wasDownloaded) return "ready"; // Sudah pernah didownload = Siap
    if (savedCount !== currentCount) return "revision";
    return "ready";
}

let activeExportCategory = "Open";
let activeExportStatus = "ready";

function applyExportFilters() {
    const labels = excelExportClassList.querySelectorAll('.export-item-label');
    let countReady = 0, countRevision = 0, countNotReady = 0;

    labels.forEach(label => {
        const cat = label.dataset.category;
        const stat = label.dataset.status;
        
        if (cat === activeExportCategory) {
            if (stat === 'ready') countReady++;
            else if (stat === 'revision') countRevision++;
            else if (stat === 'not_ready') countNotReady++;
        }

        if (cat === activeExportCategory && stat === activeExportStatus) {
            label.style.display = 'flex';
        } else {
            label.style.display = 'none';
        }
    });

    const countReadyEl = document.getElementById('count-ready');
    const countRevisionEl = document.getElementById('count-revision');
    const countNotReadyEl = document.getElementById('count-not-ready');

    if(countReadyEl) countReadyEl.textContent = `(${countReady})`;
    if(countRevisionEl) countRevisionEl.textContent = `(${countRevision})`;
    if(countNotReadyEl) countNotReadyEl.textContent = `(${countNotReady})`;

    // Check if list is empty for current tab
    const visibleCount = countReady * (activeExportStatus==='ready'?1:0) + 
                         countRevision * (activeExportStatus==='revision'?1:0) + 
                         countNotReady * (activeExportStatus==='not_ready'?1:0);
                         
    let emptyMsg = excelExportClassList.querySelector('.export-empty-msg');
    if (visibleCount === 0) {
        if (!emptyMsg) {
            emptyMsg = document.createElement('div');
            emptyMsg.className = 'export-empty-msg';
            emptyMsg.style.cssText = "padding: 30px 20px; text-align: center; color: #94a3b8; font-style: italic;";
            excelExportClassList.appendChild(emptyMsg);
        }
        emptyMsg.textContent = "Tidak ada kelas di kategori dan status ini.";
        emptyMsg.style.display = 'block';
    } else if (emptyMsg) {
        emptyMsg.style.display = 'none';
    }
    
    if (activeExportCategory === "Open") {
        if (exportPanelOpen) exportPanelOpen.style.display = 'flex';
        if (exportPanelFestival) exportPanelFestival.style.display = 'none';
    } else {
        if (exportPanelOpen) exportPanelOpen.style.display = 'none';
        if (exportPanelFestival) exportPanelFestival.style.display = 'flex';
    }

    updateExcelSelectedCount();
    updateSelectAllCheckboxState();
}

function updateSelectAllCheckboxState() {
    if (!excelExportSelectAll) return;
    const visibleCheckboxes = Array.from(excelExportClassList.querySelectorAll('.export-item-label'))
        .filter(label => label.style.display !== 'none')
        .map(label => label.querySelector('input[type="checkbox"]:not(:disabled)'))
        .filter(cb => cb !== null);
        
    if (visibleCheckboxes.length === 0) {
        excelExportSelectAll.checked = false;
        excelExportSelectAll.disabled = true;
    } else {
        excelExportSelectAll.disabled = false;
        const allChecked = visibleCheckboxes.every(cb => cb.checked);
        excelExportSelectAll.checked = allChecked;
    }
}

function populateExportModal() {
    excelExportClassList.innerHTML = '';
    
    ['Open', 'Festival'].forEach(category => {
        if (!participantsByCategory[category] || participantsByCategory[category].length === 0) return;
        
        const groups = new Map();
        participantsByCategory[category].forEach(p => {
            const className = normalizeClassName(p["KELAS PERTANDINGAN"]);
            if(!groups.has(className)) groups.set(className, 0);
            groups.set(className, groups.get(className) + 1);
        });

        if (groups.size > 0) {
            Array.from(groups.entries()).forEach(([className, currentCount]) => {
                const status = getClassBaganStatus(category, className, currentCount);
                
                let isCheckable = false;
                let isChecked = false;
                let opacity = "1";
                
                if (status === "ready" || status === "revision") {
                    isCheckable = true;
                    isChecked = true;
                } else {
                    isCheckable = false;
                    isChecked = false;
                    opacity = "0.6";
                }

                const label = document.createElement('label');
                label.className = 'export-item-label';
                label.dataset.category = category;
                label.dataset.status = status;
                label.style.cssText = `display: none; align-items: center; gap: 10px; cursor: ${isCheckable ? 'pointer' : 'not-allowed'}; font-size: 14px; padding: 8px 10px; opacity: ${opacity}; width: 100%; border-bottom: 1px solid #f1f5f9;`;
                
                // Keep checkboxes checked by default only if they are ready/revision
                label.innerHTML = `
                    <input type="checkbox" value="${escapeHtml(className)}" data-category="${category}" ${isChecked ? 'checked' : ''} ${!isCheckable ? 'disabled' : ''} style="width: 16px; height: 16px; cursor: inherit;">
                    <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(className)}</span>
                    <span style="font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${currentCount} Peserta</span>
                `;
                label.querySelector('input').addEventListener('change', () => {
                    updateExcelSelectedCount();
                    updateSelectAllCheckboxState();
                });
                excelExportClassList.appendChild(label);
            });
        }
    });

    applyExportFilters();
}

if (btnExportExcel) {
    btnExportExcel.addEventListener("click", () => {
        populateExportModal();
        exportExcelModal.showModal();
    });
}

// Handle Tab Clicks
document.querySelectorAll('.export-main-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.export-main-tab').forEach(t => {
            t.classList.remove('is-active');
            t.style.borderBottomColor = 'transparent';
            t.style.color = '#666';
        });
        const target = e.currentTarget;
        target.classList.add('is-active');
        target.style.borderBottomColor = '#1d4ed8';
        target.style.color = '#1d4ed8';
        
        activeExportCategory = target.dataset.tab;
        applyExportFilters();
    });
});

document.querySelectorAll('.export-sub-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.export-sub-tab').forEach(t => {
            t.classList.remove('is-active');
            // Reset styles
            if (t.dataset.status === 'ready') { t.style.background = 'white'; t.style.color = '#047857'; }
            if (t.dataset.status === 'revision') { t.style.background = 'white'; t.style.color = '#b45309'; }
            if (t.dataset.status === 'not_ready') { t.style.background = 'white'; t.style.color = '#b91c1c'; }
        });
        
        const target = e.currentTarget;
        target.classList.add('is-active');
        const status = target.dataset.status;
        activeExportStatus = status;
        
        // Active styles
        if (status === 'ready') { target.style.background = '#10b981'; target.style.color = 'white'; }
        if (status === 'revision') { target.style.background = '#f59e0b'; target.style.color = 'white'; }
        if (status === 'not_ready') { target.style.background = '#ef4444'; target.style.color = 'white'; }

        applyExportFilters();
    });
});

if (closeExportExcel) closeExportExcel.addEventListener("click", () => exportExcelModal.close());
if (btnCancelExcelOpen) btnCancelExcelOpen.addEventListener("click", () => exportExcelModal.close());
if (btnCancelExcelFestival) btnCancelExcelFestival.addEventListener("click", () => exportExcelModal.close());

if (excelExportSelectAll) {
    excelExportSelectAll.addEventListener("change", (e) => {
        const visibleCheckboxes = Array.from(excelExportClassList.querySelectorAll('.export-item-label'))
            .filter(label => label.style.display !== 'none')
            .map(label => label.querySelector('input[type="checkbox"]:not(:disabled)'))
            .filter(cb => cb !== null);
            
        visibleCheckboxes.forEach(cb => {
            cb.checked = e.target.checked;
        });
        updateExcelSelectedCount();
    });
}

function createBracketSheet(workbook, sheetName, category, className, participants) {
    // Truncate sheet name to 31 characters max for Excel compatibility
    const safeSheetName = sheetName.replace(/[\\/?*\[\]]/g, '').substring(0, 31);
    const sheet = workbook.addWorksheet(safeSheetName);

    const participantCount = Math.max(2, Math.min(16, participants.length || 2));
    const activeSlots = ACTIVE_SLOT_LAYOUT_BY_COUNT[participantCount] || ACTIVE_SLOT_LAYOUT_BY_COUNT[16];

    // Map slot → participant by index
    const slotMap = {};
    activeSlots.forEach((slot, i) => {
        slotMap[slot] = participants[i] || null;
    });

    sheet.columns = [
        { key: 'no',      width: 5  },
        { key: 'babak',   width: 16 },
        { key: 'partai',  width: 10 },
        { key: 'slot',    width: 8  },
        { key: 'nama',    width: 38 },
        { key: 'kontingen', width: 30 },
        { key: 'ket',     width: 15 }
    ];

    // Title row 1: "BAGAN PERTANDINGAN"
    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'BAGAN PERTANDINGAN';
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3C5E' } };
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).height = 28;

    let tatamiAssigned = '';
    try {
        const assignments = JSON.parse(localStorage.getItem('admin_schedule_tatami_settings') || '{}');
        const key = `${category}::${normalizeClassName(className)}`;
        if (assignments[key]) {
            const val = assignments[key];
            if (/^\d+$/.test(val)) tatamiAssigned = `HARI 1 - TATAMI ${val}`;
            else {
                const m = val.match(/^D(\d+)-T(\d+)$/);
                if (m) tatamiAssigned = `HARI ${m[1]} - TATAMI ${m[2]}`;
                else tatamiAssigned = val;
            }
        }
    } catch(e) {}

    // Info rows
    const infoFields = [
        { label: 'Nama Event', value: namaKejuaraan ? namaKejuaraan.toUpperCase() : '' },
        { label: 'Kategori', value: category.toUpperCase() },
        { label: 'Nama Kelas', value: className.toUpperCase() },
        { label: 'Tatami', value: tatamiAssigned },
    ];

    infoFields.forEach((field, i) => {
        const rowNum = i + 2;
        const labelCell = sheet.getCell(`A${rowNum}`);
        const valueCell = sheet.getCell(`B${rowNum}`);
        labelCell.value = `${field.label} :`;
        labelCell.font = { bold: true };
        valueCell.value = field.value;
        // Merge value cell across columns B-G for readability
        sheet.mergeCells(`B${rowNum}:G${rowNum}`);
    });

    // Header row
    const headerRowNum = 6;
    const headerRow = sheet.getRow(headerRowNum);
    headerRow.values = ['No.', 'Babak', 'Partai', 'Slot', 'Nama Peserta / Regu', 'Kontingen', 'Ket.'];
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.height = 20;
    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E75B6' } };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    let rowIdx = headerRowNum + 1;
    let countNo = 1;
    let activeCount = 0;
    let byeCount = 0;

    // Color palette per babak
    const babakColors = {
        'r1': 'FFF2F2F2',  // 16 Besar - abu muda
        'r2': 'FFE2EFDA',  // 8 Besar  - hijau muda
        'r3': 'FFFCE4D6',  // Semi Final - oranye muda
        'r4': 'FFFFF2CC',  // Final - kuning muda
    };

    // Track match numbers per roundId
    const matchCounters = {};

    MATCH_PAIRINGS.forEach(pairing => {
        // Skip rounds where none of the pairing slots are active
        const hasActiveSlot = pairing.slots.some(s => activeSlots.includes(s));
        if (!hasActiveSlot) return;

        if (!matchCounters[pairing.roundId]) matchCounters[pairing.roundId] = 0;
        matchCounters[pairing.roundId]++;
        const partaiNum = matchCounters[pairing.roundId];

        const rowColor = babakColors[pairing.roundId] || 'FFFFFFFF';

        pairing.slots.forEach(slot => {
            const p = slotMap[slot] || null;
            const isBye = !activeSlots.includes(slot) || !p || !p["NAMA LENGKAP"];

            if (!isBye) activeCount++;
            else byeCount++;

            const row = sheet.getRow(rowIdx);
            row.values = {
                no:        countNo++,
                babak:     pairing.round,
                partai:    `Partai ${partaiNum}`,
                slot:      slot,
                nama:      isBye ? '(BYE)' : p["NAMA LENGKAP"].toUpperCase(),
                kontingen: isBye ? '-' : (p.KONTINGEN || '').toUpperCase(),
                ket:       isBye ? 'Langsung Maju' : ''
            };

            row.eachCell(cell => {
                cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowColor } };
                if (isBye) {
                    cell.font = { color: { argb: 'FF999999' }, italic: true };
                }
            });

            rowIdx++;
        });

        // Blank separator row between matches
        rowIdx++;
    });

    // Summary row
    sheet.mergeCells(`A${rowIdx}:G${rowIdx}`);
    const summaryCell = sheet.getCell(`A${rowIdx}`);
    summaryCell.value = `Total: ${activeCount} peserta aktif · ${byeCount} jalur langsung (BYE)`;
    summaryCell.font = { italic: true, color: { argb: 'FF666666' } };
}

function createFestivalSheet(workbook, sheetName, category, className, participants) {
    const safeSheetName = sheetName.replace(/[\\/?*\[\]]/g, '').substring(0, 31);
    const sheet = workbook.addWorksheet(safeSheetName);

    sheet.columns = [
        { key: 'no',      width: 5  },
        { key: 'merah_nama', width: 35 },
        { key: 'merah_kontingen', width: 25 },
        { key: 'vs',      width: 5 },
        { key: 'biru_nama', width: 35 },
        { key: 'biru_kontingen', width: 25 }
    ];

    // Title row
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'BAGAN PERTANDINGAN FESTIVAL';
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3C5E' } };
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).height = 28;

    // Info rows
    const infoFields = [
        { label: 'Nama Event', value: namaKejuaraan ? namaKejuaraan.toUpperCase() : '' },
        { label: 'Kategori', value: category.toUpperCase() },
        { label: 'Nama Kelas', value: className.toUpperCase() },
        { label: 'Tatami', value: '' },
    ];

    infoFields.forEach((field, i) => {
        const rowNum = i + 2;
        const labelCell = sheet.getCell(`A${rowNum}`);
        const valueCell = sheet.getCell(`B${rowNum}`);
        labelCell.value = `${field.label} :`;
        labelCell.font = { bold: true };
        valueCell.value = field.value;
        sheet.mergeCells(`B${rowNum}:F${rowNum}`);
    });

    // Header row
    const headerRowNum = 6;
    const headerRow = sheet.getRow(headerRowNum);
    headerRow.values = ['Partai', 'SUDUT MERAH', 'KONTINGEN', 'VS', 'SUDUT BIRU', 'KONTINGEN'];
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.height = 20;
    
    headerRow.eachCell((cell, colNumber) => {
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (colNumber === 2 || colNumber === 3) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } }; // Merah
        } else if (colNumber === 5 || colNumber === 6) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } }; // Biru
        } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } }; // Gelap untuk No dan VS
        }
    });

    let rowIdx = headerRowNum + 1;
    let matchCount = 1;

    for (let index = 0; index < participants.length; index += 2) {
        const pRed = participants[index];
        const pBlue = participants[index + 1] || null;

        const row = sheet.getRow(rowIdx);
        row.values = {
            no: matchCount++,
            merah_nama: pRed && pRed["NAMA LENGKAP"] ? pRed["NAMA LENGKAP"].toUpperCase() : '-',
            merah_kontingen: pRed && pRed.KONTINGEN ? pRed.KONTINGEN.toUpperCase() : '-',
            vs: 'VS',
            biru_nama: pBlue && pBlue["NAMA LENGKAP"] ? pBlue["NAMA LENGKAP"].toUpperCase() : '-',
            biru_kontingen: pBlue && pBlue.KONTINGEN ? pBlue.KONTINGEN.toUpperCase() : '-'
        };

        row.eachCell((cell, colNumber) => {
            cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
            if (colNumber === 1 || colNumber === 4) {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.font = { bold: true };
            }
        });
        
        rowIdx++;
    }

    // Summary row
    sheet.mergeCells(`A${rowIdx}:F${rowIdx}`);
    const summaryCell = sheet.getCell(`A${rowIdx}`);
    summaryCell.value = `Total: ${participants.length} peserta · ${matchCount - 1} partai`;
    summaryCell.font = { italic: true, color: { argb: 'FF666666' } };
}

async function handleDownloadExcel(category, btnElement) {
    const checkboxes = excelExportClassList.querySelectorAll(`input[type="checkbox"]:checked[data-category="${category}"]`);
    if (checkboxes.length === 0) {
        return alert(`Pilih minimal satu kelas untuk didownload pada tab ${category}.`);
    }

    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = '⏳ Mengekspor...';
    btnElement.disabled = true;

    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistem Bagan';
        workbook.created = new Date();

        let sheetCounter = 1;
        checkboxes.forEach(cb => {
            const className = cb.value;
            const dbKey = getBracketDbKey(category, className);
            
            let sourceParticipants = participantsByCategory[category].filter(p => normalizeClassName(p["KELAS PERTANDINGAN"]) === className);
            
            let orderedParticipants = [...sourceParticipants];
            const ordersMap = getSavedOrdersMap();
            const localKey = `${category}__${normalizeClassName(className)}`;
            
            let customOrder = [];
            if (cloudBaganMap[dbKey] && cloudBaganMap[dbKey].customOrder) {
                customOrder = cloudBaganMap[dbKey].customOrder;
            } else if (ordersMap[localKey] && ordersMap[localKey].length > 0) {
                customOrder = ordersMap[localKey];
            }

            if (customOrder.length > 0) {
                const ordered = [];
                const unmatched = [...sourceParticipants];
                
                customOrder.forEach(key => {
                    const idx = unmatched.findIndex(p => getParticipantUniqueKey(p) === key);
                    if (idx !== -1) {
                        ordered.push(unmatched[idx]);
                        unmatched.splice(idx, 1);
                    } else {
                        ordered.push(null); 
                    }
                });
                
                unmatched.forEach(p => {
                    const emptyIdx = ordered.findIndex(item => item === null);
                    if (emptyIdx !== -1) ordered[emptyIdx] = p;
                    else ordered.push(p);
                });
                
                orderedParticipants = ordered.map(p => p || { "NAMA LENGKAP": "", KONTINGEN: "" });
            }

            let sheetName = className;
            if (sheetName.length > 25) {
                sheetName = sheetName.substring(0, 25) + "..";
            }
            
            let finalSheetName = `${sheetCounter}_${sheetName}`;
            sheetCounter++;

            createBracketSheet(workbook, finalSheetName, category, className, orderedParticipants);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Bagan_Pertandingan_Export_${new Date().getTime()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Tandai semua kelas yang didownload sebagai "Siap" (update participantCount agar match)
        const markPromises = [];
        checkboxes.forEach(cb => {
            const className = cb.value;
            const dbKey = getBracketDbKey(category, className);
            const currentCount = participantsByCategory[category].filter(p => normalizeClassName(p["KELAS PERTANDINGAN"]) === className).length;
            if (cloudBaganMap[dbKey]) {
                cloudBaganMap[dbKey].participantCount = currentCount;
                if (cloudBaganMap[dbKey].customOrder) {
                    // Pad or trim to match currentCount
                    cloudBaganMap[dbKey].participantCount = currentCount;
                }
                markPromises.push(
                    authReady.then(() => update(ref(rtdb, `bagan/${dbKey}`), { participantCount: currentCount, downloadedAt: Date.now() })).catch(() => {})
                );
            }
        });
        await Promise.all(markPromises);
        
        exportExcelModal.close();
        renderExportList();

    } catch (e) {
        console.error(e);
        alert("Gagal cetak excel: " + e.message);
    } finally {
        btnElement.innerHTML = originalText;
        btnElement.disabled = false;
    }
}

async function handleDownloadFestivalExcel(btnElement) {
    const checkboxes = excelExportClassList.querySelectorAll(`input[type="checkbox"]:checked[data-category="Festival"]`);
    if (checkboxes.length === 0) {
        return alert(`Pilih minimal satu kelas untuk didownload pada tab Festival.`);
    }

    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = '⏳ Mengekspor...';
    btnElement.disabled = true;

    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistem Bagan';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet("Rekap Festival");
        
        sheet.pageSetup = {
            paperSize: 5,
            orientation: 'portrait',
            scale: 55,
            printTitlesRow: '1:10', // REPEAT HEADER ON EVERY PAGE
            margins: {
                left: 0.33,
                right: 0.7,
                top: 0.75,
                bottom: 0.75,
                header: 0.3,
                footer: 0.3
            }
        };

        sheet.columns = [
            { key: 'merah',      width: 10  },
            { key: 'nama_merah', width: 35 },
            { key: 'kontingen_merah', width: 25 },
            { key: 'juara_merah', width: 10 },
            { key: 'vs',      width: 6 },
            { key: 'juara_biru', width: 10 },
            { key: 'kontingen_biru', width: 25 },
            { key: 'nama_biru', width: 35 },
            { key: 'biru', width: 10 }
        ];

        sheet.mergeCells('A1:I7');
        const titleCell = sheet.getCell('A1');
        titleCell.value = 'LOGO DAN NAMA EVENT';
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.font = { name: 'Franklin Gothic Demi', size: 20 };

        sheet.mergeCells('A9:I9');
        const festCell = sheet.getCell('A9');
        festCell.value = 'FESTIVAL';
        festCell.alignment = { horizontal: 'center', vertical: 'middle' };
        festCell.font = { name: 'Franklin Gothic Demi', bold: true, size: 24 };

        let rowIdx = 11;
        let matchCount = 1;
        let currentY = 0; // Track points for page break logic
        const MAX_POINTS_PER_PAGE = 1050; // Aman untuk ukuran kertas A4/Folio/Legal pada skala 55%

        checkboxes.forEach((cb, index) => {
            const className = cb.value;
            const dbKey = getBracketDbKey("Festival", className);
            
            let sourceParticipants = participantsByCategory["Festival"].filter(p => normalizeClassName(p["KELAS PERTANDINGAN"]) === className);
            
            let orderedParticipants = [...sourceParticipants];
            const ordersMap = getSavedOrdersMap();
            const localKey = `Festival__${normalizeClassName(className)}`;
            
            let customOrder = [];
            if (cloudBaganMap[dbKey] && cloudBaganMap[dbKey].customOrder) {
                customOrder = cloudBaganMap[dbKey].customOrder;
            } else if (ordersMap[localKey] && ordersMap[localKey].length > 0) {
                customOrder = ordersMap[localKey];
            }

            if (customOrder.length > 0) {
                const ordered = [];
                const unmatched = [...sourceParticipants];
                
                customOrder.forEach(key => {
                    const idx = unmatched.findIndex(p => getParticipantUniqueKey(p) === key);
                    if (idx !== -1) {
                        ordered.push(unmatched[idx]);
                        unmatched.splice(idx, 1);
                    }
                });
                
                unmatched.forEach(p => ordered.push(p));
                
                orderedParticipants = ordered;
            }

            const matchRows = Math.ceil(orderedParticipants.length / 2);
            const classHeight = 30 + 25 + (matchRows * 15) + 30; // ClassName(30), Header(25), Matches(15/row), Spacing(30)
            
            if (currentY > 0 && (currentY + classHeight) > MAX_POINTS_PER_PAGE) {
                try {
                    sheet.getRow(rowIdx).addPageBreak();
                } catch(e) {
                    // Fallback if addPageBreak is not supported
                    if (!sheet.pageSetup.rowBreaks) sheet.pageSetup.rowBreaks = [];
                    sheet.pageSetup.rowBreaks.push(rowIdx - 1);
                }
                currentY = 0; // Reset for new page
            }
            currentY += classHeight;

            const borderStyle = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };

            // NAMA KELAS
            sheet.mergeCells(`A${rowIdx}:H${rowIdx + 1}`);
            const classCell = sheet.getCell(`A${rowIdx}`);
            classCell.value = `${className.toUpperCase()}`;
            classCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            classCell.font = { name: 'Franklin Gothic Demi', bold: true, size: 16 };
            classCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB4C6E7' } };
            
            let tatamiAssigned = '';
            try {
                const assignments = JSON.parse(localStorage.getItem('admin_schedule_tatami_settings') || '{}');
                const key = `Festival::${normalizeClassName(className)}`;
                if (assignments[key]) {
                    const val = assignments[key];
                    if (/^\d+$/.test(val)) tatamiAssigned = `HARI 1 - TATAMI ${val}`;
                    else {
                        const m = val.match(/^D(\d+)-T(\d+)$/);
                        if (m) tatamiAssigned = `HARI ${m[1]}\nTATAMI ${m[2]}`;
                        else tatamiAssigned = val;
                    }
                }
            } catch(e) {}

            // TATAMI
            const tatamiCell = sheet.getCell(`I${rowIdx}`);
            tatamiCell.value = tatamiAssigned || 'TATAMI';
            tatamiCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            tatamiCell.font = { name: 'Franklin Gothic Demi', bold: true, size: 12 };
            
            // Apply borders to the header area
            ['A','B','C','D','E','F','G','H','I'].forEach(col => {
                const c1 = sheet.getCell(`${col}${rowIdx}`);
                const c2 = sheet.getCell(`${col}${rowIdx+1}`);
                c1.border = borderStyle;
                c2.border = borderStyle;
            });

            rowIdx += 2;

            // TABLE HEADER
            const headerRow = sheet.getRow(rowIdx);
            headerRow.values = ['SABUK', 'NAMA LENGKAP', 'KONTINGEN', 'JUARA', 'VS', 'JUARA', 'KONTINGEN', 'NAMA LENGKAP', 'SABUK'];
            headerRow.height = 25;
            
            headerRow.eachCell((cell) => {
                cell.border = borderStyle;
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.font = { name: 'Franklin Gothic Demi', bold: true, size: 12 };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB4C6E7' } };
            });
            rowIdx++;

            for (let index = 0; index < orderedParticipants.length; index += 2) {
                const pRed = orderedParticipants[index];
                const pBlue = orderedParticipants[index + 1] || null;

                const row = sheet.getRow(rowIdx);
                row.values = {
                    merah: 'MERAH',
                    nama_merah: pRed && pRed["NAMA LENGKAP"] ? pRed["NAMA LENGKAP"].toUpperCase() : '-',
                    kontingen_merah: pRed && pRed.KONTINGEN ? pRed.KONTINGEN.toUpperCase() : '-',
                    juara_merah: '',
                    vs: 'VS',
                    juara_biru: '',
                    kontingen_biru: pBlue && pBlue.KONTINGEN ? pBlue.KONTINGEN.toUpperCase() : '-',
                    nama_biru: pBlue && pBlue["NAMA LENGKAP"] ? pBlue["NAMA LENGKAP"].toUpperCase() : '(BYE)',
                    biru: 'BIRU'
                };

                row.eachCell((cell, colNumber) => {
                    cell.border = borderStyle;
                    cell.alignment = { vertical: 'middle' };
                    cell.font = { name: 'Franklin Gothic Demi', size: 11 }; // Default row font
                    
                    // Center align for SABUK, JUARA, VS, JUARA, SABUK
                    if (colNumber === 1 || colNumber === 4 || colNumber === 5 || colNumber === 6 || colNumber === 9) {
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    }
                    if (colNumber === 8 && (!pBlue || !pBlue["NAMA LENGKAP"])) {
                        cell.font = { name: 'Franklin Gothic Demi', size: 11, color: { argb: 'FF888888' }, italic: true };
                    }
                });
                
                rowIdx++;
            }

            rowIdx += 2; // Spacing before next class
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Rekap_Jadwal_Festival_${new Date().getTime()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        exportExcelModal.close();

    } catch (e) {
        console.error(e);
        alert("Gagal cetak excel: " + e.message);
    } finally {
        btnElement.innerHTML = originalText;
        btnElement.disabled = false;
    }
}

if (btnDownloadExcelOpen) {
    btnDownloadExcelOpen.addEventListener("click", () => handleDownloadExcel("Open", btnDownloadExcelOpen));
}

if (btnDownloadExcelFestival) {
    btnDownloadExcelFestival.addEventListener("click", () => handleDownloadFestivalExcel(btnDownloadExcelFestival));
}

if (btnDownloadMasterOpen) {
    btnDownloadMasterOpen.addEventListener("click", async () => {
        const checkboxes = excelExportClassList.querySelectorAll(`input[type="checkbox"]:checked[data-category="Open"]`);
        if (checkboxes.length === 0) {
            return alert("Pilih minimal satu kelas untuk didownload pada tab Open.");
        }

        const originalText = btnDownloadMasterOpen.innerHTML;
        btnDownloadMasterOpen.innerHTML = '⏳ Mengekspor...';
        btnDownloadMasterOpen.disabled = true;

        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Sistem Bagan';
            workbook.created = new Date();

            const sheet = workbook.addWorksheet("Master Mapping");

            sheet.columns = [
                { key: 'kode_unik', header: 'Kode Unik (Untuk VLOOKUP)', width: 50 },
                { key: 'kelas', header: 'Kategori / Kelas', width: 45 },
                { key: 'id_sel', header: 'ID Sel Excel', width: 15 },
                { key: 'nama', header: 'Nama Peserta', width: 40 },
                { key: 'kontingen', header: 'Kontingen', width: 35 },
                { key: 'tatami', header: 'Tatami', width: 12 },
                { key: 'hari', header: 'Hari Ke-', width: 12 },
                { key: 'tanggal', header: 'Tanggal', width: 20 }
            ];

            const masterAssignments = JSON.parse(localStorage.getItem("admin_schedule_tatami_settings") || "{}");
            const masterDaySettings = JSON.parse(localStorage.getItem("admin_schedule_days_settings") || "[]");
            const masterDayMap = {};
            masterDaySettings.forEach(d => { masterDayMap[d.day] = d; });

            // Style headers
            sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
            sheet.getRow(1).eachCell(cell => {
                cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
            });
            
            let rowIdx = 2;

            checkboxes.forEach(cb => {
                const className = cb.value;
                const category = cb.dataset.category;
                const dbKey = getBracketDbKey(category, className);
                
                let sourceParticipants = participantsByCategory[category].filter(p => normalizeClassName(p["KELAS PERTANDINGAN"]) === className);
                
                let orderedParticipants = [...sourceParticipants];
                const ordersMap = getSavedOrdersMap();
                const localKey = `${category}__${normalizeClassName(className)}`;
                
                let customOrder = [];
                if (cloudBaganMap[dbKey] && cloudBaganMap[dbKey].customOrder) {
                    customOrder = cloudBaganMap[dbKey].customOrder;
                } else if (ordersMap[localKey] && ordersMap[localKey].length > 0) {
                    customOrder = ordersMap[localKey];
                }

                if (customOrder.length > 0) {
                    const ordered = [];
                    const unmatched = [...sourceParticipants];
                    
                    customOrder.forEach(key => {
                        const idx = unmatched.findIndex(p => getParticipantUniqueKey(p) === key);
                        if (idx !== -1) {
                            ordered.push(unmatched[idx]);
                            unmatched.splice(idx, 1);
                        } else {
                            ordered.push(null); 
                        }
                    });
                    
                    unmatched.forEach(p => {
                        const emptyIdx = ordered.findIndex(item => item === null);
                        if (emptyIdx !== -1) ordered[emptyIdx] = p;
                        else ordered.push(p);
                    });
                    
                    orderedParticipants = ordered.map(p => p || { "NAMA LENGKAP": "", KONTINGEN: "" });
                }

                const participantCount = Math.max(2, Math.min(16, orderedParticipants.length || 2));
                const activeSlots = ACTIVE_SLOT_LAYOUT_BY_COUNT[participantCount] || ACTIVE_SLOT_LAYOUT_BY_COUNT[16];

                orderedParticipants.forEach((p, index) => {
                    if (p["NAMA LENGKAP"] && p["NAMA LENGKAP"].trim() !== "") {
                        const idSel = activeSlots[index] || `Slot ${index + 1}`;
                        const kodeUnik = `${className.toUpperCase()}_${idSel}`;

                    const classKeyStr = `${category}::${className}`;
                        const rawAssignment = String(masterAssignments[classKeyStr] || "");
                        let tatamiNum = "";
                        let hariNum = "";
                        let tanggalStr = "";
                        if (/^\d+$/.test(rawAssignment)) {
                            tatamiNum = rawAssignment;
                            hariNum = "1";
                        } else {
                            const m = rawAssignment.match(/^D(\d+)-T(\d+)$/);
                            if (m) { hariNum = m[1]; tatamiNum = m[2]; }
                        }
                        if (hariNum) {
                            const dayInfo = masterDayMap[parseInt(hariNum)];
                            if (dayInfo && dayInfo.date) {
                                const d = new Date(dayInfo.date);
                                tanggalStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
                            }
                        }

                        const row = sheet.addRow({
                            kode_unik: kodeUnik,
                            kelas: className.toUpperCase(),
                            id_sel: idSel,
                            nama: p["NAMA LENGKAP"].toUpperCase(),
                            kontingen: (p.KONTINGEN || "-").toUpperCase(),
                            tatami: tatamiNum || "-",
                            hari: hariNum || "-",
                            tanggal: tanggalStr || "-"
                        });
                        
                        // Add border to data row
                        row.eachCell(cell => {
                            cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                        });
                        
                        // Alternate row color
                        if (rowIdx % 2 === 0) {
                            row.eachCell(cell => {
                                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } }; // Light green
                            });
                        }
                        
                        rowIdx++;
                    }
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Master_Mapping_${new Date().getTime()}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            exportExcelModal.close();

        } catch (e) {
            console.error(e);
            alert("Gagal cetak excel master: " + e.message);
        } finally {
            btnDownloadMasterOpen.innerHTML = originalText;
            btnDownloadMasterOpen.disabled = false;
        }
    });
}

if (btnCancelSwap) btnCancelSwap.addEventListener("click", cancelSwapSelection);

document.querySelectorAll(".festival-preview-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        activeFestivalTab = tab.dataset.festivalTab;
        updateFestivalTabPanels();
    });
});

const batchDialog = document.getElementById("batch-bracket-dialog");
if (document.getElementById("open-batch-dialog")) {
    document.getElementById("open-batch-dialog").addEventListener("click", () => {
        document.getElementById("batch-current-category-label").textContent = `Kategori saat ini (${categorySelect.value})`;
        document.getElementById("batch-progress-container").style.display = "none";
        batchDialog.showModal();
    });
}
if (document.getElementById("close-batch-dialog")) {
    document.getElementById("close-batch-dialog").addEventListener("click", () => batchDialog.close());
}
if (document.getElementById("btn-start-batch")) {
    document.getElementById("btn-start-batch").addEventListener("click", runBatchBracketGeneration);
}

document.getElementById("open-bracket-display").addEventListener("click", syncAndOpenTemplateBagan);
document.getElementById("open-bracket-rules").addEventListener("click", () => {
    renderRules();
    rulesDialog.showModal();
});
document.getElementById("close-bracket-rules").addEventListener("click", () => rulesDialog.close());

document.querySelectorAll("input[data-bracket-rule]").forEach(input => input.addEventListener("change", () => {
    rules[input.dataset.bracketRule] = input.checked;
    saveBracketShuffleRules(rules);
    rules = getBracketShuffleRules(rules);
    rulesStatus.textContent = "Aturan tersimpan";
    rulesStatus.className = "status-message success";
}));

void loadParticipants();
