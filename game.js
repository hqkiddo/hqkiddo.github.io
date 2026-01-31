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
const magnifierLevelEl = document.getElementById("magnifierLevel");
const clarityLevelEl = document.getElementById("clarityLevel");
const upgradeMagnifierBtn = document.getElementById("upgradeMagnifierBtn");
const upgradeClarityBtn = document.getElementById("upgradeClarityBtn");

const sceneWidth = canvas.width;
const sceneHeight = canvas.height;

const modes = {
  easy: { time: 75, reward: 1 },
  medium: { time: 45, reward: 5 },
  hard: { time: 25, reward: 10 },
};

const magnifierRadii = [70, 90, 115, 140];
const clarityAlpha = [0.92, 0.84, 0.74, 0.64];
const magnifierCosts = [10, 20, 35];
const clarityCosts = [8, 16, 28];
const hintCost = 5;

const itemTemplates = [
  { name: "Ice Cream", type: "icecream", color: "#f6b8d0" },
  { name: "Bench", type: "bench", color: "#a5753b" },
  { name: "Balloon", type: "balloon", color: "#ff6b6b" },
  { name: "Book", type: "book", color: "#4d7cff" },
  { name: "Rocket", type: "rocket", color: "#f8d86b" },
  { name: "Umbrella", type: "umbrella", color: "#9b5de5" },
  { name: "Tree", type: "tree", color: "#57c785" },
  { name: "Cat", type: "cat", color: "#f2b880" },
  { name: "Star", type: "star", color: "#ffd166" },
  { name: "Kite", type: "kite", color: "#00bbf9" },
  { name: "Camera", type: "camera", color: "#5d6a82" },
  { name: "Shell", type: "shell", color: "#f7a072" },
  { name: "Backpack", type: "backpack", color: "#3d5a80" },
  { name: "Clock", type: "clock", color: "#e0fbfc" },
  { name: "Flower", type: "flower", color: "#ffafcc" },
  { name: "Bottle", type: "bottle", color: "#7bdff2" },
  { name: "Key", type: "key", color: "#f4c430" },
  { name: "Leaf", type: "leaf", color: "#80ed99" },
  { name: "Cup", type: "cup", color: "#ffd6a5" },
];

const sceneThemes = {
  park: {
    id: "park",
    name: "Sunny Park",
    cost: 0,
    skyTop: "#7ec9ff",
    skyBottom: "#dff3ff",
    ground: "#96d38c",
  },
  beach: {
    id: "beach",
    name: "Golden Beach",
    cost: 25,
    skyTop: "#8bd3ff",
    skyBottom: "#ffe6b3",
    ground: "#f6d3a0",
  },
  city: {
    id: "city",
    name: "City Streets",
    cost: 35,
    skyTop: "#9bb6ff",
    skyBottom: "#e5efff",
    ground: "#c4c4cf",
  },
  meadow: {
    id: "meadow",
    name: "Wild Meadow",
    cost: 20,
    skyTop: "#89d4ff",
    skyBottom: "#f8f2e5",
    ground: "#a4e3a1",
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
let clarityLevel = 0;
let pointer = { x: sceneWidth / 2, y: sceneHeight / 2 };
let currentScene = sceneThemes.park;
const unlockedScenes = new Set(["park"]);

function setStatus(message) {
  statusMessageEl.textContent = message;
}

function updateUI() {
  gemCountEl.textContent = gems.toString();
  foundCountEl.textContent = found.toString();
  timeLeftEl.textContent = running ? `${timeLeft}s` : "--";
  magnifierLevelEl.textContent = `Level ${magnifierLevel + 1}`;
  clarityLevelEl.textContent = `Level ${clarityLevel + 1}`;

  const nextMagCost = magnifierCosts[magnifierLevel];
  const nextPicCost = clarityCosts[clarityLevel];
  upgradeMagnifierBtn.textContent = nextMagCost
    ? `Upgrade (${nextMagCost})`
    : "Maxed";
  upgradeClarityBtn.textContent = nextPicCost
    ? `Upgrade (${nextPicCost})`
    : "Maxed";
  upgradeMagnifierBtn.disabled = !nextMagCost || gems < nextMagCost;
  upgradeClarityBtn.disabled = !nextPicCost || gems < nextPicCost;
  hintBtn.disabled = !running || gems < hintCost;

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
  const selectedScene = sceneThemes[sceneSelect.value];
  if (!unlockedScenes.has(selectedScene.id)) {
    setStatus("Unlock this scene to play it.");
    updateUI();
    return;
  }
  currentScene = selectedScene;
  timeLeft = mode.time;
  found = 0;
  running = true;
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
    return;
  }
  gems -= selectedScene.cost;
  unlockedScenes.add(selectedScene.id);
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

function upgradeMagnifier() {
  const cost = magnifierCosts[magnifierLevel];
  if (!cost || gems < cost) {
    return;
  }
  gems -= cost;
  magnifierLevel += 1;
  setStatus("Magnifier upgraded.");
  updateUI();
}

function upgradeClarity() {
  const cost = clarityCosts[clarityLevel];
  if (!cost || gems < cost) {
    return;
  }
  gems -= cost;
  clarityLevel += 1;
  setStatus("Picture upgraded.");
  updateUI();
}

function drawSky(theme) {
  const gradient = ctx.createLinearGradient(0, 0, 0, sceneHeight);
  gradient.addColorStop(0, theme.skyTop);
  gradient.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, sceneWidth, sceneHeight);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  for (let i = 0; i < 6; i += 1) {
    const x = 90 + i * 140;
    const y = 70 + (i % 2) * 26;
    ctx.beginPath();
    ctx.ellipse(x, y, 56, 24, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 42, y + 10, 42, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMountains() {
  ctx.fillStyle = "rgba(90, 120, 150, 0.35)";
  ctx.beginPath();
  ctx.moveTo(0, 320);
  ctx.lineTo(180, 180);
  ctx.lineTo(360, 320);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(70, 100, 130, 0.4)";
  ctx.beginPath();
  ctx.moveTo(240, 330);
  ctx.lineTo(440, 170);
  ctx.lineTo(660, 330);
  ctx.closePath();
  ctx.fill();
}

function drawGround(theme) {
  ctx.fillStyle = theme.ground;
  ctx.beginPath();
  ctx.ellipse(160, 460, 240, 120, 0, 0, Math.PI * 2);
  ctx.ellipse(600, 520, 340, 150, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawWater() {
  const gradient = ctx.createLinearGradient(0, 360, 0, sceneHeight);
  gradient.addColorStop(0, "rgba(120, 196, 255, 0.9)");
  gradient.addColorStop(1, "rgba(60, 130, 200, 0.9)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 360, sceneWidth, sceneHeight);

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  for (let y = 380; y < sceneHeight; y += 22) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.quadraticCurveTo(160, y - 6, 280, y);
    ctx.stroke();
  }
}

function drawCity() {
  ctx.fillStyle = "#5d6478";
  ctx.fillRect(40, 240, 120, 180);
  ctx.fillRect(190, 210, 80, 210);
  ctx.fillRect(290, 260, 140, 160);
  ctx.fillRect(460, 220, 120, 200);
  ctx.fillRect(610, 250, 160, 170);

  ctx.fillStyle = "rgba(255,255,200,0.6)";
  for (let x = 60; x < 760; x += 50) {
    for (let y = 260; y < 380; y += 40) {
      ctx.fillRect(x, y, 18, 14);
    }
  }
}

function drawCityDetails() {
  ctx.fillStyle = "#2b2f3a";
  ctx.fillRect(0, 420, sceneWidth, 130);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, 485);
  ctx.lineTo(220, 485);
  ctx.moveTo(300, 485);
  ctx.lineTo(480, 485);
  ctx.moveTo(560, 485);
  ctx.lineTo(740, 485);
  ctx.stroke();

  ctx.fillStyle = "#4a4f5c";
  ctx.fillRect(100, 380, 80, 40);
  ctx.fillRect(520, 380, 120, 40);
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillRect(130, 388, 20, 16);
  ctx.fillRect(570, 388, 20, 16);
  ctx.fillRect(600, 388, 20, 16);
}

function drawBeach() {
  ctx.fillStyle = "rgba(246, 211, 160, 0.9)";
  ctx.fillRect(0, 360, sceneWidth, sceneHeight);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.ellipse(80 + i * 110, 420 + (i % 2) * 18, 40, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBeachDetails() {
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 360);
  ctx.bezierCurveTo(200, 380, 420, 340, 640, 365);
  ctx.lineTo(sceneWidth, 350);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.beginPath();
  ctx.arc(780, 90, 40, 0, Math.PI * 2);
  ctx.fill();
}

function drawTreesLine() {
  ctx.fillStyle = "#5a7d4c";
  for (let i = 0; i < 7; i += 1) {
    const x = 60 + i * 120;
    ctx.beginPath();
    ctx.arc(x, 330, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 6, 330, 12, 40);
  }
}

function drawParkDetails() {
  ctx.fillStyle = "rgba(120, 90, 60, 0.9)";
  ctx.beginPath();
  ctx.moveTo(0, 470);
  ctx.quadraticCurveTo(200, 420, 420, 460);
  ctx.quadraticCurveTo(640, 500, sceneWidth, 450);
  ctx.lineTo(sceneWidth, sceneHeight);
  ctx.lineTo(0, sceneHeight);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#b07a48";
  ctx.fillRect(120, 360, 60, 20);
  ctx.fillRect(120, 380, 8, 30);
  ctx.fillRect(172, 380, 8, 30);
}

function drawMeadowDetails() {
  ctx.fillStyle = "rgba(255, 182, 193, 0.7)";
  for (let i = 0; i < 12; i += 1) {
    const x = 50 + i * 70;
    const y = 420 + (i % 3) * 22;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBackground() {
  drawSky(currentScene);
  drawMountains();
  if (currentScene.id === "beach") {
    drawBeach();
    drawWater();
    drawBeachDetails();
  } else if (currentScene.id === "city") {
    drawGround(currentScene);
    drawCity();
    drawCityDetails();
  } else {
    drawGround(currentScene);
    drawTreesLine();
    if (currentScene.id === "park") {
      drawParkDetails();
    } else {
      drawMeadowDetails();
    }
  }
}

function drawItem(item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.globalAlpha = item.found ? 0.35 : 1;
  ctx.fillStyle = item.color;
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 2;

  switch (item.type) {
    case "icecream":
      ctx.beginPath();
      ctx.arc(0, -12, item.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#d49a6a";
      ctx.beginPath();
      ctx.moveTo(0, 26);
      ctx.lineTo(-12, -2);
      ctx.lineTo(12, -2);
      ctx.closePath();
      ctx.fill();
      break;
    case "bench":
      ctx.fillRect(-26, -10, 52, 14);
      ctx.fillRect(-22, 6, 6, 18);
      ctx.fillRect(16, 6, 6, 18);
      break;
    case "balloon":
      ctx.beginPath();
      ctx.ellipse(0, -10, 16, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#2f2f2f";
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(0, 32);
      ctx.stroke();
      break;
    case "book":
      ctx.fillRect(-22, -16, 44, 28);
      ctx.fillStyle = "#fef3c7";
      ctx.fillRect(-18, -12, 36, 20);
      break;
    case "rocket":
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(16, 10);
      ctx.lineTo(0, 20);
      ctx.lineTo(-16, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f25f5c";
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "umbrella":
      ctx.beginPath();
      ctx.arc(0, 0, 26, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 28);
      ctx.stroke();
      break;
    case "tree":
      ctx.fillStyle = "#7c4a2d";
      ctx.fillRect(-6, 4, 12, 22);
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(0, -4, 24, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "cat":
      ctx.beginPath();
      ctx.ellipse(0, 4, 18, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -10, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3a2f2b";
      ctx.beginPath();
      ctx.arc(-4, -12, 2, 0, Math.PI * 2);
      ctx.arc(4, -12, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "star":
      ctx.beginPath();
      for (let i = 0; i < 5; i += 1) {
        ctx.lineTo(
          Math.cos(((18 + i * 72) * Math.PI) / 180) * 18,
          -Math.sin(((18 + i * 72) * Math.PI) / 180) * 18
        );
        ctx.lineTo(
          Math.cos(((54 + i * 72) * Math.PI) / 180) * 8,
          -Math.sin(((54 + i * 72) * Math.PI) / 180) * 8
        );
      }
      ctx.closePath();
      ctx.fill();
      break;
    case "kite":
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(18, 0);
      ctx.lineTo(0, 24);
      ctx.lineTo(-18, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#3a3a3a";
      ctx.beginPath();
      ctx.moveTo(0, 24);
      ctx.lineTo(0, 40);
      ctx.stroke();
      break;
    case "camera":
      ctx.fillRect(-24, -12, 48, 28);
      ctx.fillStyle = "#f0f4ff";
      ctx.beginPath();
      ctx.arc(0, 2, 10, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "shell":
      ctx.beginPath();
      ctx.arc(0, 12, 20, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      for (let i = -12; i <= 12; i += 6) {
        ctx.beginPath();
        ctx.moveTo(i, 12);
        ctx.lineTo(0, -8);
        ctx.stroke();
      }
      break;
    case "gem":
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(14, -2);
      ctx.lineTo(8, 16);
      ctx.lineTo(-8, 16);
      ctx.lineTo(-14, -2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.stroke();
      break;
    case "backpack":
      ctx.fillRect(-18, -14, 36, 36);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(-12, -10, 24, 18);
      break;
    case "clock":
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#223";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -10);
      ctx.moveTo(0, 0);
      ctx.lineTo(8, 4);
      ctx.stroke();
      break;
    case "flower":
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        ctx.ellipse(
          Math.cos((i * Math.PI) / 3) * 10,
          Math.sin((i * Math.PI) / 3) * 10,
          6,
          12,
          0,
          0,
          Math.PI * 2
        );
      }
      ctx.fill();
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "bottle":
      ctx.fillRect(-8, -20, 16, 32);
      ctx.fillRect(-4, -28, 8, 8);
      break;
    case "key":
      ctx.beginPath();
      ctx.arc(-10, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-2, -2, 24, 6);
      ctx.fillRect(12, 4, 6, 6);
      ctx.fillRect(18, 4, 6, 6);
      break;
    case "leaf":
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 18, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "cup":
      ctx.fillRect(-14, -10, 28, 20);
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.arc(16, 0, 8, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      break;
    default:
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
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
  ctx.beginPath();
  ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
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
upgradeClarityBtn.addEventListener("click", upgradeClarity);

updateUI();
render();
