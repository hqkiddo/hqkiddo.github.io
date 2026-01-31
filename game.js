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
const sceneImages = new Map();
const itemImages = new Map();

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
  preloadScene(selectedScene);
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
preloadScene(currentScene);
preloadItemImages();
render();
