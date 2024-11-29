/******************************************
 * Canvas Setup
 ******************************************/
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameRunning = false;
let score = 0;
let level = 1;
let lives = 3;
let timer = 120; // 2 minutes per level
let treasures = [];
let obstacles = [];
let bubbles = [];
let gameInterval;
let timerInterval;

/******************************************
 * Diver Object
 ******************************************/
const diver = {
  x: canvas.width / 4,
  y: canvas.height / 2,
  size: 50,
  color: "yellow",
  moveUp: false,
  moveDown: false,
  moveLeft: false,
  moveRight: false,
};

// Handle Diver Controls
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") diver.moveUp = true;
  if (e.key === "ArrowDown") diver.moveDown = true;
  if (e.key === "ArrowLeft") diver.moveLeft = true;
  if (e.key === "ArrowRight") diver.moveRight = true;
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowUp") diver.moveUp = false;
  if (e.key === "ArrowDown") diver.moveDown = false;
  if (e.key === "ArrowLeft") diver.moveLeft = false;
  if (e.key === "ArrowRight") diver.moveRight = false;
});

/******************************************
 * Bubble Animation Class
 ******************************************/
class Bubble {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + Math.random() * 200;
    this.size = Math.random() * 20 + 10;
    this.speed = Math.random() * 2 + 1;
  }

  move() {
    this.y -= this.speed;
    if (this.y < -this.size) {
      this.y = canvas.height + this.size;
      this.x = Math.random() * canvas.width;
    }
  }

  display() {
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/******************************************
 * Treasure and Obstacle Classes
 ******************************************/
class Treasure {
  constructor() {
    this.x = canvas.width + Math.random() * 200;
    this.y = Math.random() * canvas.height;
    this.size = 30;
  }

  move() {
    this.x -= 4 + level; // Speed increases with level
  }

  display() {
    ctx.fillStyle = "gold";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  collect() {
    const distance = Math.hypot(this.x - diver.x, this.y - diver.y);
    if (distance < this.size / 2 + diver.size / 2) {
      score += 10;
      return true;
    }
    return false;
  }
}

class Obstacle {
  constructor() {
    this.x = canvas.width + Math.random() * 200;
    this.y = Math.random() * canvas.height;
    this.size = 50;
  }

  move() {
    this.x -= 3 + level; // Speed increases with level
  }

  display() {
    ctx.fillStyle = "gray";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  checkCollision() {
    const distance = Math.hypot(this.x - diver.x, this.y - diver.y);
    if (distance < this.size / 2 + diver.size / 2) {
      return true;
    }
    return false;
  }
}

/******************************************
 * Game Loop
 ******************************************/
function update() {
  // Move diver
  if (diver.moveUp && diver.y > 0) diver.y -= 5;
  if (diver.moveDown && diver.y < canvas.height - diver.size) diver.y += 5;
  if (diver.moveLeft && diver.x > 0) diver.x -= 5;
  if (diver.moveRight && diver.x < canvas.width - diver.size) diver.x += 5;

  // Spawn treasures
  if (Math.random() < 0.02) treasures.push(new Treasure());

  // Spawn obstacles
  if (Math.random() < 0.015) obstacles.push(new Obstacle());

  // Spawn bubbles
  if (bubbles.length < 50) bubbles.push(new Bubble());

  // Update treasures
  treasures.forEach((treasure, index) => {
    treasure.move();
    treasure.display();
    if (treasure.collect()) {
      treasures.splice(index, 1);
    }
  });

  // Update obstacles
  obstacles.forEach((obstacle, index) => {
    obstacle.move();
    obstacle.display();
    if (obstacle.checkCollision()) {
      obstacles.splice(index, 1);
      loseLife();
    }
  });

  // Update and display bubbles
  bubbles.forEach((bubble) => {
    bubble.move();
    bubble.display();
  });

  // Draw diver
  ctx.fillStyle = diver.color;
  ctx.beginPath();
  ctx.arc(diver.x, diver.y, diver.size / 2, 0, Math.PI * 2);
  ctx.fill();
}

/******************************************
 * Timer
 ******************************************/
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!gameRunning) return; // Prevent timer from decrementing when paused
    timer--;
    if (timer <= 0) {
      clearInterval(timerInterval);
      nextLevelModal();
    }
    updateUI();
  }, 1000);
}

/******************************************
 * Pause and Play Logic
 ******************************************/
const pauseButton = document.createElement("button");
pauseButton.id = "pauseBtn";
pauseButton.textContent = "Pause";
pauseButton.style.display = "none"; // Initially hidden
document.body.appendChild(pauseButton);

pauseButton.addEventListener("click", () => {
  if (gameRunning) {
    pauseGame();
    pauseButton.textContent = "Play";
  } else {
    resumeGame();
    pauseButton.textContent = "Pause";
  }
});

function pauseGame() {
  gameRunning = false;
  clearInterval(gameInterval);
  clearInterval(timerInterval);
}

function resumeGame() {
  gameRunning = true;
  startTimer();
  gameInterval = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
  }, 16);
}

/******************************************
 * Lives and Modals
 ******************************************/
function loseLife() {
  lives--;
  pauseGame(); // Pause game on losing life
  if (lives > 0) {
    showLifeModal();
  } else {
    showGameOverModal();
  }
}

function showLifeModal() {
  const modal = document.getElementById("modal");
  modal.innerHTML = `
    <h2>You Crashed!</h2>
    <p>Lives Remaining: ${lives}</p>
    <button onclick="closeModal(); resumeGame()">Continue</button>
  `;
  modal.style.display = "block";
}

function showGameOverModal() {
  pauseGame();
  const modal = document.getElementById("modal");
  modal.innerHTML = `
    <h2>Game Over!</h2>
    <p>Final Score: ${score}</p>
    <p>Level Reached: ${level}</p>
    <button onclick="closeModal(); restartGame()">Restart</button>
  `;
  modal.style.display = "block";
}

function nextLevelModal() {
  pauseGame();
  const modal = document.getElementById("modal");
  modal.innerHTML = `
    <h2>Level ${level} Completed!</h2>
    <p>Current Score: ${score}</p>
    <button onclick="closeModal(); nextLevel()">Next Level</button>
    <button onclick="closeModal(); restartGame()">Restart</button>
  `;
  modal.style.display = "block";
}

/******************************************
 * Start, Restart, Next Level
 ******************************************/
function startGame() {
  gameRunning = true;
  document.getElementById("startBtn").style.display = "none"; // Hide Start Button
  pauseButton.style.display = "block"; // Show Pause Button
  resetGame();
  closeModal();
  gameInterval = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
  }, 16);
}

function restartGame() {
  document.getElementById("startBtn").style.display = "block"; // Show Start Button
  pauseButton.style.display = "none"; // Hide Pause Button
  resetGame();
}

function resetGame() {
  lives = 3;
  score = 0;
  level = 1;
  timer = 120;
  treasures = [];
  obstacles = [];
  bubbles = [];
  updateUI();
}

function nextLevel() {
  level++;
  timer = 120;
  treasures = [];
  obstacles = [];
  closeModal();
  startTimer();
  gameInterval = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
  }, 16);
}

/******************************************
 * UI and Modal Controls
 ******************************************/
function updateUI() {
  document.getElementById("score").textContent = `Score: ${score}`;
  document.getElementById("level").textContent = `Level: ${level}`;
  document.getElementById("lives").textContent = `Lives: ${lives}`;
  document.getElementById("timer").textContent = `Time: ${timer}s`;
}

function closeModal() {
  const modal = document.getElementById("modal");
  modal.style.display = "none";
}

/******************************************
 * Initialize Game
 ******************************************/
document.getElementById("startBtn").addEventListener("click", startGame);
updateUI();





















