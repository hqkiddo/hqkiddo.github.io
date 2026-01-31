const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

const timeLeftEl = document.getElementById("timeLeft");
const gemCountEl = document.getElementById("gemCount");
const foundCountEl = document.getElementById("foundCount");
const targetNameEl = document.getElementById("targetName");
const statusMessageEl = document.getElementById("statusMessage");
const modeSelect = document.getElementById("modeSelect");
const startBtn = document.getElementById("startBtn");
const hintBtn = document.getElementById("hintBtn");
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
];

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
  const count = 9;
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

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, sceneHeight);
  gradient.addColorStop(0, "#87c5ff");
  gradient.addColorStop(1, "#f9f0d6");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, sceneWidth, sceneHeight);

  ctx.fillStyle = "#b4e4b7";
  ctx.beginPath();
  ctx.ellipse(150, 460, 220, 120, 0, 0, Math.PI * 2);
  ctx.ellipse(600, 520, 300, 140, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  for (let i = 0; i < 5; i += 1) {
    const x = 120 + i * 150;
    const y = 80 + (i % 2) * 30;
    ctx.beginPath();
    ctx.ellipse(x, y, 50, 22, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 40, y + 8, 38, 18, 0, 0, Math.PI * 2);
    ctx.fill();
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

function drawMagnifier() {
  const radius = magnifierRadii[magnifierLevel];
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${clarityAlpha[clarityLevel]})`;
  ctx.fillRect(0, 0, sceneWidth, sceneHeight);
  ctx.globalCompositeOperation = "destination-out";
  const gradient = ctx.createRadialGradient(
    pointer.x,
    pointer.y,
    radius * 0.4,
    pointer.x,
    pointer.y,
    radius
  );
  gradient.addColorStop(0, "rgba(0,0,0,1)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, sceneWidth, sceneHeight);
  drawBackground();
  items.forEach(drawItem);
  drawHint();
  drawMagnifier();
  requestAnimationFrame(render);
}

canvas.addEventListener("mousemove", handlePointerMove);
canvas.addEventListener("click", handleClick);
canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
startBtn.addEventListener("click", startGame);
hintBtn.addEventListener("click", handleHint);
upgradeMagnifierBtn.addEventListener("click", upgradeMagnifier);
upgradeClarityBtn.addEventListener("click", upgradeClarity);

updateUI();
render();
