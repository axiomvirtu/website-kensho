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
let activeCategory = "all";
let searchTerm = "";
let currentPage = 1;
let loadingPromise = null;
const pageSize = 50;
const participantCacheKey = "kenshotech_participants_cache";

function restoreCachedParticipants() {
    try {
        const cachedParticipants = JSON.parse(localStorage.getItem(participantCacheKey) || "null");
        if (!Array.isArray(cachedParticipants) || !cachedParticipants.length) return false;

        allParticipants = cachedParticipants;
        updateSummary();
        renderTable();
        setStatus("Menampilkan data tersimpan. Memperbarui data terbaru...", "success");
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
        const snapshot = await get(ref(rtdb, "pengaturan/namaKejuaraan"));
        const championshipName = snapshot.val()?.trim();
        if (championshipName) {
            championshipTitle.textContent = championshipName;
            document.title = `${championshipName} | Daftar Peserta`;
        }
    } catch (error) {
        console.error("Gagal mengambil nama kejuaraan:", error);
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

    const teamRows = categoryParticipants.filter(participant =>
        /beregu/i.test(participant["KELAS PERTANDINGAN"] || "")
    ).length;
    return categoryParticipants.length - teamRows + teamRows / 3;
}

function openBreakdown(participants) {
    const openParticipants = participants.filter(participant => participant.category === "Open");
    const teamRows = openParticipants.filter(participant => /beregu/i.test(participant["KELAS PERTANDINGAN"] || "")).length;
    return { individual: openParticipants.length - teamRows, teams: teamRows / 3 };
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

async function loadParticipants(attempt = 0) {
    if (attempt === 0) {
        if (loadingPromise) return loadingPromise;
        loadingPromise = loadParticipants(1);
        try {
            return await loadingPromise;
        } finally {
            loadingPromise = null;
        }
    }

    setStatus(allParticipants.length ? "Sedang memperbarui data peserta ke database..." : "Sedang mengambil data peserta ke database");
    refreshButton.disabled = true;

    try {
        const participants = (await loadRtdbParticipants()).map(participant => ({
            ...participant,
            category: participant.kategori || "Festival"
        }));

        allParticipants = sortParticipants(participants);
        localStorage.setItem(participantCacheKey, JSON.stringify(allParticipants));
        updateSummary();
        lastUpdated.textContent = `Diperbarui ${new Date().toLocaleString("id-ID")}`;
        setStatus(allParticipants.length ? "Data peserta siap ditampilkan." : "Belum ada data peserta tersimpan.", allParticipants.length ? "success" : "empty");
        renderTable();
    } catch (error) {
        console.error("Gagal mengambil data publik:", error);
        if (attempt < 3 && error.status === 429) {
            const retryDelay = 3000 * attempt;
            setStatus(`Database sedang sibuk. Mencoba lagi dalam ${retryDelay / 1000} detik...`, "empty");
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return loadParticipants(attempt + 1);
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
    const visibleParticipants = categoryParticipants.filter(participant => {
        if (!searchTerm) return true;
        const searchableText = [
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

refreshButton.addEventListener("click", loadParticipants);
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
