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
const upgradeBtn = document.getElementById("upgradeBtn");

const grid = {
  cols: 10,
  rows: 6,
};

let tiles = [];
let level = 1;
let gold = 0;
let coins = 0;
let fishFound = 0;
let pickaxeLevel = 1;
let running = false;

function setStatus(message) {
  statusMessage.textContent = message;
}

function getUpgradeCost() {
  return 12 + (pickaxeLevel - 1) * 12;
}

function getGoldGain() {
  return pickaxeLevel;
}

function updateUI() {
  levelValue.textContent = level.toString();
  goldValue.textContent = gold.toString();
  coinValue.textContent = coins.toString();
  fishValue.textContent = fishFound.toString();
  pickaxeValue.textContent = `Lv ${pickaxeLevel}`;

  sellBtn.disabled = gold <= 0;
  const upgradeCost = getUpgradeCost();
  upgradeBtn.textContent = `Upgrade Pickaxe (${upgradeCost} coins)`;
  upgradeBtn.disabled = coins < upgradeCost;
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
  running = true;
  generateMine();
  setStatus("Level 1: start mining!");
  updateUI();
  draw();
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

function upgradePickaxe() {
  const cost = getUpgradeCost();
  if (coins < cost) {
    setStatus(`You need ${cost} coins to upgrade.`);
    return;
  }
  coins -= cost;
  pickaxeLevel += 1;
  setStatus("Pickaxe upgraded! You mine more gold.");
  updateUI();
}

function nextLevel() {
  fishFound += 1;
  level += 1;
  generateMine();
  setStatus(`Fish found! Welcome to level ${level}.`);
  updateUI();
  draw();
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
  draw();
}

function drawFish(centerX, centerY, size) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.fillStyle = "#6ac7ff";
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
  ctx.translate(90, canvas.height - 90);
  ctx.fillStyle = "#1d2230";
  ctx.beginPath();
  ctx.ellipse(0, 0, 40, 52, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f5f6fb";
  ctx.beginPath();
  ctx.ellipse(0, 10, 26, 36, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffb454";
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(10, 0);
  ctx.lineTo(0, 6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f5f6fb";
  ctx.beginPath();
  ctx.arc(-12, -16, 4, 0, Math.PI * 2);
  ctx.arc(12, -16, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0f1118";
  ctx.beginPath();
  ctx.arc(-12, -16, 2, 0, Math.PI * 2);
  ctx.arc(12, -16, 2, 0, Math.PI * 2);
  ctx.fill();
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

  ctx.fillStyle = tile.revealed ? "#2c303a" : "#6a4b2f";
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
    ctx.fillStyle = "#f2c14e";
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.stroke();
  } else if (tile.type === "fish") {
    drawFish(centerX, centerY, size);
  } else {
    ctx.fillStyle = "#80889b";
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0f1118";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tileWidth = canvas.width / grid.cols;
  const tileHeight = canvas.height / grid.rows;

  tiles.forEach((tile, index) => {
    const col = index % grid.cols;
    const row = Math.floor(index / grid.cols);
    drawTile(tile, col, row, tileWidth, tileHeight);
  });

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(0, canvas.height - 70, canvas.width, 70);

  drawPenguin();

  ctx.fillStyle = "#f5f6fb";
  ctx.font = "bold 18px 'Segoe UI', sans-serif";
  ctx.fillText(`Level ${level}`, canvas.width - 120, canvas.height - 28);
}

canvas.addEventListener("click", handleClick);
startBtn.addEventListener("click", resetGame);
sellBtn.addEventListener("click", sellGold);
upgradeBtn.addEventListener("click", upgradePickaxe);

createIdleGrid();
updateUI();
draw();
