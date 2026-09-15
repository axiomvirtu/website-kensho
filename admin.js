import { get, push, ref, remove, set, update } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
import { browserLocalPersistence, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, setPersistence, signInAnonymously, signInWithPopup, signInWithRedirect, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { auth, rtdb } from "./firebase-config.js";

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
const accessCodeManagement = document.getElementById("access-code-management");
const eventSettings = document.getElementById("event-settings");
const classTypeSettingsPanel = document.getElementById("class-type-settings");
const uploadPanel = document.getElementById("upload-panel");
const previewPanel = document.getElementById("preview-panel");
const accessCodeForm = document.getElementById("access-code-form");
const newAccessCode = document.getElementById("new-access-code");
const newAccessLabel = document.getElementById("new-access-label");
const accessCodeStatus = document.getElementById("access-code-status");
const accessCodeList = document.getElementById("access-code-list");
const adminTotalCount = document.getElementById("admin-total-count");
const adminOpenCount = document.getElementById("admin-open-count");
const adminOpenIndividualCount = document.getElementById("admin-open-individual-count");
const adminOpenTeamCount = document.getElementById("admin-open-team-count");
const adminFestivalCount = document.getElementById("admin-festival-count");
const participantListView = document.getElementById("participant-list-view");
const classRecapView = document.getElementById("class-recap-view");
const medalCountView = document.getElementById("medal-count-view");
const adminParticipantBody = document.getElementById("admin-participant-body");
const classRecapBody = document.getElementById("class-recap-body");
const medalStatus = document.getElementById("medal-status");
const goldMedalCount = document.getElementById("gold-medal-count");
const silverMedalCount = document.getElementById("silver-medal-count");
const bronzeMedalCount = document.getElementById("bronze-medal-count");
const eligibleClassBody = document.getElementById("eligible-class-body");
const adminPageInfo = document.getElementById("admin-page-info");
const adminPreviousPage = document.getElementById("admin-previous-page");
const adminNextPage = document.getElementById("admin-next-page");
const classTypeForm = document.getElementById("class-type-form");
const classNameTagInput = document.getElementById("class-name-tag");
const classTypeSelect = document.getElementById("class-type-select");
const classTypeStatus = document.getElementById("class-type-status");
const classTypeList = document.getElementById("class-type-list");

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
let activeSettingsView = "event-settings";
let classTypeSettings = {};
let adminCurrentPage = 1;
const adminPageSize = 50;
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
        details.append(label, date);
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

async function loadParticipantSummary() {
    const classSettingsSnapshot = await get(ref(rtdb, "pengaturan/jenisKelas"));
    classTypeSettings = classSettingsSnapshot.val() || {};

    const snapshot = await get(ref(rtdb, "peserta"));
    let participantData = snapshot.val() || {};
    if (typeof participantData === "string") {
        participantData = JSON.parse(participantData);
    }
    const participants = Object.values(participantData);
    adminParticipants = participants
        .map(participant => ({ ...participant, kategori: participant.kategori || "Festival" }))
        .sort((first, second) => String(first["NAMA LENGKAP"] || "").localeCompare(String(second["NAMA LENGKAP"] || ""), "id", { sensitivity: "base" }));
    renderAdminParticipantList();
    renderClassRecap();
    renderMedalRecap();
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

function renderAdminParticipantList() {
    const filteredParticipants = adminParticipants.filter(participant => participant.kategori === activeAdminCategory);
    const totalPages = Math.max(1, Math.ceil(filteredParticipants.length / adminPageSize));
    adminCurrentPage = Math.min(adminCurrentPage, totalPages);
    const start = (adminCurrentPage - 1) * adminPageSize;
    adminParticipantBody.innerHTML = "";

    filteredParticipants.slice(start, start + adminPageSize).forEach((participant, index) => {
        const row = document.createElement("tr");
        [start + index + 1, participant["NAMA LENGKAP"] || "-", participant["KELAS PERTANDINGAN"] || "-", participant.KONTINGEN || "-"].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });
        adminParticipantBody.appendChild(row);
    });

    if (!filteredParticipants.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.className = "empty-state";
        cell.textContent = "Belum ada peserta pada kategori ini.";
        row.appendChild(cell);
        adminParticipantBody.appendChild(row);
    }

    adminPageInfo.textContent = `Halaman ${adminCurrentPage} dari ${totalPages} · ${filteredParticipants.length.toLocaleString("id-ID")} data`;
    adminPreviousPage.disabled = adminCurrentPage === 1;
    adminNextPage.disabled = adminCurrentPage === totalPages;
}

function renderClassRecap() {
    const counts = new Map();
    adminParticipants
        .filter(participant => participant.kategori === activeRecapCategory)
        .forEach(participant => {
            const className = participant["KELAS PERTANDINGAN"] || "Tanpa kelas";
            const participantWeight = isTeamClass(className, classTypeSettings) ? 1 / 3 : 1;
            counts.set(className, (counts.get(className) || 0) + participantWeight);
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

function renderMedalRecap() {
    const medalRows = adminParticipants.filter(participant => participant.kategori === activeMedalCategory);
    const totals = renderEligibleClasses(medalRows);
    goldMedalCount.textContent = totals.emas.toLocaleString("id-ID");
    silverMedalCount.textContent = totals.perak.toLocaleString("id-ID");
    bronzeMedalCount.textContent = totals.perunggu.toLocaleString("id-ID");
    medalStatus.textContent = activeMedalCategory === "Open" ? "Kebutuhan medali Open." : "Perhitungan Festival akan dibuat setelah aturan Open selesai.";
    medalStatus.className = `status-message ${activeMedalCategory === "Open" ? "success" : "empty"}`;
}

function renderEligibleClasses(participants) {
    const classes = new Map();
    participants.forEach(participant => {
        const className = participant["KELAS PERTANDINGAN"] || "Tanpa kelas";
        const isTeam = isTeamClass(className, classTypeSettings);
        if (!classes.has(className)) classes.set(className, { count: 0, isTeam });
        classes.get(className).count += 1;
    });

    eligibleClassBody.innerHTML = "";
    const eligibleClasses = Array.from(classes.entries()).sort((first, second) => first[0].localeCompare(second[0], "id", { sensitivity: "base" }));
    const totals = { emas: 0, perak: 0, perunggu: 0 };

    eligibleClasses.forEach(([className, details], index) => {
        const row = document.createElement("tr");
        const adjustedCount = details.isTeam ? details.count / 3 : details.count;
        const requirement = medalRequirement(adjustedCount);
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

function medalRequirement(participantCount) {
    if (participantCount <= 1) return { emas: 0, perak: 0, perunggu: 0, note: "Belum mencukupi kriteria" };
    const medals = participantCount === 2
        ? { emas: 1, perak: 1, perunggu: 0 }
        : { emas: 1, perak: participantCount - 2, perunggu: 2 };

    return {
        emas: medals.emas,
        perak: medals.perak,
        perunggu: medals.perunggu,
        note: "Memenuhi kriteria"
    };
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

document.querySelectorAll("[data-admin-view]").forEach(button => {
    button.addEventListener("click", () => {
        const view = button.dataset.adminView;
        document.querySelectorAll(".admin-view-tab").forEach(tab => tab.classList.toggle("active", tab === button));
        participantListView.hidden = view !== "participant-list";
        classRecapView.hidden = view !== "class-recap";
        medalCountView.hidden = view !== "medal-count";
    });
});

document.querySelectorAll("[data-settings-view]").forEach(button => {
    button.addEventListener("click", () => {
        activeSettingsView = button.dataset.settingsView;
        updateSettingsView();
    });
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

adminPreviousPage.addEventListener("click", () => {
    if (adminCurrentPage > 1) {
        adminCurrentPage -= 1;
        renderAdminParticipantList();
    }
});

adminNextPage.addEventListener("click", () => {
    const total = adminParticipants.filter(participant => participant.kategori === activeAdminCategory).length;
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
    const settingsPanels = [eventSettings, classTypeSettingsPanel, accessCodeManagement, uploadPanel, previewPanel];
    settingsPanels.forEach(panel => {
        panel.hidden = panel.id !== activeSettingsView || !panel.id;
    });

    if (activeSettingsView === "upload-panel" && !uploadPanel.hidden) {
        previewPanel.hidden = false;
    }

    document.querySelectorAll(".settings-view-tab").forEach(tab => {
        tab.classList.toggle("active", tab.dataset.settingsView === activeSettingsView);
    });
}

function showAdminPanel(isSuperAdminUser = false) {
    loginPanel.hidden = true;
    accessPanel.hidden = true;
    adminContent.hidden = false;
    accessCodeManagement.hidden = !isSuperAdminUser || activeSettingsView !== "access-code-management";
    eventSettings.hidden = !isSuperAdminUser || activeSettingsView !== "event-settings";
    classTypeSettingsPanel.hidden = !isSuperAdminUser || activeSettingsView !== "class-type-settings";
    uploadPanel.hidden = !isSuperAdminUser || activeSettingsView !== "upload-panel";
    previewPanel.hidden = !isSuperAdminUser || activeSettingsView !== "upload-panel";
    updateSettingsView();
}

function showAccessPanel() {
    loginPanel.hidden = true;
    accessPanel.hidden = false;
    adminContent.hidden = true;
    accessCodeInput.focus();
}

loginForm.addEventListener("submit", async event => {
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

logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem("kensho_admin_access");
    void signOut(auth);
});

accessForm.addEventListener("submit", event => {
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
            await authPersistenceReady;
            sessionStorage.setItem("kensho_admin_access", "granted");
            await signInAnonymously(auth);
            setAccessStatus("Kode benar. Membuka sesi admin...", "success");
        } catch (error) {
            console.error("Sesi admin anonim gagal:", error);
            setAccessStatus(`Sesi Firebase gagal (${error.code || "unknown"}). Aktifkan Anonymous pada Firebase Authentication.`, "error");
        }

        accessButton.disabled = false;
    })();
});

accessCodeForm.addEventListener("submit", async event => {
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
        await set(ref(rtdb, `kodeAkses/${codeHash}`), {
            label: label || "Kode admin",
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
                if (sessionStorage.getItem("kensho_admin_access") === "granted") {
                    await saveUserProfile(user, false);
                    showAdminPanel(false);
                    await loadClassTypeSettings();
                    await loadParticipantSummary();
                    setAccessStatus("Login Admin berhasil.", "success");
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
                await loadClassTypeSettings();
                await loadParticipantSummary();
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

championshipForm.addEventListener("submit", async event => {
    event.preventDefault();
    const championshipName = championshipNameInput.value.trim();
    if (!championshipName) {
        setChampionshipStatus("Nama kejuaraan wajib diisi.", "error");
        return;
    }

    const saveButton = championshipForm.querySelector("button");
    saveButton.disabled = true;
    setChampionshipStatus("Menyimpan nama kejuaraan...");

    try {
        await update(ref(rtdb, "pengaturan"), {
            namaKejuaraan: championshipName,
            diperbaruiPada: new Date().toISOString()
        });
        championshipTitle.textContent = championshipName;
        document.title = `${championshipName} | Panel Admin`;
        setChampionshipStatus("Nama kejuaraan berhasil disimpan.", "success");
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
    const entries = Object.entries(classTypeSettings);
    if (!entries.length) {
        classTypeList.textContent = "Belum ada tag kelas yang disimpan.";
        return;
    }

    entries.forEach(([className, type]) => {
        const item = document.createElement("div");
        item.className = "access-code-item";
        const details = document.createElement("div");
        const label = document.createElement("strong");
        label.textContent = `${className} · ${type}`;
        details.appendChild(label);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "button secondary-button";
        removeButton.textContent = "Hapus";
        removeButton.addEventListener("click", async () => {
            const nextTypes = { ...classTypeSettings };
            delete nextTypes[className];
            await set(ref(rtdb, "pengaturan/jenisKelas"), nextTypes);
            classTypeSettings = nextTypes;
            renderClassTypeList();
            renderClassRecap();
            renderMedalRecap();
            await loadParticipantSummary();
        });

        item.append(details, removeButton);
        classTypeList.appendChild(item);
    });
}

classTypeForm.addEventListener("submit", async event => {
    event.preventDefault();
    const className = classNameTagInput.value.trim();
    const classType = classTypeSelect.value;
    if (!className) {
        classTypeStatus.textContent = "Nama kelas wajib diisi.";
        classTypeStatus.className = "status-message error";
        return;
    }

    try {
        const nextTypes = { ...classTypeSettings, [className]: classType };
        await set(ref(rtdb, "pengaturan/jenisKelas"), nextTypes);
        classTypeSettings = nextTypes;
        classNameTagInput.value = "";
        classTypeStatus.textContent = `Tag kelas "${className}" berhasil disimpan sebagai ${classType}.`;
        classTypeStatus.className = "status-message success";
        renderClassTypeList();
        renderClassRecap();
        renderMedalRecap();
        await loadParticipantSummary();
    } catch (error) {
        console.error("Gagal menyimpan tag kelas:", error);
        classTypeStatus.textContent = "Gagal menyimpan tag kelas.";
        classTypeStatus.className = "status-message error";
    }
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

fileInput.addEventListener("change", async event => {
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
        setStatus(`${files.length} file berhasil dibaca. Data dengan sheet yang sama akan digabung saat disimpan.`, "success");
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

sheetSelector.addEventListener("change", event => loadSheetData(event.target.value));

function loadSheetData(sheetName) {
    currentSheetName = sheetName;
    currentExcelData = parseSheetData(sheetName);

    categoryLabel.textContent = sheetName;
    renderPreview();
    setStatus(`${currentExcelData.length.toLocaleString("id-ID")} peserta pada pratinjau ${sheetName}. Tombol simpan akan memproses semua sheet ke RTDB.`, currentExcelData.length ? "success" : "empty");
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

saveButton.addEventListener("click", async () => {
    if (!availableSheetNames.length || !workbooks.length) {
        setStatus("Belum ada file Excel yang valid.", "error");
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Menyimpan semua...";
    setStatus(`Memproses ${availableSheetNames.join(" dan ")}...`);

    try {
        const replacementSummary = [];
        const unifiedReference = ref(rtdb, "peserta");
        const existingUnifiedSnapshot = await get(unifiedReference);
        const existingParticipants = existingUnifiedSnapshot.val() || {};
        const incomingSheetData = availableSheetNames
            .map(sheetName => ({ sheetName, data: parseSheetData(sheetName) }))
            .filter(sheet => sheet.data.length);
        const incomingCategories = incomingSheetData.map(sheet =>
            sheet.sheetName.toUpperCase() === "OPEN" ? "OPEN" : "FESTIVAL"
        );
        const existingReplacementCount = Object.values(existingParticipants).filter(participant =>
            incomingCategories.includes((participant.kategori || "").toUpperCase())
        ).length;
        for (const sheet of incomingSheetData) {
            if (existingReplacementCount) {
                replacementSummary.push(`${sheet.sheetName}: data lama akan diganti dengan ${sheet.data.length.toLocaleString("id-ID")} data baru`);
            }
        }

        if (replacementSummary.length) {
            const shouldReplace = window.confirm(
                `Data berikut sudah tersimpan dan akan ditimpa:\n\n${replacementSummary.join("\n")}\n\nLanjutkan mengganti data lama dengan data baru?`
            );
            if (!shouldReplace) {
                setStatus("Penyimpanan dibatalkan. Data lama tetap aman.", "empty");
                return;
            }
        }

        const savedSheets = [];
        let totalSaved = 0;

        const nextParticipants = Object.fromEntries(Object.entries(existingParticipants).filter(([, participant]) =>
            !incomingCategories.includes((participant.kategori || "").toUpperCase())
        ));

        for (const sheet of incomingSheetData) {
            const sheetName = sheet.sheetName;
            const sheetData = sheet.data;

            sheetData.forEach(row => {
                const participantReference = push(unifiedReference);
                nextParticipants[participantReference.key] = {
                    ...row,
                    kategori: sheetName.toUpperCase() === "OPEN" ? "Open" : "Festival"
                };
            });
            savedSheets.push(`${sheetName}: ${sheetData.length.toLocaleString("id-ID")}`);
            totalSaved += sheetData.length;
        }

        await set(unifiedReference, nextParticipants);

        if (!savedSheets.length) {
            setStatus("Tidak ada nama peserta valid pada sheet FESTIVAL atau OPEN.", "empty");
        } else {
            setStatus(`Berhasil menyimpan semua data (${savedSheets.join(", ")}). Total ${totalSaved.toLocaleString("id-ID")} peserta.`, "success");
            await loadParticipantSummary();
        }
    } catch (error) {
        console.error("Gagal menyimpan ke RTDB:", error);
        setStatus("Gagal menyimpan. Periksa RTDB Rules dan koneksi Firebase.", "error");
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Simpan Semua ke RTDB";
    }
});
