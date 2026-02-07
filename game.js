const canvas = document.getElementById("mineCanvas");
const ctx = canvas.getContext("2d");

const levelValue = document.getElementById("levelValue");
const goldValue = document.getElementById("goldValue");
const coinValue = document.getElementById("coinValue");
const fishValue = document.getElementById("fishValue");
const pickaxeValue = document.getElementById("pickaxeValue");
const statusMessage = document.getElementById("statusMessage");
const startBtn = document.getElementById("startBtn");
const sellBtn = document.getElementById("sellBtn");
const buyPickaxeBtn = document.getElementById("buyPickaxeBtn");
const buyBootsBtn = document.getElementById("buyBootsBtn");
const pickaxeCostEl = document.getElementById("pickaxeCost");
const bootsCostEl = document.getElementById("bootsCost");

const grid = {
  cols: 10,
  rows: 6,
};

const levelThemes = [
  {
    name: "Snowy Cave",
    ground: "#0f1118",
    tileHidden: "#5b6b7a",
    tileRevealed: "#2c303a",
    rock: "#8c96a3",
    gold: "#f2c14e",
    fish: "#6ac7ff",
    accent: "rgba(255,255,255,0.12)",
  },
  {
    name: "Jungle Mine",
    ground: "#0d1612",
    tileHidden: "#3f5b3f",
    tileRevealed: "#2a3b2a",
    rock: "#7f8f6b",
    gold: "#e0b14f",
    fish: "#74d0ff",
    accent: "rgba(122, 180, 120, 0.18)",
  },
  {
    name: "Desert Dig",
    ground: "#19130a",
    tileHidden: "#7b5a3a",
    tileRevealed: "#3b2a1b",
    rock: "#b49a7c",
    gold: "#ffcb5c",
    fish: "#7fd3ff",
    accent: "rgba(255, 210, 140, 0.16)",
  },
  {
    name: "Volcano Shaft",
    ground: "#140c0c",
    tileHidden: "#6a2a2a",
    tileRevealed: "#311818",
    rock: "#a07a7a",
    gold: "#ffb347",
    fish: "#7bcaff",
    accent: "rgba(255, 120, 90, 0.18)",
  },
  {
    name: "Crystal Cavern",
    ground: "#0c0d18",
    tileHidden: "#4a4d7a",
    tileRevealed: "#2a2c47",
    rock: "#9aa0ff",
    gold: "#f0d17a",
    fish: "#88e0ff",
    accent: "rgba(120, 140, 255, 0.18)",
  },
];

let tiles = [];
let level = 1;
let gold = 0;
let coins = 0;
let fishFound = 0;
let pickaxeLevel = 1;
let running = false;
let penguinSpeedLevel = 1;
let penguin = { x: 90, y: canvas.height - 90 };
let penguinTarget = null;
let pendingMineIndex = null;
let currentTheme = levelThemes[0];

const penguinBaseSpeed = 3.5;

function setStatus(message) {
  statusMessage.textContent = message;
}

function getUpgradeCost() {
  return 12 + (pickaxeLevel - 1) * 12;
}

function getGoldGain() {
  return pickaxeLevel;
}

function getBootsCost() {
  return 18 + (penguinSpeedLevel - 1) * 14;
}

function getPenguinSpeed() {
  return penguinBaseSpeed + (penguinSpeedLevel - 1) * 1.2;
}

function updateUI() {
  levelValue.textContent = level.toString();
  goldValue.textContent = gold.toString();
  coinValue.textContent = coins.toString();
  fishValue.textContent = fishFound.toString();
  pickaxeValue.textContent = `Lv ${pickaxeLevel}`;

  sellBtn.disabled = gold <= 0;
  const upgradeCost = getUpgradeCost();
  pickaxeCostEl.textContent = upgradeCost.toString();
  buyPickaxeBtn.disabled = coins < upgradeCost;

  const bootsCost = getBootsCost();
  bootsCostEl.textContent = bootsCost.toString();
  buyBootsBtn.disabled = coins < bootsCost;

  startBtn.textContent = running ? "Restart" : "Start Mining";
}

function createTile(type) {
  return { type, revealed: false };
}

function createIdleGrid() {
  tiles = [];
  for (let i = 0; i < grid.cols * grid.rows; i += 1) {
    tiles.push(createTile("rock"));
  }
}

function randomIndex(max) {
  return Math.floor(Math.random() * max);
}

function placeGold(count) {
  let placed = 0;
  while (placed < count) {
    const index = randomIndex(tiles.length);
    if (tiles[index].type === "rock") {
      tiles[index].type = "gold";
      placed += 1;
    }
  }
}

function generateMine() {
  tiles = [];
  for (let i = 0; i < grid.cols * grid.rows; i += 1) {
    tiles.push(createTile("rock"));
  }

  const fishIndex = randomIndex(tiles.length);
  tiles[fishIndex].type = "fish";

  const goldCount = Math.min(6 + level, 18);
  placeGold(goldCount);
}

function resetGame() {
  level = 1;
  gold = 0;
  coins = 0;
  fishFound = 0;
  pickaxeLevel = 1;
  penguinSpeedLevel = 1;
  running = true;
  currentTheme = levelThemes[0];
  generateMine();
  penguin = { x: 90, y: canvas.height - 90 };
  penguinTarget = null;
  pendingMineIndex = null;
  setStatus(`Level 1: ${currentTheme.name}`);
  updateUI();
}

function sellGold() {
  if (gold <= 0) {
    return;
  }
  coins += gold;
  setStatus(`Sold ${gold} gold for ${gold} coins.`);
  gold = 0;
  updateUI();
}

function buyPickaxe() {
  const cost = getUpgradeCost();
  if (coins < cost) {
    setStatus(`You need ${cost} coins to buy this upgrade.`);
    return;
  }
  coins -= cost;
  pickaxeLevel += 1;
  setStatus("Pickaxe upgraded! You mine more gold.");
  updateUI();
}

function buyBoots() {
  const cost = getBootsCost();
  if (coins < cost) {
    setStatus(`You need ${cost} coins for the speed boots.`);
    return;
  }
  coins -= cost;
  penguinSpeedLevel += 1;
  setStatus("Speed boots equipped! Your penguin moves faster.");
  updateUI();
}

function nextLevel() {
  fishFound += 1;
  level += 1;
  currentTheme = levelThemes[(level - 1) % levelThemes.length];
  generateMine();
  setStatus(`Level ${level}: ${currentTheme.name}`);
  updateUI();
  penguinTarget = null;
  pendingMineIndex = null;
}

function handleClick(event) {
  if (!running) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  const tileWidth = canvas.width / grid.cols;
  const tileHeight = canvas.height / grid.rows;
  const col = Math.floor(x / tileWidth);
  const row = Math.floor(y / tileHeight);

  if (col < 0 || col >= grid.cols || row < 0 || row >= grid.rows) {
    return;
  }

  const index = row * grid.cols + col;
  const tile = tiles[index];
  if (!tile || tile.revealed) {
    setStatus("That spot is already mined.");
    return;
  }

  const tileWidth = canvas.width / grid.cols;
  const tileHeight = canvas.height / grid.rows;
  const targetX = col * tileWidth + tileWidth / 2;
  const targetY = row * tileHeight + tileHeight / 2;

  penguinTarget = { x: targetX, y: targetY };
  pendingMineIndex = index;
  setStatus("Penguin is mining that spot...");
}

function mineTile(index) {
  const tile = tiles[index];
  if (!tile || tile.revealed) {
    return;
  }

  tile.revealed = true;

  if (tile.type === "gold") {
    const gain = getGoldGain();
    gold += gain;
    setStatus(`Gold found! +${gain} gold.`);
  } else if (tile.type === "fish") {
    nextLevel();
    return;
  } else {
    setStatus("Just rock here.");
  }

  updateUI();
}

function updatePenguin() {
  if (!penguinTarget) {
    return;
  }

  const dx = penguinTarget.x - penguin.x;
  const dy = penguinTarget.y - penguin.y;
  const distance = Math.hypot(dx, dy);
  const speed = getPenguinSpeed();

  if (distance <= speed) {
    penguin.x = penguinTarget.x;
    penguin.y = penguinTarget.y;
    const mineIndex = pendingMineIndex;
    penguinTarget = null;
    pendingMineIndex = null;
    if (mineIndex !== null) {
      mineTile(mineIndex);
    }
    return;
  }

  penguin.x += (dx / distance) * speed;
  penguin.y += (dy / distance) * speed;
}

function drawFish(centerX, centerY, size) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.fillStyle = currentTheme.fish;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.45, size * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(size * 0.45, 0);
  ctx.lineTo(size * 0.75, size * 0.2);
  ctx.lineTo(size * 0.75, -size * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#0f1118";
  ctx.beginPath();
  ctx.arc(-size * 0.15, -size * 0.05, size * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPenguin() {
  ctx.save();
  ctx.translate(penguin.x, penguin.y);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#0b0d12";
  ctx.beginPath();
  ctx.ellipse(0, 60, 36, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const bodyGradient = ctx.createRadialGradient(0, -10, 12, 0, 10, 70);
  bodyGradient.addColorStop(0, "#2a2f3b");
  bodyGradient.addColorStop(1, "#0f1118");
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.ellipse(0, 4, 42, 56, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.ellipse(-16, -10, 14, 22, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1d2230";
  ctx.beginPath();
  ctx.ellipse(-44, 6, 18, 28, -0.35, 0, Math.PI * 2);
  ctx.ellipse(44, 6, 18, 28, 0.35, 0, Math.PI * 2);
  ctx.fill();

  const bellyGradient = ctx.createRadialGradient(0, 22, 6, 0, 26, 40);
  bellyGradient.addColorStop(0, "#ffffff");
  bellyGradient.addColorStop(1, "#dbe2f0");
  ctx.fillStyle = bellyGradient;
  ctx.beginPath();
  ctx.ellipse(0, 20, 28, 38, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff9a3d";
  ctx.beginPath();
  ctx.ellipse(-16, 52, 14, 6, 0.05, 0, Math.PI * 2);
  ctx.ellipse(16, 52, 14, 6, -0.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#232835";
  ctx.beginPath();
  ctx.ellipse(0, -42, 24, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffb454";
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(16, -18);
  ctx.lineTo(0, -10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f5f6fb";
  ctx.beginPath();
  ctx.arc(-9, -32, 6, 0, Math.PI * 2);
  ctx.arc(9, -32, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1b1f2a";
  ctx.beginPath();
  ctx.arc(-9, -32, 3, 0, Math.PI * 2);
  ctx.arc(9, -32, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-7.5, -34, 1.4, 0, Math.PI * 2);
  ctx.arc(10.5, -34, 1.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -18, 12, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawTile(tile, col, row, tileWidth, tileHeight) {
  const x = col * tileWidth;
  const y = row * tileHeight;
  const padding = 4;
  const innerX = x + padding;
  const innerY = y + padding;
  const innerW = tileWidth - padding * 2;
  const innerH = tileHeight - padding * 2;

  ctx.fillStyle = tile.revealed
    ? currentTheme.tileRevealed
    : currentTheme.tileHidden;
  ctx.fillRect(innerX, innerY, innerW, innerH);
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.strokeRect(innerX, innerY, innerW, innerH);

  if (!tile.revealed) {
    return;
  }

  const centerX = x + tileWidth / 2;
  const centerY = y + tileHeight / 2;
  const size = Math.min(tileWidth, tileHeight) * 0.5;

  if (tile.type === "gold") {
    ctx.fillStyle = currentTheme.gold;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.stroke();
  } else if (tile.type === "fish") {
    drawFish(centerX, centerY, size);
  } else {
    ctx.fillStyle = currentTheme.rock;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = currentTheme.ground;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tileWidth = canvas.width / grid.cols;
  const tileHeight = canvas.height / grid.rows;

  tiles.forEach((tile, index) => {
    const col = index % grid.cols;
    const row = Math.floor(index / grid.cols);
    drawTile(tile, col, row, tileWidth, tileHeight);
  });

  ctx.fillStyle = currentTheme.accent;
  ctx.fillRect(0, canvas.height - 70, canvas.width, 70);

  drawPenguin();

  ctx.fillStyle = "#f5f6fb";
  ctx.font = "bold 18px 'Segoe UI', sans-serif";
  ctx.fillText(`Level ${level}`, canvas.width - 120, canvas.height - 28);
}

function render() {
  updatePenguin();
  draw();
  requestAnimationFrame(render);
}

canvas.addEventListener("click", handleClick);
startBtn.addEventListener("click", resetGame);
sellBtn.addEventListener("click", sellGold);
buyPickaxeBtn.addEventListener("click", buyPickaxe);
buyBootsBtn.addEventListener("click", buyBoots);

createIdleGrid();
updateUI();
render();
