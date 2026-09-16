const participantCount = 16;
const roundNames = ["16 Besar", "Perempat Final", "Semifinal", "Final"];
const board = document.getElementById("bracket-board");
const resetButton = document.getElementById("reset-bracket");
const championResult = document.getElementById("champion-result");
const runnerUpResult = document.getElementById("runner-up-result");
const thirdPlaceResultOne = document.getElementById("third-place-result-one");
const thirdPlaceResultTwo = document.getElementById("third-place-result-two");

let participants = Array.from({ length: participantCount }, (_, index) => `Peserta ${index + 1}`);
let winners = [
    Array(8).fill(null),
    Array(4).fill(null),
    Array(2).fill(null),
    Array(1).fill(null)
];
let semifinalLosers = [];

function getMatchSlots(round, matchIndex) {
    if (round === 1) {
        return [participants[matchIndex * 2], participants[matchIndex * 2 + 1]];
    }

    const previousRound = winners[round - 2];
    return [previousRound[matchIndex * 2], previousRound[matchIndex * 2 + 1]];
}

function clearLaterRounds(round) {
    for (let nextRound = round; nextRound < winners.length; nextRound += 1) {
        winners[nextRound].fill(null);
    }
    if (round <= 3) semifinalLosers = [];
}

function selectWinner(round, matchIndex, participant) {
    const slots = getMatchSlots(round, matchIndex);
    if (!participant || slots.some(slot => !slot)) return;

    clearLaterRounds(round);
    winners[round - 1][matchIndex] = participant;

    if (round === 3) {
        semifinalLosers[matchIndex] = slots.find(slot => slot !== participant);
    }

    renderBracket();
}

function renderParticipantInput(index) {
    return `<input class="participant-name-input" data-participant-index="${index}" value="${escapeHtml(participants[index])}" aria-label="Nama peserta ${index + 1}">`;
}

function renderMatch(round, matchIndex) {
    const slots = getMatchSlots(round, matchIndex);
    const canSelect = slots.every(Boolean);
    const slotMarkup = slots.map((participant, slotIndex) => {
        const label = participant || "Menunggu pemenang";
        if (round === 1) {
            return `<div class="bracket-entry"><input class="participant-name-input" data-participant-index="${matchIndex * 2 + slotIndex}" value="${escapeHtml(label)}" aria-label="Nama peserta ${matchIndex * 2 + slotIndex + 1}"><button class="bracket-competitor" type="button" data-round="${round}" data-match="${matchIndex}" data-participant="${escapeHtml(participant || label)}" ${canSelect ? "" : "disabled"}>Pilih</button></div>`;
        }
        const buttonClass = participant ? "bracket-competitor" : "bracket-competitor is-empty";
        return `<button class="${buttonClass}" type="button" data-round="${round}" data-match="${matchIndex}" data-participant="${escapeHtml(participant || "")}" ${canSelect ? "" : "disabled"}><span>${escapeHtml(label)}</span></button>`;
    }).join("");

    return `<article class="bracket-match"><span class="match-number">Pertandingan ${matchIndex + 1}</span>${slotMarkup}</article>`;
}

function renderBracket() {
    board.innerHTML = roundNames.map((roundName, index) => {
        const round = index + 1;
        const matchCount = participantCount / (2 ** round);
        const matches = Array.from({ length: matchCount }, (_, matchIndex) => renderMatch(round, matchIndex)).join("");
        return `<section class="bracket-round bracket-round-${round}"><h2>${roundName}</h2><div class="bracket-matches">${matches}</div></section>`;
    }).join("");

    championResult.textContent = winners[3][0] || "Belum ditentukan";
    runnerUpResult.textContent = winners[2][0] && winners[2][1] && winners[3][0]
        ? (winners[2][0] === winners[3][0] ? winners[2][1] : winners[2][0])
        : "Belum ditentukan";
    thirdPlaceResultOne.textContent = semifinalLosers[0] || "Belum ditentukan";
    thirdPlaceResultTwo.textContent = semifinalLosers[1] || "Belum ditentukan";
}

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
    }[character]));
}

board.addEventListener("click", event => {
    const competitor = event.target.closest(".bracket-competitor");
    if (!competitor || competitor.disabled) return;

    selectWinner(
        Number(competitor.dataset.round),
        Number(competitor.dataset.match),
        competitor.dataset.participant
    );
});

board.addEventListener("change", event => {
    const input = event.target.closest(".participant-name-input");
    if (!input) return;

    participants[Number(input.dataset.participantIndex)] = input.value.trim() || `Peserta ${Number(input.dataset.participantIndex) + 1}`;
    winners = [Array(8).fill(null), Array(4).fill(null), Array(2).fill(null), Array(1).fill(null)];
    semifinalLosers = [];
    renderBracket();
});

resetButton.addEventListener("click", () => {
    participants = Array.from({ length: participantCount }, (_, index) => `Peserta ${index + 1}`);
    winners = [Array(8).fill(null), Array(4).fill(null), Array(2).fill(null), Array(1).fill(null)];
    semifinalLosers = [];
    renderBracket();
});

renderBracket();
