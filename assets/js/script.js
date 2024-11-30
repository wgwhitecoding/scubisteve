document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let gameRunning = false;
  let score = 0;
  let highestScore = 0;
  let level = 1;
  let lives = 3;
  let timer = 120;
  let treasures = [];
  let obstacles = [];
  let bubbles = [];
  let fishes = [];
  let timerInterval;
  let modalOpen = false;
  let invincible = false;
  let animationFrameRequest;

  const diver = {
      x: canvas.width / 4,
      y: canvas.height / 2,
      size: 50,
      color: "yellow",
      velocity: { x: 0, y: 0 },
      speed: 2.5,
      moveUp: false,
      moveDown: false,
      moveLeft: false,
      moveRight: false,
  };

  window.addEventListener("keydown", (e) => {
      if (modalOpen) return;

      if (e.key === "ArrowUp") diver.moveUp = true;
      if (e.key === "ArrowDown") diver.moveDown = true;
      if (e.key === "ArrowLeft") diver.moveLeft = true;
      if (e.key === "ArrowRight") diver.moveRight = true;
      if (e.key === " ") togglePause();
  });

  window.addEventListener("keyup", (e) => {
      if (modalOpen) return;

      if (e.key === "ArrowUp") diver.moveUp = false;
      if (e.key === "ArrowDown") diver.moveDown = false;
      if (e.key === "ArrowLeft") diver.moveLeft = false;
      if (e.key === "ArrowRight") diver.moveRight = false;
  });

  class Bubble {
      constructor() {
          this.x = Math.random() * canvas.width;
          this.y = canvas.height + Math.random() * 200;
          this.size = Math.random() * 20 + 10;
          this.speed = Math.random() * 0.5 + 0.5;
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

  class Treasure {
      constructor() {
          this.x = canvas.width + Math.random() * 200;
          this.y = Math.random() * canvas.height;
          this.size = 30;
      }

      move() {
          this.x -= 0.5 + level * 0.2;
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
          this.x -= 0.5 + level * 0.2;
      }

      display() {
          ctx.fillStyle = "gray";
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
          ctx.fill();
      }

      checkCollision() {
          if (invincible) return false;
          const distance = Math.hypot(this.x - diver.x, this.y - diver.y);
          if (distance < this.size / 2 + diver.size / 2) {
              return true;
          }
          return false;
      }
  }

  class Fish {
      constructor() {
          this.x = canvas.width + Math.random() * 300;
          this.y = Math.random() * canvas.height;
          this.size = Math.random() * 30 + 20;
          this.speed = Math.random() * 0.5 + 0.8;
      }

      move() {
          this.x -= this.speed;
          if (this.x < -this.size) {
              this.x = canvas.width + this.size;
              this.y = Math.random() * canvas.height;
          }
      }

      display() {
          ctx.fillStyle = "orange";
          ctx.beginPath();
          ctx.ellipse(this.x, this.y, this.size, this.size / 2, 0, 0, Math.PI * 2);
          ctx.fill();
      }
  }

  function startTimer() {
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
          if (!gameRunning) return;
          timer--;
          if (timer <= 0) {
              timer = 0;
              clearInterval(timerInterval);
              pauseGame();
              nextLevelModal();
          }
          updateUI();
      }, 1000);
  }

  function update() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      bubbles.forEach((bubble) => {
          bubble.move();
          bubble.display();
      });

      fishes.forEach((fish) => {
          fish.move();
          fish.display();
      });

      if (!gameRunning) {
          animationFrameRequest = requestAnimationFrame(update);
          return;
      }

      diver.velocity.x = 0;
      diver.velocity.y = 0;
      if (diver.moveUp) diver.velocity.y = -diver.speed;
      if (diver.moveDown) diver.velocity.y = diver.speed;
      if (diver.moveLeft) diver.velocity.x = -diver.speed;
      if (diver.moveRight) diver.velocity.x = diver.speed;

      diver.x += diver.velocity.x;
      diver.y += diver.velocity.y;

      if (diver.y < 0) diver.y = 0;
      if (diver.y > canvas.height - diver.size) diver.y = canvas.height - diver.size;
      if (diver.x < 0) diver.x = 0;
      if (diver.x > canvas.width - diver.size) diver.x = canvas.width - diver.size;

      if (Math.random() < 0.01) treasures.push(new Treasure());
      if (Math.random() < 0.01) obstacles.push(new Obstacle());
      if (bubbles.length < 30) bubbles.push(new Bubble());
      if (fishes.length < 10) fishes.push(new Fish());

      treasures.forEach((treasure, index) => {
          treasure.move();
          treasure.display();
          if (treasure.collect()) {
              treasures.splice(index, 1);
          }
      });

      obstacles.forEach((obstacle, index) => {
          obstacle.move();
          obstacle.display();
          if (obstacle.checkCollision()) {
              obstacles.splice(index, 1);
              loseLife();
          }
      });

      ctx.fillStyle = diver.color;
      ctx.beginPath();
      ctx.arc(diver.x, diver.y, diver.size / 2, 0, Math.PI * 2);
      ctx.fill();

      animationFrameRequest = requestAnimationFrame(update);
  }

  function loseLife() {
      lives--;
      pauseGame();
      if (lives > 0) {
          showLifeModal();
      } else {
          showGameOverModal();
      }
  }

  function showLifeModal() {
      modalOpen = true;
      disableButtons();

      const modal = document.getElementById("modal");
      modal.innerHTML = `
          <h2>You Crashed!</h2>
          <p>Lives Remaining: <span style='font-size: 1.5em;'>${'🤿'.repeat(lives)}</span></p>
          <button id="continueBtn">Continue</button>
      `;
      modal.style.display = "block";

      document.getElementById("continueBtn").addEventListener("click", () => {
          closeModal();
          resetDiverPosition();
          diver.velocity.x = 0;
          diver.velocity.y = 0;
          diver.moveUp = diver.moveDown = diver.moveLeft = diver.moveRight = false;
          makeInvincible();
          resumeGame();
      });
  }

  function showGameOverModal() {
      modalOpen = true;
      disableButtons();

      highestScore = Math.max(highestScore, score);
      pauseGame();
      const modal = document.getElementById("modal");
      modal.innerHTML = `
          <h2>Game Over!</h2>
          <p>Final Score: ${score}</p>
          <p>Level Reached: ${level}</p>
          <button id="restartBtn">Restart</button>
      `;
      modal.style.display = "block";

      document.getElementById("restartBtn").addEventListener("click", () => {
          closeModal();
          showStartGameModal();
      });
  }

  function nextLevelModal() {
      modalOpen = true;
      disableButtons();

      const modal = document.getElementById("modal");
      modal.innerHTML = `
          <h2>Level ${level} Completed!</h2>
          <p>Current Score: ${score}</p>
          <button id="nextLevelBtn">Next Level</button>
      `;
      modal.style.display = "block";

      document.getElementById("nextLevelBtn").addEventListener("click", () => {
          closeModal();
          resetDiverPosition();
          diver.velocity.x = 0;
          diver.velocity.y = 0;
          diver.moveUp = diver.moveDown = diver.moveLeft = diver.moveRight = false;
          makeInvincible();
          nextLevel();
      });
  }

  function showStartGameModal() {
      modalOpen = true;
      disableButtons();

      const modal = document.getElementById("modal");
      modal.innerHTML = `
          <h2>Welcome to Scubi Steve Adventures!</h2>
          <img src="assets/images/scubi_steve.png" alt="Scubi Steve" style="width: 100%; max-width: 300px; margin: 20px auto; display: block;">
          <button id="startBtnModal">Start Game</button>
      `;
      modal.style.display = "block";

      document.getElementById("startBtnModal").addEventListener("click", () => {
          closeModal();
          startGame();
      });
  }

  const pauseButton = document.createElement("button");
  pauseButton.id = "pauseBtn";
  pauseButton.textContent = "Pause";
  pauseButton.style.display = "none";
  document.body.appendChild(pauseButton);

  pauseButton.addEventListener("click", () => {
      if (modalOpen) return;
      togglePause();
  });

  function togglePause() {
      if (gameRunning) {
          pauseGame();
          pauseButton.textContent = "Play";
      } else {
          resumeGame();
          pauseButton.textContent = "Pause";
      }
  }

  function pauseGame() {
      gameRunning = false;
      clearInterval(timerInterval);
      cancelAnimationFrame(animationFrameRequest);
  }

  function resumeGame() {
      gameRunning = true;
      startTimer();
      update();
  }

  function startGame() {
      resetGame();
      gameRunning = true;
      pauseButton.style.display = "block";
      closeModal();
      makeInvincible();
      startTimer();
      update();
  }

  function restartGame() {
      highestScore = Math.max(highestScore, score);
      pauseButton.style.display = "none";
      resetGame();
  }

  function resetGame() {
      gameRunning = false;
      score = 0;
      level = 1;
      lives = 3;
      timer = 120;
      treasures = [];
      obstacles = [];
      bubbles = [];
      fishes = [];
      clearInterval(timerInterval);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      resetDiverPosition();
      updateUI();
  }

  function resetDiverPosition() {
      diver.x = canvas.width / 4;
      diver.y = canvas.height / 2;
      diver.velocity.x = 0;
      diver.velocity.y = 0;
      diver.moveUp = diver.moveDown = diver.moveLeft = diver.moveRight = false;
  }

  function nextLevel() {
      if (level < 10) {
          level++;
          timer = 120;
          treasures = [];
          obstacles = [];
          closeModal();
          makeInvincible();
          startTimer();
          update();
      } else {
          showGameOverModal();
      }
  }

  function updateUI() {
      document.getElementById("score").textContent = `Score: ${score}`;
      document.getElementById("highestScore").textContent = `Highest Score: ${highestScore}`;
      document.getElementById("level").textContent = `Level: ${level}`;
      document.getElementById("lives").innerHTML = `Lives: <span style='font-size: 1.5em;'>${'🤿'.repeat(lives)}</span>`;
      document.getElementById("timer").textContent = `Time: ${timer}s`;
  }

  function closeModal() {
      modalOpen = false;
      enableButtons();
      const modal = document.getElementById("modal");
      modal.style.display = "none";
  }

  function disableButtons() {
      pauseButton.disabled = true;
  }

  function enableButtons() {
      pauseButton.disabled = false;
  }

  function makeInvincible() {
      invincible = true;
      let flashCount = 0;
      const flashInterval = setInterval(() => {
          diver.color = diver.color === "yellow" ? "transparent" : "yellow";
          flashCount++;
          if (flashCount >= 6) {
              clearInterval(flashInterval);
              diver.color = "yellow";
              invincible = false;
          }
      }, 500);
  }

  showStartGameModal();
  updateUI();
  update(); // Keep bubbles animating in the background
});








































