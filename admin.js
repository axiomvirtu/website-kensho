import { get, push, ref, remove, set, update } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
import { browserLocalPersistence, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, setPersistence, signInAnonymously, signInWithPopup, signInWithRedirect, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { auth, rtdb } from "./firebase-config.js";
import { getBracketShuffleRules as getStoredBracketShuffleRules, loadBracketShuffleRules, saveBracketShuffleRules as persistBracketShuffleRules } from "./bracket-rules.js";

const loginPanel = document.getElementById("login-panel");
const loginForm = document.getElementById("login-form");
const googleLoginButton = document.getElementById("google-login-button");
const loginStatus = document.getElementById("login-status");
const accessPanel = document.getElementById("access-panel");
const accessForm = document.getElementById("access-form");
const accessCodeInput = document.getElementById("access-code");
const accessButton = document.getElementById("access-button");
const accessStatus = document.getElementById("access-status");
const adminContent = document.getElementById("admin-content");
const logoutButton = document.getElementById("logout-button");
const userStatus = document.getElementById("user-status");
const fileInput = document.getElementById("excel-upload");
const sheetSelectorContainer = document.getElementById("sheet-selector-container");
const sheetSelector = document.getElementById("sheet-selector");
const saveButton = document.getElementById("btn-save-firebase");
const statusMessage = document.getElementById("status-message");
const categoryLabel = document.getElementById("current-category");
const tableHead = document.getElementById("table-head");
const tableBody = document.getElementById("table-body");
const championshipTitle = document.getElementById("championship-title");
const championshipForm = document.getElementById("championship-form");
const championshipNameInput = document.getElementById("championship-name");
const championshipStatus = document.getElementById("championship-status");
const feeOpenIndividual = document.getElementById("fee-open-individual");
const feeOpenTeam = document.getElementById("fee-open-team");
const feeFestival = document.getElementById("fee-festival");
const feeContingent = document.getElementById("fee-contingent");
const feeCashback = document.getElementById("fee-cashback");
const accessCodeManagement = document.getElementById("access-code-management");
const eventSettings = document.getElementById("event-settings");
const paymentManagement = document.getElementById("payment-management");
const scheduleView = document.getElementById("schedule-view");
const scheduleBody = document.getElementById("schedule-body");
const scheduleTatamiCount = document.getElementById("schedule-tatami-count");
const scheduleShuffleButton = document.getElementById("schedule-shuffle-button");
const schedulePrintButton = document.getElementById("schedule-print-button");
const scheduleAutoAssignButton = document.getElementById("schedule-auto-assign-button");
const scheduleBoard = document.getElementById("schedule-board");
const scheduleBoardPanel = document.getElementById("schedule-board-panel");
const scheduleSettingsPanel = document.getElementById("schedule-settings-panel");
const scheduleTatamiStorageKey = "admin_schedule_tatami_settings";
const scheduleTatamiCountStorageKey = "admin_schedule_tatami_count";
const scheduleOrderStorageKey = "admin_schedule_tatami_order_v3";
const scheduleDaysStorageKey = "admin_schedule_days_settings";
const scheduleDayCount = document.getElementById("schedule-day-count");
const scheduleDaysContainer = document.getElementById("schedule-days-container");
if (scheduleTatamiCount) {
    scheduleTatamiCount.value = localStorage.getItem(scheduleTatamiCountStorageKey) || "1";
}
let activeScheduleTab = "board";
let activeScheduleCategory = "Open";
const bracketView = document.getElementById("bracket-view");
const openBracketDisplay = document.getElementById("open-bracket-display");
const classTypeSettingsPanel = document.getElementById("class-type-settings");
const uploadPanel = document.getElementById("upload-panel");
const previewPanel = document.getElementById("preview-panel");
const accessCodeForm = document.getElementById("access-code-form");
const newAccessCode = document.getElementById("new-access-code");
const newAccessLabel = document.getElementById("new-access-label");
const newAccessRole = document.getElementById("new-access-role");
const accessCodeStatus = document.getElementById("access-code-status");
const accessCodeList = document.getElementById("access-code-list");
const adminTotalCount = document.getElementById("admin-total-count");
const adminOpenCount = document.getElementById("admin-open-count");
const adminOpenIndividualCount = document.getElementById("admin-open-individual-count");
const adminOpenTeamCount = document.getElementById("admin-open-team-count");
const adminFestivalCount = document.getElementById("admin-festival-count");
const participantListView = document.getElementById("participant-list-view");
const contingentListView = document.getElementById("contingent-list-view");
const classRecapView = document.getElementById("class-recap-view");
const medalCountView = document.getElementById("medal-count-view");
const adminParticipantBody = document.getElementById("admin-participant-body");
const adminContingentBody = document.getElementById("admin-contingent-body");
const contingentListBadge = document.getElementById("contingent-list-badge");
const classRecapBody = document.getElementById("class-recap-body");
const medalStatus = document.getElementById("medal-status");
const goldMedalCount = document.getElementById("gold-medal-count");
const silverMedalCount = document.getElementById("silver-medal-count");
const bronzeMedalCount = document.getElementById("bronze-medal-count");
const overallGoldMedalCount = document.getElementById("overall-gold-medal-count");
const overallSilverMedalCount = document.getElementById("overall-silver-medal-count");
const overallBronzeMedalCount = document.getElementById("overall-bronze-medal-count");
const eligibleClassBody = document.getElementById("eligible-class-body");
const festivalFormatControl = document.getElementById("festival-format-control");
const festivalFastTrackToggle = document.getElementById("festival-fast-track-toggle");
const festivalFormatDescription = document.getElementById("festival-format-description");
const medalDetailTab = document.querySelector('[data-medal-detail="odd"]');
const medalRequirementPanel = document.getElementById("medal-requirement-panel");
const oddMedalPanel = document.getElementById("odd-medal-panel");
const oddMedalBody = document.getElementById("odd-medal-body");
const oddMedalStatus = document.getElementById("odd-medal-status");
const adminPageInfo = document.getElementById("admin-page-info");
const adminPreviousPage = document.getElementById("admin-previous-page");
const adminNextPage = document.getElementById("admin-next-page");
const adminParticipantSearch = document.getElementById("admin-participant-search");
const adminContingentSearch = document.getElementById("admin-contingent-search");
adminContingentSearch?.addEventListener("input", () => window.renderContingentList && window.renderContingentList());
const participantEditDialog = document.getElementById("participant-edit-dialog");
const participantEditForm = document.getElementById("participant-edit-form");
const participantEditName = document.getElementById("participant-edit-name");
const participantEditClass = document.getElementById("participant-edit-class");
const participantEditContingent = document.getElementById("participant-edit-contingent");
const participantEditCancel = document.getElementById("participant-edit-cancel");
const classTypeForm = document.getElementById("class-type-form");
const classNameTagInput = document.getElementById("class-name-tag");
const classTypeSelect = document.getElementById("class-type-select");
const classTypeStatus = document.getElementById("class-type-status");
const classTypeList = document.getElementById("class-type-list");
const paymentBody = document.getElementById("payment-body");
const paymentStatus = document.getElementById("payment-status");
const bracketCategorySelect = document.getElementById("bracket-category-select");
const bracketClassSelect = document.getElementById("bracket-class-select");
const bracketSelectedClass = document.getElementById("bracket-selected-class");
const bracketParticipantCount = document.getElementById("bracket-participant-count");
const bracketParticipantBody = document.getElementById("bracket-participant-body");
const cancelBracketMixButton = document.getElementById("cancel-bracket-mix");
const bracketMixWarning = document.getElementById("bracket-mix-warning");
const bracketSlotPlanStatus = document.getElementById("bracket-slot-plan-status");
const bracketSlotPlanCount = document.getElementById("bracket-slot-plan-count");
const bracketSlotPlanList = document.getElementById("bracket-slot-plan-list");
const prepareBracketSlotsButton = document.getElementById("prepare-bracket-slots");
const bracketOpenClassCount = document.getElementById("bracket-open-class-count");
const bracketFestivalClassCount = document.getElementById("bracket-festival-class-count");
const bracketRulesStatus = document.getElementById("bracket-rules-status");
const bracketRulesDialog = document.getElementById("bracket-rules-dialog");
const openBracketRulesButton = document.getElementById("open-bracket-rules");
const closeBracketRulesButton = document.getElementById("close-bracket-rules");
const mixClassView = document.getElementById("mix-class-view");
const mixCategorySelect = document.getElementById("mix-category-select");
const bracketMixName = document.getElementById("bracket-mix-name");
const createBracketMixButton = document.getElementById("create-bracket-mix");
const bracketMixNeedsList = document.getElementById("bracket-mix-needs-list");
const bracketMixAllList = document.getElementById("bracket-mix-all-list");
const bracketMixAgeCategory = document.getElementById("bracket-mix-age-category");
const bracketMixStatus = document.getElementById("bracket-mix-status");
const activeMixList = document.getElementById("active-mix-list");
const invoiceDialog = document.getElementById("invoice-dialog");
const invoiceTitle = document.getElementById("invoice-title");
const invoiceContent = document.getElementById("invoice-content");
const invoiceClose = document.getElementById("invoice-close");
const invoicePrint = document.getElementById("invoice-print");
const invoicePrintThermal = document.getElementById("invoice-print-thermal");
const invoiceExtraFee = document.getElementById("invoice-extra-fee");
const invoiceExtraFeeNote = document.getElementById("invoice-extra-fee-note");
const invoiceNote = document.getElementById("invoice-note");
const invoiceSaveAdjustments = document.getElementById("invoice-save-adjustments");
const slowTrackFormulaBody = document.getElementById("slow-track-formula-body");
const slowTrackPreviousPage = document.getElementById("slow-track-previous-page");
const slowTrackNextPage = document.getElementById("slow-track-next-page");
const slowTrackPageInfo = document.getElementById("slow-track-page-info");

const targetSheets = ["FESTIVAL", "OPEN"];
const selectedColumns = ["NAMA LENGKAP", "KELAS PERTANDINGAN", "KONTINGEN"];
let workbooks = [];
let currentExcelData = [];
let currentSheetName = "";
let availableSheetNames = [];
let adminParticipants = [];
let activeAdminCategory = "Open";
let activeRecapCategory = "Open";
let activeMedalCategory = "Open";
let festivalMedalFormat = "Fast Track";
let activeMedalDetail = "requirement";
let festivalOddAllocations = {};
let activeSettingsView = "event-settings";
let classTypeSettings = {};
let feeSettings = { openIndividual: 0, openTeam: 0, festival: 0, contingent: 0, cashback: 0 };
let paymentSettings = {};
let currentChampionshipName = "Nama Kejuaraan";
let activeInvoice = null;
let slowTrackFormulaSettings = {};
let slowTrackCurrentPage = 1;
const slowTrackPageSize = 10;
let adminCurrentPage = 1;
const adminPageSize = 50;
let adminParticipantSearchTerm = "";
let activeBracketCategory = "Open";
let activeBracketClassKey = "";
let activeBracketAgeCategory = "SEMUA";
let bracketMixClasses = loadBracketMixClasses();
const BRACKET_SLOT_PLANS_STORAGE_KEY = "admin_bracket_slot_plans";
const BRACKET_SLOT_LAYOUT_BY_COUNT = {
    2: ["AC", "AD"],
    3: ["AA", "AB", "AC"],
    4: ["Y", "Z", "AB", "AA"],
    5: ["AA", "Z", "Y", "X", "W"],
    6: ["X", "W", "AA", "Q", "R", "Z"],
    7: ["Y", "S", "T", "U", "V", "W", "X"],
    8: ["X", "W", "V", "U", "T", "S", "R", "Q"],
    9: ["O", "P", "W", "V", "U", "T", "S", "R", "Q"],
    10: ["O", "P", "W", "V", "U", "H", "G", "S", "R", "Q"],
    11: ["Q", "R", "S", "G", "H", "U", "K", "L", "W", "O", "P"],
    12: ["C", "D", "Q", "S", "G", "H", "U", "K", "L", "W", "P", "O"],
    13: ["Q", "C", "D", "S", "G", "H", "K", "L", "M", "N", "O", "P", "U"],
    14: ["Q", "C", "D", "E", "F", "G", "H", "U", "K", "L", "M", "N", "O", "P"],
    15: ["Q", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"],
    16: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"]
};
let bracketShuffleRules = loadBracketShuffleRules();
const authPersistenceReady = setPersistence(auth, browserLocalPersistence);

async function ensureSuperAdmin(user) {
    const settingsReference = ref(rtdb, "pengaturan");
    const settingsSnapshot = await get(settingsReference);
    const settings = settingsSnapshot.val() || {};

    return Boolean(settings.superAdminUid) && settings.superAdminUid === user.uid;
}

async function saveUserProfile(user, isSuperAdminUser) {
    await update(ref(rtdb, `pengguna/${user.uid}`), {
        uid: user.uid,
        email: user.email || "",
        nama: user.displayName || "",
        fotoUrl: user.photoURL || "",
        role: isSuperAdminUser ? "super_admin" : "admin",
        terakhirLogin: new Date().toISOString()
    }, { merge: true });
}

function setChampionshipStatus(message, type = "") {
    championshipStatus.textContent = message;
    championshipStatus.className = `status-message ${type}`.trim();
}

async function loadChampionshipName() {
    try {
        const settingsSnapshot = await get(ref(rtdb, "pengaturan/namaKejuaraan"));
        const championshipName = settingsSnapshot.val()?.trim();
        if (championshipName) {
            championshipNameInput.value = championshipName;
            championshipTitle.textContent = championshipName;
            currentChampionshipName = championshipName;
            document.title = `${championshipName} | Panel Admin`;
            setChampionshipStatus("Nama kejuaraan tersimpan.", "success");
        }
    } catch (error) {
        console.error("Gagal mengambil nama kejuaraan:", error);
        setChampionshipStatus("Nama belum dapat dimuat dari Firebase.", "error");
    }
}

function setLoginStatus(message, type = "") {
    loginStatus.textContent = message;
    loginStatus.className = `status-message ${type}`.trim();
}

function setAccessStatus(message, type = "") {
    accessStatus.textContent = message;
    accessStatus.className = `status-message ${type}`.trim();
}

function setAccessCodeStatus(message, type = "") {
    accessCodeStatus.textContent = message;
    accessCodeStatus.className = `status-message ${type}`.trim();
}

async function hashAccessCode(code) {
    const bytes = new TextEncoder().encode(code.trim());
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function loadAccessCodes() {
    accessCodeList.innerHTML = "";
    const snapshot = await get(ref(rtdb, "kodeAkses"));
    const codes = snapshot.val() || {};
    if (!Object.keys(codes).length) {
        accessCodeList.textContent = "Belum ada kode akses.";
        return;
    }

    Object.entries(codes).forEach(([codeHash, code]) => {
        const item = document.createElement("div");
        item.className = "access-code-item";
        const details = document.createElement("div");
        const label = document.createElement("strong");
        label.textContent = code.label || "Tanpa label";
        const date = document.createElement("small");
        date.textContent = code.createdAt ? new Date(code.createdAt).toLocaleString("id-ID") : "";
        const roleBadge = document.createElement("small");
        roleBadge.style.display = "block";
        roleBadge.style.marginTop = "2px";
        roleBadge.style.color = "var(--accent)";
        roleBadge.style.fontWeight = "600";
        roleBadge.textContent = code.role === "superadmin" ? "Peran: Super Admin" : "Peran: Admin Biasa";
        details.append(label, roleBadge, date);
        const revokeButton = document.createElement("button");
        revokeButton.type = "button";
        revokeButton.className = "button secondary-button";
        revokeButton.textContent = "Cabut";
        revokeButton.addEventListener("click", async () => {
            revokeButton.disabled = true;
            await remove(ref(rtdb, `kodeAkses/${codeHash}`));
            loadAccessCodes();
        });
        item.append(details, revokeButton);
        accessCodeList.appendChild(item);
    });
}

const adminCacheKey = "kensho_admin_participants_cache";
const adminVersionKey = "kensho_admin_participants_version";

async function loadParticipantSummary(force = false) {
    const classSettingsSnapshot = await get(ref(rtdb, "pengaturan/jenisKelas"));
    classTypeSettings = classSettingsSnapshot.val() || {};
    const feeSnapshot = await get(ref(rtdb, "pengaturan/biaya"));
    feeSettings = { ...feeSettings, ...(feeSnapshot.val() || {}) };
    try {
        const paymentSnapshot = await get(ref(rtdb, "pembayaran"));
        paymentSettings = paymentSnapshot.val() || {};
    } catch (error) {
        paymentSettings = {};
        paymentStatus.textContent = "Data pembayaran belum dapat dibaca. Deploy database.rules.json terbaru ke Firebase.";
        paymentStatus.className = "status-message error";
        console.warn("Data pembayaran belum dapat dibaca:", error);
    }
    loadFeeInputs();
    const festivalFormatSnapshot = await get(ref(rtdb, "pengaturan/formatFestival"));
    const savedFestivalFormat = festivalFormatSnapshot.val();
    festivalMedalFormat = savedFestivalFormat === "Open" || savedFestivalFormat === "Slow Track"
        ? "Slow Track"
        : "Fast Track";
    festivalFastTrackToggle.checked = festivalMedalFormat === "Fast Track";
    const oddAllocationSnapshot = await get(ref(rtdb, "pengaturan/pembagianGanjil"));
    festivalOddAllocations = normalizeOddAllocations(oddAllocationSnapshot.val() || {});

    let participantData = null;
    let remoteVersion = null;
    try {
        const versionSnapshot = await get(ref(rtdb, "versiPeserta"));
        remoteVersion = versionSnapshot.val();
    } catch (error) {
        console.warn("Versi peserta belum dapat dicek:", error);
    }

    const cachedDataStr = sessionStorage.getItem(adminCacheKey);
    const localVersion = sessionStorage.getItem(adminVersionKey);

    if (!force && cachedDataStr && remoteVersion && String(remoteVersion) === String(localVersion)) {
        try {
            participantData = JSON.parse(cachedDataStr);
        } catch (parseError) {
            participantData = null;
        }
    }

    if (!participantData) {
        const snapshot = await get(ref(rtdb, "peserta"));
        participantData = snapshot.val() || {};
        if (typeof participantData === "string") {
            try {
                participantData = JSON.parse(participantData);
            } catch (error) {
                participantData = {};
            }
        }
        try {
            sessionStorage.setItem(adminCacheKey, JSON.stringify(participantData));
            if (remoteVersion) {
                sessionStorage.setItem(adminVersionKey, String(remoteVersion));
            }
        } catch (error) {
            console.warn("Gagal menyimpan cache sesi admin:", error);
        }
    }

    try {
        await reconcileActiveMixParticipants(participantData);
    } catch (error) {
        console.error("Gagal menyinkronkan peserta dengan kelas mix:", error);
    }

    const participants = Object.entries(participantData).map(([id, participant]) => ({ id, ...participant }));
    adminParticipants = participants
        .map(participant => ({ ...participant, kategori: participant.kategori || "Festival" }))
        .sort((first, second) => String(first["NAMA LENGKAP"] || "").localeCompare(String(second["NAMA LENGKAP"] || ""), "id", { sensitivity: "base" }));
    renderClassTypeList();
    renderAdminParticipantList();
    renderBracketWorkspace();
    renderClassRecap();
    renderMedalRecap();
    renderPaymentList();
    renderScheduleList();
    if (typeof window.renderContingentList === "function") window.renderContingentList();
    const festivalParticipants = participants.filter(participant => participant.kategori === "Festival");
    const openParticipants = participants.filter(participant => participant.kategori === "Open");
    const festivalTotal = adjustedParticipantCount(festivalParticipants, "Festival", classTypeSettings);
    const openTotal = adjustedParticipantCount(openParticipants, "Open", classTypeSettings);
    const openBreakdownCount = adjustedOpenBreakdown(openParticipants, classTypeSettings);
    adminTotalCount.textContent = (festivalTotal + openTotal).toLocaleString("id-ID");
    adminOpenCount.textContent = openTotal.toLocaleString("id-ID");
    adminOpenIndividualCount.textContent = openBreakdownCount.individual.toLocaleString("id-ID");
    adminOpenTeamCount.textContent = openBreakdownCount.teams.toLocaleString("id-ID");
    adminFestivalCount.textContent = festivalTotal.toLocaleString("id-ID");
}

async function loadSlowTrackFormulaSettings() {
    const snapshot = await get(ref(rtdb, "pengaturan/rumusSlowTrack"));
    slowTrackFormulaSettings = snapshot.val() || {};
    renderSlowTrackFormulaPage();
}

function renderSlowTrackFormulaPage() {
    const totalPages = Math.ceil(99 / slowTrackPageSize);
    slowTrackCurrentPage = Math.min(Math.max(slowTrackCurrentPage, 1), totalPages);
    const firstParticipantCount = 2 + (slowTrackCurrentPage - 1) * slowTrackPageSize;
    const participantCounts = Array.from({ length: slowTrackPageSize }, (_, index) => firstParticipantCount + index)
        .filter(participantCount => participantCount <= 100);
    slowTrackFormulaBody.innerHTML = "";

    participantCounts.forEach(participantCount => {
        const configuredPools = getConfiguredSlowTrackPoolSizes(participantCount);
        const row = document.createElement("tr");
        const participantCell = document.createElement("td");
        participantCell.textContent = `${participantCount}p`;
        const poolCell = document.createElement("td");
        const poolInput = document.createElement("input");
        poolInput.className = "slow-track-pool-input";
        poolInput.type = "text";
        poolInput.value = configuredPools.length ? configuredPools.join("+") : "";
        poolInput.placeholder = participantCount < 3 ? "Belum memenuhi" : "Contoh: 4+3+3";
        poolInput.setAttribute("aria-label", `Susunan pool untuk ${participantCount} peserta`);
        poolCell.appendChild(poolInput);

        const medalCell = document.createElement("td");
        const medalText = document.createElement("span");
        medalText.className = "slow-track-medal-text";
        medalText.textContent = formatSlowTrackMedals(configuredPools);
        medalCell.appendChild(medalText);

        const actionCell = document.createElement("td");
        const saveFormulaButton = document.createElement("button");
        saveFormulaButton.className = "button secondary-button";
        saveFormulaButton.type = "button";
        saveFormulaButton.textContent = "Simpan";
        saveFormulaButton.addEventListener("click", () => {
            void saveSlowTrackFormula(participantCount, poolInput.value, medalText, saveFormulaButton);
        });
        actionCell.appendChild(saveFormulaButton);
        row.append(participantCell, poolCell, medalCell, actionCell);
        slowTrackFormulaBody.appendChild(row);
    });

    slowTrackPageInfo.textContent = `Halaman ${slowTrackCurrentPage} dari ${totalPages} · Peserta ${firstParticipantCount}-${Math.min(firstParticipantCount + slowTrackPageSize - 1, 100)}`;
    slowTrackPreviousPage.disabled = slowTrackCurrentPage === 1;
    slowTrackNextPage.disabled = slowTrackCurrentPage === totalPages;
}

function getConfiguredSlowTrackPoolSizes(participantCount) {
    const configuredPools = parsePoolSizes(slowTrackFormulaSettings[participantCount]);
    return configuredPools.length || participantCount === 2 ? configuredPools : getSlowTrackPoolSizes(participantCount);
}

function parsePoolSizes(value) {
    if (Array.isArray(value)) return value.map(Number).filter(poolSize => Number.isInteger(poolSize) && poolSize > 0);
    if (typeof value !== "string") return [];
    return value.split(/[+,\s]+/).map(Number).filter(poolSize => Number.isInteger(poolSize) && poolSize > 0);
}

function formatSlowTrackMedals(poolSizes) {
    if (!poolSizes.length) return "Belum memenuhi minimal 3 peserta per pool";
    const totals = poolSizes.reduce((medalTotals, poolSize) => {
        const medals = poolSize === 2
            ? { emas: 1, perak: 1, perunggu: 0 }
            : poolSize === 3
                ? { emas: 1, perak: 1, perunggu: 1 }
                : { emas: 1, perak: 1, perunggu: 2 };
        return combineMedalTotals(medalTotals, medals);
    }, { emas: 0, perak: 0, perunggu: 0 });
    return `${totals.emas} emas, ${totals.perak} perak, ${totals.perunggu} perunggu`;
}

async function saveSlowTrackFormula(participantCount, rawPoolValue, medalText, saveButton) {
    const poolSizes = parsePoolSizes(rawPoolValue);
    if (participantCount === 2) {
        if (poolSizes.length !== 1 || poolSizes[0] !== 2) {
            window.alert("Rumus 2 peserta harus berupa pool 2.");
            return;
        }
    } else if (!poolSizes.length || poolSizes.reduce((total, poolSize) => total + poolSize, 0) !== participantCount || poolSizes.some(poolSize => poolSize < 3 || poolSize > 4)) {
        window.alert(`Pool ${participantCount} peserta harus berjumlah ${participantCount}, dan setiap pool berisi 3 atau 4 peserta.`);
        return;
    }

    saveButton.disabled = true;
    const previousValue = slowTrackFormulaSettings[participantCount];
    try {
        const nextSettings = { ...slowTrackFormulaSettings, [participantCount]: poolSizes };
        await set(ref(rtdb, "pengaturan/rumusSlowTrack"), nextSettings);
        slowTrackFormulaSettings = nextSettings;
        medalText.textContent = formatSlowTrackMedals(poolSizes);
        saveButton.textContent = "Tersimpan";
        setTimeout(() => { saveButton.textContent = "Simpan"; }, 1200);
        renderMedalRecap();
    } catch (error) {
        slowTrackFormulaSettings[participantCount] = previousValue;
        console.error("Gagal menyimpan rumus Slow Track:", error);
        window.alert("Rumus Slow Track gagal disimpan. Periksa koneksi dan Rules Firebase.");
    } finally {
        saveButton.disabled = false;
    }
}

function updateParticipantTabCounts() {
    const tabOpen = document.getElementById("tab-count-open");
    const tabFestival = document.getElementById("tab-count-festival");
    const tabBeregu = document.getElementById("tab-count-beregu");
    const totalBadge = document.getElementById("participant-list-badge");

    let countOpen = 0;
    let countFestival = 0;
    let countBeregu = 0;

    adminParticipants.forEach(participant => {
        if (participant.kategori === "Open") {
            if (isTeamClass(participant["KELAS PERTANDINGAN"], classTypeSettings)) {
                countBeregu += 1;
            } else {
                countOpen += 1;
            }
        } else if (participant.kategori === "Festival") {
            countFestival += 1;
        }
    });

    if (tabOpen) tabOpen.textContent = countOpen.toLocaleString("id-ID");
    if (tabFestival) tabFestival.textContent = countFestival.toLocaleString("id-ID");
    if (tabBeregu) tabBeregu.textContent = countBeregu.toLocaleString("id-ID");
    if (totalBadge) totalBadge.textContent = `${adminParticipants.length.toLocaleString("id-ID")} Peserta Terdaftar`;
}

function renderAdminParticipantList() {
    updateParticipantTabCounts();
    const filteredParticipants = getAdminListParticipants();
    const totalPages = Math.max(1, Math.ceil(filteredParticipants.length / adminPageSize));
    adminCurrentPage = Math.min(adminCurrentPage, totalPages);
    const start = (adminCurrentPage - 1) * adminPageSize;
    adminParticipantBody.innerHTML = "";

    const visibleParticipants = filteredParticipants.slice(start, start + adminPageSize);
    visibleParticipants.forEach((participant, index) => {
        const row = document.createElement("tr");

        // 1. Kolom No
        const numCell = document.createElement("td");
        numCell.style.textAlign = "center";
        numCell.textContent = String(start + index + 1);
        row.appendChild(numCell);

        // 2. Kolom Nama Lengkap
        const nameCell = document.createElement("td");
        nameCell.textContent = participant["NAMA LENGKAP"] || "-";
        row.appendChild(nameCell);

        // 3. Kolom Kelas Pertandingan
        const classCell = document.createElement("td");
        classCell.textContent = participant["KELAS PERTANDINGAN"] || "-";
        row.appendChild(classCell);

        // 4. Kolom Kontingen
        if (activeAdminCategory === "Beregu") {
            const teamKey = getTeamKey(participant);
            const firstTeamIndex = visibleParticipants.findIndex(currentParticipant => getTeamKey(currentParticipant) === teamKey);
            if (firstTeamIndex === index) {
                const teamCell = document.createElement("td");
                teamCell.rowSpan = visibleParticipants.filter(currentParticipant => getTeamKey(currentParticipant) === teamKey).length;
                teamCell.className = "merged-team-cell";
                teamCell.textContent = participant.KONTINGEN || "Tanpa kontingen";
                row.appendChild(teamCell);
            }
        } else {
            const teamCell = document.createElement("td");
            teamCell.textContent = participant.KONTINGEN || "-";
            row.appendChild(teamCell);
        }

        // 5. Kolom Aksi (Hanya Ikon Saja)
        const actionCell = document.createElement("td");
        actionCell.style.textAlign = "center";
        actionCell.style.whiteSpace = "nowrap";

        const actionGroup = document.createElement("div");
        actionGroup.className = "action-btn-group";

        // Tombol Edit (Icon Only)
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "action-icon-btn edit-icon-btn";
        editButton.dataset.editParticipant = participant.id || "";
        editButton.title = `Edit: ${participant["NAMA LENGKAP"] || "Peserta"}`;
        editButton.setAttribute("aria-label", "Edit data peserta");
        editButton.disabled = !participant.id;
        editButton.innerHTML = `
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
        `;

        // Tombol Hapus (Icon Only)
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "action-icon-btn delete-icon-btn";
        deleteButton.dataset.deleteParticipant = participant.id || "";
        deleteButton.title = `Hapus: ${participant["NAMA LENGKAP"] || "Peserta"}`;
        deleteButton.setAttribute("aria-label", "Hapus data peserta");
        deleteButton.disabled = !participant.id;
        deleteButton.innerHTML = `
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
        `;

        actionGroup.append(editButton, deleteButton);
        actionCell.appendChild(actionGroup);
        row.appendChild(actionCell);
        adminParticipantBody.appendChild(row);
    });

    if (!filteredParticipants.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 5;
        cell.className = "empty-state";
        cell.textContent = adminParticipantSearchTerm ? "Tidak ada peserta yang cocok dengan pencarian." : "Belum ada peserta pada kategori ini.";
        row.appendChild(cell);
        adminParticipantBody.appendChild(row);
    }

    adminPageInfo.textContent = `Halaman ${adminCurrentPage} dari ${totalPages} · ${filteredParticipants.length.toLocaleString("id-ID")} data`;
    adminPreviousPage.disabled = adminCurrentPage === 1;
    adminNextPage.disabled = adminCurrentPage === totalPages;
}

async function deleteParticipant(participantId) {
    const participant = adminParticipants.find(currentParticipant => currentParticipant.id === participantId);
    if (!participant || !window.confirm(`Hapus data peserta "${participant["NAMA LENGKAP"] || "ini"}"?`)) return;

    try {
        await remove(ref(rtdb, `peserta/${participantId}`));
        const newVersion = Date.now();
        await set(ref(rtdb, "versiPeserta"), newVersion);
        sessionStorage.setItem(adminVersionKey, String(newVersion));
        setStatus(`Data peserta ${participant["NAMA LENGKAP"] || ""} berhasil dihapus.`, "success");
        await loadParticipantSummary(true);
    } catch (error) {
        console.error("Gagal menghapus peserta:", error);
        setStatus("Data peserta gagal dihapus. Periksa koneksi Firebase dan Rules.", "error");
    }
}

function openParticipantEdit(participantId) {
    const participant = adminParticipants.find(currentParticipant => currentParticipant.id === participantId);
    if (!participant || !participantEditDialog || !participantEditForm) return;

    participantEditForm.dataset.participantId = participantId;
    participantEditName.value = participant["NAMA LENGKAP"] || "";
    participantEditClass.value = participant["KELAS PERTANDINGAN"] || "";
    participantEditContingent.value = participant.KONTINGEN || "";
    participantEditDialog.showModal();
}

async function saveParticipantEdit(event) {
    event.preventDefault();
    const participantId = participantEditForm.dataset.participantId;
    const name = normalizeValue(participantEditName.value);
    const className = normalizeValue(participantEditClass.value);
    const contingent = normalizeValue(participantEditContingent.value);
    if (!participantId || !name || !className) return;

    const saveEditButton = participantEditForm.querySelector("[type=submit]");
    saveEditButton.disabled = true;
    try {
        await update(ref(rtdb, `peserta/${participantId}`), {
            "NAMA LENGKAP": name,
            "KELAS PERTANDINGAN": className,
            KONTINGEN: contingent
        });
        const newVersion = Date.now();
        await set(ref(rtdb, "versiPeserta"), newVersion);
        sessionStorage.setItem(adminVersionKey, String(newVersion));
        participantEditDialog.close();
        setStatus(`Data peserta ${name} berhasil diperbarui.`, "success");
        await loadParticipantSummary(true);
    } catch (error) {
        console.error("Gagal mengubah peserta:", error);
        setStatus("Data peserta gagal diubah. Periksa koneksi Firebase dan Rules.", "error");
    } finally {
        saveEditButton.disabled = false;
    }
}

function getAdminListParticipants() {
    const filteredParticipants = adminParticipants.filter(participant => {
        const searchTarget = [
            participant["NAMA LENGKAP"],
            participant["KELAS PERTANDINGAN"],
            participant.KONTINGEN
        ].map(normalizeSearchText).join(" ");
        if (adminParticipantSearchTerm && !searchTarget.includes(adminParticipantSearchTerm)) return false;

        if (activeAdminCategory === "Beregu") {
            return participant.kategori === "Open" && isTeamClass(participant["KELAS PERTANDINGAN"], classTypeSettings);
        }
        if (activeAdminCategory === "Open") {
            return participant.kategori === "Open" && !isTeamClass(participant["KELAS PERTANDINGAN"], classTypeSettings);
        }
        return participant.kategori === activeAdminCategory;
    });

    if (activeAdminCategory !== "Beregu") return filteredParticipants;
    return filteredParticipants.sort((first, second) => {
        const classComparison = normalizeClassName(first["KELAS PERTANDINGAN"]).localeCompare(normalizeClassName(second["KELAS PERTANDINGAN"]), "id", { sensitivity: "base" });
        if (classComparison) return classComparison;
        const teamComparison = String(first.KONTINGEN || "").localeCompare(String(second.KONTINGEN || ""), "id", { sensitivity: "base" });
        if (teamComparison) return teamComparison;
        return String(first["NAMA LENGKAP"] || "").localeCompare(String(second["NAMA LENGKAP"] || ""), "id", { sensitivity: "base" });
    });
}

function normalizeSearchText(value) {
    return normalizeValue(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("id-ID");
}

function getTeamKey(participant) {
    return `${normalizeClassName(participant["KELAS PERTANDINGAN"]).toLocaleLowerCase("id-ID")}::${String(participant.KONTINGEN || "Tanpa kontingen").trim().toLocaleLowerCase("id-ID")}`;
}

function getRecapClassName(participant) {
    const category = normalizeParticipantCategory(participant.kategori);
    const className = normalizeClassName(participant["KELAS PERTANDINGAN"]);
    const sourceKey = `${category}::${className}`;
    const mix = bracketMixClasses.find(currentMix =>
        currentMix.category === category && currentMix.sourceKeys.includes(sourceKey)
    );
    return mix ? mix.name : className;
}

function renderClassRecap() {
    const counts = new Map();
    adminParticipants
        .filter(participant => normalizeParticipantCategory(participant.kategori) === activeRecapCategory)
        .forEach(participant => {
            const sourceClassName = normalizeClassName(participant["KELAS PERTANDINGAN"]);
            const recapClassName = getRecapClassName(participant);
            const participantWeight = activeRecapCategory === "Open" && isTeamClass(sourceClassName, classTypeSettings) ? 1 / 3 : 1;
            counts.set(recapClassName, (counts.get(recapClassName) || 0) + participantWeight);
        });

    classRecapBody.innerHTML = "";
    Array.from(counts.entries()).sort((first, second) => first[0].localeCompare(second[0], "id", { sensitivity: "base" })).forEach(([className, count], index) => {
        const row = document.createElement("tr");
        [index + 1, className, count].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value.toLocaleString ? value.toLocaleString("id-ID") : value;
            row.appendChild(cell);
        });
        classRecapBody.appendChild(row);
    });
}

function formatScheduleValue(val) {
    if (!val) return "Belum dijadwalkan";
    if (/^\d+$/.test(val)) return `Hari 1 - Tatami ${val}`;
    const m = val.match(/^D(\d+)-T(\d+)$/);
    if (m) return `Hari ${m[1]} - Tatami ${m[2]}`;
    return val;
}

function renderScheduleList() {
    if (!scheduleBody) return;
    const classes = new Map();
    adminParticipants.forEach(participant => {
        const category = normalizeParticipantCategory(participant.kategori);
        const className = normalizeClassName(participant["KELAS PERTANDINGAN"]);
        const key = `${category}::${className}`;
        if (!classes.has(key)) classes.set(key, { category, className, count: 0, isTeam: isTeamClass(className, classTypeSettings) });
        classes.get(key).count += 1;
    });
    classes.forEach(item => {
        if (item.isTeam) item.count = Math.ceil(item.count / 3);
    });

    const allRows = [...classes.values()]
        .filter(item => !(item.category === "Open" && item.count <= 1))
        .sort(compareScheduleClasses);
    const rows = allRows.filter(item => item.category === activeScheduleCategory);
    const tatamiCount = Number(scheduleTatamiCount?.value || 1);
    const savedAssignments = loadScheduleTatamiAssignments();
    const daySettings = getScheduleDaySettings();

    scheduleBody.innerHTML = rows.length
        ? rows.map((item, index) => {
            const validDays = daySettings.filter(s => s.category === "Semua" || s.category === item.category);
            let optionsHtml = '<option value="">Pilih</option>';
            const savedValueRaw = String(savedAssignments[`${item.category}::${item.className}`] || "");
            const savedValue = /^\d+$/.test(savedValueRaw) ? `D1-T${savedValueRaw}` : savedValueRaw;
            
            validDays.forEach(dayInfo => {
                for (let t = 1; t <= tatamiCount; t++) {
                    const val = `D${dayInfo.day}-T${t}`;
                    const selected = savedValue === val ? "selected" : "";
                    optionsHtml += `<option value="${val}" ${selected}>Hari ${dayInfo.day} - Tatami ${t}</option>`;
                }
            });

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.category}</td>
                    <td>${escapeHtml(item.className)}</td>
                    <td>${item.count.toLocaleString("id-ID")}</td>
                    <td>
                        <select class="schedule-tatami-select" data-schedule-class="${escapeHtml(`${item.category}::${item.className}`)}">
                            ${optionsHtml}
                        </select>
                    </td>
                    <td><span class="schedule-status">${formatScheduleValue(savedValue)}</span></td>
                </tr>
            `;
        }).join("")
        : '<tr><td colspan="6" class="empty-state">Belum ada data kelas.</td></tr>';
    renderScheduleBoard(allRows, tatamiCount, savedAssignments);
}

function loadScheduleOrders() {
    try {
        const saved = JSON.parse(localStorage.getItem(scheduleOrderStorageKey) || "{}");
        return saved && typeof saved === "object" ? saved : {};
    } catch (error) {
        return {};
    }
}

function renderScheduleBoard(rows, tatamiCount, assignments) {
    if (!scheduleBoard) return;
    const daySettings = getScheduleDaySettings();
    const orders = loadScheduleOrders();

    const boardData = daySettings.map(d => ({
        day: d.day,
        tatamis: Array.from({ length: tatamiCount }, (_, index) => ({ number: index + 1, classes: [] }))
    }));

    rows.forEach(item => {
        const savedValueRaw = String(assignments[`${item.category}::${item.className}`] || "");
        const savedValue = /^\d+$/.test(savedValueRaw) ? `D1-T${savedValueRaw}` : savedValueRaw;
        const m = savedValue.match(/^D(\d+)-T(\d+)$/);
        if (m) {
            const dIdx = parseInt(m[1]) - 1;
            const tIdx = parseInt(m[2]) - 1;
            if (boardData[dIdx] && boardData[dIdx].tatamis[tIdx]) {
                boardData[dIdx].tatamis[tIdx].classes.push(item);
            }
        }
    });

    boardData.forEach(dayGroup => {
        dayGroup.tatamis.forEach(group => {
            const order = orders[`D${dayGroup.day}-T${group.number}`] || orders[String(group.number)] || [];
            group.classes.sort((first, second) => {
                const firstIndex = order.indexOf(`${first.category}::${first.className}`);
                const secondIndex = order.indexOf(`${second.category}::${second.className}`);
                if (firstIndex !== -1 || secondIndex !== -1) {
                    return (firstIndex === -1 ? Number.MAX_SAFE_INTEGER : firstIndex) - (secondIndex === -1 ? Number.MAX_SAFE_INTEGER : secondIndex);
                }
                return compareScheduleClasses(first, second);
            });
        });
    });

    const tabsHtml = `
        <nav class="schedule-tabs" aria-label="Tab Hari Pertandingan" style="margin-bottom: 20px;">
            ${boardData.map((d, i) => `
                <button class="category-button schedule-day-tab ${i === 0 ? 'active' : ''}" data-day="${d.day}" type="button">
                    Hari Ke-${d.day}
                </button>
            `).join('')}
        </nav>
    `;

    const panelsHtml = boardData.map((dayGroup, i) => `
        <div class="schedule-day-panel" data-day="${dayGroup.day}" ${i === 0 ? 'style="display:block;"' : 'hidden style="display:none;"'}>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; align-items: start;">
                ${dayGroup.tatamis.map(group => `
                    <article class="schedule-tatami-card">
                        <header><span>Tatami ${group.number}</span><strong>${group.classes.reduce((total, item) => total + item.count, 0).toLocaleString("id-ID")} peserta <small>(${group.classes.length} kelas)</small></strong></header>
                        <div class="schedule-card-list">${group.classes.length ? group.classes.map((item, index) => `<div class="schedule-card-item"><b>${index + 1}</b><div><strong>${escapeHtml(item.className)}</strong><small>${item.category} · ${item.count.toLocaleString("id-ID")} peserta</small></div></div>`).join("") : '<p class="schedule-empty">Belum ada kelas</p>'}</div>
                    </article>
                `).join("")}
            </div>
        </div>
    `).join("");

    scheduleBoard.style.display = 'block';
    scheduleBoard.innerHTML = tabsHtml + panelsHtml;

    // Attach event listeners for the tabs
    const dayTabs = scheduleBoard.querySelectorAll('.schedule-day-tab');
    const dayPanels = scheduleBoard.querySelectorAll('.schedule-day-panel');
    
    dayTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const day = tab.dataset.day;
            dayTabs.forEach(t => {
                t.classList.toggle('active', t === tab);
            });
            dayPanels.forEach(p => {
                if (p.dataset.day === day) {
                    p.removeAttribute('hidden');
                    p.style.display = 'block'; // ensure it shows
                } else {
                    p.setAttribute('hidden', '');
                    p.style.display = 'none';
                }
            });
        });
    });
}

const SCHEDULE_AGE_ORDER = ["PRA USIA DINI", "USIA DINI", "PRA PEMULA", "PEMULA", "KADET", "JUNIOR", "UNDER-21", "SENIOR"];
const FESTIVAL_AGE_ORDER = ["PAUD/TK", "SD 1-3", "SD 4-6", "SMP", "SMA", "MAHASISWA/UMUM", "MAHASISWA", "UMUM"];

function compareScheduleClasses(first, second) {
    const firstName = first.className.toLocaleUpperCase("id-ID");
    const secondName = second.className.toLocaleUpperCase("id-ID");
    
    const categoryOrder = { Open: 0, Festival: 1 };
    const categoryComparison = (categoryOrder[first.category] ?? 2) - (categoryOrder[second.category] ?? 2);
    if (categoryComparison) return categoryComparison;

    const getTypeOrder = name => name.includes("KATA BEREGU")
        ? 0
        : name.includes("KATA PERORANGAN")
            ? 1
            : name.includes("KUMITE")
                ? 2
                : 3;
    const typeComparison = getTypeOrder(firstName) - getTypeOrder(secondName);
    if (typeComparison) return typeComparison;

    const ageOrderList = first.category === "Festival" ? FESTIVAL_AGE_ORDER : SCHEDULE_AGE_ORDER;
    const firstAge = ageOrderList.findIndex(age => firstName.includes(age));
    const secondAge = ageOrderList.findIndex(age => secondName.includes(age));
    const ageComparison = (firstAge === -1 ? ageOrderList.length : firstAge) - (secondAge === -1 ? ageOrderList.length : secondAge);
    if (ageComparison) return ageComparison;

    const getGenderOrder = name => name.includes("PUTRA") ? 0 : name.includes("PUTRI") ? 1 : 2;
    const genderComparison = getGenderOrder(firstName) - getGenderOrder(secondName);
    if (genderComparison) return genderComparison;

    if (firstName.includes("KUMITE") && secondName.includes("KUMITE")) {
        const getWeight = name => {
            const match = name.match(/([+-]?)(\d+)\s*KG/);
            if (!match) return Number.POSITIVE_INFINITY;
            const sign = match[1] === '-' ? -1 : 1;
            const val = Number(match[2]);
            return sign === -1 ? val : 10000 + val;
        };
        const weightComparison = getWeight(firstName) - getWeight(secondName);
        if (weightComparison) return weightComparison;
    }

    return firstName.localeCompare(secondName, "id", { sensitivity: "base" });
}

function autoAssignSchedule() {
    const tatamiCount = Number(scheduleTatamiCount?.value || 1);
    const daySettings = getScheduleDaySettings();
    const classes = new Map();
    adminParticipants
        .forEach(participant => {
            const category = normalizeParticipantCategory(participant.kategori);
            const className = normalizeClassName(participant["KELAS PERTANDINGAN"]);
            const key = `${category}::${className}`;
            if (!classes.has(key)) classes.set(key, { category, className, count: 0, isTeam: isTeamClass(className, classTypeSettings) });
            classes.get(key).count += 1;
        });
    classes.forEach(item => {
        if (item.isTeam) item.count = Math.ceil(item.count / 3);
    });

    const sortedClasses = [...classes.values()]
        .filter(item => !(item.category === "Open" && item.count <= 1))
        .sort((first, second) => second.count - first.count || compareScheduleClasses(first, second));
    const assignments = loadScheduleTatamiAssignments();
    const orders = loadScheduleOrders();
    Object.keys(orders).forEach(key => { orders[key] = []; });
    
    const bucketTotals = {};
    daySettings.forEach(d => {
        for(let t=1; t<=tatamiCount; t++) bucketTotals[`D${d.day}-T${t}`] = 0;
    });

    sortedClasses.forEach(item => {
        const validDays = daySettings.filter(d => d.category === "Semua" || d.category === item.category);
        if (validDays.length === 0) return;
        
        let minBucket = null;
        let minTotal = Infinity;
        validDays.forEach(d => {
            for(let t=1; t<=tatamiCount; t++) {
                const b = `D${d.day}-T${t}`;
                if (bucketTotals[b] < minTotal) {
                    minTotal = bucketTotals[b];
                    minBucket = b;
                }
            }
        });

        if (minBucket) {
            assignments[`${item.category}::${item.className}`] = minBucket;
            bucketTotals[minBucket] += item.count;
            if (!orders[minBucket]) orders[minBucket] = [];
            orders[minBucket].push(`${item.category}::${item.className}`);
        }
    });

    Object.keys(orders).forEach(tatami => {
        const orderKeys = new Set(orders[tatami]);
        const tatamiClasses = sortedClasses.filter(item => orderKeys.has(`${item.category}::${item.className}`));
        tatamiClasses.sort(compareScheduleClasses);
        orders[tatami] = tatamiClasses.map(item => `${item.category}::${item.className}`);
    });
    localStorage.setItem(scheduleTatamiStorageKey, JSON.stringify(assignments));
    localStorage.setItem(scheduleOrderStorageKey, JSON.stringify(orders));
    syncScheduleToCloud();
    renderScheduleList();
}

function shuffleScheduleBoard() {
    const assignments = loadScheduleTatamiAssignments();
    const rows = [...new Map(adminParticipants.map(participant => {
        const category = normalizeParticipantCategory(participant.kategori);
        const className = normalizeClassName(participant["KELAS PERTANDINGAN"]);
        return [`${category}::${className}`, { category, className, count: 0 }];
    })).values()];
    rows.forEach(row => {
        row.count = adminParticipants.filter(participant => normalizeParticipantCategory(participant.kategori) === row.category && normalizeClassName(participant["KELAS PERTANDINGAN"]) === row.className).length;
    });
    const grouped = {};
    rows.forEach(row => {
        const tatami = assignments[`${row.category}::${row.className}`];
        if (tatami) (grouped[tatami] ||= []).push(`${row.category}::${row.className}`);
    });
    const orders = loadScheduleOrders();
    Object.entries(grouped).forEach(([tatami, keys]) => {
        for (let index = keys.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [keys[index], keys[swapIndex]] = [keys[swapIndex], keys[index]];
        }
        orders[tatami] = keys;
    });
    localStorage.setItem(scheduleOrderStorageKey, JSON.stringify(orders));
    syncScheduleToCloud();
    renderScheduleList();
}

function loadScheduleTatamiAssignments() {
    try {
        const saved = JSON.parse(localStorage.getItem(scheduleTatamiStorageKey) || "{}");
        return saved && typeof saved === "object" ? saved : {};
    } catch (error) {
        return {};
    }
}

function saveScheduleTatamiAssignment(classKey, tatami) {
    const assignments = loadScheduleTatamiAssignments();
    if (tatami) assignments[classKey] = tatami;
    else delete assignments[classKey];
    localStorage.setItem(scheduleTatamiStorageKey, JSON.stringify(assignments));
    syncScheduleToCloud();
}

function loadBracketMixClasses() {
    try {
        const savedMixes = JSON.parse(localStorage.getItem("admin_bracket_mix_classes") || "[]");
        return Array.isArray(savedMixes) ? savedMixes : [];
    } catch (error) {
        return [];
    }
}

function saveBracketMixClasses() {
    localStorage.setItem("admin_bracket_mix_classes", JSON.stringify(bracketMixClasses));
}

async function reconcileActiveMixParticipants(participantData) {
    const participantUpdates = {};
    let mixChanged = false;

    bracketMixClasses.forEach(mix => {
        const sourceParticipants = Array.isArray(mix.sourceParticipants) ? mix.sourceParticipants : [];
        const knownParticipantIds = new Set(sourceParticipants.map(participant => participant.id));
        Object.entries(participantData).forEach(([id, participant]) => {
            const sourceKey = `${normalizeParticipantCategory(participant.kategori)}::${normalizeClassName(participant["KELAS PERTANDINGAN"])}`;
            if (!mix.sourceKeys.includes(sourceKey) || knownParticipantIds.has(id)) return;

            sourceParticipants.push({
                id,
                className: normalizeClassName(participant["KELAS PERTANDINGAN"])
            });
            knownParticipantIds.add(id);
            participantUpdates[`${id}/KELAS PERTANDINGAN`] = mix.name;
            participantData[id] = { ...participant, "KELAS PERTANDINGAN": mix.name };
            mixChanged = true;
        });
        if (sourceParticipants.length !== (mix.sourceParticipants || []).length) {
            mix.sourceParticipants = sourceParticipants;
        }
    });

    if (!mixChanged) return false;
    await update(ref(rtdb, "peserta"), participantUpdates);
    await set(ref(rtdb, "versiPeserta"), Date.now());
    saveBracketMixClasses();
    return true;
}

async function syncScheduleToCloud() {
    try {
        const assignments = loadScheduleTatamiAssignments();
        const orders = loadScheduleOrders();
        const tatamiCount = localStorage.getItem(scheduleTatamiCountStorageKey) || "1";
        const daySettings = getScheduleDaySettings();
        await update(ref(rtdb, "pengaturan/jadwal"), {
            assignments,
            orders,
            tatamiCount,
            daySettings,
            updatedAt: Date.now()
        });
        console.log("Jadwal disinkronkan ke Cloud.");
    } catch (error) {
        console.warn("Gagal sinkron jadwal ke cloud:", error);
    }
}

async function loadScheduleFromCloud() {
    try {
        const snapshot = await get(ref(rtdb, "pengaturan/jadwal"));
        if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.assignments) localStorage.setItem(scheduleTatamiStorageKey, JSON.stringify(data.assignments));
            if (data.orders) localStorage.setItem(scheduleOrderStorageKey, JSON.stringify(data.orders));
            if (data.tatamiCount) {
                localStorage.setItem(scheduleTatamiCountStorageKey, data.tatamiCount);
                if (scheduleTatamiCount) scheduleTatamiCount.value = data.tatamiCount;
            }
            if (data.daySettings) {
                localStorage.setItem(scheduleDaysStorageKey, JSON.stringify(data.daySettings));
                if (scheduleDayCount) {
                    scheduleDayCount.value = data.daySettings.length;
                    renderDayConfig();
                }
            }
            renderScheduleList();
            console.log("Jadwal dimuat dari Cloud.");
        }
    } catch (error) {
        console.warn("Gagal muat jadwal dari cloud:", error);
    }
}

function saveBracketShuffleRules() {
    persistBracketShuffleRules(bracketShuffleRules);
    if (bracketRulesStatus) {
        bracketRulesStatus.textContent = "Aturan tersimpan";
        bracketRulesStatus.className = "status-message success";
    }
}

function renderBracketShuffleRules() {
    document.querySelectorAll("input[data-bracket-rule]").forEach(input => {
        const ruleKey = input.dataset.bracketRule;
        input.checked = Boolean(bracketShuffleRules[ruleKey]);
    });
}

function getBracketShuffleRules() {
    return getStoredBracketShuffleRules(bracketShuffleRules);
}

window.getBracketShuffleRules = getBracketShuffleRules;

function loadBracketSlotPlans() {
    try {
        const savedPlans = JSON.parse(localStorage.getItem(BRACKET_SLOT_PLANS_STORAGE_KEY) || "{}");
        return savedPlans && typeof savedPlans === "object" ? savedPlans : {};
    } catch (error) {
        return {};
    }
}

function getBracketSlotPlanKey() {
    return `${activeBracketCategory}::${activeBracketClassKey}`;
}

function getBracketSlotsForCount(count) {
    const numericCount = Math.max(2, Math.min(16, Number(count) || 2));
    return (BRACKET_SLOT_LAYOUT_BY_COUNT[numericCount] || BRACKET_SLOT_LAYOUT_BY_COUNT[16]).slice();
}

function renderBracketSlotPlan(participantCount) {
    if (!bracketSlotPlanList || !bracketSlotPlanCount || !prepareBracketSlotsButton) return;
    const selectedSlots = getBracketSlotsForCount(participantCount);
    const slotPlans = loadBracketSlotPlans();
    const savedPlan = slotPlans[getBracketSlotPlanKey()];
    const isPrepared = savedPlan?.participantCount === participantCount && JSON.stringify(savedPlan.slots) === JSON.stringify(selectedSlots);

    bracketSlotPlanCount.textContent = `${selectedSlots.length} slot aktif`;
    bracketSlotPlanList.innerHTML = selectedSlots.map((slot, index) => `
        <span class="bracket-slot-chip"><strong>${slot}</strong><small>Peserta ${index + 1}</small></span>
    `).join("");
    prepareBracketSlotsButton.disabled = !activeBracketClassKey;
    prepareBracketSlotsButton.textContent = isPrepared ? "Slot Sudah Disiapkan" : "Siapkan Slot Bagan";
    if (bracketSlotPlanStatus) {
        bracketSlotPlanStatus.textContent = isPrepared ? "Slot siap digunakan" : "Belum disiapkan";
        bracketSlotPlanStatus.className = `status-message ${isPrepared ? "success" : ""}`.trim();
    }
}

function prepareBracketSlots() {
    if (!activeBracketClassKey) return;
    const selectedOption = getBracketClassOptions().find(option => option.key === activeBracketClassKey);
    if (!selectedOption) return;
    const participantCount = getBracketParticipants(selectedOption).length;
    const slotPlans = loadBracketSlotPlans();
    slotPlans[getBracketSlotPlanKey()] = {
        category: activeBracketCategory,
        classKey: activeBracketClassKey,
        participantCount,
        slots: getBracketSlotsForCount(participantCount),
        preparedAt: new Date().toISOString()
    };
    localStorage.setItem(BRACKET_SLOT_PLANS_STORAGE_KEY, JSON.stringify(slotPlans));
    renderBracketSlotPlan(participantCount);
}

const BRACKET_AGE_CATEGORIES = ["PRA USIA DINI", "USIA DINI", "PRA PEMULA", "PEMULA", "KADET", "JUNIOR", "UNDER-21", "SENIOR"];

function getBracketAgeCategory(className) {
    const normalizedClassName = String(className || "").toLocaleUpperCase("id-ID");
    return BRACKET_AGE_CATEGORIES.find(category => normalizedClassName.includes(category)) || "LAINNYA";
}

function compareBracketMixNeededOptions(first, second) {
    const firstName = first.className.toLocaleUpperCase("id-ID");
    const secondName = second.className.toLocaleUpperCase("id-ID");
    const getTypeOrder = className => {
        if (className.includes("KATA PERORANGAN")) return 0;
        if (className.includes("KATA BEREGU")) return 1;
        if (className.includes("KUMITE")) return 2;
        return 3;
    };
    const typeComparison = getTypeOrder(firstName) - getTypeOrder(secondName);
    if (typeComparison) return typeComparison;

    const getAgeOrder = className => {
        const ageIndex = BRACKET_AGE_CATEGORIES.indexOf(getBracketAgeCategory(className));
        return ageIndex === -1 ? BRACKET_AGE_CATEGORIES.length : ageIndex;
    };
    const ageComparison = getAgeOrder(firstName) - getAgeOrder(secondName);
    if (ageComparison) return ageComparison;

    if (firstName.includes("KUMITE") && secondName.includes("KUMITE")) {
        const getWeight = className => {
            const weightMatch = className.match(/([+-]?\d+)\s*KG/);
            return weightMatch ? Number(weightMatch[1]) : Number.POSITIVE_INFINITY;
        };
        const weightComparison = getWeight(firstName) - getWeight(secondName);
        if (weightComparison) return weightComparison;
    }

    const getGenderOrder = className => className.includes("PUTRA") ? 0 : className.includes("PUTRI") ? 1 : 2;
    const genderComparison = getGenderOrder(firstName) - getGenderOrder(secondName);
    if (genderComparison) return genderComparison;

    return firstName.localeCompare(secondName, "id", { sensitivity: "base" });
}

function getBracketClassOptions() {
    const groupedClasses = new Map();
    const activeMixNames = new Set(bracketMixClasses
        .filter(mix => mix.category === activeBracketCategory)
        .map(mix => mix.name));
    adminParticipants.filter(participant => normalizeParticipantCategory(participant.kategori) === activeBracketCategory).forEach(participant => {
        const className = normalizeClassName(participant["KELAS PERTANDINGAN"]);
        if (activeMixNames.has(className)) return;
        const category = normalizeParticipantCategory(participant.kategori);
        const key = `${category}::${className}`;
        if (!groupedClasses.has(key)) groupedClasses.set(key, { key, className, category, participantCount: 0 });
        groupedClasses.get(key).participantCount += 1;
    });
    const options = Array.from(groupedClasses.values()).map(option => ({
        ...option,
        participantCount: getMixUnitCount(activeBracketCategory, option.className)
    }));
    bracketMixClasses.filter(mix => mix.category === activeBracketCategory).forEach(mix => {
        const sourceParticipants = mix.sourceParticipants?.length
            ? adminParticipants.filter(participant => mix.sourceParticipants.some(source => source.id === participant.id))
            : adminParticipants.filter(participant => mix.sourceKeys.includes(`${normalizeParticipantCategory(participant.kategori)}::${normalizeClassName(participant["KELAS PERTANDINGAN"])}`));
        options.push({
            key: `mix::${mix.id}`,
            className: mix.name,
            category: mix.category,
            participantCount: getMixUnitCountForParticipants(sourceParticipants, mix.sourceParticipants),
            isMix: true,
            sourceKeys: mix.sourceKeys,
            sourceParticipants: mix.sourceParticipants || []
        });
    });
    return options.sort((first, second) => {
        const countComparison = second.participantCount - first.participantCount;
        return countComparison || first.className.localeCompare(second.className, "id", { sensitivity: "base" });
    });
}

function getMixUnitCount(category, className) {
    const participants = adminParticipants.filter(participant =>
        normalizeParticipantCategory(participant.kategori) === category &&
        normalizeClassName(participant["KELAS PERTANDINGAN"]) === className
    );
    return getMixUnitCountForParticipants(participants);
}

function getMixUnitCountForParticipants(participants, sourceParticipants = []) {
    if (!participants.length) return 0;
    const sourceClassById = new Map(sourceParticipants.map(participant => [participant.id, participant.className]));
    const groups = new Map();
    participants.forEach(participant => {
        const className = normalizeClassName(sourceClassById.get(participant.id) || participant["KELAS PERTANDINGAN"]);
        if (!groups.has(className)) groups.set(className, []);
        groups.get(className).push(participant);
    });
    return Array.from(groups.entries()).reduce((total, [className, classParticipants]) => {
        if (!isTeamClass(className, classTypeSettings)) return total + classParticipants.length;
        const teamKeys = new Set(classParticipants.map(participant =>
            String(participant.KONTINGEN || "Tanpa kontingen").trim().toLocaleLowerCase("id-ID")
        ));
        return total + teamKeys.size;
    }, 0);
}

function getBracketParticipants(option) {
    if (!option) return [];
    if (option.isMix) {
        if (option.sourceParticipants?.length) {
            const sourceIds = new Set(option.sourceParticipants.map(participant => participant.id));
            return adminParticipants.filter(participant => sourceIds.has(participant.id));
        }
        return adminParticipants.filter(participant => option.sourceKeys.includes(`${normalizeParticipantCategory(participant.kategori)}::${normalizeClassName(participant["KELAS PERTANDINGAN"])}`));
    }
    return adminParticipants.filter(participant => `${normalizeParticipantCategory(participant.kategori)}::${normalizeClassName(participant["KELAS PERTANDINGAN"])}` === option.key);
}

function normalizeParticipantCategory(value) {
    return String(value || "Festival").trim().toLocaleUpperCase("id-ID") === "OPEN" ? "Open" : "Festival";
}

function renderBracketMixSources() {
    if (!bracketMixNeedsList || !bracketMixAllList) return;
    if (bracketMixAgeCategory) bracketMixAgeCategory.value = activeBracketAgeCategory;
    const selectedSources = new Set(Array.from(document.querySelectorAll("input[data-mix-source]:checked"), input => input.dataset.mixSource));
    const bracketOptions = getBracketClassOptions();
    const sourceOptions = bracketOptions.filter(option => !option.isMix);
    const activeMixOptions = bracketOptions.filter(option => option.isMix);
    const neededOptions = sourceOptions.filter(option => option.participantCount < 2).sort(compareBracketMixNeededOptions);
    const selectedNeededKeys = new Set(neededOptions.filter(option => selectedSources.has(option.key)).map(option => option.key));
    const allOptions = sourceOptions.filter(option => {
        if (selectedNeededKeys.has(option.key)) return false;
        return activeBracketAgeCategory === "SEMUA" || getBracketAgeCategory(option.className) === activeBracketAgeCategory;
    }).sort(compareBracketMixNeededOptions);
    const visibleActiveMixOptions = activeMixOptions.filter(option =>
        activeBracketAgeCategory === "SEMUA" || getBracketAgeCategory(option.className) === activeBracketAgeCategory
    ).sort(compareBracketMixNeededOptions);
    const renderOptions = options => options.length
        ? options.map(option => option.isMix ? `
            <label class="bracket-mix-source">
                <input type="checkbox" data-mix-source="${escapeHtml(option.key)}" ${selectedSources.has(option.key) ? "checked" : ""}>
                <span>${escapeHtml(option.className.toLocaleUpperCase("id-ID"))}</span>
                <small>${option.participantCount.toLocaleString("id-ID")} peserta</small>
            </label>
        ` : `
            <label class="bracket-mix-source">
                <input type="checkbox" data-mix-source="${escapeHtml(option.key)}" ${selectedSources.has(option.key) ? "checked" : ""}>
                <span>${escapeHtml(option.className.toLocaleUpperCase("id-ID"))}</span>
                <small>${option.participantCount.toLocaleString("id-ID")} peserta</small>
            </label>
        `).join("")
        : '<span class="settings-help">Belum ada kelas pada kategori ini.</span>';
    bracketMixNeedsList.innerHTML = renderOptions(neededOptions);
    bracketMixAllList.innerHTML = renderOptions([...allOptions, ...visibleActiveMixOptions]);
    document.querySelectorAll("input[data-mix-source]").forEach(input => {
        input.addEventListener("change", renderBracketMixSources);
    });
    renderActiveMixList();
}

function renderActiveMixList() {
    if (!activeMixList) return;
    const activeMixes = bracketMixClasses.filter(mix => mix.category === activeBracketCategory);
    activeMixList.innerHTML = activeMixes.length
        ? activeMixes.map(mix => `
            <div class="active-mix-item">
                <div>
                    <strong>${escapeHtml(mix.name)}</strong>
                    <small>${mix.sourceKeys.map(sourceKey => escapeHtml(sourceKey.split("::").slice(1).join("::"))).join(" + ")}</small>
                </div>
                <button class="button secondary-button" type="button" data-unmerge-mix="${escapeHtml(mix.id)}">Unmerge</button>
            </div>
        `).join("")
        : '<p class="settings-help">Belum ada kelas yang di-mix pada kategori ini.</p>';
}

async function createBracketMix() {
    if (!bracketMixName || !bracketMixNeedsList || !bracketMixAllList) return;
    const selectedSources = Array.from(document.querySelectorAll("input[data-mix-source]:checked"), input => input.dataset.mixSource);
    const name = bracketMixName.value.trim();

    if (!name) {
        bracketMixStatus.textContent = "Masukkan nama kelas baru.";
        bracketMixStatus.className = "status-message error";
        return;
    }
    if (selectedSources.length < 2) {
        bracketMixStatus.textContent = "Pilih minimal dua kelas untuk di-mix.";
        bracketMixStatus.className = "status-message error";
        return;
    }

    const normalizedName = name.toLocaleUpperCase("id-ID");
    const duplicateName = bracketMixClasses.some(mix => mix.category === activeBracketCategory && mix.name === normalizedName);
    if (duplicateName) {
        bracketMixStatus.textContent = "Nama kelas mix tersebut sudah digunakan.";
        bracketMixStatus.className = "status-message error";
        return;
    }

    const selectedOptions = getBracketClassOptions().filter(option => selectedSources.includes(option.key));
    const sourceParticipants = selectedOptions.flatMap(option => {
        if (option.isMix) {
            const sourceIds = new Set(option.sourceParticipants.map(participant => participant.id));
            return adminParticipants
                .filter(participant => sourceIds.has(participant.id))
                .map(participant => ({ id: participant.id, className: normalizeClassName(participant["KELAS PERTANDINGAN"]) }));
        }
        return adminParticipants
            .filter(participant => `${normalizeParticipantCategory(participant.kategori)}::${normalizeClassName(participant["KELAS PERTANDINGAN"])}` === option.key)
            .map(participant => ({ id: participant.id, className: normalizeClassName(participant["KELAS PERTANDINGAN"]) }));
    }).filter((participant, index, participants) => participant.id && participants.findIndex(item => item.id === participant.id) === index);
    if (!sourceParticipants.length) {
        bracketMixStatus.textContent = "Peserta kelas sumber tidak ditemukan.";
        bracketMixStatus.className = "status-message error";
        return;
    }

    const mix = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: normalizedName,
        category: activeBracketCategory,
        sourceKeys: selectedSources,
        sourceParticipants
    };

    const participantUpdates = Object.fromEntries(sourceParticipants.map(participant => [
        `${participant.id}/KELAS PERTANDINGAN`,
        normalizedName
    ]));
    const createButton = document.getElementById("create-bracket-mix");
    createButton.disabled = true;
    try {
        await update(ref(rtdb, "peserta"), participantUpdates);
        await set(ref(rtdb, "versiPeserta"), Date.now());
        bracketMixClasses.push(mix);
        saveBracketMixClasses();
        activeBracketClassKey = `mix::${mix.id}`;
        bracketMixName.value = "";
        bracketMixStatus.textContent = `${sourceParticipants.length.toLocaleString("id-ID")} peserta berhasil dipindahkan ke kelas ${normalizedName}.`;
        bracketMixStatus.className = "status-message success";
        await loadParticipantSummary(true);
        renderBracketWorkspace();
    } catch (error) {
        console.error("Gagal membuat mix kelas:", error);
        bracketMixStatus.textContent = "Mix gagal dibuat. Data peserta belum diubah.";
        bracketMixStatus.className = "status-message error";
    } finally {
        createButton.disabled = false;
    }
}

async function cancelBracketMix(mixId = "") {
    const selectedMix = bracketMixClasses.find(mix => mixId ? mix.id === mixId : `mix::${mix.id}` === activeBracketClassKey);
    if (!selectedMix) return;
    if (!window.confirm(`Unmerge kelas ${selectedMix.name}? Kelas sumber akan tampil kembali.`)) return;

    const restoreUpdates = Object.fromEntries((selectedMix.sourceParticipants || []).map(participant => [
        `${participant.id}/KELAS PERTANDINGAN`,
        participant.className
    ]));
    try {
        if (Object.keys(restoreUpdates).length) await update(ref(rtdb, "peserta"), restoreUpdates);
        if (Object.keys(restoreUpdates).length) await set(ref(rtdb, "versiPeserta"), Date.now());
        bracketMixClasses = bracketMixClasses.filter(mix => mix.id !== selectedMix.id);
        saveBracketMixClasses();
        activeBracketClassKey = "";
        if (bracketMixStatus) {
            bracketMixStatus.textContent = `Mix ${selectedMix.name} dibatalkan. Kelas sumber dan peserta dikembalikan.`;
            bracketMixStatus.className = "status-message success";
        }
        await loadParticipantSummary(true);
        renderBracketWorkspace();
    } catch (error) {
        console.error("Gagal melakukan unmerge kelas:", error);
        if (bracketMixStatus) {
            bracketMixStatus.textContent = "Unmerge gagal. Data peserta belum diubah.";
            bracketMixStatus.className = "status-message error";
        }
    }
}

function renderBracketWorkspace() {
    renderBracketMixSources();
    if (!bracketClassSelect || !bracketParticipantBody) return;
    const uppercase = value => String(value || "").toLocaleUpperCase("id-ID");
    renderBracketShuffleRules();
    if (mixCategorySelect) mixCategorySelect.value = activeBracketCategory;

    const classCounts = new Map();
    adminParticipants.forEach(participant => {
        const category = participant.kategori || "Festival";
        const className = normalizeClassName(participant["KELAS PERTANDINGAN"]);
        classCounts.set(`${category}::${className}`, { category, className });
    });
    if (bracketOpenClassCount) {
        bracketOpenClassCount.textContent = String([...classCounts.values()].filter(item => item.category === "Open").length);
    }
    if (bracketFestivalClassCount) {
        bracketFestivalClassCount.textContent = String([...classCounts.values()].filter(item => item.category === "Festival").length);
    }

    const options = getBracketClassOptions();
    if (!options.some(option => option.key === activeBracketClassKey)) {
        activeBracketClassKey = options[0]?.key || "";
    }

    bracketClassSelect.innerHTML = options.length
        ? options.map(option => `<option value="${escapeHtml(option.key)}">${escapeHtml(uppercase(option.className))} · ${escapeHtml(uppercase(option.category))}</option>`).join("")
        : '<option value="">Belum ada kelas</option>';
    bracketClassSelect.value = activeBracketClassKey;

    const selectedOption = options.find(option => option.key === activeBracketClassKey);
    const classParticipants = getBracketParticipants(selectedOption);
    if (cancelBracketMixButton) {
        cancelBracketMixButton.hidden = !selectedOption?.isMix;
    }
    if (bracketMixWarning) {
        bracketMixWarning.textContent = "";
        if (selectedOption?.isMix) {
            const sourceDetails = selectedOption.sourceKeys.map(sourceKey => {
                const separatorIndex = sourceKey.indexOf("::");
                const className = sourceKey.slice(separatorIndex + 2);
                const participantCount = adminParticipants.filter(participant => `${participant.kategori || "Festival"}::${normalizeClassName(participant["KELAS PERTANDINGAN"])}` === sourceKey).length;
                return { label: `${className.toLocaleUpperCase("id-ID")}: ${participantCount} peserta`, participantCount };
            });
            const readySources = sourceDetails.filter(detail => detail.participantCount >= 2);
            bracketMixWarning.textContent = readySources.length
                ? `Peringatan: ${readySources.map(detail => detail.label).join(", ")} sudah memenuhi minimal 2 peserta. Mix tetap aktif sampai admin membatalkannya.`
                : `Mix manual aktif dari ${sourceDetails.map(detail => detail.label).join(", ")}. Data kelas sumber tetap tersimpan.`;
        }
    }
    const participants = selectedOption && selectedOption.category === "Open" && isTeamClass(selectedOption.className, classTypeSettings)
        ? Array.from(classParticipants.reduce((groups, participant) => {
            const contingentKey = String(participant.KONTINGEN || "Tanpa kontingen").trim().toLocaleLowerCase("id-ID");
            if (!groups.has(contingentKey)) groups.set(contingentKey, []);
            groups.get(contingentKey).push(participant);
            return groups;
        }, new Map()).values()).map(members => {
            const firstMember = [...members].sort((first, second) => String(first["NAMA LENGKAP"] || "").localeCompare(String(second["NAMA LENGKAP"] || ""), "id", { sensitivity: "base" }))[0];
            return { ...firstMember, "NAMA LENGKAP": `${firstMember["NAMA LENGKAP"] || "Tim"} Cs` };
        })
        : classParticipants;

    renderBracketSlotPlan(participants.length);

    bracketSelectedClass.textContent = selectedOption ? `${uppercase(selectedOption.className)} · ${uppercase(selectedOption.category)}` : "BELUM ADA KELAS DIPILIH";
    bracketParticipantCount.textContent = `${participants.length.toLocaleString("id-ID")} peserta`;
    bracketParticipantBody.innerHTML = "";

    participants.forEach((participant, index) => {
        const row = document.createElement("tr");
        [index + 1, uppercase(participant["NAMA LENGKAP"] || "-"), uppercase(participant.kategori || "-"), uppercase(participant.KONTINGEN || "-")].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });
        bracketParticipantBody.appendChild(row);
    });

    if (!participants.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.className = "empty-state";
        cell.textContent = "Belum ada peserta pada kelas ini.";
        row.appendChild(cell);
        bracketParticipantBody.appendChild(row);
    }
}

function renderMedalRecap() {
    const medalRows = adminParticipants.filter(participant => participant.kategori === activeMedalCategory);
    const totals = renderEligibleClasses(medalRows);
    const overallTotals = combineMedalTotals(
        calculateMedalTotals(adminParticipants.filter(participant => participant.kategori === "Open"), "Open"),
        calculateMedalTotals(adminParticipants.filter(participant => participant.kategori === "Festival"), "Festival")
    );
    goldMedalCount.textContent = totals.emas.toLocaleString("id-ID");
    silverMedalCount.textContent = totals.perak.toLocaleString("id-ID");
    bronzeMedalCount.textContent = totals.perunggu.toLocaleString("id-ID");
    overallGoldMedalCount.textContent = overallTotals.emas.toLocaleString("id-ID");
    overallSilverMedalCount.textContent = overallTotals.perak.toLocaleString("id-ID");
    overallBronzeMedalCount.textContent = overallTotals.perunggu.toLocaleString("id-ID");
    festivalFormatControl.hidden = activeMedalCategory !== "Festival";
    medalDetailTab.hidden = activeMedalCategory !== "Festival" || festivalMedalFormat !== "Fast Track";
    if (medalDetailTab.hidden && activeMedalDetail === "odd") activeMedalDetail = "requirement";
    medalRequirementPanel.hidden = activeMedalDetail !== "requirement";
    oddMedalPanel.hidden = activeMedalDetail !== "odd";
    festivalFormatDescription.textContent = festivalMedalFormat === "Fast Track"
        ? "Fast Track: peserta dibagi rata; sisa ganjil dihitung setelah memilih Emas atau Perak."
        : "Slow Track: juara 1, juara 2, dan juara 3 bersama.";
    medalStatus.textContent = activeMedalCategory === "Festival"
        ? `Kebutuhan medali Festival (${festivalMedalFormat}). Hanya kelas yang memiliki peserta ditampilkan.`
        : "Kebutuhan medali Open. Hanya kelas yang memiliki peserta ditampilkan.";
    medalStatus.className = "status-message success";
    renderOddMedalClasses(medalRows);
}

function calculateMedalTotals(participants, category) {
    const classes = new Map();
    participants.forEach(participant => {
        const sourceClassName = normalizeClassName(participant["KELAS PERTANDINGAN"]);
        const className = getRecapClassName(participant);
        const isTeam = category === "Open" && isTeamClass(sourceClassName, classTypeSettings);
        if (!classes.has(className)) classes.set(className, { count: 0, isTeam });
        classes.get(className).count += 1;
    });

    return Array.from(classes.entries()).reduce((totals, [className, details]) => {
        const adjustedCount = details.isTeam ? details.count / 3 : details.count;
        const oddAllocation = category === "Festival" ? festivalOddAllocations[className] : "Emas";
        const format = category === "Festival" ? festivalMedalFormat : "Open";
        const requirement = medalRequirement(adjustedCount, details.isTeam, format, oddAllocation);
        return combineMedalTotals(totals, requirement);
    }, { emas: 0, perak: 0, perunggu: 0 });
}

function combineMedalTotals(first, second) {
    return {
        emas: first.emas + second.emas,
        perak: first.perak + second.perak,
        perunggu: first.perunggu + second.perunggu
    };
}

function renderOddMedalClasses(participants) {
    const oddClasses = new Map();
    if (activeMedalCategory === "Festival" && festivalMedalFormat === "Fast Track") {
        participants.forEach(participant => {
            const className = normalizeClassName(participant["KELAS PERTANDINGAN"]);
            const count = (oddClasses.get(className) || 0) + 1;
            oddClasses.set(className, count);
        });
    }

    oddMedalBody.innerHTML = "";
    const entries = Array.from(oddClasses.entries())
        .filter(([, count]) => count % 2 === 1)
        .sort((first, second) => first[0].localeCompare(second[0], "id", { sensitivity: "base" }));

    if (!entries.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 5;
        cell.className = "empty-state";
        cell.textContent = "Tidak ada kelas Festival dengan jumlah peserta ganjil.";
        row.appendChild(cell);
        oddMedalBody.appendChild(row);
        oddMedalStatus.textContent = "Semua kelas memiliki jumlah peserta genap.";
        return;
    }

    oddMedalStatus.textContent = "Pilih apakah peserta sisa masuk ke Emas atau Perak.";
    entries.forEach(([className, count], index) => {
        const allocation = festivalOddAllocations[className] === "Perak" || festivalOddAllocations[className] === "Emas"
            ? festivalOddAllocations[className]
            : "";
        const baseGold = Math.floor(count / 2);
        const baseSilver = Math.floor(count / 2);
        const displayedGold = baseGold + (allocation === "Emas" && count % 2 === 1 ? 1 : 0);
        const displayedSilver = baseSilver + (allocation === "Perak" && count % 2 === 1 ? 1 : 0);
        const splitText = allocation
            ? `${displayedGold} emas + ${displayedSilver} perak`
            : `${baseGold} emas + ${baseSilver} perak (pilih sisa)`;
        const row = document.createElement("tr");
        const switchCell = document.createElement("td");
        const radioGroup = document.createElement("div");
        radioGroup.className = "odd-allocation-radios";
        ["Emas", "Perak"].forEach(option => {
            const radioLabel = document.createElement("label");
            radioLabel.className = "odd-allocation-radio";
            const radioInput = document.createElement("input");
            radioInput.type = "radio";
            radioInput.name = `odd-allocation-${safeClassKey(className)}`;
            radioInput.value = option;
            radioInput.checked = allocation === option;
            const radioText = document.createElement("span");
            radioText.textContent = option;
            radioLabel.addEventListener("mousedown", event => {
                if (radioInput.checked) {
                    event.preventDefault();
                    event.stopPropagation();
                    void updateOddAllocation(className, "", participants);
                }
            });
            radioInput.addEventListener("change", () => {
                void updateOddAllocation(className, radioInput.value, participants);
            });
            radioLabel.append(radioInput, radioText);
            radioGroup.appendChild(radioLabel);
        });
        switchCell.appendChild(radioGroup);
        [index + 1, className, count, splitText, switchCell].forEach(value => {
            const cell = value instanceof HTMLElement ? value : document.createElement("td");
            if (!(value instanceof HTMLElement)) cell.textContent = value.toLocaleString ? value.toLocaleString("id-ID") : value;
            row.appendChild(cell);
        });
        oddMedalBody.appendChild(row);
    });
}

async function updateOddAllocation(className, nextAllocation, participants) {
    const previousAllocation = festivalOddAllocations[className];
    if (nextAllocation === "Emas" || nextAllocation === "Perak") {
        festivalOddAllocations = { ...festivalOddAllocations, [className]: nextAllocation };
    } else {
        festivalOddAllocations = { ...festivalOddAllocations };
        delete festivalOddAllocations[className];
    }

    try {
        await set(ref(rtdb, "pengaturan/pembagianGanjil"), serializeOddAllocations(festivalOddAllocations));
        renderMedalRecap();
    } catch (error) {
        if (previousAllocation) {
            festivalOddAllocations = { ...festivalOddAllocations, [className]: previousAllocation };
        } else {
            delete festivalOddAllocations[className];
        }
        renderOddMedalClasses(participants);
        oddMedalStatus.textContent = "Pembagian ganjil gagal disimpan.";
        oddMedalStatus.className = "status-message error";
    }
}

function renderEligibleClasses(participants) {
    const classes = new Map();
    participants.forEach(participant => {
        const sourceClassName = normalizeClassName(participant["KELAS PERTANDINGAN"]);
        const className = getRecapClassName(participant);
        const isTeam = activeMedalCategory === "Open" && isTeamClass(sourceClassName, classTypeSettings);
        if (!classes.has(className)) classes.set(className, { count: 0, isTeam });
        classes.get(className).count += 1;
    });

    eligibleClassBody.innerHTML = "";
    const eligibleClasses = Array.from(classes.entries()).sort((first, second) => first[0].localeCompare(second[0], "id", { sensitivity: "base" }));
    const totals = { emas: 0, perak: 0, perunggu: 0 };

    eligibleClasses.forEach(([className, details], index) => {
        const row = document.createElement("tr");
        const adjustedCount = details.isTeam ? details.count / 3 : details.count;
        const oddAllocation = activeMedalCategory === "Festival" ? festivalOddAllocations[className] : "Emas";
        const requirement = medalRequirement(adjustedCount, details.isTeam, activeMedalCategory === "Festival" ? festivalMedalFormat : "Open", oddAllocation);
        totals.emas += requirement.emas;
        totals.perak += requirement.perak;
        totals.perunggu += requirement.perunggu;
        [index + 1, className, details.isTeam ? "Beregu" : "Perorangan", adjustedCount, requirement.emas || "-", requirement.perak || "-", requirement.perunggu || "-", requirement.note].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value.toLocaleString ? value.toLocaleString("id-ID") : value;
            row.appendChild(cell);
        });
        eligibleClassBody.appendChild(row);
    });

    if (!eligibleClasses.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 8;
        cell.className = "empty-state";
        cell.textContent = "Belum ada kelas pada kategori ini.";
        row.appendChild(cell);
        eligibleClassBody.appendChild(row);
    }

    return totals;
}

function medalRequirement(participantCount, isTeam = false, format = "Slow Track", oddAllocation = "") {
    if (participantCount <= 0) return { emas: 0, perak: 0, perunggu: 0, note: "Belum ada peserta" };
    if (format === "Slow Track") {
        const slowTrackRequirement = calculateSlowTrackRequirement(participantCount);
        return {
            emas: slowTrackRequirement.emas * (isTeam ? 3 : 1),
            perak: slowTrackRequirement.perak * (isTeam ? 3 : 1),
            perunggu: slowTrackRequirement.perunggu * (isTeam ? 3 : 1),
            note: slowTrackRequirement.note
        };
    }
    if (participantCount === 1 && format !== "Fast Track") {
        return { emas: 0, perak: 0, perunggu: 0, note: "Belum mencukupi kriteria" };
    }
    const medals = format === "Fast Track"
        ? oddAllocation === "Perak"
            ? { emas: Math.floor(participantCount / 2), perak: Math.ceil(participantCount / 2), perunggu: 0 }
            : oddAllocation === "Emas"
                ? { emas: Math.ceil(participantCount / 2), perak: Math.floor(participantCount / 2), perunggu: 0 }
                : { emas: Math.floor(participantCount / 2), perak: Math.floor(participantCount / 2), perunggu: 0 }
        : participantCount === 2
            ? { emas: 1, perak: 1, perunggu: 0 }
            : participantCount === 3
                ? { emas: 1, perak: 1, perunggu: 1 }
                : { emas: 1, perak: 1, perunggu: 2 };
    const multiplier = isTeam ? 3 : 1;
    const hasUnallocatedOdd = format === "Fast Track" && participantCount % 2 === 1 && !oddAllocation;

    return {
        emas: medals.emas * multiplier,
        perak: medals.perak * multiplier,
        perunggu: medals.perunggu * multiplier,
        note: hasUnallocatedOdd ? "Pilih Emas atau Perak untuk sisa ganjil" : "Memenuhi kriteria"
    };
}

function calculateSlowTrackRequirement(participantCount) {
    const wholeParticipantCount = Math.floor(Number(participantCount));
    if (wholeParticipantCount === 2) {
        return { emas: 1, perak: 1, perunggu: 0, note: "Pengecualian 2 peserta" };
    }
    if (wholeParticipantCount < 3) {
        return { emas: 0, perak: 0, perunggu: 0, note: "Belum memenuhi minimal 3 peserta per pool" };
    }

    const poolSizes = getConfiguredSlowTrackPoolSizes(wholeParticipantCount);
    const totals = poolSizes.reduce((medalTotals, poolSize) => {
        const medals = poolSize === 2
            ? { emas: 1, perak: 1, perunggu: 0 }
            : poolSize === 3
                ? { emas: 1, perak: 1, perunggu: 1 }
                : { emas: 1, perak: 1, perunggu: 2 };
        return combineMedalTotals(medalTotals, medals);
    }, { emas: 0, perak: 0, perunggu: 0 });
    return { ...totals, note: `Pool ${poolSizes.join(" + ")}` };
}

function getSlowTrackPoolSizes(participantCount) {
    if (participantCount === 2) return [2];
    if (participantCount === 5) return [3, 2];

    for (let fourPoolCount = Math.floor(participantCount / 4); fourPoolCount >= 0; fourPoolCount -= 1) {
        const remainingParticipants = participantCount - fourPoolCount * 4;
        if (remainingParticipants === 0 || (remainingParticipants >= 3 && remainingParticipants % 3 === 0)) {
            return [
                ...Array.from({ length: fourPoolCount }, () => 4),
                ...Array.from({ length: remainingParticipants / 3 }, () => 3)
            ];
        }
    }

    return [];
}

function normalizeClassName(value) {
    const normalizedValue = String(value ?? "").replace(/\s+/g, " ").trim();
    return normalizedValue || "Tanpa kelas";
}

function safeClassKey(className) {
    return Array.from(normalizeClassName(className), character => character.codePointAt(0).toString(16)).join("_");
}

function normalizeOddAllocations(rawAllocations) {
    return Object.entries(rawAllocations).reduce((allocations, [key, value]) => {
        if (value && typeof value === "object" && value.className) {
            allocations[normalizeClassName(value.className)] = value.allocation === "Perak" ? "Perak" : "Emas";
        } else if (value === "Emas" || value === "Perak") {
            allocations[normalizeClassName(key)] = value;
        }
        return allocations;
    }, {});
}

function serializeOddAllocations(allocations) {
    return Object.entries(allocations).reduce((serialized, [className, allocation]) => {
        serialized[safeClassKey(className)] = {
            className: normalizeClassName(className),
            allocation: allocation === "Perak" ? "Perak" : "Emas"
        };
        return serialized;
    }, {});
}

function normalizeClassType(value) {
    const normalizedValue = String(value ?? "").trim().toLowerCase();
    if (["beregu", "team", "tim", "regu"].includes(normalizedValue)) return "Beregu";
    if (["perorangan", "individual", "solo", "individu"].includes(normalizedValue)) return "Perorangan";
    return null;
}

function resolveClassType(className, settings = {}) {
    const classKey = String(className ?? "").trim();
    if (!classKey) return "Perorangan";

    const normalizedSettings = Object.fromEntries(
        Object.entries(settings).map(([key, value]) => [String(key).trim().toLowerCase(), normalizeClassType(value)])
    );

    const explicitType = normalizedSettings[classKey.trim().toLowerCase()];
    if (explicitType) return explicitType;

    const regexFallback = /beregu|team|tim|regu/i.test(classKey);
    return regexFallback ? "Beregu" : "Perorangan";
}

function isTeamClass(className, settings = {}) {
    return resolveClassType(className, settings) === "Beregu";
}

let currentAdminView = "participant-list";
let isSuperAdminSession = false;
const superAdminOnlyViews = ["class-type-settings", "slow-track-settings", "access-code-management", "upload-panel", "bracket-view", "mix-class-view"];

function switchAdminView(viewId) {
    if (!isSuperAdminSession && superAdminOnlyViews.includes(viewId)) {
        viewId = "participant-list";
    }
    currentAdminView = viewId;

    document.querySelectorAll(".side-menu-item").forEach(item => {
        item.classList.toggle("active", item.dataset.view === viewId);
    });

    const panelMap = {
        "participant-list": participantListView,
        "contingent-list": contingentListView,
        "class-recap": classRecapView,
        "medal-count": medalCountView,
        "payment-management": paymentManagement,
        "schedule-view": scheduleView,
        "bracket-view": bracketView,
        "mix-class-view": mixClassView,
        "event-settings": eventSettings,
        "class-type-settings": classTypeSettingsPanel,
        "slow-track-settings": document.getElementById("slow-track-settings"),
        "access-code-management": accessCodeManagement,
        "upload-panel": uploadPanel
    };

    Object.entries(panelMap).forEach(([id, panel]) => {
        if (panel) {
            panel.hidden = (id !== viewId);
        }
    });

    if (viewId === "mix-class-view") renderBracketMixSources();
    if (viewId === "contingent-list") renderContingentList();

    if (previewPanel) {
        previewPanel.hidden = (viewId !== "upload-panel" || !currentExcelData.length);
    }
}

document.querySelectorAll(".side-menu-item").forEach(button => {
    button.addEventListener("click", () => {
        const view = button.dataset.view;
        if (view && (isSuperAdminSession || !superAdminOnlyViews.includes(view))) {
            switchAdminView(view);
        }
    });
});

function getScheduleDaySettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(scheduleDaysStorageKey) || "[]");
        if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    } catch (e) {}
    return [{ day: 1, category: "Semua" }];
}

function saveScheduleDaySettings(settings) {
    localStorage.setItem(scheduleDaysStorageKey, JSON.stringify(settings));
    syncScheduleToCloud();
}

function renderDayConfig() {
    if (!scheduleDaysContainer || !scheduleDayCount) return;
    const settings = getScheduleDaySettings();
    const count = parseInt(scheduleDayCount.value) || 1;
    
    while(settings.length < count) {
        settings.push({ day: settings.length + 1, category: "Semua" });
    }
    while(settings.length > count) {
        settings.pop();
    }
    saveScheduleDaySettings(settings);

    scheduleDaysContainer.innerHTML = settings.map((s, index) => `
        <div class="day-config-item" style="border:1px solid var(--border-color); padding: 10px; border-radius:6px; flex:1; min-width:150px;">
            <strong style="display:block; margin-bottom: 5px;">Hari ${index + 1}</strong>
            <label style="font-size:12px; display:block; margin-bottom:4px;">Tanggal</label>
            <input type="date" class="schedule-day-date-input" data-day="${index + 1}" value="${s.date || ''}" style="width:100%; margin-bottom:8px; border:1px solid var(--border-color); border-radius:4px; padding:4px;">
            <label style="font-size:12px; display:block; margin-bottom:4px;">Kategori</label>
            <select class="schedule-day-category-select" data-day="${index + 1}" style="width: 100%;">
                <option value="Semua" ${s.category === 'Semua' ? 'selected' : ''}>Semua Kategori</option>
                <option value="Open" ${s.category === 'Open' ? 'selected' : ''}>Open Saja</option>
                <option value="Festival" ${s.category === 'Festival' ? 'selected' : ''}>Festival Saja</option>
            </select>
        </div>
    `).join('');

    document.querySelectorAll('.schedule-day-category-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const day = parseInt(e.target.dataset.day);
            const val = e.target.value;
            const currentSettings = getScheduleDaySettings();
            if (currentSettings[day - 1]) {
                currentSettings[day - 1].category = val;
                saveScheduleDaySettings(currentSettings);
                renderScheduleList();
            }
        });
    });

    document.querySelectorAll('.schedule-day-date-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const day = parseInt(e.target.dataset.day);
            const val = e.target.value;
            const currentSettings = getScheduleDaySettings();
            if (currentSettings[day - 1]) {
                currentSettings[day - 1].date = val;
                saveScheduleDaySettings(currentSettings);
            }
        });
    });
}

if (scheduleDayCount) {
    const initSettings = getScheduleDaySettings();
    scheduleDayCount.value = initSettings.length;
    renderDayConfig();
    scheduleDayCount.addEventListener('change', () => {
        renderDayConfig();
        renderScheduleList();
    });
}

scheduleTatamiCount?.addEventListener("change", () => {
    localStorage.setItem(scheduleTatamiCountStorageKey, scheduleTatamiCount.value);
    syncScheduleToCloud();
    renderScheduleList();
});
scheduleShuffleButton?.addEventListener("click", shuffleScheduleBoard);
schedulePrintButton?.addEventListener("click", exportScheduleToExcel);
scheduleAutoAssignButton?.addEventListener("click", autoAssignSchedule);
document.querySelectorAll(".schedule-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        activeScheduleTab = tab.dataset.scheduleTab;
        document.querySelectorAll(".schedule-tab").forEach(item => item.classList.toggle("active", item === tab));
        if (scheduleBoardPanel) scheduleBoardPanel.hidden = activeScheduleTab !== "board";
        if (scheduleSettingsPanel) scheduleSettingsPanel.hidden = activeScheduleTab !== "settings";
    });
});
document.querySelectorAll(".schedule-category-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        activeScheduleCategory = tab.dataset.scheduleCategory;
        document.querySelectorAll(".schedule-category-tab").forEach(item => item.classList.toggle("active", item === tab));
        renderScheduleList();
    });
});
scheduleBody?.addEventListener("change", event => {
    const tatamiSelect = event.target.closest("[data-schedule-class]");
    if (!tatamiSelect) return;
    saveScheduleTatamiAssignment(tatamiSelect.dataset.scheduleClass, tatamiSelect.value);
    const row = tatamiSelect.closest("tr");
    const status = row?.querySelector(".schedule-status");
    if (status) status.textContent = formatScheduleValue(tatamiSelect.value);
});

openBracketDisplay?.addEventListener("click", () => {
    const bracketWindow = window.open("template_bagan.html", "_blank", "noopener,noreferrer");
    if (!bracketWindow) {
        window.alert("Tab baru diblokir browser. Izinkan pop-up untuk membuka tampilan bagan.");
    }
});

bracketClassSelect?.addEventListener("change", () => {
    activeBracketClassKey = bracketClassSelect.value;
    renderBracketWorkspace();
});

prepareBracketSlotsButton?.addEventListener("click", prepareBracketSlots);

bracketCategorySelect?.addEventListener("change", () => {
    activeBracketCategory = bracketCategorySelect.value;
    activeBracketClassKey = "";
    if (mixCategorySelect) mixCategorySelect.value = activeBracketCategory;
    renderBracketWorkspace();
});

mixCategorySelect?.addEventListener("change", () => {
    activeBracketCategory = mixCategorySelect.value;
    activeBracketClassKey = "";
    if (bracketCategorySelect) bracketCategorySelect.value = activeBracketCategory;
    renderBracketWorkspace();
});

activeMixList?.addEventListener("click", event => {
    const unmergeButton = event.target.closest("[data-unmerge-mix]");
    if (unmergeButton?.dataset.unmergeMix) cancelBracketMix(unmergeButton.dataset.unmergeMix);
});

bracketMixAgeCategory?.addEventListener("change", () => {
    activeBracketAgeCategory = bracketMixAgeCategory.value;
    renderBracketMixSources();
});

document.querySelectorAll("input[data-bracket-rule]").forEach(input => {
    input.addEventListener("change", () => {
        bracketShuffleRules[input.dataset.bracketRule] = input.checked;
        saveBracketShuffleRules();
    });
});

openBracketRulesButton?.addEventListener("click", () => {
    renderBracketShuffleRules();
    bracketRulesDialog?.showModal();
});

closeBracketRulesButton?.addEventListener("click", () => bracketRulesDialog?.close());
bracketRulesDialog?.addEventListener("click", event => {
    if (event.target === bracketRulesDialog) bracketRulesDialog.close();
});

createBracketMixButton?.addEventListener("click", createBracketMix);
cancelBracketMixButton?.addEventListener("click", cancelBracketMix);

const adminClearSearch = document.getElementById("admin-clear-search");
adminParticipantSearch?.addEventListener("input", event => {
    adminParticipantSearchTerm = normalizeSearchText(event.target.value).replace(/\s+/g, " ").trim();
    if (adminClearSearch) adminClearSearch.hidden = !event.target.value.trim();
    adminCurrentPage = 1;
    renderAdminParticipantList();
});
adminClearSearch?.addEventListener("click", () => {
    if (adminParticipantSearch) {
        adminParticipantSearch.value = "";
        adminParticipantSearchTerm = "";
        adminClearSearch.hidden = true;
        adminCurrentPage = 1;
        renderAdminParticipantList();
        adminParticipantSearch.focus();
    }
});

adminParticipantBody?.addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit-participant]");
    if (editButton?.dataset.editParticipant) {
        openParticipantEdit(editButton.dataset.editParticipant);
        return;
    }
    const deleteButton = event.target.closest("[data-delete-participant]");
    if (deleteButton?.dataset.deleteParticipant) void deleteParticipant(deleteButton.dataset.deleteParticipant);
});

participantEditForm?.addEventListener("submit", event => void saveParticipantEdit(event));
participantEditCancel?.addEventListener("click", () => participantEditDialog?.close());
participantEditDialog?.addEventListener("click", event => {
    if (event.target === participantEditDialog) participantEditDialog.close();
});

document.querySelectorAll("[data-admin-category]").forEach(button => {
    button.addEventListener("click", () => {
        activeAdminCategory = button.dataset.adminCategory;
        adminCurrentPage = 1;
        document.querySelectorAll(".admin-category-tab").forEach(tab => tab.classList.toggle("active", tab === button));
        renderAdminParticipantList();
    });
});

document.querySelectorAll("[data-recap-category]").forEach(button => {
    button.addEventListener("click", () => {
        activeRecapCategory = button.dataset.recapCategory;
        document.querySelectorAll(".recap-category-tab").forEach(tab => tab.classList.toggle("active", tab === button));
        renderClassRecap();
    });
});

document.querySelectorAll("[data-medal-category]").forEach(button => {
    button.addEventListener("click", () => {
        activeMedalCategory = button.dataset.medalCategory;
        document.querySelectorAll(".medal-category-tab").forEach(tab => tab.classList.toggle("active", tab === button));
        renderMedalRecap();
    });
});

document.querySelectorAll("[data-medal-detail]").forEach(button => {
    button.addEventListener("click", () => {
        activeMedalDetail = button.dataset.medalDetail;
        document.querySelectorAll(".medal-detail-tab").forEach(tab => tab.classList.toggle("active", tab === button));
        renderMedalRecap();
    });
});

slowTrackPreviousPage?.addEventListener("click", () => {
    if (slowTrackCurrentPage > 1) {
        slowTrackCurrentPage -= 1;
        renderSlowTrackFormulaPage();
    }
});

slowTrackNextPage?.addEventListener("click", () => {
    if (slowTrackCurrentPage < Math.ceil(99 / slowTrackPageSize)) {
        slowTrackCurrentPage += 1;
        renderSlowTrackFormulaPage();
    }
});

festivalFastTrackToggle?.addEventListener("change", async () => {
    festivalMedalFormat = festivalFastTrackToggle.checked ? "Fast Track" : "Slow Track";
    festivalFastTrackToggle.disabled = true;
    try {
        await set(ref(rtdb, "pengaturan/formatFestival"), festivalMedalFormat);
        renderMedalRecap();
    } catch (error) {
        festivalFastTrackToggle.checked = !festivalFastTrackToggle.checked;
        festivalMedalFormat = festivalFastTrackToggle.checked ? "Fast Track" : "Slow Track";
        console.error("Gagal menyimpan format Festival:", error);
        medalStatus.textContent = "Format Festival gagal disimpan. Periksa koneksi dan Rules Firebase.";
        medalStatus.className = "status-message error";
    } finally {
        festivalFastTrackToggle.disabled = false;
    }
});

adminPreviousPage?.addEventListener("click", () => {
    if (adminCurrentPage > 1) {
        adminCurrentPage -= 1;
        renderAdminParticipantList();
    }
});

adminNextPage?.addEventListener("click", () => {
    const total = getAdminListParticipants().length;
    if (adminCurrentPage < Math.ceil(total / adminPageSize)) {
        adminCurrentPage += 1;
        renderAdminParticipantList();
    }
});

function adjustedParticipantCount(participants, category, settings = {}) {
    if (category !== "Open") return participants.length;

    const teamRows = participants.filter(participant => isTeamClass(participant["KELAS PERTANDINGAN"], settings)).length;
    return participants.length - teamRows + teamRows / 3;
}

function adjustedOpenBreakdown(participants, settings = {}) {
    const teamRows = participants.filter(participant => isTeamClass(participant["KELAS PERTANDINGAN"], settings)).length;
    return { individual: participants.length - teamRows, teams: teamRows / 3 };
}

function updateSettingsView() {
    switchAdminView(currentAdminView);
}

function showAdminPanel(isSuperAdminUser = false) {
    isSuperAdminSession = isSuperAdminUser;
    loginPanel.hidden = true;
    accessPanel.hidden = true;
    adminContent.hidden = false;

    const sidebarRoleBadge = document.getElementById("sidebar-role-badge");
    if (sidebarRoleBadge) {
        sidebarRoleBadge.textContent = isSuperAdminUser ? "Super Admin" : "Admin";
    }

    superAdminOnlyViews.forEach(viewId => {
        const menu = document.querySelector(`.side-menu-item[data-view="${viewId}"]`);
        if (menu) {
            menu.hidden = !isSuperAdminUser;
            menu.setAttribute("aria-hidden", String(!isSuperAdminUser));
        }
    });

    if (!isSuperAdminUser && superAdminOnlyViews.includes(currentAdminView)) {
        switchAdminView("participant-list");
    } else {
        switchAdminView(currentAdminView || "participant-list");
    }
}

function showAccessPanel() {
    loginPanel.hidden = true;
    accessPanel.hidden = false;
    adminContent.hidden = true;
    accessCodeInput.focus();
}

loginForm?.addEventListener("submit", async event => {
    event.preventDefault();

    googleLoginButton.disabled = true;
    setLoginStatus("Mengalihkan ke login Google...");

    try {
        await authPersistenceReady;
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Login admin gagal:", error);
        if (error.code === "auth/popup-blocked" || error.code === "auth/popup-cancelled-by-user" || error.code === "auth/popup-closed-by-user") {
            try {
                const provider = new GoogleAuthProvider();
                provider.setCustomParameters({ prompt: "select_account" });
                setLoginStatus("Popup diblokir, mengalihkan ke Google...");
                await signInWithRedirect(auth, provider);
                return;
            } catch (redirectError) {
                console.error("Fallback redirect login gagal:", redirectError);
                setLoginStatus(`Login Google gagal (${redirectError.code || "unknown"}). ${getAuthErrorMessage(redirectError)}`, "error");
            }
        } else {
            setLoginStatus(`Login Google gagal (${error.code || "unknown"}). ${getAuthErrorMessage(error)}`, "error");
        }
    } finally {
        googleLoginButton.disabled = false;
    }
});

function getAuthErrorMessage(error) {
    if (error.code === "auth/unauthorized-domain") {
        return "Tambahkan domain aplikasi pada Authentication > Settings > Authorized domains.";
    }
    if (error.code === "auth/operation-not-allowed") {
        return "Provider Google belum aktif pada project Firebase ini.";
    }
    return error.message || "Periksa konfigurasi Firebase Authentication.";
}

authPersistenceReady.then(() => getRedirectResult(auth)).catch(error => {
    console.error("Hasil redirect login gagal:", error);
    setLoginStatus(`Login Google gagal (${error.code || "unknown"}). ${getAuthErrorMessage(error)}`, "error");
});

logoutButton?.addEventListener("click", () => {
    sessionStorage.removeItem("kensho_admin_access");
    void signOut(auth);
});

accessForm?.addEventListener("submit", event => {
    void (async () => {
        event.preventDefault();
        accessButton.disabled = true;

        try {
            const codeHash = await hashAccessCode(accessCodeInput.value);
            const codeSnapshot = await get(ref(rtdb, `kodeAkses/${codeHash}`));
            if (!codeSnapshot.exists() || codeSnapshot.val().active !== true) {
                accessCodeInput.value = "";
                setAccessStatus("Kode akses tidak valid atau sudah dicabut.", "error");
                accessButton.disabled = false;
                return;
            }
            const role = codeSnapshot.val().role || "admin";
            await authPersistenceReady;
            sessionStorage.setItem("kensho_admin_access", role === "superadmin" ? "superadmin" : "granted");
            await signInAnonymously(auth);
            setAccessStatus("Kode benar. Membuka sesi admin...", "success");
        } catch (error) {
            console.error("Sesi admin anonim gagal:", error);
            setAccessStatus(`Sesi Firebase gagal (${error.code || "unknown"}). Aktifkan Anonymous pada Firebase Authentication.`, "error");
        }

        accessButton.disabled = false;
    })();
});

accessCodeForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const code = newAccessCode.value.trim();
    const label = newAccessLabel.value.trim();
    const submitButton = accessCodeForm.querySelector("button");

    if (code.length < 4) {
        setAccessCodeStatus("Kode minimal 4 karakter.", "error");
        return;
    }

    submitButton.disabled = true;
    setAccessCodeStatus("Membuat kode akses...");
    try {
        const codeHash = await hashAccessCode(code);
        const role = newAccessRole ? newAccessRole.value : "admin";
        await set(ref(rtdb, `kodeAkses/${codeHash}`), {
            label: label || "Kode admin",
            role: role,
            active: true,
            createdAt: new Date().toISOString()
        });
        accessCodeForm.reset();
        setAccessCodeStatus("Kode akses berhasil dibuat.", "success");
        await loadAccessCodes();
    } catch (error) {
        console.error("Gagal membuat kode akses:", error);
        setAccessCodeStatus("Gagal membuat kode. Pastikan Anda login sebagai Super Admin.", "error");
    } finally {
        submitButton.disabled = false;
    }
});

onAuthStateChanged(auth, user => {
    void (async () => {
        const isAuthenticated = Boolean(user);
        logoutButton.hidden = !isAuthenticated;
        userStatus.hidden = !isAuthenticated;
        userStatus.textContent = isAuthenticated ? user.email : "";

        if (!isAuthenticated) {
            loginPanel.hidden = false;
            accessPanel.hidden = false;
            adminContent.hidden = true;
            setLoginStatus("Super Admin masuk dengan Google. Admin biasa gunakan kode akses.");
            return;
        }

        try {
            if (user.isAnonymous) {
                const adminAccess = sessionStorage.getItem("kensho_admin_access");
                if (adminAccess === "granted" || adminAccess === "superadmin") {
                    const isSuper = adminAccess === "superadmin";
                    await saveUserProfile(user, isSuper);
                    showAdminPanel(isSuper);
                    await loadSlowTrackFormulaSettings();
                    await loadClassTypeSettings();
                    await loadParticipantSummary();
                    await loadScheduleFromCloud();
                    
                    if (isSuper) {
                        await loadAccessCodes();
                        await loadChampionshipName();
                    }

                    setAccessStatus(isSuper ? "Login Super Admin berhasil." : "Login Admin berhasil.", "success");
                } else {
                    await signOut(auth);
                }
                return;
            }

            const isSuperAdminUser = await ensureSuperAdmin(user);
            await saveUserProfile(user, isSuperAdminUser);

            if (isSuperAdminUser) {
                setLoginStatus("Login berhasil sebagai Super Admin.", "success");
                showAdminPanel(true);
                await loadSlowTrackFormulaSettings();
                await loadClassTypeSettings();
                await loadParticipantSummary();
                await loadScheduleFromCloud();
                await loadAccessCodes();
                await loadChampionshipName();
            } else {
                loginPanel.hidden = false;
                accessPanel.hidden = false;
                adminContent.hidden = true;
                setLoginStatus("Akun Google ini bukan Super Admin. Gunakan login kode akses untuk Admin.", "error");
            }
        } catch (error) {
            console.error("Gagal memeriksa role Super Admin:", error);
            loginPanel.hidden = false;
            accessPanel.hidden = true;
            adminContent.hidden = true;
            setLoginStatus(`Login berhasil, tetapi role belum dapat diverifikasi (${error.code || "permission-denied"}). Periksa RTDB Rules.`, "error");
        }
    })();
});

championshipForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const championshipName = championshipNameInput.value.trim();
    if (!championshipName) {
        setChampionshipStatus("Nama kejuaraan wajib diisi.", "error");
        return;
    }

    const saveButton = championshipForm.querySelector("button");
    saveButton.disabled = true;
    setChampionshipStatus("Menyimpan nama dan nominal pendaftaran...");

    try {
        feeSettings = {
            openIndividual: Number(feeOpenIndividual.value) || 0,
            openTeam: Number(feeOpenTeam.value) || 0,
            festival: Number(feeFestival.value) || 0,
            contingent: Number(feeContingent.value) || 0,
            cashback: Number(feeCashback.value) || 0
        };
        await update(ref(rtdb, "pengaturan"), {
            namaKejuaraan: championshipName,
            biaya: feeSettings,
            diperbaruiPada: new Date().toISOString()
        });
        championshipTitle.textContent = championshipName;
        currentChampionshipName = championshipName;
        document.title = `${championshipName} | Panel Admin`;
        renderPaymentList();
        setChampionshipStatus("Nama kejuaraan dan nominal pendaftaran berhasil disimpan.", "success");
    } catch (error) {
        console.error("Gagal menyimpan nama kejuaraan:", error);
        setChampionshipStatus("Gagal menyimpan. Periksa RTDB Rules.", "error");
    } finally {
        saveButton.disabled = false;
    }
});

async function loadClassTypeSettings() {
    const snapshot = await get(ref(rtdb, "pengaturan/jenisKelas"));
    classTypeSettings = snapshot.val() || {};
    renderClassTypeList();
}

function renderClassTypeList() {
    classTypeList.innerHTML = "";
    const classNames = [...new Set(adminParticipants
        .map(participant => normalizeClassName(participant["KELAS PERTANDINGAN"]))
        .filter(Boolean))]
        .sort((first, second) => first.localeCompare(second, "id", { sensitivity: "base" }));

    if (!classNames.length) {
        classTypeList.textContent = "Belum ada kelas dari data peserta.";
        return;
    }

    classNames.forEach(className => {
        const type = resolveClassType(className, classTypeSettings);
        const item = document.createElement("div");
        item.className = "class-type-item";
        const details = document.createElement("div");
        const label = document.createElement("strong");
        label.textContent = className;
        const participantCount = adminParticipants.filter(participant => normalizeClassName(participant["KELAS PERTANDINGAN"]) === className).length;
        const count = document.createElement("small");
        count.textContent = `${participantCount.toLocaleString("id-ID")} peserta`;
        details.appendChild(label);
        details.appendChild(count);

        const switchLabel = document.createElement("label");
        switchLabel.className = "class-type-switch";
        switchLabel.title = "Ubah jenis kelas";
        const switchInput = document.createElement("input");
        switchInput.type = "checkbox";
        switchInput.checked = type === "Beregu";
        const switchTrack = document.createElement("span");
        switchTrack.className = "switch-track";
        const switchText = document.createElement("span");
        switchText.className = "switch-text";
        switchText.textContent = type;
        switchInput.addEventListener("change", async () => {
            switchInput.disabled = true;
            const nextType = switchInput.checked ? "Beregu" : "Perorangan";
            const nextTypes = { ...classTypeSettings, [className]: nextType };
            try {
                await set(ref(rtdb, "pengaturan/jenisKelas"), nextTypes);
                classTypeSettings = nextTypes;
                switchText.textContent = nextType;
                renderClassRecap();
                renderMedalRecap();
                updateAdminSummary();
                renderAdminParticipantList();
                classTypeStatus.textContent = `Kelas "${className}" disimpan sebagai ${nextType}.`;
                classTypeStatus.className = "status-message success";
            } catch (error) {
                switchInput.checked = !switchInput.checked;
                classTypeStatus.textContent = "Gagal menyimpan jenis kelas. Periksa koneksi dan Rules Firebase.";
                classTypeStatus.className = "status-message error";
            } finally {
                switchInput.disabled = false;
            }
        });

        switchLabel.append(switchInput, switchTrack, switchText);
        item.append(details, switchLabel);
        classTypeList.appendChild(item);
    });
}

function updateAdminSummary() {
    const festivalParticipants = adminParticipants.filter(participant => participant.kategori === "Festival");
    const openParticipants = adminParticipants.filter(participant => participant.kategori === "Open");
    const festivalTotal = adjustedParticipantCount(festivalParticipants, "Festival", classTypeSettings);
    const openTotal = adjustedParticipantCount(openParticipants, "Open", classTypeSettings);
    const openBreakdownCount = adjustedOpenBreakdown(openParticipants, classTypeSettings);
    adminTotalCount.textContent = (festivalTotal + openTotal).toLocaleString("id-ID");
    adminOpenCount.textContent = openTotal.toLocaleString("id-ID");
    adminOpenIndividualCount.textContent = openBreakdownCount.individual.toLocaleString("id-ID");
    adminOpenTeamCount.textContent = openBreakdownCount.teams.toLocaleString("id-ID");
    adminFestivalCount.textContent = festivalTotal.toLocaleString("id-ID");
}

function loadFeeInputs() {
    feeOpenIndividual.value = feeSettings.openIndividual || 0;
    feeOpenTeam.value = feeSettings.openTeam || 0;
    feeFestival.value = feeSettings.festival || 0;
    feeContingent.value = feeSettings.contingent || 0;
    feeCashback.value = feeSettings.cashback || 0;
}

function getContingentKey(value) {
    return String(value || "Tanpa kontingen").trim() || "Tanpa kontingen";
}

function getPaymentGroups() {
    const groups = new Map();
    adminParticipants.forEach(participant => {
        const contingent = getContingentKey(participant.KONTINGEN);
        if (!groups.has(contingent)) groups.set(contingent, { participants: [], teamKeys: new Set() });
        const group = groups.get(contingent);
        group.participants.push(participant);
        if (participant.kategori === "Open" && isTeamClass(participant["KELAS PERTANDINGAN"], classTypeSettings)) {
            group.teamKeys.add(`${normalizeClassName(participant["KELAS PERTANDINGAN"]).toLowerCase()}::${contingent.toLowerCase()}`);
        }
    });
    return groups;
}

function calculateContingentBill(group) {
    const breakdown = getContingentPaymentBreakdown(group);
    let total = Number(feeSettings.contingent) || 0;
    total += breakdown.openIndividual * (Number(feeSettings.openIndividual) || 0);
    total += breakdown.openTeam * (Number(feeSettings.openTeam) || 0);
    total += breakdown.festival * (Number(feeSettings.festival) || 0);
    total -= breakdown.totalUnits * (Number(feeSettings.cashback) || 0);
    return Math.max(0, total);
}

function getContingentPaymentBreakdown(group) {
    const openIndividual = group.participants.filter(participant =>
        participant.kategori === "Open" && !isTeamClass(participant["KELAS PERTANDINGAN"], classTypeSettings)
    ).length;
    const festival = group.participants.filter(participant => participant.kategori === "Festival").length;
    const openTeam = group.teamKeys.size;
    return { openIndividual, openTeam, festival, totalUnits: openIndividual + openTeam + festival };
}

function renderPaymentList() {
    if (!paymentBody) return;
    paymentBody.innerHTML = "";
    const groups = [...getPaymentGroups().entries()].sort((first, second) => first[0].localeCompare(second[0], "id", { sensitivity: "base" }));
    if (!groups.length) {
        paymentBody.innerHTML = '<tr><td colspan="7" class="empty-state">Belum ada data kontingen.</td></tr>';
        return;
    }

    groups.forEach(([contingent, group], index) => {
        const key = safeClassKey(contingent);
        const record = paymentSettings[key] || {};
        const breakdown = getContingentPaymentBreakdown(group);
        const totalParticipants = breakdown.totalUnits;
        const paidParticipants = Math.min(totalParticipants, Math.max(0, Number(record.paidParticipants) || 0));
        const additionalFee = Math.max(0, Number(record.additionalFee) || 0);
        const totalBill = calculateContingentBill(group) + additionalFee;
        const status = paidParticipants === 0 ? "Belum Bayar" : paidParticipants >= totalParticipants ? "Lunas" : "Bayar Sebagian";
        const row = document.createElement("tr");
        const paidInput = document.createElement("input");
        paidInput.className = "payment-paid-input";
        paidInput.type = "number";
        paidInput.min = "0";
        paidInput.max = String(totalParticipants);
        paidInput.value = paidParticipants;
        paidInput.title = `Maksimal ${totalParticipants} peserta`;
        const saveButton = document.createElement("button");
        saveButton.className = "button secondary-button";
        saveButton.type = "button";
        saveButton.textContent = "Simpan";
        saveButton.addEventListener("click", async () => {
            const nextPaid = Math.min(totalParticipants, Math.max(0, Number(paidInput.value) || 0));
            saveButton.disabled = true;
            try {
                paymentSettings = { ...paymentSettings, [key]: { ...record, paidParticipants: nextPaid, updatedAt: new Date().toISOString(), contingent } };
                await set(ref(rtdb, `pembayaran/${key}`), paymentSettings[key]);
                renderPaymentList();
            } catch (error) {
                console.error("Gagal menyimpan pembayaran:", error);
                paymentStatus.textContent = "Pembayaran gagal disimpan. Periksa koneksi dan Rules Firebase.";
                paymentStatus.className = "status-message error";
            } finally {
                saveButton.disabled = false;
            }
        });
        const invoiceButton = document.createElement("button");
        invoiceButton.className = "button secondary-button invoice-button";
        invoiceButton.type = "button";
        invoiceButton.textContent = "Lihat Invoice";
        invoiceButton.addEventListener("click", () => openInvoice(contingent, group, paidParticipants, totalBill, status, key, additionalFee, record.additionalFeeNote || "", record.note || ""));
        const actionCell = document.createElement("td");
        actionCell.className = "payment-actions";
        actionCell.append(saveButton, invoiceButton);
        [index + 1, contingent, totalParticipants, paidInput, `Rp ${totalBill.toLocaleString("id-ID")}`, status, actionCell].forEach(value => {
            const cell = document.createElement("td");
            if (value instanceof HTMLElement) cell.appendChild(value);
            else cell.textContent = value;
            row.appendChild(cell);
        });
        paymentBody.appendChild(row);
    });
    paymentStatus.textContent = "Bayar Sebagian berarti baru sebagian peserta kontingen yang sudah dibayar; peserta tambahan tetap masuk ke sisa pembayaran.";
    paymentStatus.className = "status-message";
}

function openInvoice(contingent, group, paidParticipants, totalBill, status, paymentKey, additionalFee, additionalFeeNote, note) {
    activeInvoice = { contingent, group, paidParticipants, totalBill, status, paymentKey, additionalFee, additionalFeeNote, note };
    invoiceExtraFee.value = additionalFee || 0;
    invoiceExtraFeeNote.value = additionalFeeNote || "";
    invoiceNote.value = note || "";
    renderInvoice();
    invoiceDialog.showModal();
}

function renderInvoice() {
    const { contingent, group, paidParticipants, totalBill, status, additionalFee, additionalFeeNote, note } = activeInvoice;
    const breakdown = getContingentPaymentBreakdown(group);
    const openIndividual = breakdown.openIndividual;
    const festival = breakdown.festival;
    const openTeam = breakdown.openTeam;
    const paidAmount = totalBill && breakdown.totalUnits ? Math.round(totalBill * paidParticipants / breakdown.totalUnits) : 0;
    const remainingAmount = Math.max(0, totalBill - paidAmount);
    const rows = [
        ["Open Perorangan", openIndividual, feeSettings.openIndividual],
        ["Open Beregu", openTeam, feeSettings.openTeam],
        ["Festival Perorangan", festival, feeSettings.festival],
        ["Biaya Kontingen", 1, feeSettings.contingent],
        ["Cashback", breakdown.totalUnits, -(Number(feeSettings.cashback) || 0)]
    ];
    if (additionalFee > 0) rows.push([additionalFeeNote ? `Biaya Tambahan - ${escapeHtml(additionalFeeNote)}` : "Biaya Tambahan", 1, additionalFee]);

    invoiceTitle.textContent = `Invoice - ${contingent}`;
    invoiceContent.innerHTML = `
        <div class="invoice-event-header">
            <p class="eyebrow">${escapeHtml(currentChampionshipName)}</p>
            <h3>INVOICE PENDAFTARAN</h3>
        </div>
        <div class="invoice-meta"><span>Kontingen</span><strong>${escapeHtml(contingent)}</strong></div>
        <div class="invoice-meta"><span>Status</span><strong>${status}</strong></div>
        ${note ? `<div class="invoice-note"><span>Catatan</span><p>${escapeHtml(note)}</p></div>` : ""}
        <table class="invoice-table"><thead><tr><th>Item</th><th>Jumlah</th><th>Tarif</th><th>Subtotal</th></tr></thead><tbody>
            ${rows.map(([label, quantity, rate]) => `<tr><td>${escapeHtml(label)}</td><td>${quantity}</td><td>Rp ${(Number(rate) || 0).toLocaleString("id-ID")}</td><td>Rp ${(quantity * (Number(rate) || 0)).toLocaleString("id-ID")}</td></tr>`).join("")}
        </tbody></table>
        <div class="invoice-total"><span>Total Tagihan</span><strong>Rp ${totalBill.toLocaleString("id-ID")}</strong></div>
        <div class="invoice-total"><span>Sudah Dibayar (${paidParticipants} pendaftaran)</span><strong>Rp ${paidAmount.toLocaleString("id-ID")}</strong></div>
        <div class="invoice-total invoice-remaining"><span>Sisa Pembayaran</span><strong>Rp ${remainingAmount.toLocaleString("id-ID")}</strong></div>
    `;
}

invoiceSaveAdjustments?.addEventListener("click", async () => {
    if (!activeInvoice) return;
    const additionalFee = Math.max(0, Number(invoiceExtraFee.value) || 0);
    const additionalFeeNote = invoiceExtraFeeNote.value.trim();
    const note = invoiceNote.value.trim();
    const { paymentKey, contingent } = activeInvoice;
    invoiceSaveAdjustments.disabled = true;
    try {
        const nextRecord = {
            ...(paymentSettings[paymentKey] || {}),
            additionalFee,
            additionalFeeNote,
            note,
            contingent,
            updatedAt: new Date().toISOString()
        };
        await set(ref(rtdb, `pembayaran/${paymentKey}`), nextRecord);
        paymentSettings = { ...paymentSettings, [paymentKey]: nextRecord };
        activeInvoice.additionalFee = additionalFee;
        activeInvoice.additionalFeeNote = additionalFeeNote;
        activeInvoice.note = note;
        activeInvoice.totalBill = calculateContingentBill(activeInvoice.group) + additionalFee;
        renderPaymentList();
        renderInvoice();
    } catch (error) {
        console.error("Gagal menyimpan catatan dan biaya tambahan:", error);
        paymentStatus.textContent = "Catatan dan biaya tambahan gagal disimpan. Periksa koneksi dan Rules Firebase.";
        paymentStatus.className = "status-message error";
    } finally {
        invoiceSaveAdjustments.disabled = false;
    }
});

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

invoiceClose?.addEventListener("click", () => invoiceDialog?.close());
invoiceDialog?.addEventListener("click", event => {
    if (event.target === invoiceDialog) invoiceDialog.close();
});
invoicePrint?.addEventListener("click", () => window.print());
invoicePrintThermal?.addEventListener("click", () => {
    const thermalWindow = window.open("", "_blank", "width=420,height=700");
    if (!thermalWindow) {
        window.alert("Jendela cetak diblokir browser. Izinkan pop-up untuk mencetak Thermal 80mm.");
        return;
    }

    thermalWindow.document.write(`<!doctype html>
        <html><head><title>${escapeHtml(currentChampionshipName)} - Invoice</title>
        <style>
            @page { size: 80mm auto; margin: 0; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            html, body { width: 80mm; margin: 0; padding: 0; background: #fff; color: #000; font-family: Arial, Helvetica, sans-serif; }
            body { padding: 4mm 3mm; font-size: 12px; font-weight: 600; }
            .invoice-event-header { margin-bottom: 10px; padding-bottom: 9px; border-bottom: 2px solid #000; text-align: center; }
            .invoice-event-header p { margin: 0 0 6px; font-size: 10px; line-height: 1.35; font-weight: 800; }
            .invoice-event-header h3 { margin: 0; font-size: 16px; font-weight: 800; }
            .invoice-meta, .invoice-total { display: flex; justify-content: space-between; gap: 8px; padding: 7px 0; border-bottom: 1px solid #777; }
            .invoice-meta strong, .invoice-total strong { text-align: right; font-weight: 800; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 11px 0; }
            th, td { padding: 7px 3px; border-bottom: 1px solid #777; font-size: 11px; line-height: 1.3; font-weight: 600; text-align: left; overflow-wrap: anywhere; }
            th { background: #fff; color: #000; font-size: 10px; font-weight: 600; }
            th:nth-child(1), td:nth-child(1) { width: 36%; }
            th:nth-child(2), td:nth-child(2) { width: 13%; }
            th:nth-child(3), td:nth-child(3), th:nth-child(4), td:nth-child(4) { width: 25.5%; }
            .invoice-remaining { color: #000; font-weight: 800; }
        </style></head><body>${invoiceContent.innerHTML}</body></html>`);
    thermalWindow.document.close();
    thermalWindow.focus();
    thermalWindow.addEventListener("afterprint", () => thermalWindow.close(), { once: true });
    thermalWindow.addEventListener("load", () => {
        thermalWindow.setTimeout(() => thermalWindow.print(), 1200);
    }, { once: true });
    thermalWindow.setTimeout(() => {
        if (!thermalWindow.closed) thermalWindow.print();
    }, 1800);
});

function setStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`.trim();
}

function normalizeValue(value) {
    return value === undefined || value === null ? "" : String(value).trim();
}

function getCollectionName(sheetName) {
    return `peserta_${sheetName.replace(/\s+/g, "_").toLowerCase()}`;
}

function getParticipantImportKey(participant, category) {
    return [
        category,
        participant["NAMA LENGKAP"],
        participant["KELAS PERTANDINGAN"],
        participant.KONTINGEN
    ].map(value => normalizeValue(value).replace(/\s+/g, " ").toLocaleLowerCase("id-ID")).join("|");
}

fileInput?.addEventListener("change", async event => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    setStatus(`Membaca ${files.length} file Excel...`);
    try {
        workbooks = await Promise.all(files.map(readWorkbook));
        availableSheetNames = targetSheets.filter(targetSheet =>
            workbooks.some(currentWorkbook => currentWorkbook.SheetNames.some(sheetName =>
                sheetName.trim().toUpperCase() === targetSheet
            ))
        );

        sheetSelector.innerHTML = "";
        availableSheetNames.forEach(sheetName => {
            const option = document.createElement("option");
            option.value = sheetName;
            option.textContent = sheetName;
            sheetSelector.appendChild(option);
        });

        if (!availableSheetNames.length) {
            sheetSelectorContainer.hidden = true;
            setStatus("Sheet FESTIVAL atau OPEN tidak ditemukan.", "error");
            return;
        }

        sheetSelectorContainer.hidden = false;
        loadSheetData(availableSheetNames[0]);
        await updateImportPreviewStatus(availableSheetNames[0]);
    } catch (error) {
        console.error("Gagal membaca file Excel:", error);
        workbooks = [];
        setStatus("Salah satu file Excel tidak dapat dibaca.", "error");
    }
});

function readWorkbook(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => {
            try {
                resolve(XLSX.read(new Uint8Array(event.target.result), { type: "array" }));
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

sheetSelector?.addEventListener("change", async event => {
    loadSheetData(event.target.value);
    await updateImportPreviewStatus(event.target.value);
});

function loadSheetData(sheetName) {
    currentSheetName = sheetName;
    currentExcelData = parseSheetData(sheetName);

    categoryLabel.textContent = sheetName;
    renderPreview();
    setStatus(`${currentExcelData.length.toLocaleString("id-ID")} peserta pada pratinjau ${sheetName}. Menghitung data baru...`, currentExcelData.length ? "success" : "empty");
}

async function updateImportPreviewStatus(sheetName) {
    if (!currentExcelData.length) return;

    try {
        const existingSnapshot = await get(ref(rtdb, "peserta"));
        const existingParticipants = existingSnapshot.val() || {};
        const existingKeys = new Set(Object.values(existingParticipants).map(participant =>
            getParticipantImportKey(participant, participant.kategori || "Festival")
        ));
        let selectedSheetNewCount = 0;
        let selectedSheetExistingCount = 0;
        let totalNewCount = 0;
        let totalExistingCount = 0;

        for (const currentSheet of availableSheetNames) {
            const category = currentSheet.toUpperCase() === "OPEN" ? "Open" : "Festival";
            parseSheetData(currentSheet).forEach(row => {
                const importKey = getParticipantImportKey(row, category);
                if (existingKeys.has(importKey)) {
                    totalExistingCount += 1;
                    if (currentSheet === sheetName) selectedSheetExistingCount += 1;
                    return;
                }

                existingKeys.add(importKey);
                totalNewCount += 1;
                if (currentSheet === sheetName) selectedSheetNewCount += 1;
            });
        }

        setStatus(
            `Pratinjau ${sheetName}: ${currentExcelData.length.toLocaleString("id-ID")} peserta; ` +
            `${selectedSheetNewCount.toLocaleString("id-ID")} data baru, ` +
            `${selectedSheetExistingCount.toLocaleString("id-ID")} sudah ada. ` +
            `Semua sheet: ${totalNewCount.toLocaleString("id-ID")} baru, ` +
            `${totalExistingCount.toLocaleString("id-ID")} sudah ada.`,
            currentExcelData.length ? "success" : "empty"
        );
    } catch (error) {
        console.error("Gagal menghitung data import:", error);
        setStatus(`${currentExcelData.length.toLocaleString("id-ID")} peserta pada pratinjau ${sheetName}. Jumlah data baru belum dapat dihitung.`, "error");
    }
}

function parseSheetData(sheetName) {
    return workbooks.flatMap(workbook => {
        const actualSheetName = workbook.SheetNames.find(currentSheetName =>
            currentSheetName.trim().toUpperCase() === sheetName.toUpperCase()
        );
        if (!actualSheetName) return [];

        // Baris 14 Excel adalah header, sehingga indeks awal SheetJS adalah 13.
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[actualSheetName], { defval: "", range: 13 });
        return rawData
            .filter(row => normalizeValue(row["NAMA LENGKAP"]) && normalizeValue(row["NAMA LENGKAP"]) !== "( HURUF BALOK )")
            .map(row => Object.fromEntries(selectedColumns.map(column => [column, normalizeValue(row[column])])))
            .filter(row => Object.values(row).some(Boolean));
    }).sort((first, second) =>
        String(first["NAMA LENGKAP"] || "").localeCompare(
            String(second["NAMA LENGKAP"] || ""),
            "id",
            { sensitivity: "base" }
        )
    );
}

function renderPreview() {
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";
    selectedColumns.forEach(column => {
        const cell = document.createElement("th");
        cell.textContent = column;
        tableHead.appendChild(cell);
    });

    if (!currentExcelData.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = selectedColumns.length;
        cell.className = "empty-state";
        cell.textContent = "Tidak ada data valid pada sheet ini.";
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    currentExcelData.forEach(data => {
        const row = document.createElement("tr");
        selectedColumns.forEach(column => {
            const cell = document.createElement("td");
            cell.textContent = data[column] || "-";
            row.appendChild(cell);
        });
        tableBody.appendChild(row);
    });
}

saveButton?.addEventListener("click", async () => {
    if (!availableSheetNames.length || !workbooks.length) {
        setStatus("Belum ada file Excel yang valid.", "error");
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Menyimpan semua...";
    setStatus(`Memproses ${availableSheetNames.join(" dan ")}...`);

    try {
        const unifiedReference = ref(rtdb, "peserta");
        const existingUnifiedSnapshot = await get(unifiedReference);
        const existingParticipants = existingUnifiedSnapshot.val() || {};
        const incomingSheetData = availableSheetNames
            .map(sheetName => ({ sheetName, data: parseSheetData(sheetName) }))
            .filter(sheet => sheet.data.length);
        const existingKeys = new Set(Object.values(existingParticipants).map(participant =>
            getParticipantImportKey(participant, participant.kategori || "Festival")
        ));
        const savedSheets = [];
        const skippedSheets = [];
        let totalSaved = 0;
        let totalSkipped = 0;
        const newParticipants = {};

        for (const sheet of incomingSheetData) {
            const sheetName = sheet.sheetName;
            const category = sheetName.toUpperCase() === "OPEN" ? "Open" : "Festival";
            let savedCount = 0;
            let skippedCount = 0;

            sheet.data.forEach(row => {
                const importKey = getParticipantImportKey(row, category);
                if (existingKeys.has(importKey)) {
                    skippedCount += 1;
                    return;
                }

                const participantReference = push(unifiedReference);
                newParticipants[participantReference.key] = {
                    ...row,
                    kategori: category
                };
                existingKeys.add(importKey);
                savedCount += 1;
            });
            if (savedCount) savedSheets.push(`${sheetName}: ${savedCount.toLocaleString("id-ID")}`);
            if (skippedCount) skippedSheets.push(`${sheetName}: ${skippedCount.toLocaleString("id-ID")} sudah ada`);
            totalSaved += savedCount;
            totalSkipped += skippedCount;
        }

        if (totalSaved) {
            await update(unifiedReference, newParticipants);
        }
        const nextParticipants = { ...existingParticipants, ...newParticipants };
        const newVersion = Date.now();
        try {
            await set(ref(rtdb, "versiPeserta"), newVersion);
            sessionStorage.setItem(adminVersionKey, String(newVersion));
            sessionStorage.setItem(adminCacheKey, JSON.stringify(nextParticipants));
        } catch (versionError) {
            console.warn("Gagal memperbarui versiPeserta:", versionError);
        }

        if (!totalSaved && !totalSkipped) {
            setStatus("Tidak ada nama peserta valid pada sheet FESTIVAL atau OPEN.", "empty");
        } else {
            const savedMessage = totalSaved ? `tersimpan ${totalSaved.toLocaleString("id-ID")} peserta` : "tidak ada data baru";
            const skippedMessage = totalSkipped ? `; dilewati ${totalSkipped.toLocaleString("id-ID")} data yang sudah ada` : "";
            setStatus(`Import selesai: ${savedMessage}${skippedMessage}.`, "success");
            await loadParticipantSummary(true);
        }
    } catch (error) {
        console.error("Gagal menyimpan ke RTDB:", error);
        setStatus("Gagal menyimpan. Periksa RTDB Rules dan koneksi Firebase.", "error");
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Simpan Semua ke RTDB";
    }
});

window.deleteContingent = async (contingentName) => {
    if (!contingentName) return;
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data pendaftaran dan kontingen "${contingentName}"?\nTindakan ini tidak bisa dibatalkan.`)) return;
    
    try {
        const pToDelete = adminParticipants.filter(p => {
            let cName = (p.KONTINGEN || p["KONTINGEN / NAMA TEAM"] || "").trim().toUpperCase();
            if (!cName || cName === "-") cName = "TANPA KONTINGEN";
            return cName === contingentName;
        });
        if (pToDelete.length === 0) return alert("Data peserta dari kontingen ini tidak ditemukan.");
        
        const promises = pToDelete.map(p => remove(ref(rtdb, `peserta/${p.id}`)));
        await Promise.all(promises);
        
        const newVersion = Date.now();
        await set(ref(rtdb, "versiPeserta"), newVersion);
        sessionStorage.setItem(adminVersionKey, String(newVersion));
        
        setStatus(`Berhasil menghapus ${pToDelete.length} data peserta dari kontingen ${contingentName}.`, "success");
        await loadParticipantSummary(true);
    } catch(err) {
        console.error("Gagal menghapus kontingen:", err);
        setStatus("Gagal menghapus kontingen. Periksa koneksi dan izin Firebase.", "error");
    }
};

window.renderContingentList = () => {
    if (!adminContingentBody) return;
    
    const contingentMap = {};
    let totalContingents = 0;
    
    adminParticipants.forEach(p => {
        let cName = (p.KONTINGEN || p["KONTINGEN / NAMA TEAM"] || "").trim().toUpperCase();
        if (!cName || cName === "-") cName = "TANPA KONTINGEN";
        
        if (!contingentMap[cName]) {
            contingentMap[cName] = 0;
            totalContingents++;
        }
        contingentMap[cName]++;
    });
    
    if (contingentListBadge) {
        contingentListBadge.textContent = `${totalContingents} Kontingen`;
    }
    
    const searchQuery = (adminContingentSearch?.value || "").trim().toUpperCase();
    const sortedContingents = Object.keys(contingentMap)
        .filter(c => !searchQuery || c.includes(searchQuery))
        .sort();
    
    adminContingentBody.innerHTML = "";
    
    if (sortedContingents.length === 0) {
        adminContingentBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem;">Belum ada data kontingen</td></tr>`;
        return;
    }
    
    sortedContingents.forEach((cName, idx) => {
        const tr = document.createElement("tr");
        
        const tdNo = document.createElement("td");
        tdNo.style.textAlign = "center";
        tdNo.textContent = idx + 1;
        
        const tdName = document.createElement("td");
        tdName.style.fontWeight = "600";
        tdName.textContent = cName;
        
        const tdCount = document.createElement("td");
        tdCount.style.textAlign = "center";
        tdCount.innerHTML = `<span style="background: var(--surface-200); padding: 4px 10px; border-radius: 99px; font-weight: 600; font-size: 13px;">${contingentMap[cName]}</span>`;
        
        const tdAction = document.createElement("td");
        tdAction.style.textAlign = "center";
        
        const actionGroup = document.createElement("div");
        actionGroup.className = "action-btn-group";
        
        const btnDelete = document.createElement("button");
        btnDelete.type = "button";
        btnDelete.className = "action-icon-btn delete-icon-btn";
        btnDelete.title = "Hapus Kontingen";
        btnDelete.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
        btnDelete.onclick = () => window.deleteContingent(cName);
        
        actionGroup.appendChild(btnDelete);
        tdAction.appendChild(actionGroup);
        
        tr.appendChild(tdNo);
        tr.appendChild(tdName);
        tr.appendChild(tdCount);
        tr.appendChild(tdAction);
        
        adminContingentBody.appendChild(tr);
    });
};

async function exportScheduleToExcel() {
    if (typeof ExcelJS === 'undefined') {
        alert("Library ExcelJS tidak ditemukan. Harap muat ulang halaman.");
        return;
    }

    const tatamiCount = Number(scheduleTatamiCount?.value || 1);
    const daySettings = getScheduleDaySettings();
    const orders = loadScheduleOrders();
    const assignments = loadScheduleTatamiAssignments();
    
    const classesMap = new Map();
    adminParticipants.forEach(participant => {
        const category = normalizeParticipantCategory(participant.kategori);
        const className = normalizeClassName(participant["KELAS PERTANDINGAN"]);
        const key = `${category}::${className}`;
        if (!classesMap.has(key)) classesMap.set(key, { category, className, count: 0, isTeam: isTeamClass(className, classTypeSettings) });
        classesMap.get(key).count += 1;
    });
    classesMap.forEach(item => {
        if (item.isTeam) item.count = Math.ceil(item.count / 3);
    });
    
    const validClasses = [...classesMap.values()].filter(item => !(item.category === "Open" && item.count <= 1));
    
    const boardData = daySettings.map(d => ({
        day: d.day,
        tatamis: Array.from({ length: tatamiCount }, (_, index) => ({ number: index + 1, classes: [] }))
    }));

    validClasses.forEach(item => {
        const savedValueRaw = String(assignments[`${item.category}::${item.className}`] || "");
        const savedValue = /^\d+$/.test(savedValueRaw) ? `D1-T${savedValueRaw}` : savedValueRaw;
        const m = savedValue.match(/^D(\d+)-T(\d+)$/);
        if (m) {
            const dIdx = parseInt(m[1]) - 1;
            const tIdx = parseInt(m[2]) - 1;
            if (boardData[dIdx] && boardData[dIdx].tatamis[tIdx]) {
                boardData[dIdx].tatamis[tIdx].classes.push(item);
            }
        }
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Antigravity";
    const sheet = workbook.addWorksheet("Jadwal Pertandingan");
    
    // Setup Kertas Legal Landscape
    sheet.pageSetup = { paperSize: 5, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.2, right: 0.2, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 } };
    
    let columns = [];
    for (let i = 0; i < tatamiCount; i++) {
        const baseKey = `t${i}`;
        columns.push({ header: '', key: `${baseKey}_no`, width: 4 });
        columns.push({ header: '', key: `${baseKey}_category`, width: 12 });
        columns.push({ header: '', key: `${baseKey}_className`, width: 38 });
        columns.push({ header: '', key: `${baseKey}_count`, width: 8 });
        if (i < tatamiCount - 1) {
            columns.push({ header: '', key: `spacer_${i}`, width: 2 });
        }
    }
    sheet.columns = columns;

    const eventName = document.getElementById("championship-title")?.textContent || "KEJUARAAN KARATE";
    const totalCols = (tatamiCount * 5) - 1;

    sheet.addRow([]).height = 15; // Top spacer for logo

    const mainTitleRow = sheet.addRow([]);
    mainTitleRow.height = 30;
    sheet.mergeCells(mainTitleRow.number, 1, mainTitleRow.number, totalCols);
    mainTitleRow.getCell(1).value = 'JADWAL PERTANDINGAN';
    mainTitleRow.getCell(1).font = { name: 'Franklin Gothic Demi', size: 20, bold: true };
    mainTitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    const subtitleRow = sheet.addRow([]);
    subtitleRow.height = 25;
    sheet.mergeCells(subtitleRow.number, 1, subtitleRow.number, totalCols);
    subtitleRow.getCell(1).value = eventName.toUpperCase();
    subtitleRow.getCell(1).font = { name: 'Franklin Gothic Demi', size: 14, bold: true };
    subtitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.addRow([]).height = 20; // Empty spacer

    let hasData = false;
    boardData.forEach(dayGroup => {
        let maxRows = 0;
        dayGroup.tatamis.forEach(group => {
            const order = orders[`D${dayGroup.day}-T${group.number}`] || orders[String(group.number)] || [];
            group.classes.sort((first, second) => {
                const firstIndex = order.indexOf(`${first.category}::${first.className}`);
                const secondIndex = order.indexOf(`${second.category}::${second.className}`);
                if (firstIndex !== -1 || secondIndex !== -1) {
                    return (firstIndex === -1 ? Number.MAX_SAFE_INTEGER : firstIndex) - (secondIndex === -1 ? Number.MAX_SAFE_INTEGER : secondIndex);
                }
                return compareScheduleClasses(first, second);
            });
            if (group.classes.length > maxRows) maxRows = group.classes.length;
        });

        if (maxRows === 0) return;
        hasData = true;

        const titleRow = sheet.addRow([]);
        titleRow.height = 25;
        const headerRow = sheet.addRow([]);
        headerRow.height = 20;

        dayGroup.tatamis.forEach((group, i) => {
            const startCol = i * 5 + 1;
            const endCol = startCol + 3;
            sheet.mergeCells(titleRow.number, startCol, titleRow.number, endCol);
            
            const titleCell = sheet.getCell(titleRow.number, startCol);
            titleCell.value = `HARI ${dayGroup.day} - TATAMI ${group.number}`;
            titleCell.font = { name: 'Franklin Gothic Demi', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
            titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3C5E' } };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            titleCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

            const h1 = headerRow.getCell(startCol); h1.value = 'NO';
            const h2 = headerRow.getCell(startCol + 1); h2.value = 'KATEGORI';
            const h3 = headerRow.getCell(startCol + 2); h3.value = 'NAMA KELAS';
            const h4 = headerRow.getCell(startCol + 3); h4.value = 'PARTAI';

            for (let c = 0; c < 4; c++) {
                const cell = headerRow.getCell(startCol + c);
                cell.font = { name: 'Franklin Gothic Demi', size: 10, bold: true };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB4C6E7' } };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            }
        });

        for (let r = 0; r < maxRows; r++) {
            const rowObj = {};
            dayGroup.tatamis.forEach((group, i) => {
                const baseKey = `t${i}`;
                const item = group.classes[r];
                if (item) {
                    rowObj[`${baseKey}_no`] = r + 1;
                    rowObj[`${baseKey}_category`] = item.category;
                    rowObj[`${baseKey}_className`] = item.className.toUpperCase();
                    rowObj[`${baseKey}_count`] = item.count;
                }
            });
            const row = sheet.addRow(rowObj);
            row.font = { name: 'Franklin Gothic Demi', size: 9 };
            
            dayGroup.tatamis.forEach((group, i) => {
                const startCol = i * 5 + 1;
                if (group.classes[r]) {
                    row.getCell(startCol).alignment = { horizontal: 'center', vertical: 'middle' };
                    row.getCell(startCol + 1).alignment = { horizontal: 'center', vertical: 'middle' };
                    row.getCell(startCol + 2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
                    row.getCell(startCol + 3).alignment = { horizontal: 'center', vertical: 'middle' };
                    for (let c = 0; c < 4; c++) {
                        row.getCell(startCol + c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    }
                }
            });
        }

        const totalRowObj = {};
        dayGroup.tatamis.forEach((group, i) => {
            const baseKey = `t${i}`;
            const totalCount = group.classes.reduce((sum, item) => sum + item.count, 0);
            totalRowObj[`${baseKey}_count`] = totalCount;
        });
        
        const totalRow = sheet.addRow(totalRowObj);
        totalRow.font = { name: 'Franklin Gothic Demi', size: 10, bold: true };
        
        dayGroup.tatamis.forEach((group, i) => {
            const startCol = i * 5 + 1;
            sheet.mergeCells(totalRow.number, startCol, totalRow.number, startCol + 2);
            const labelCell = sheet.getCell(totalRow.number, startCol);
            labelCell.value = 'TOTAL PARTAI / PESERTA';
            labelCell.alignment = { horizontal: 'right', vertical: 'middle' };
            labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
            
            const countCell = sheet.getCell(totalRow.number, startCol + 3);
            countCell.alignment = { horizontal: 'center', vertical: 'middle' };
            countCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
            
            for (let c = 0; c < 4; c++) {
                totalRow.getCell(startCol + c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            }
        });
        
        sheet.addRow([]).height = 20; // Spacer after each day
    });

    if (!hasData) {
        alert("Tidak ada jadwal yang bisa dicetak.");
        return;
    }

    const schedulePrintButtonObj = document.getElementById("schedule-print-button");
    const originalText = schedulePrintButtonObj.textContent;
    schedulePrintButtonObj.textContent = "Menyiapkan Excel...";
    schedulePrintButtonObj.disabled = true;

    try {
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Jadwal_Pertandingan.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    } catch(e) {
        console.error("Gagal export excel", e);
        alert("Terjadi kesalahan saat memproses file Excel.");
    } finally {
        schedulePrintButtonObj.textContent = originalText;
        schedulePrintButtonObj.disabled = false;
    }
}
