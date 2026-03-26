const MAX_PLAYERS = 10;
const MIN_PLAYERS = 3;
const ROUND_SECONDS = 300;

const WORDS = [
  "Pizza", "Ocean", "Library", "Mountain", "Football", "Robot", "Banana", "Volcano",
  "Airport", "Galaxy", "Castle", "Dragon", "Chocolate", "Umbrella", "Theater", "Jungle",
  "Laptop", "Hospital", "Bicycle", "Desert", "Pirate", "Rainbow", "Submarine", "Fireworks"
];

const IMPOSTOR_HINTS = {
  Pizza: "It is often sliced, shared, and has a crust.",
  Ocean: "Think very large, salty, and full of waves.",
  Library: "It is usually quiet and full of shelves.",
  Mountain: "Tall, rocky, and often climbed.",
  Football: "A team sport with a ball and scoring zones/goals.",
  Robot: "A machine that can follow tasks or commands.",
  Banana: "A yellow fruit with a peel.",
  Volcano: "A mountain that can erupt with lava.",
  Airport: "A transport hub where planes take off and land.",
  Galaxy: "A huge collection of stars in space.",
  Castle: "A large fortified building from old times.",
  Dragon: "A mythical creature often shown with wings.",
  Chocolate: "A sweet treat made from cocoa.",
  Umbrella: "Used for protection from rain.",
  Theater: "A place for live performances or movies.",
  Jungle: "A dense tropical forest with lots of wildlife.",
  Laptop: "A portable personal computer.",
  Hospital: "A place for medical treatment.",
  Bicycle: "A two-wheeled vehicle powered by pedaling.",
  Desert: "A dry area with very little rain.",
  Pirate: "A sea outlaw from historical stories.",
  Rainbow: "A colorful arc seen after rain.",
  Submarine: "A vehicle that travels underwater.",
  Fireworks: "Bright explosive lights used in celebrations."
};

const playerForm = document.getElementById("playerForm");
const playerNameInput = document.getElementById("playerName");
const playerListEl = document.getElementById("playerList");
const startBtn = document.getElementById("startGame");
const resetSetupBtn = document.getElementById("resetSetup");

const revealCard = document.getElementById("revealCard");
const setupCard = document.getElementById("setupCard");
const roundCard = document.getElementById("roundCard");
const revealInstruction = document.getElementById("revealInstruction");
const showRoleBtn = document.getElementById("showRole");
const nextRevealBtn = document.getElementById("nextReveal");
const roleDisplay = document.getElementById("roleDisplay");

const speakingOrderEl = document.getElementById("speakingOrder");
const starterNoticeEl = document.getElementById("starterNotice");
const timerEl = document.getElementById("timer");
const pauseTimerBtn = document.getElementById("pauseTimer");
const endRoundBtn = document.getElementById("endRound");

const state = {
  players: [],
  secretWord: "",
  impostorIndex: -1,
  speakingOrder: [],
  revealIndex: 0,
  timer: ROUND_SECONDS,
  timerInterval: null,
  paused: false
};

function renderPlayers() {
  playerListEl.innerHTML = "";
  state.players.forEach((name, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${name}`;
    playerListEl.appendChild(li);
  });

  startBtn.disabled = !(state.players.length >= MIN_PLAYERS && state.players.length <= MAX_PLAYERS);
}

playerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = playerNameInput.value.trim();
  if (!name) return;

  if (state.players.length >= MAX_PLAYERS) {
    alert("Max 10 players reached.");
    return;
  }

  state.players.push(name);
  playerNameInput.value = "";
  renderPlayers();
});

resetSetupBtn.addEventListener("click", () => {
  state.players = [];
  renderPlayers();
});

startBtn.addEventListener("click", () => {
  initializeGame();
  setupCard.classList.add("hidden");
  revealCard.classList.remove("hidden");
  showCurrentRevealPrompt();
});

showRoleBtn.addEventListener("click", () => {
  const i = state.revealIndex;
  const playerName = state.players[i];
  const isImpostor = i === state.impostorIndex;
  const starterIsImpostor = state.speakingOrder[0] === state.impostorIndex;

  let text;
  if (isImpostor) {
    const hintBase = IMPOSTOR_HINTS[state.secretWord] ?? "It's a common object/place/idea.";
    text = `🕵️ ${playerName}, you are the IMPOSTOR. You don't get the secret word.`;

    if (starterIsImpostor) {
      text += `\n\n⭐ You start first, so you get a better hint: ${hintBase}`;
    } else {
      text += "\n\nHint: Try speaking generally and mirror what others say.";
    }
  } else {
    text = `✅ ${playerName}, your secret word is: ${state.secretWord}`;
  }

  roleDisplay.textContent = text;
  roleDisplay.classList.remove("hidden");
  showRoleBtn.classList.add("hidden");
  nextRevealBtn.classList.remove("hidden");
});

nextRevealBtn.addEventListener("click", () => {
  state.revealIndex += 1;
  roleDisplay.classList.add("hidden");
  roleDisplay.textContent = "";
  showRoleBtn.classList.remove("hidden");
  nextRevealBtn.classList.add("hidden");

  if (state.revealIndex >= state.players.length) {
    revealCard.classList.add("hidden");
    roundCard.classList.remove("hidden");
    startRound();
    return;
  }

  showCurrentRevealPrompt();
});

pauseTimerBtn.addEventListener("click", () => {
  state.paused = !state.paused;
  pauseTimerBtn.textContent = state.paused ? "Resume" : "Pause";
});

endRoundBtn.addEventListener("click", () => {
  endRound("Round ended manually. Vote who the impostor is!");
});

function initializeGame() {
  state.secretWord = WORDS[Math.floor(Math.random() * WORDS.length)];
  state.impostorIndex = Math.floor(Math.random() * state.players.length);
  state.speakingOrder = shuffle([...state.players.keys()]);
  state.revealIndex = 0;
  state.timer = ROUND_SECONDS;
  state.paused = false;
  pauseTimerBtn.textContent = "Pause";
}

function showCurrentRevealPrompt() {
  const playerName = state.players[state.revealIndex];
  revealInstruction.textContent = `${playerName}, tap “Show Role” privately.`;
}

function startRound() {
  speakingOrderEl.textContent = state.speakingOrder
    .map((idx, i) => `${i + 1}) ${state.players[idx]}`)
    .join(" → ");

  const starterIdx = state.speakingOrder[0];
  const starterName = state.players[starterIdx];
  if (starterIdx === state.impostorIndex) {
    starterNoticeEl.textContent = `${starterName} starts first (and is the impostor, with an extra hint).`;
  } else {
    starterNoticeEl.textContent = `${starterName} starts first.`;
  }

  updateTimerView();
  state.timerInterval = setInterval(() => {
    if (state.paused) return;
    state.timer -= 1;
    updateTimerView();

    if (state.timer <= 0) {
      endRound("⏰ Time is up! Vote now: who is the impostor?");
    }
  }, 1000);
}

function updateTimerView() {
  const m = String(Math.floor(state.timer / 60)).padStart(2, "0");
  const s = String(state.timer % 60).padStart(2, "0");
  timerEl.textContent = `${m}:${s}`;
}

function endRound(message) {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }

  const impostorName = state.players[state.impostorIndex];
  alert(`${message}\n\nImpostor was: ${impostorName}\nSecret word: ${state.secretWord}`);

  roundCard.classList.add("hidden");
  setupCard.classList.remove("hidden");
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

renderPlayers();
