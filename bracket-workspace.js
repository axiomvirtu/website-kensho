import { get, ref } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
import { rtdb } from "./firebase-config.js";
import { getBracketShuffleRules, loadBracketShuffleRules, saveBracketShuffleRules } from "./bracket-rules.js";

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
const festivalPreviewTabs = document.getElementById("festival-preview-tabs");
const bracketParticipantListPanel = document.getElementById("bracket-participant-list-panel");

const STORAGE_CUSTOM_ORDERS = "admin_bracket_custom_orders_v2";
const participantsByCategory = { Open: [], Festival: [] };
let rules = loadBracketShuffleRules();
let selectedSwapItem = null; // { index, slot, name, contingent }
let activeFestivalTab = "participants";
const festivalPlacements = new Map();

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

function saveCustomOrder(category, className, participants) {
    const ordersMap = getSavedOrdersMap();
    const key = `${category}__${normalizeClassName(className)}`;
    ordersMap[key] = participants.map(p => getParticipantUniqueKey(p));
    localStorage.setItem(STORAGE_CUSTOM_ORDERS, JSON.stringify(ordersMap));
}

function clearCustomOrder(category, className) {
    const ordersMap = getSavedOrdersMap();
    const key = `${category}__${normalizeClassName(className)}`;
    delete ordersMap[key];
    localStorage.setItem(STORAGE_CUSTOM_ORDERS, JSON.stringify(ordersMap));
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

function renderClassOptions() {
    const options = getClassOptions();
    classSelect.innerHTML = options.length
        ? options.map(option => `<option value="${escapeHtml(option.className)}">${option.hasContingentClash && categorySelect.value === "Festival" ? "⚠️ " : ""}${escapeHtml(option.className.toLocaleUpperCase("id-ID"))} · ${option.participantCount} peserta${option.hasContingentClash && categorySelect.value === "Festival" ? " · Kontingen bentrok" : ""}</option>`).join("")
        : '<option value="">Belum ada kelas</option>';
    cancelSwapSelection();
    renderParticipants();
}

function refreshClassOptionWarnings() {
    if (categorySelect.value !== "Festival") return;
    const optionsByClass = new Map(getClassOptions().map(option => [option.className, option]));
    Array.from(classSelect.options).forEach(optionElement => {
        const option = optionsByClass.get(optionElement.value);
        if (!option) return;
        optionElement.textContent = `${option.hasContingentClash ? "⚠️ " : ""}${option.className.toLocaleUpperCase("id-ID")} · ${option.participantCount} peserta${option.hasContingentClash ? " · Kontingen bentrok" : ""}`;
    });
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
    if (baseParticipants.length <= 1) {
        setStatus("Jumlah peserta tidak cukup untuk diacak.", "error");
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

function syncAndOpenTemplateBagan() {
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

    const slotToParticipant = new Map(activeSlots.map((slot, index) => [slot, participants[index]]));

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

    try {
        localStorage.setItem('custom_bracket_participant_count', String(participantCount));
        localStorage.setItem('custom_bracket_active_slots', JSON.stringify(activeSlots));
        localStorage.setItem('custom_bracket_class_name', className);
        localStorage.setItem('custom_bracket_category', categorySelect.value);
        localStorage.setItem('custom_bracket_data_16_ad_v2', JSON.stringify(bracket));
    } catch (e) {
        console.warn("Could not write to localStorage for template_bagan", e);
    }

    const url = `template_bagan.html?count=${participantCount}&class=${encodeURIComponent(className)}&cat=${encodeURIComponent(categorySelect.value)}`;
    window.open(url, "_blank", "noopener,noreferrer");
}

function renderRules() {
    document.querySelectorAll("input[data-bracket-rule]").forEach(input => {
        input.checked = Boolean(rules[input.dataset.bracketRule]);
    });
}

async function loadParticipants() {
    try {
        const snapshot = await get(ref(rtdb, "peserta"));
        const rawParticipants = snapshot.val() || {};
        Object.values(rawParticipants).forEach(participant => {
            const category = participant.kategori === "Open" ? "Open" : "Festival";
            participantsByCategory[category].push(participant);
        });
        document.getElementById("bracket-open-class-count").textContent = new Set(participantsByCategory.Open.map(participant => normalizeClassName(participant["KELAS PERTANDINGAN"]))).size;
        document.getElementById("bracket-festival-class-count").textContent = new Set(participantsByCategory.Festival.map(participant => normalizeClassName(participant["KELAS PERTANDINGAN"]))).size;
        renderClassOptions();
        setStatus("Data peserta siap digunakan.", "success");
    } catch (error) {
        setStatus(`Data peserta gagal dimuat: ${error.code || "permission-denied"}.`, "error");
    }
}

categorySelect.addEventListener("change", () => {
    activeFestivalTab = "participants";
    renderClassOptions();
});
classSelect.addEventListener("change", () => {
    cancelSwapSelection();
    renderParticipants();
});

if (btnSmartShuffle) btnSmartShuffle.addEventListener("click", smartShuffleParticipants);
if (btnResetOrder) btnResetOrder.addEventListener("click", resetParticipantsOrder);
if (btnCancelSwap) btnCancelSwap.addEventListener("click", cancelSwapSelection);

document.querySelectorAll(".festival-preview-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        activeFestivalTab = tab.dataset.festivalTab;
        updateFestivalTabPanels();
    });
});

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
