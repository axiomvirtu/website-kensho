import { get, ref } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
import { rtdb } from "./firebase-config.js";

const categories = [
    { key: "all", label: "Semua Peserta", collection: null },
    { key: "festival", label: "Festival", collection: "peserta_festival" },
    { key: "open", label: "Open", collection: "peserta_open" }
];

const categoryList = document.getElementById("category-list");
const tableHead = document.getElementById("table-head");
const tableBody = document.getElementById("table-body");
const statusMessage = document.getElementById("status-message");
const totalCount = document.getElementById("total-count");
const openCount = document.getElementById("open-count");
const openIndividualCount = document.getElementById("open-individual-count");
const openTeamCount = document.getElementById("open-team-count");
const festivalCount = document.getElementById("festival-count");
const lastUpdated = document.getElementById("last-updated");
const refreshButton = document.getElementById("refresh-data");
const championshipTitle = document.getElementById("championship-title");
const searchInput = document.getElementById("participant-search");
const previousPageButton = document.getElementById("previous-page");
const nextPageButton = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");

let allParticipants = [];
let classTypeSettings = {};
let activeCategory = "all";
let searchTerm = "";
let currentPage = 1;
let loadingPromise = null;
const pageSize = 50;
const participantCacheKey = "kenshotech_participants_cache";
const participantVersionKey = "kenshotech_participants_version";
const championshipNameKey = "kenshotech_championship_name";
let lastRefreshTime = 0;
const REFRESH_COOLDOWN_MS = 6000;

function restoreCachedParticipants() {
    try {
        const cachedParticipants = JSON.parse(localStorage.getItem(participantCacheKey) || "null");
        if (!Array.isArray(cachedParticipants) || !cachedParticipants.length) return false;

        allParticipants = cachedParticipants;
        updateSummary();
        renderTable();
        const savedTime = localStorage.getItem("kenshotech_participants_timestamp");
        if (savedTime) {
            lastUpdated.textContent = `Tersimpan ${new Date(Number(savedTime)).toLocaleTimeString("id-ID")}`;
        }
        setStatus("Menampilkan data tersimpan di perangkat ini. Memeriksa status terbaru...", "success");
        return true;
    } catch (error) {
        console.warn("Cache peserta tidak dapat digunakan:", error);
        return false;
    }
}

function updateSummary() {
    const adjustedOpenCount = participantCount(allParticipants, "Open");
    const adjustedFestivalCount = participantCount(allParticipants, "Festival");
    const openBreakdownCount = openBreakdown(allParticipants);
    totalCount.textContent = (adjustedOpenCount + adjustedFestivalCount).toLocaleString("id-ID");
    openCount.textContent = adjustedOpenCount.toLocaleString("id-ID");
    openIndividualCount.textContent = openBreakdownCount.individual.toLocaleString("id-ID");
    openTeamCount.textContent = openBreakdownCount.teams.toLocaleString("id-ID");
    festivalCount.textContent = adjustedFestivalCount.toLocaleString("id-ID");
}

async function loadChampionshipName() {
    try {
        const cachedName = localStorage.getItem(championshipNameKey);
        if (cachedName) {
            championshipTitle.textContent = cachedName;
            document.title = `${cachedName} | Daftar Peserta`;
        }
        const snapshot = await get(ref(rtdb, "pengaturan/namaKejuaraan"));
        const championshipName = snapshot.val()?.trim();
        if (championshipName && championshipName !== cachedName) {
            championshipTitle.textContent = championshipName;
            document.title = `${championshipName} | Daftar Peserta`;
            localStorage.setItem(championshipNameKey, championshipName);
        }
    } catch (error) {
        console.error("Gagal mengambil nama kejuaraan:", error);
    }
}

async function getRemoteVersion() {
    try {
        const snapshot = await get(ref(rtdb, "versiPeserta"));
        return snapshot.val();
    } catch (error) {
        console.warn("Gagal membaca versiPeserta:", error);
        return null;
    }
}

async function loadRtdbParticipants() {
    const snapshot = await get(ref(rtdb, "peserta"));
    let participants = snapshot.val() || {};
    if (typeof participants === "string") {
        try {
            participants = JSON.parse(participants);
        } catch (error) {
            console.error("Format data peserta RTDB tidak valid:", error);
            participants = {};
        }
    }
    return Object.entries(participants).map(([id, participant]) => ({ id, ...participant }));
}

function setStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`.trim();
}

function collectionLabel(collectionName) {
    return collectionName === "peserta_festival" ? "Festival" : "Open";
}

function participantCount(participants, category) {
    const categoryParticipants = participants.filter(participant => participant.category === category);
    if (category !== "Open") return categoryParticipants.length;

    const teamRows = categoryParticipants.filter(participant => isTeamClassPublic(participant["KELAS PERTANDINGAN"])).length;
    return categoryParticipants.length - teamRows + teamRows / 3;
}

function openBreakdown(participants) {
    const openParticipants = participants.filter(participant => participant.category === "Open");
    const teamRows = openParticipants.filter(participant => isTeamClassPublic(participant["KELAS PERTANDINGAN"])).length;
    return { individual: openParticipants.length - teamRows, teams: teamRows / 3 };
}

function normalizePublicClassName(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim() || "Tanpa kelas";
}

function isTeamClassPublic(className) {
    const normalizedClassName = normalizePublicClassName(className).toLowerCase();
    const configuredType = Object.entries(classTypeSettings).find(([key]) => normalizePublicClassName(key).toLowerCase() === normalizedClassName)?.[1];
    if (configuredType) return String(configuredType).toLowerCase() === "beregu";
    return /beregu|team|tim|regu/i.test(normalizedClassName);
}

function mergePublicTeamParticipants(participants) {
    const mergedRows = [];
    const teamGroups = new Map();
    participants.forEach(participant => {
        if (participant.category !== "Open" || !isTeamClassPublic(participant["KELAS PERTANDINGAN"])) {
            mergedRows.push({
                ...participant,
                _teamSearchText: String(participant["NAMA LENGKAP"] || "")
            });
            return;
        }
        const className = normalizePublicClassName(participant["KELAS PERTANDINGAN"]);
        const contingent = String(participant.KONTINGEN || "Tanpa kontingen").trim();
        const teamKey = `${className.toLowerCase()}::${contingent.toLowerCase()}`;
        if (!teamGroups.has(teamKey)) teamGroups.set(teamKey, []);
        teamGroups.get(teamKey).push(participant);
    });

    teamGroups.forEach(members => {
        const sortedMembers = [...members].sort((first, second) => String(first["NAMA LENGKAP"] || "").localeCompare(String(second["NAMA LENGKAP"] || ""), "id", { sensitivity: "base" }));
        mergedRows.push({
            ...sortedMembers[0],
            "NAMA LENGKAP": `${sortedMembers[0]["NAMA LENGKAP"] || "Tim"} Cs`,
            _teamMembers: sortedMembers.length,
            _teamSearchText: sortedMembers.map(member => [
                member["NAMA LENGKAP"],
                member["KELAS PERTANDINGAN"],
                member.KONTINGEN,
                member.category
            ].join(" ")).join(" ")
        });
    });

    return mergedRows.sort((first, second) => {
        const classComparison = normalizePublicClassName(first["KELAS PERTANDINGAN"]).localeCompare(normalizePublicClassName(second["KELAS PERTANDINGAN"]), "id", { sensitivity: "base" });
        if (classComparison) return classComparison;
        return String(first["NAMA LENGKAP"] || "").localeCompare(String(second["NAMA LENGKAP"] || ""), "id", { sensitivity: "base" });
    });
}

function sortParticipants(participants) {
    return participants.sort((first, second) =>
        String(first["NAMA LENGKAP"] || "").localeCompare(
            String(second["NAMA LENGKAP"] || ""),
            "id",
            { sensitivity: "base" }
        )
    );
}

async function loadParticipants(forceFullDownload = false, attempt = 0) {
    if (attempt === 0) {
        if (loadingPromise) return loadingPromise;
        loadingPromise = loadParticipants(forceFullDownload, 1);
        try {
            return await loadingPromise;
        } finally {
            loadingPromise = null;
        }
    }

    refreshButton.disabled = true;

    try {
        try {
            const classSettingsSnapshot = await get(ref(rtdb, "pengaturan/jenisKelas"));
            classTypeSettings = classSettingsSnapshot.val() || {};
        } catch (error) {
            console.warn("Pengaturan jenis kelas publik belum dapat dimuat:", error);
        }
        const localVersion = localStorage.getItem(participantVersionKey);
        const hasCachedData = allParticipants.length > 0;

        // Pengecekan versi cepat (hanya unduh ukuran mikro beberapa byte)
        setStatus(hasCachedData ? "Memeriksa status pembaruan data..." : "Menghubungkan ke database...");
        const remoteVersion = await getRemoteVersion();

        // Optimasi Kuota RTDB: jika versi sama dan cache ada, hindari download data ratusan KB
        if (!forceFullDownload && hasCachedData && remoteVersion && String(remoteVersion) === String(localVersion)) {
            lastUpdated.textContent = `Sinkron ${new Date().toLocaleTimeString("id-ID")} (Data Terkini)`;
            setStatus("Data peserta sudah versi terbaru dari panitia (hemat kuota).", "success");
            updateSummary();
            renderTable();
            return;
        }

        setStatus(hasCachedData ? "Ada pembaruan data panitia. Mengunduh data terbaru..." : "Mengambil data peserta ke database...");

        const participants = (await loadRtdbParticipants()).map(participant => ({
            ...participant,
            category: participant.kategori || "Festival"
        }));

        allParticipants = sortParticipants(participants);
        localStorage.setItem(participantCacheKey, JSON.stringify(allParticipants));
        localStorage.setItem("kenshotech_participants_timestamp", String(Date.now()));
        if (remoteVersion) {
            localStorage.setItem(participantVersionKey, String(remoteVersion));
        } else {
            localStorage.setItem(participantVersionKey, String(Date.now()));
        }

        updateSummary();
        lastUpdated.textContent = `Diperbarui ${new Date().toLocaleTimeString("id-ID")}`;
        setStatus(allParticipants.length ? "Data peserta siap ditampilkan." : "Belum ada data peserta tersimpan.", allParticipants.length ? "success" : "empty");
        renderTable();
    } catch (error) {
        console.error("Gagal mengambil data publik:", error);
        if (attempt < 3 && error.status === 429) {
            const retryDelay = 3000 * attempt;
            setStatus(`Database sedang sibuk. Mencoba lagi dalam ${retryDelay / 1000} detik...`, "empty");
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return loadParticipants(forceFullDownload, attempt + 1);
        }
        if (allParticipants.length) {
            setStatus("Data tersimpan ditampilkan sementara. Pembaruan database akan dicoba lagi saat Muat ulang.", "empty");
            renderTable();
        } else {
            setStatus("Data belum dapat dimuat. Periksa koneksi RTDB dan RTDB Rules.", "error");
            renderEmptyState("Data tidak dapat dimuat.");
        }
    } finally {
        refreshButton.disabled = false;
    }
}

function renderCategories() {
    categoryList.innerHTML = "";
    categories.forEach(category => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = category.key === activeCategory ? "category-button active" : "category-button";
        button.textContent = category.label;
        button.addEventListener("click", () => {
            activeCategory = category.key;
            currentPage = 1;
            renderCategories();
            renderTable();
        });
        categoryList.appendChild(button);
    });
}

function renderEmptyState(message) {
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "empty-state";
    cell.textContent = message;
    row.appendChild(cell);
    tableBody.appendChild(row);
    pageInfo.textContent = "Tidak ada data";
    previousPageButton.disabled = true;
    nextPageButton.disabled = true;
}

function renderTable() {
    const categoryParticipants = activeCategory === "all"
        ? allParticipants
        : allParticipants.filter(participant => participant.category.toLowerCase() === activeCategory);
    const mergedParticipants = mergePublicTeamParticipants(categoryParticipants);
    const visibleParticipants = mergedParticipants.filter(participant => {
        if (!searchTerm) return true;
        const searchableText = [
            participant._teamSearchText,
            participant["NAMA LENGKAP"],
            participant["KELAS PERTANDINGAN"],
            participant.KONTINGEN,
            participant.category
        ].join(" ").toLocaleLowerCase("id-ID");
        return searchableText.includes(searchTerm);
    });

    const totalPages = Math.max(1, Math.ceil(visibleParticipants.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const pageStart = (currentPage - 1) * pageSize;
    const pageParticipants = visibleParticipants.slice(pageStart, pageStart + pageSize);

    tableHead.innerHTML = "";
    ["No.", "Nama Lengkap", "Kelas Pertandingan", "Kontingen", "Kategori"].forEach(header => {
        const cell = document.createElement("th");
        cell.textContent = header;
        tableHead.appendChild(cell);
    });

    if (!visibleParticipants.length) {
        renderEmptyState(searchTerm ? "Peserta tidak ditemukan." : "Belum ada peserta pada kategori ini.");
        return;
    }

    tableBody.innerHTML = "";
    pageParticipants.forEach((participant, index) => {
        const row = document.createElement("tr");
        [
            pageStart + index + 1,
            participant["NAMA LENGKAP"] || "-",
            participant["KELAS PERTANDINGAN"] || "-",
            participant.KONTINGEN || "-",
            participant.category
        ].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });
        tableBody.appendChild(row);
    });

    pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages} · ${visibleParticipants.length.toLocaleString("id-ID")} data`;
    previousPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === totalPages;
}

refreshButton.addEventListener("click", () => {
    const now = Date.now();
    if (now - lastRefreshTime < REFRESH_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((REFRESH_COOLDOWN_MS - (now - lastRefreshTime)) / 1000);
        setStatus(`Harap tunggu ${remainingSeconds} detik sebelum memeriksa database lagi.`, "empty");
        return;
    }
    lastRefreshTime = now;
    void loadParticipants(false);
});

// Jika pengguna klik ganda pada tombol muat ulang saat menekan tombol Shift, izinkan force refresh
refreshButton.addEventListener("dblclick", event => {
    if (event.shiftKey) {
        lastRefreshTime = Date.now();
        setStatus("Mengunduh ulang seluruh data dari awal...");
        void loadParticipants(true);
    }
});
searchInput.addEventListener("input", event => {
    searchTerm = event.target.value.trim().toLocaleLowerCase("id-ID");
    currentPage = 1;
    renderTable();
});
previousPageButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage -= 1;
        renderTable();
    }
});
nextPageButton.addEventListener("click", () => {
    currentPage += 1;
    renderTable();
});
renderCategories();
restoreCachedParticipants();
loadChampionshipName();
loadParticipants();
