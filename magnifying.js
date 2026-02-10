const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

const timeLeftEl = document.getElementById("timeLeft");
const gemCountEl = document.getElementById("gemCount");
const foundCountEl = document.getElementById("foundCount");
const targetNameEl = document.getElementById("targetName");
const statusMessageEl = document.getElementById("statusMessage");
const modeSelect = document.getElementById("modeSelect");
const sceneSelect = document.getElementById("sceneSelect");
const unlockSceneBtn = document.getElementById("unlockSceneBtn");
const startBtn = document.getElementById("startBtn");
const hintBtn = document.getElementById("hintBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const spinBtn = document.getElementById("spinBtn");
const wheelModal = document.getElementById("wheelModal");
const closeWheelBtn = document.getElementById("closeWheelBtn");
const spinWheelBtn = document.getElementById("spinWheelBtn");
const wheelCanvas = document.getElementById("wheelCanvas");
const wheelResult = document.getElementById("wheelResult");
const dailyBtn = document.getElementById("dailyBtn");
const dailyModal = document.getElementById("dailyModal");
const closeDailyBtn = document.getElementById("closeDailyBtn");
const claimDailyBtn = document.getElementById("claimDailyBtn");
const dailyStatus = document.getElementById("dailyStatus");
const chanceBtn = document.getElementById("chanceBtn");
const chanceModal = document.getElementById("chanceModal");
const closeChanceBtn = document.getElementById("closeChanceBtn");
const spinChanceBtn = document.getElementById("spinChanceBtn");
const chanceCanvas = document.getElementById("chanceCanvas");
const chanceResult = document.getElementById("chanceResult");
const magnifierLevelEl = document.getElementById("magnifierLevel");
const shapeSelect = document.getElementById("shapeSelect");
const unlockShapeBtn = document.getElementById("unlockShapeBtn");
const upgradeMagnifierBtn = document.getElementById("upgradeMagnifierBtn");

const wheelCtx = wheelCanvas.getContext("2d");
const chanceCtx = chanceCanvas.getContext("2d");

const sceneWidth = canvas.width;
const sceneHeight = canvas.height;

const modes = {
  easy: { time: 75, reward: 1 },
  medium: { time: 45, reward: 5 },
  hard: { time: 25, reward: 10 },
};

const magnifierRadii = [70, 90, 115, 140];
const magnifierCosts = [10, 20, 35];
const hintCost = 5;
const spinCost = 15;
const shapeCosts = {
  circle: 0,
  square: 15,
  rounded: 20,
  hex: 30,
};
const baseSpinsPerRound = 1;
const wheelPrizes = [
  { label: "+5 Gems", type: "gems", value: 5 },
  { label: "+10 Gems", type: "gems", value: 10 },
  { label: "+20 Gems", type: "gems", value: 20 },
  { label: "+10s Time", type: "time", value: 10 },
  { label: "+15s Time", type: "time", value: 15 },
  { label: "Free Hint", type: "hint", value: 1 },
  { label: "Spin Again", type: "spin", value: 1 },
];
const dailyRewards = [
  { label: "+10 Gems", type: "gems", value: 10 },
  { label: "+20 Gems", type: "gems", value: 20 },
  { label: "+15s Time", type: "time", value: 15 },
  { label: "+25s Time", type: "time", value: 25 },
  { label: "Free Hint", type: "hint", value: 1 },
  { label: "Spin Again", type: "spin", value: 1 },
];
const chancePrizes = [
  { label: "+50 Gems", type: "gems", value: 50 },
  { label: "+100 Gems", type: "gems", value: 100 },
  { label: "+30s Time", type: "time", value: 30 },
  { label: "Lose 50 gems", type: "gems", value: -50 },
  { label: "Lose 20 Gems", type: "lose_gems", value: -20 },
  { label: "Lose 10s", type: "lose_time", value: -10 },
  { label: "No Prize", type: "nothing", value: 0 },
  { label: "Lose Spin", type: "lose_spin", value: 1 },
];

const itemTemplates = [
  {
    name: "Ice Cream",
    type: "icecream",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/2/26/Vanilla_ice_cream_cone_detail.jpg",
  },
  {
    name: "Balloon",
    type: "balloon",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/c/c3/Balloon_fully_inflated.jpg",
  },
  {
    name: "Book",
    type: "book",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a3/Freethetextbook.jpg",
  },
  {
    name: "Umbrella",
    type: "umbrella",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Umbrella.jpg",
  },
  {
    name: "Camera",
    type: "camera",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Digital_Camera.jpg",
  },
  {
    name: "Shell",
    type: "shell",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/f/f8/Small_sea_shell.jpg",
  },
  {
    name: "Backpack",
    type: "backpack",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/e/ea/Backpack%2C_military_%28AM_1929.162.1-1%29.jpg",
  },
  {
    name: "Clock",
    type: "clock",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Clock.jpeg",
  },
  {
    name: "Flower",
    type: "flower",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/22/Flower_macro_hd.jpg",
  },
  {
    name: "Key",
    type: "key",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3c/House_key.jpg",
  },
  {
    name: "Cup",
    type: "cup",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/3/3a/Coffee_cup_seen_from_above.jpg",
  },
  {
    name: "Leaf",
    type: "leaf",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/32/Maple_leaf.jpg",
  },
];

const sceneThemes = {
  park: {
    id: "park",
    name: "Sunny Park",
    cost: 0,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/e/ef/Prior_Park_Landscape_Garden.jpg",
  },
  beach: {
    id: "beach",
    name: "Golden Beach",
    cost: 25,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/85/Empty_beach.jpg",
  },
  city: {
    id: "city",
    name: "City Streets",
    cost: 35,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/3/3e/Seattle_skyline.jpeg",
  },
  meadow: {
    id: "meadow",
    name: "Wild Meadow",
    cost: 20,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/d/dc/Rocky-mountain-scene-942017.jpg",
  },
  forest: {
    id: "forest",
    name: "Forest Lake",
    cost: 30,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/e/e5/Landscape-nature-forest-lake_%2824300004076%29.jpg",
  },
  lake: {
    id: "lake",
    name: "Sunset Lake",
    cost: 28,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/b/bf/Landscape_of_lake_and_clouds.jpg",
  },
  desert: {
    id: "desert",
    name: "Desert Dunes",
    cost: 40,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/4/48/A_scenic_view_of_the_desert_landscape_on_the_desert.jpg",
  },
};

let items = [];
let gems = 0;
let found = 0;
let timeLeft = 0;
let running = false;
let target = null;
let timerId = null;
let hintUntil = 0;
let magnifierLevel = 0;
let pointer = { x: sceneWidth / 2, y: sceneHeight / 2 };
let currentScene = sceneThemes.park;
const unlockedScenes = new Set(["park"]);
const sceneImages = new Map();
const itemImages = new Map();
let spinsRemaining = baseSpinsPerRound;
let wheelAngle = 0;
let isSpinning = false;
let dailyReward = null;
let chanceAngle = 0;
let isChanceSpinning = false;
let magnifierShape = "circle";
const unlockedShapes = new Set(["circle"]);
let wheelSelectedIndex = null;
let chanceSelectedIndex = null;

function playBuzzer() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = "square";
  oscillator.frequency.value = 140;
  gainNode.gain.value = 0.2;

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + 0.25
  );
  oscillator.stop(audioCtx.currentTime + 0.25);
  oscillator.onended = () => {
    audioCtx.close();
  };
}

function playRoundOver() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.25;
  gainNode.connect(audioCtx.destination);

  const tones = [240, 200, 160];
  tones.forEach((freq, index) => {
    const oscillator = audioCtx.createOscillator();
    oscillator.type = "sawtooth";
    oscillator.frequency.value = freq;
    oscillator.connect(gainNode);
    const start = audioCtx.currentTime + index * 0.12;
    const end = start + 0.1;
    oscillator.start(start);
    oscillator.stop(end);
  });

  const total = tones.length * 0.12 + 0.2;
  setTimeout(() => audioCtx.close(), total * 1000);
}

function playWheelTick() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = 520;
  gainNode.gain.value = 0.15;
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + 0.08
  );
  oscillator.stop(audioCtx.currentTime + 0.08);
  oscillator.onended = () => audioCtx.close();
}

function setStatus(message) {
  statusMessageEl.textContent = message;
}

function updateUI() {
  gemCountEl.textContent = gems.toString();
  foundCountEl.textContent = found.toString();
  timeLeftEl.textContent = running ? `${timeLeft}s` : "--";
  magnifierLevelEl.textContent = `Level ${magnifierLevel + 1}`;

  const nextMagCost = magnifierCosts[magnifierLevel];
  upgradeMagnifierBtn.textContent = nextMagCost
    ? `Upgrade (${nextMagCost})`
    : "Maxed";
  upgradeMagnifierBtn.disabled = !nextMagCost || gems < nextMagCost;
  hintBtn.disabled = !running || gems < hintCost;
  spinBtn.disabled = spinsRemaining <= 0;
  spinWheelBtn.disabled =
    isSpinning || spinsRemaining <= 0 || gems < spinCost;
  dailyBtn.disabled = false;
  spinChanceBtn.disabled = isChanceSpinning || gems < spinCost;

  const selectedShape = shapeSelect.value;
  const shapeCost = shapeCosts[selectedShape];
  const isShapeUnlocked = unlockedShapes.has(selectedShape);
  unlockShapeBtn.textContent = isShapeUnlocked
    ? "Unlocked"
    : `Unlock (${shapeCost})`;
  unlockShapeBtn.disabled = isShapeUnlocked || gems < shapeCost;

  Array.from(sceneSelect.options).forEach((option) => {
    const scene = sceneThemes[option.value];
    const locked = !unlockedScenes.has(scene.id);
    option.textContent = locked
      ? `${scene.name} (${scene.cost} gems)`
      : scene.name;
  });

  const selectedScene = sceneThemes[sceneSelect.value];
  const isUnlocked = unlockedScenes.has(selectedScene.id);
  if (isUnlocked) {
    unlockSceneBtn.textContent = "Unlocked";
  } else {
    unlockSceneBtn.textContent = `Unlock (${selectedScene.cost})`;
  }
  unlockSceneBtn.disabled = isUnlocked || gems < selectedScene.cost;
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function placeItem(base, size, existing) {
  for (let i = 0; i < 40; i += 1) {
    const x = randomBetween(80, sceneWidth - 80);
    const y = randomBetween(90, sceneHeight - 80);
    const tooClose = existing.some((item) => {
      const dx = item.x - x;
      const dy = item.y - y;
      return Math.hypot(dx, dy) < item.size + size + 22;
    });
    if (!tooClose) {
      return { ...base, x, y, size };
    }
  }
  return {
    ...base,
    x: randomBetween(60, sceneWidth - 60),
    y: randomBetween(60, sceneHeight - 60),
    size,
  };
}

function generateScene() {
  const shuffled = shuffle(itemTemplates);
  items = [];
  const count = 12;
  for (let i = 0; i < count; i += 1) {
    const template = shuffled[i % shuffled.length];
    const size = randomBetween(20, 34);
    const placed = placeItem(template, size, items);
    items.push({ ...placed, found: false, isGem: false });
  }

  const gemCount = Math.random() > 0.6 ? 2 : 1;
  for (let i = 0; i < gemCount; i += 1) {
    const gemItem = placeItem(
      { name: "Gem", type: "gem", color: "#65f9ff" },
      randomBetween(16, 22),
      items
    );
    items.push({ ...gemItem, found: false, isGem: true });
  }

  pickNextTarget();
}

function pickNextTarget() {
  const available = items.filter((item) => !item.isGem && !item.found);
  if (available.length === 0) {
    generateScene();
    return;
  }
  target = available[Math.floor(Math.random() * available.length)];
  targetNameEl.textContent = target.name;
}

function startGame() {
  const mode = modes[modeSelect.value];
  const selectedShape = shapeSelect.value;
  if (!unlockedShapes.has(selectedShape)) {
    setStatus("Unlock this magnifier shape to play.");
    playBuzzer();
    updateUI();
    return;
  }
  const selectedScene = sceneThemes[sceneSelect.value];
  if (!unlockedScenes.has(selectedScene.id)) {
    setStatus("Unlock this scene to play it.");
    playBuzzer();
    updateUI();
    return;
  }
  currentScene = selectedScene;
  preloadScene(selectedScene);
  timeLeft = mode.time;
  found = 0;
  running = true;
  spinsRemaining = baseSpinsPerRound;
  const pendingDaily = localStorage.getItem("mq-daily-pending");
  if (pendingDaily) {
    timeLeft += Number(pendingDaily);
    localStorage.removeItem("mq-daily-pending");
  }
  generateScene();
  setStatus("Find the object on the card.");
  updateUI();

  clearInterval(timerId);
  timerId = setInterval(() => {
    if (!running) {
      return;
    }
    timeLeft -= 1;
    if (timeLeft <= 0) {
      endGame();
    }
    updateUI();
  }, 1000);
}

function endGame() {
  running = false;
  clearInterval(timerId);
  setStatus(`Time! You found ${found} objects.`);
  targetNameEl.textContent = "Round over";
  playRoundOver();
  updateUI();
}

function addGems(amount) {
  gems += amount;
  updateUI();
}

function selectAtPosition(x, y) {
  const clicked = items.find(
    (item) => !item.found && Math.hypot(item.x - x, item.y - y) < item.size + 12
  );

  if (!clicked) {
    setStatus("Nope. Try again.");
    return;
  }

  if (clicked.isGem) {
    clicked.found = true;
    addGems(3);
    setStatus("You found a hidden gem!");
    return;
  }

  if (target && clicked.name === target.name) {
    clicked.found = true;
    found += 1;
    addGems(modes[modeSelect.value].reward);
    setStatus(`Nice! You found the ${clicked.name}.`);
    pickNextTarget();
    return;
  }

  setStatus("That is not the card item.");
}

function handleClick(event) {
  if (!running) {
    return;
  }
  const { x, y } = getPointerPosition(event);
  selectAtPosition(x, y);
}

function getPointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function handlePointerMove(event) {
  pointer = getPointerPosition(event);
}

function getTouchPosition(touch) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (touch.clientX - rect.left) * scaleX,
    y: (touch.clientY - rect.top) * scaleY,
  };
}

function handleTouchStart(event) {
  if (event.touches.length === 0) {
    return;
  }
  pointer = getTouchPosition(event.touches[0]);
  event.preventDefault();
}

function handleTouchMove(event) {
  if (event.touches.length === 0) {
    return;
  }
  pointer = getTouchPosition(event.touches[0]);
  event.preventDefault();
}

function handleTouchEnd(event) {
  if (!running || event.changedTouches.length === 0) {
    return;
  }
  const { x, y } = getTouchPosition(event.changedTouches[0]);
  selectAtPosition(x, y);
  event.preventDefault();
}

function handleHint() {
  if (!running || gems < hintCost || !target) {
    if (running && gems < hintCost) {
      playBuzzer();
    }
    return;
  }
  gems -= hintCost;
  hintUntil = Date.now() + 2500;
  setStatus("Hint activated!");
  updateUI();
}

function unlockScene() {
  const selectedScene = sceneThemes[sceneSelect.value];
  if (unlockedScenes.has(selectedScene.id)) {
    return;
  }
  if (gems < selectedScene.cost) {
    setStatus("Not enough gems to unlock.");
    playBuzzer();
    return;
  }
  gems -= selectedScene.cost;
  unlockedScenes.add(selectedScene.id);
  preloadScene(selectedScene);
  setStatus(`${selectedScene.name} unlocked!`);
  updateUI();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function buildMagnifierPath(radius, shape) {
  ctx.beginPath();
  if (shape === "square") {
    ctx.rect(pointer.x - radius, pointer.y - radius, radius * 2, radius * 2);
    return;
  }

  if (shape === "rounded") {
    const size = radius * 2;
    const corner = radius * 0.4;
    const x = pointer.x - radius;
    const y = pointer.y - radius;
    ctx.moveTo(x + corner, y);
    ctx.lineTo(x + size - corner, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + corner);
    ctx.lineTo(x + size, y + size - corner);
    ctx.quadraticCurveTo(x + size, y + size, x + size - corner, y + size);
    ctx.lineTo(x + corner, y + size);
    ctx.quadraticCurveTo(x, y + size, x, y + size - corner);
    ctx.lineTo(x, y + corner);
    ctx.quadraticCurveTo(x, y, x + corner, y);
    return;
  }

  if (shape === "hex") {
    const angleStep = (Math.PI * 2) / 6;
    for (let i = 0; i < 6; i += 1) {
      const angle = angleStep * i - Math.PI / 2;
      const x = pointer.x + Math.cos(angle) * radius;
      const y = pointer.y + Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    return;
  }

  ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
}

function unlockShape() {
  const selectedShape = shapeSelect.value;
  const cost = shapeCosts[selectedShape];
  if (unlockedShapes.has(selectedShape)) {
    return;
  }
  if (gems < cost) {
    playBuzzer();
    return;
  }
  gems -= cost;
  unlockedShapes.add(selectedShape);
  magnifierShape = selectedShape;
  setStatus(`${selectedShape} magnifier unlocked.`);
  updateUI();
}

function changeShape() {
  const selectedShape = shapeSelect.value;
  if (!unlockedShapes.has(selectedShape)) {
    return;
  }
  magnifierShape = selectedShape;
  setStatus(`${selectedShape} magnifier selected.`);
}

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function getDailyClaimKey() {
  return `mq-daily-${getTodayKey()}`;
}

function openDaily() {
  dailyReward = dailyRewards[Math.floor(Math.random() * dailyRewards.length)];
  const claimed = localStorage.getItem(getDailyClaimKey());
  dailyStatus.textContent = claimed
    ? "You already claimed today. Come back tomorrow!"
    : `Today's power-up: ${dailyReward.label}`;
  claimDailyBtn.disabled = Boolean(claimed);
  dailyModal.classList.add("show");
  dailyModal.setAttribute("aria-hidden", "false");
}

function closeDaily() {
  dailyModal.classList.remove("show");
  dailyModal.setAttribute("aria-hidden", "true");
}

function claimDaily() {
  if (!dailyReward || localStorage.getItem(getDailyClaimKey())) {
    return;
  }
  localStorage.setItem(getDailyClaimKey(), "claimed");
  if (dailyReward.type === "gems") {
    addGems(dailyReward.value);
    dailyStatus.textContent = `Claimed ${dailyReward.value} gems!`;
  } else if (dailyReward.type === "time") {
    if (running) {
      timeLeft += dailyReward.value;
      updateUI();
      dailyStatus.textContent = `Added ${dailyReward.value} seconds to this round!`;
    } else {
      localStorage.setItem("mq-daily-pending", String(dailyReward.value));
      dailyStatus.textContent = `Time bonus saved for your next round: ${dailyReward.value} seconds.`;
    }
  } else if (dailyReward.type === "hint") {
    handleHint();
    dailyStatus.textContent = "Free hint activated!";
  } else if (dailyReward.type === "spin") {
    spinsRemaining += 1;
    dailyStatus.textContent = "You earned an extra spin!";
  }
  claimDailyBtn.disabled = true;
  updateUI();
}

function openWheel() {
  wheelModal.classList.add("show");
  wheelModal.setAttribute("aria-hidden", "false");
  wheelResult.textContent = spinsRemaining
    ? `You have ${spinsRemaining} spin${
        spinsRemaining === 1 ? "" : "s"
      } left. Cost: ${spinCost} gems.`
    : "No spins left this round.";
  drawWheel();
  updateUI();
}

function openChanceWheel() {
  chanceModal.classList.add("show");
  chanceModal.setAttribute("aria-hidden", "false");
  chanceResult.textContent = `Spin for a big risk or big reward. Cost: ${spinCost} gems.`;
  drawChanceWheel();
  updateUI();
}

function closeChanceWheel() {
  chanceModal.classList.remove("show");
  chanceModal.setAttribute("aria-hidden", "true");
}

function closeWheel() {
  wheelModal.classList.remove("show");
  wheelModal.setAttribute("aria-hidden", "true");
}

function drawWheel() {
  const { width, height } = wheelCanvas;
  const radius = Math.min(width, height) / 2 - 8;
  const centerX = width / 2;
  const centerY = height / 2;
  const slice = (Math.PI * 2) / wheelPrizes.length;
  const colors = ["#fe7a57", "#ffd166", "#7bdff2", "#80ed99"];

  wheelCtx.clearRect(0, 0, width, height);
  wheelCtx.save();
  wheelCtx.translate(centerX, centerY);
  wheelCtx.rotate(wheelAngle);

  wheelPrizes.forEach((prize, index) => {
    wheelCtx.beginPath();
    wheelCtx.moveTo(0, 0);
    wheelCtx.fillStyle = colors[index % colors.length];
    wheelCtx.arc(0, 0, radius, index * slice, (index + 1) * slice);
    wheelCtx.fill();

    wheelCtx.save();
    wheelCtx.rotate(index * slice + slice / 2);
    wheelCtx.fillStyle = "#0f1118";
    wheelCtx.font = "bold 14px 'Segoe UI', sans-serif";
    wheelCtx.textAlign = "right";
    wheelCtx.textBaseline = "middle";
    wheelCtx.fillText(prize.label, radius - 12, 0);
    wheelCtx.restore();
  });

  wheelCtx.strokeStyle = "rgba(255,255,255,0.5)";
  wheelCtx.lineWidth = 3;
  wheelCtx.beginPath();
  wheelCtx.arc(0, 0, radius, 0, Math.PI * 2);
  wheelCtx.stroke();

  wheelCtx.fillStyle = "#0f1118";
  wheelCtx.beginPath();
  wheelCtx.arc(0, 0, 24, 0, Math.PI * 2);
  wheelCtx.fill();

  if (wheelSelectedIndex !== null) {
    wheelCtx.save();
    const angle = wheelSelectedIndex * slice + slice / 2;
    wheelCtx.rotate(angle);
    wheelCtx.strokeStyle = "#ffffff";
    wheelCtx.lineWidth = 4;
    wheelCtx.beginPath();
    wheelCtx.moveTo(0, 0);
    wheelCtx.lineTo(radius - 10, 0);
    wheelCtx.stroke();
    wheelCtx.restore();
  }
  wheelCtx.restore();
}

function drawChanceWheel() {
  const { width, height } = chanceCanvas;
  const radius = Math.min(width, height) / 2 - 8;
  const centerX = width / 2;
  const centerY = height / 2;
  const slice = (Math.PI * 2) / chancePrizes.length;
  const colors = ["#fe7a57", "#4d7cff", "#ffd166", "#1ad1a5"];

  chanceCtx.clearRect(0, 0, width, height);
  chanceCtx.save();
  chanceCtx.translate(centerX, centerY);
  chanceCtx.rotate(chanceAngle);

  chancePrizes.forEach((prize, index) => {
    chanceCtx.beginPath();
    chanceCtx.moveTo(0, 0);
    chanceCtx.fillStyle = colors[index % colors.length];
    chanceCtx.arc(0, 0, radius, index * slice, (index + 1) * slice);
    chanceCtx.fill();

    chanceCtx.save();
    chanceCtx.rotate(index * slice + slice / 2);
    chanceCtx.fillStyle = "#0f1118";
    chanceCtx.font = "bold 13px 'Segoe UI', sans-serif";
    chanceCtx.textAlign = "right";
    chanceCtx.textBaseline = "middle";
    chanceCtx.fillText(prize.label, radius - 12, 0);
    chanceCtx.restore();
  });

  chanceCtx.strokeStyle = "rgba(255,255,255,0.5)";
  chanceCtx.lineWidth = 3;
  chanceCtx.beginPath();
  chanceCtx.arc(0, 0, radius, 0, Math.PI * 2);
  chanceCtx.stroke();

  chanceCtx.fillStyle = "#0f1118";
  chanceCtx.beginPath();
  chanceCtx.arc(0, 0, 24, 0, Math.PI * 2);
  chanceCtx.fill();

  if (chanceSelectedIndex !== null) {
    chanceCtx.save();
    const angle = chanceSelectedIndex * slice + slice / 2;
    chanceCtx.rotate(angle);
    chanceCtx.strokeStyle = "#ffffff";
    chanceCtx.lineWidth = 4;
    chanceCtx.beginPath();
    chanceCtx.moveTo(0, 0);
    chanceCtx.lineTo(radius - 10, 0);
    chanceCtx.stroke();
    chanceCtx.restore();
  }
  chanceCtx.restore();
}

function applyPrize(prize) {
  if (prize.type === "gems") {
    addGems(prize.value);
    wheelResult.textContent = `You won ${prize.value} gems!`;
  } else if (prize.type === "time") {
    if (running) {
      timeLeft += prize.value;
      updateUI();
    }
    wheelResult.textContent = `You gained ${prize.value} seconds!`;
  } else if (prize.type === "hint") {
    handleHint();
    wheelResult.textContent = "Free hint activated!";
  } else if (prize.type === "spin") {
    spinsRemaining += 1;
    wheelResult.textContent = "Spin again unlocked!";
  }
  updateUI();
}

function applyChancePrize(prize) {
  if (prize.type === "gems") {
    addGems(prize.value);
    chanceResult.textContent = `Lucky! You won ${prize.value} gems.`;
  } else if (prize.type === "time") {
    if (running) {
      timeLeft += prize.value;
      updateUI();
    }
    chanceResult.textContent = `Nice! You gained ${prize.value} seconds.`;
  } else if (prize.type === "win") {
    found += 1;
    setStatus("Instant win! Card completed.");
    pickNextTarget();
    updateUI();
    chanceResult.textContent = "Instant win! You auto-found the card item.";
  } else if (prize.type === "lose_gems") {
    gems = Math.max(0, gems - prize.value);
    updateUI();
    chanceResult.textContent = `Ouch! You lost ${prize.value} gems.`;
  } else if (prize.type === "lose_time") {
    if (running) {
      timeLeft = Math.max(0, timeLeft - prize.value);
      updateUI();
    }
    chanceResult.textContent = `Ouch! You lost ${prize.value} seconds.`;
  } else if (prize.type === "lose_spin") {
    spinsRemaining = Math.max(0, spinsRemaining - 1);
    updateUI();
    chanceResult.textContent = "Bad luck! You lost one spin.";
  } else {
    chanceResult.textContent = "Nothing this time.";
  }
  updateUI();
}

function spinChanceWheel() {
  if (isChanceSpinning || gems < spinCost) {
    if (gems < spinCost) {
      playBuzzer();
    }
    return;
  }
  gems -= spinCost;
  isChanceSpinning = true;
  chanceResult.textContent = "Spinning...";
  updateUI();

  const slice = (Math.PI * 2) / chancePrizes.length;
  const landingIndex = Math.floor(Math.random() * chancePrizes.length);
  const targetAngle =
    Math.PI * 2 * (3 + Math.random()) -
    (landingIndex * slice + slice / 2);
  const startAngle = chanceAngle;
  const duration = 2200;
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    chanceAngle = startAngle + targetAngle * ease;
    drawChanceWheel();

    if (t < 1) {
      if (Math.random() < 0.2) {
        playWheelTick();
      }
      requestAnimationFrame(animate);
      return;
    }

    isChanceSpinning = false;
    const normalized =
      (Math.PI * 2 - (chanceAngle % (Math.PI * 2))) % (Math.PI * 2);
    const index = Math.floor(normalized / slice) % chancePrizes.length;
    chanceSelectedIndex = index;
    applyChancePrize(chancePrizes[index]);
  }

  requestAnimationFrame(animate);
}

function spinWheel() {
  if (isSpinning || spinsRemaining <= 0 || gems < spinCost) {
    if (gems < spinCost) {
      playBuzzer();
    }
    return;
  }
  spinsRemaining -= 1;
  gems -= spinCost;
  isSpinning = true;
  wheelResult.textContent = "Spinning...";
  updateUI();

  const slice = (Math.PI * 2) / wheelPrizes.length;
  const landingIndex = Math.floor(Math.random() * wheelPrizes.length);
  const targetAngle =
    Math.PI * 2 * (3 + Math.random()) -
    (landingIndex * slice + slice / 2);
  const startAngle = wheelAngle;
  const duration = 2200;
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    wheelAngle = startAngle + targetAngle * ease;
    drawWheel();

    if (t < 1) {
      if (Math.random() < 0.2) {
        playWheelTick();
      }
      requestAnimationFrame(animate);
      return;
    }

    isSpinning = false;
    const normalized =
      (Math.PI * 2 - (wheelAngle % (Math.PI * 2))) % (Math.PI * 2);
    const index = Math.floor(normalized / slice) % wheelPrizes.length;
    wheelSelectedIndex = index;
    applyPrize(wheelPrizes[index]);
  }

  requestAnimationFrame(animate);
}

function upgradeMagnifier() {
  const cost = magnifierCosts[magnifierLevel];
  if (!cost || gems < cost) {
    if (cost && gems < cost) {
      playBuzzer();
    }
    return;
  }
  gems -= cost;
  magnifierLevel += 1;
  setStatus("Magnifier upgraded.");
  updateUI();
}

function preloadScene(scene) {
  if (sceneImages.has(scene.id)) {
    return;
  }
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = scene.imageUrl;
  sceneImages.set(scene.id, img);
}

function preloadItemImages() {
  itemTemplates.forEach((item) => {
    if (!item.imageUrl || itemImages.has(item.imageUrl)) {
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = item.imageUrl;
    itemImages.set(item.imageUrl, img);
  });
}

function drawCoverImage(image) {
  const canvasRatio = sceneWidth / sceneHeight;
  const imageRatio = image.width / image.height;
  let drawWidth = sceneWidth;
  let drawHeight = sceneHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > canvasRatio) {
    drawHeight = sceneHeight;
    drawWidth = imageRatio * drawHeight;
    offsetX = (sceneWidth - drawWidth) / 2;
  } else {
    drawWidth = sceneWidth;
    drawHeight = drawWidth / imageRatio;
    offsetY = (sceneHeight - drawHeight) / 2;
  }

  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(0, 0, sceneWidth, sceneHeight);
}

function drawCoverImageAt(image, size) {
  const imageRatio = image.width / image.height;
  let drawWidth = size;
  let drawHeight = size;

  if (imageRatio > 1) {
    drawWidth = size * imageRatio;
  } else {
    drawHeight = size / imageRatio;
  }

  ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
}

function drawBackground() {
  const sceneImage = sceneImages.get(currentScene.id);
  if (sceneImage && sceneImage.complete && sceneImage.naturalWidth > 0) {
    drawCoverImage(sceneImage);
    return;
  }

  ctx.fillStyle = "#11141c";
  ctx.fillRect(0, 0, sceneWidth, sceneHeight);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "20px 'Segoe UI', sans-serif";
  ctx.fillText("Loading scene...", 32, 40);
}

function drawItem(item) {
  if (item.isGem) {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.globalAlpha = item.found ? 0.35 : 1;
    ctx.fillStyle = "#65f9ff";
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(14, -2);
    ctx.lineTo(8, 16);
    ctx.lineTo(-8, 16);
    ctx.lineTo(-14, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  const image = item.imageUrl ? itemImages.get(item.imageUrl) : null;
  const radius = item.size * 1.2;
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.globalAlpha = item.found ? 0.35 : 1;

  if (image && image.complete && image.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.clip();
    drawCoverImageAt(image, radius * 2);
    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawHint() {
  if (!target || Date.now() > hintUntil) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = "rgba(255, 214, 64, 0.9)";
  ctx.lineWidth = 4;
  const pulse = 10 * Math.sin(Date.now() / 120);
  ctx.beginPath();
  ctx.arc(target.x, target.y, target.size + 30 + pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawMagnifierRing(radius) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawScene() {
  drawBackground();
  items.forEach(drawItem);
  drawHint();
}

function render() {
  ctx.clearRect(0, 0, sceneWidth, sceneHeight);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, sceneWidth, sceneHeight);

  const radius = magnifierRadii[magnifierLevel];
  ctx.save();
  buildMagnifierPath(radius, magnifierShape);
  ctx.clip();
  drawScene();
  ctx.restore();

  drawMagnifierRing(radius);
  requestAnimationFrame(render);
}

canvas.addEventListener("mousemove", handlePointerMove);
canvas.addEventListener("click", handleClick);
canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
startBtn.addEventListener("click", startGame);
hintBtn.addEventListener("click", handleHint);
unlockSceneBtn.addEventListener("click", unlockScene);
sceneSelect.addEventListener("change", updateUI);
fullscreenBtn.addEventListener("click", toggleFullscreen);
upgradeMagnifierBtn.addEventListener("click", upgradeMagnifier);
spinBtn.addEventListener("click", openWheel);
closeWheelBtn.addEventListener("click", closeWheel);
spinWheelBtn.addEventListener("click", spinWheel);
wheelModal.addEventListener("click", (event) => {
  if (event.target === wheelModal) {
    closeWheel();
  }
});
dailyBtn.addEventListener("click", openDaily);
closeDailyBtn.addEventListener("click", closeDaily);
claimDailyBtn.addEventListener("click", claimDaily);
dailyModal.addEventListener("click", (event) => {
  if (event.target === dailyModal) {
    closeDaily();
  }
});
chanceBtn.addEventListener("click", openChanceWheel);
closeChanceBtn.addEventListener("click", closeChanceWheel);
spinChanceBtn.addEventListener("click", spinChanceWheel);
chanceModal.addEventListener("click", (event) => {
  if (event.target === chanceModal) {
    closeChanceWheel();
  }
});
unlockShapeBtn.addEventListener("click", unlockShape);
shapeSelect.addEventListener("change", () => {
  changeShape();
  updateUI();
});

updateUI();
preloadScene(currentScene);
preloadItemImages();
render();
