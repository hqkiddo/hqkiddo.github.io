const canvas = document.getElementById("mineCanvas");
const ctx = canvas.getContext("2d");

const levelValue = document.getElementById("levelValue");
const ironValue = document.getElementById("ironValue");
const silverValue = document.getElementById("silverValue");
const goldValue = document.getElementById("goldValue");
const crystalValue = document.getElementById("crystalValue");
const fishValue = document.getElementById("fishValue");
const pickaxeValue = document.getElementById("pickaxeValue");
const statusMessage = document.getElementById("statusMessage");
const startBtn = document.getElementById("startBtn");
const pickaxeButtons = Array.from(
  document.querySelectorAll("[data-pickaxe]")
);

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
    iron: "#b8c2cf",
    silver: "#d7dde6",
    gold: "#f2c14e",
    crystal: "#8fd3ff",
    fish: "#6ac7ff",
    accent: "rgba(255,255,255,0.12)",
  },
  {
    name: "Jungle Mine",
    ground: "#0d1612",
    tileHidden: "#3f5b3f",
    tileRevealed: "#2a3b2a",
    rock: "#7f8f6b",
    iron: "#9cab8c",
    silver: "#cbd6c2",
    gold: "#e0b14f",
    crystal: "#7fd7ff",
    fish: "#74d0ff",
    accent: "rgba(122, 180, 120, 0.18)",
  },
  {
    name: "Desert Dig",
    ground: "#19130a",
    tileHidden: "#7b5a3a",
    tileRevealed: "#3b2a1b",
    rock: "#b49a7c",
    iron: "#c8ad8f",
    silver: "#e0d4c6",
    gold: "#ffcb5c",
    crystal: "#9ad9ff",
    fish: "#7fd3ff",
    accent: "rgba(255, 210, 140, 0.16)",
  },
  {
    name: "Volcano Shaft",
    ground: "#140c0c",
    tileHidden: "#6a2a2a",
    tileRevealed: "#311818",
    rock: "#a07a7a",
    iron: "#b28d8d",
    silver: "#d1b6b6",
    gold: "#ffb347",
    crystal: "#8ecbff",
    fish: "#7bcaff",
    accent: "rgba(255, 120, 90, 0.18)",
  },
  {
    name: "Crystal Cavern",
    ground: "#0c0d18",
    tileHidden: "#4a4d7a",
    tileRevealed: "#2a2c47",
    rock: "#9aa0ff",
    iron: "#b9c0ff",
    silver: "#d7ddff",
    gold: "#f0d17a",
    crystal: "#a2f1ff",
    fish: "#88e0ff",
    accent: "rgba(120, 140, 255, 0.18)",
  },
];

const pickaxeTiers = [
  {
    name: "Wood Pickaxe",
    power: 1,
    cost: { iron: 0, silver: 0, gold: 0, crystal: 0 },
  },
  {
    name: "Stone Pickaxe",
    power: 2,
    cost: { iron: 6, silver: 0, gold: 0, crystal: 0 },
  },
  {
    name: "Iron Pickaxe",
    power: 3,
    cost: { iron: 10, silver: 4, gold: 0, crystal: 0 },
  },
  {
    name: "Gold Pickaxe",
    power: 4,
    cost: { iron: 8, silver: 6, gold: 4, crystal: 0 },
  },
  {
    name: "Crystal Pickaxe",
    power: 5,
    cost: { iron: 10, silver: 8, gold: 6, crystal: 2 },
  },
];

let tiles = [];
let level = 1;
let materials = { iron: 0, silver: 0, gold: 0, crystal: 0 };
let fishFound = 0;
let pickaxeLevel = 0;
let running = false;
let penguin = { x: 90, y: canvas.height - 90 };
let penguinTarget = null;
let pendingMineIndex = null;
let currentTheme = levelThemes[0];

const penguinSpeed = 3.5;

function setStatus(message) {
  statusMessage.textContent = message;
}

function getGoldGain() {
  return pickaxeTiers[pickaxeLevel].power;
}

function updateUI() {
  levelValue.textContent = level.toString();
  ironValue.textContent = materials.iron.toString();
  silverValue.textContent = materials.silver.toString();
  goldValue.textContent = materials.gold.toString();
  crystalValue.textContent = materials.crystal.toString();
  fishValue.textContent = fishFound.toString();
  pickaxeValue.textContent = pickaxeTiers[pickaxeLevel].name;

  pickaxeButtons.forEach((button) => {
    const tier = Number(button.dataset.pickaxe);
    const isOwned = tier <= pickaxeLevel;
    const cost = pickaxeTiers[tier].cost;
    const canAfford =
      materials.iron >= cost.iron &&
      materials.silver >= cost.silver &&
      materials.gold >= cost.gold &&
      materials.crystal >= cost.crystal;
    button.disabled = isOwned || !canAfford;
    button.textContent = isOwned ? "Owned" : "Buy";
  });

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

function placeMaterial(type, count) {
  let placed = 0;
  while (placed < count) {
    const index = randomIndex(tiles.length);
    if (tiles[index].type === "rock") {
      tiles[index].type = type;
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

  const ironCount = Math.min(10 + level * 2, 22);
  const silverCount = Math.min(4 + Math.floor(level / 2), 12);
  const goldCount = Math.min(2 + Math.floor(level / 3), 8);
  const crystalCount = Math.min(Math.floor(level / 4), 5);
  placeMaterial("iron", ironCount);
  placeMaterial("silver", silverCount);
  placeMaterial("gold", goldCount);
  if (crystalCount > 0) {
    placeMaterial("crystal", crystalCount);
  }
}

function resetGame() {
  level = 1;
  materials = { iron: 0, silver: 0, gold: 0, crystal: 0 };
  fishFound = 0;
  pickaxeLevel = 0;
  running = true;
  currentTheme = levelThemes[0];
  generateMine();
  penguin = { x: 90, y: canvas.height - 90 };
  penguinTarget = null;
  pendingMineIndex = null;
  setStatus(`Level 1: ${currentTheme.name}`);
  updateUI();
}

function buyPickaxe(tier) {
  if (tier <= pickaxeLevel || tier >= pickaxeTiers.length) {
    return;
  }
  const cost = pickaxeTiers[tier].cost;
  if (
    materials.iron < cost.iron ||
    materials.silver < cost.silver ||
    materials.gold < cost.gold ||
    materials.crystal < cost.crystal
  ) {
    setStatus("You need more materials to buy that pickaxe.");
    return;
  }
  materials.iron -= cost.iron;
  materials.silver -= cost.silver;
  materials.gold -= cost.gold;
  materials.crystal -= cost.crystal;
  pickaxeLevel = tier;
  setStatus(`${pickaxeTiers[tier].name} equipped!`);
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

  if (tile.type === "iron") {
    const gain = getGoldGain();
    materials.iron += gain;
    setStatus(`Iron found! +${gain}`);
  } else if (tile.type === "silver") {
    const gain = getGoldGain();
    materials.silver += gain;
    setStatus(`Silver found! +${gain}`);
  } else if (tile.type === "gold") {
    const gain = getGoldGain();
    materials.gold += gain;
    setStatus(`Gold found! +${gain}`);
  } else if (tile.type === "crystal") {
    const gain = getGoldGain();
    materials.crystal += gain;
    setStatus(`Crystal found! +${gain}`);
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
  const speed = penguinSpeed;

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
  const bodyGradient = ctx.createLinearGradient(
    -size * 0.5,
    0,
    size * 0.6,
    0
  );
  bodyGradient.addColorStop(0, "#3aa6ff");
  bodyGradient.addColorStop(1, currentTheme.fish);
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.48, size * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.ellipse(-size * 0.12, -size * 0.1, size * 0.18, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = currentTheme.fish;
  ctx.beginPath();
  ctx.moveTo(size * 0.45, 0);
  ctx.lineTo(size * 0.75, size * 0.22);
  ctx.lineTo(size * 0.75, -size * 0.22);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-size * 0.05, 0);
  ctx.lineTo(size * 0.2, 0);
  ctx.stroke();

  ctx.fillStyle = "#0f1118";
  ctx.beginPath();
  ctx.arc(-size * 0.22, -size * 0.06, size * 0.045, 0, Math.PI * 2);
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

  const tileGradient = ctx.createLinearGradient(innerX, innerY, innerX, innerY + innerH);
  tileGradient.addColorStop(0, tile.revealed ? currentTheme.tileRevealed : currentTheme.tileHidden);
  tileGradient.addColorStop(1, "rgba(0,0,0,0.2)");
  ctx.fillStyle = tileGradient;
  ctx.fillRect(innerX, innerY, innerW, innerH);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.strokeRect(innerX, innerY, innerW, innerH);

  if (!tile.revealed) {
    return;
  }

  const centerX = x + tileWidth / 2;
  const centerY = y + tileHeight / 2;
  const size = Math.min(tileWidth, tileHeight) * 0.5;

  if (tile.type === "iron") {
    const oreGradient = ctx.createRadialGradient(
      centerX - size * 0.1,
      centerY - size * 0.1,
      size * 0.1,
      centerX,
      centerY,
      size * 0.35
    );
    oreGradient.addColorStop(0, "#f2f5f8");
    oreGradient.addColorStop(1, currentTheme.iron);
    ctx.fillStyle = oreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.stroke();
  } else if (tile.type === "silver") {
    const oreGradient = ctx.createRadialGradient(
      centerX - size * 0.12,
      centerY - size * 0.12,
      size * 0.08,
      centerX,
      centerY,
      size * 0.36
    );
    oreGradient.addColorStop(0, "#ffffff");
    oreGradient.addColorStop(1, currentTheme.silver);
    ctx.fillStyle = oreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.stroke();
  } else if (tile.type === "gold") {
    const oreGradient = ctx.createRadialGradient(
      centerX - size * 0.1,
      centerY - size * 0.1,
      size * 0.08,
      centerX,
      centerY,
      size * 0.38
    );
    oreGradient.addColorStop(0, "#fff2b0");
    oreGradient.addColorStop(1, currentTheme.gold);
    ctx.fillStyle = oreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.stroke();
  } else if (tile.type === "crystal") {
    const crystalGradient = ctx.createLinearGradient(
      centerX - size * 0.2,
      centerY - size * 0.2,
      centerX + size * 0.2,
      centerY + size * 0.2
    );
    crystalGradient.addColorStop(0, "#e6fbff");
    crystalGradient.addColorStop(1, currentTheme.crystal);
    ctx.fillStyle = crystalGradient;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - size * 0.28);
    ctx.lineTo(centerX + size * 0.2, centerY);
    ctx.lineTo(centerX, centerY + size * 0.28);
    ctx.lineTo(centerX - size * 0.2, centerY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.stroke();
  } else if (tile.type === "fish") {
    drawFish(centerX, centerY, size);
  } else {
    const rockGradient = ctx.createRadialGradient(
      centerX - size * 0.08,
      centerY - size * 0.1,
      size * 0.08,
      centerX,
      centerY,
      size * 0.28
    );
    rockGradient.addColorStop(0, "#ffffff");
    rockGradient.addColorStop(1, currentTheme.rock);
    ctx.fillStyle = rockGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const groundGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  groundGradient.addColorStop(0, currentTheme.ground);
  groundGradient.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = groundGradient;
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

  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

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
pickaxeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tier = Number(button.dataset.pickaxe);
    buyPickaxe(tier);
  });
});

createIdleGrid();
updateUI();
render();
