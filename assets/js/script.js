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
    let isFlashing = false; // Declare it once globally
 
    const diver = {
        x: canvas.width / 4,
        y: canvas.height / 2,
        size: 150,  // Keep the size, but it's not used for image height/width
        image: new Image(),
        velocity: { x: 0, y: 0 },
        speed: 2.5,
        moveUp: false,
        moveDown: false,
        moveLeft: false,
        moveRight: false,
    };
    diver.image.src = "assets/images/scubi_steve.png";
    
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
            this.size = 70;
            this.image = new Image();
            this.image.src = "assets/images/coin.png";
        }
  
        move() {
            this.x -= 0.5 + level * 0.2;
        }
  
        display() {
            ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
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
            this.x = canvas.width + Math.random() * 200; // Initial position on the canvas
            this.y = Math.random() * canvas.height; // Initial vertical position
            this.size = 60;  // Set the size of the obstacle (square size for the image)
            this.image = new Image();
            const imageChoice = Math.random() < 0.5 ? "shark.png" : "octopus.png"; // Randomly choose image
            this.image.src = `assets/images/${imageChoice}`;
        
            this.loaded = false;
            this.image.onload = () => {
                this.loaded = true;  // Set the flag to true once the image is loaded
            };
        }
    
        move() {
            this.x -= 0.5 + level * 0.2;  // Move the obstacle from right to left
        }
    
        display() {
            if (this.loaded) {
                // Draw the image at the correct position based on the size
                ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
            }
        }
    
        // Adjusted collision check to ONLY use the image's bounding box (NO circles)
        checkCollision() {
            if (invincible) return false;  // Skip collision if the diver is invincible
        
            // Get the bounding box for the obstacle image
            const obstacleLeft = this.x;
            const obstacleRight = this.x + this.size;
            const obstacleTop = this.y;
            const obstacleBottom = this.y + this.size;
        
            // Get the diver's bounding box
            const diverLeft = diver.x;
            const diverRight = diver.x + diver.size;
            const diverTop = diver.y;
            const diverBottom = diver.y + diver.size;
    
            // Check if the diver's bounding box intersects with the obstacle's bounding box
            const collisionDetected = !(diverRight < obstacleLeft || 
                                        diverLeft > obstacleRight || 
                                        diverBottom < obstacleTop || 
                                        diverTop > obstacleBottom);
    
            return collisionDetected;  // Return true if a collision has occurred
        }
    }
    
    class Fish {
        constructor() {
            this.x = canvas.width + Math.random() * 300;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 50 + 30;  // Bigger fish size
            this.speed = Math.random() * 0.5 + 0.8;
    
            const fishImages = [
                "assets/images/fish1.png", "assets/images/fish2.png", "assets/images/fish3.png",
                "assets/images/fish4.png", "assets/images/fish5.png", "assets/images/fish6.png",
                "assets/images/fish7.png", "assets/images/fish8.png", "assets/images/fish9.png",
                "assets/images/fish10.png", "assets/images/fish11.png"
            ];
    
            this.image = new Image();
            this.image.src = fishImages[Math.floor(Math.random() * fishImages.length)];
        }
    
        move() {
            this.x -= this.speed;
            if (this.x < -this.size) {
                this.x = canvas.width + this.size;
                this.y = Math.random() * canvas.height;
            }
        }
    
        display() {
            ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
        }
    }
    
    // In the update function:
    if (Math.random() < 0.05) fishes.push(new Fish());  // More frequent fish spawn
    
    
  
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
  
// Function to make the diver flash for 5 seconds
function makeInvincible() {
    invincible = true;
    isFlashing = true; // Start the flashing effect immediately

    let flashCount = 0;
    const flashDuration = 500; // 500ms (half a second) for each flash
    const flashLimit = 10; // 5 seconds / 500ms per flash = 10 flashes

    // Flashing interval
    const flashInterval = setInterval(() => {
        flashCount++;

        // Toggle the flashing state
        isFlashing = !isFlashing;

        // Stop flashing after 5 seconds
        if (flashCount >= flashLimit) {
            clearInterval(flashInterval);
            isFlashing = false; // Ensure diver stops flashing
            invincible = false;
        }
    }, flashDuration);
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bubbles, fishes, treasures, obstacles
    bubbles.forEach((bubble) => {
        bubble.move();
        bubble.display();
    });

    fishes.forEach((fish) => {
        fish.move();
        fish.display();
    });

    // If the game is paused, display the paused message, and the score
    if (!gameRunning) {
        ctx.font = '48px retro-font';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME PAUSED', canvas.width / 2, canvas.height / 2);

        // Draw the score (even when the game is paused)
        ctx.font = '30px retro-font';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 100);

        // Continue the animation loop even while paused to display the message
        animationFrameRequest = requestAnimationFrame(update);
        return;
    }

    // Normal game logic (when game is running)
    diver.velocity.x = 0;
    diver.velocity.y = 0;
    if (diver.moveUp) diver.velocity.y = -diver.speed;
    if (diver.moveDown) diver.velocity.y = diver.speed;
    if (diver.moveLeft) diver.velocity.x = -diver.speed;
    if (diver.moveRight) diver.velocity.x = diver.speed;

    diver.x += diver.velocity.x;
    diver.y += diver.velocity.y;

    // Prevent diver from moving out of bounds
    if (diver.y < 0) diver.y = 0;
    if (diver.y > canvas.height - diver.size) diver.y = canvas.height - diver.size;
    if (diver.x < 0) diver.x = 0;
    if (diver.x > canvas.width - diver.size) diver.x = canvas.width - diver.size;

    // Add random treasures, obstacles, and other elements
    if (Math.random() < 0.01) treasures.push(new Treasure());
    if (Math.random() < 0.01) obstacles.push(new Obstacle());
    if (bubbles.length < 30) bubbles.push(new Bubble());
    if (fishes.length < 10) fishes.push(new Fish());

    treasures.forEach((treasure, index) => {
        treasure.move();
        treasure.display();

        const treasureCenterX = treasure.x + treasure.size / 2;
        const treasureCenterY = treasure.y + treasure.size / 2;
        const diverCenterX = diver.x + diver.size / 2;
        const diverCenterY = diver.y + diver.size / 2;

        const dist = Math.hypot(treasureCenterX - diverCenterX, treasureCenterY - diverCenterY);
        const threshold = (treasure.size / 2) + (diver.size / 2) * 0.5;

        if (dist < threshold) {
            treasures.splice(index, 1); // Remove the treasure from the array
            score += 10; // Add to score when treasure is collected
        }
    });

    obstacles.forEach((obstacle) => {
        obstacle.move();
        obstacle.display();

        // Refined Collision Detection for obstacles
        const collisionBoxSize = obstacle.size * 0.3;  // Small collision box size (adjust as needed)
        const collisionBoxX = obstacle.x + (obstacle.size - collisionBoxSize) / 2;
        const collisionBoxY = obstacle.y + (obstacle.size - collisionBoxSize) / 2;

        // Refined collision check
        const diverLeft = diver.x + (diver.size - diver.size * 0.3) / 2;
        const diverTop = diver.y + (diver.size - diver.size * 0.3) / 2;
        const diverRight = diver.x + diver.size * 0.7;
        const diverBottom = diver.y + diver.size * 0.7;

        const isColliding = (
            diverRight > collisionBoxX &&
            diverLeft < collisionBoxX + collisionBoxSize &&
            diverBottom > collisionBoxY &&
            diverTop < collisionBoxY + collisionBoxSize
        );

        if (isColliding) {
            // If a collision happens inside the red box
            loseLife();
        }
    });

    // Draw diver image only if not flashing
    if (!isFlashing) {
        ctx.drawImage(diver.image, diver.x, diver.y, diver.size, diver.size);
    }

    animationFrameRequest = requestAnimationFrame(update);
}
    
    function loseLife() {
        if (invincible) return; // Skip life decrement if invincible
        lives--;
        if (lives > 0) {
            pauseGame();
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
    
        // Set timer to 20 seconds for level 1 (testing)
        if (level === 1) {
            timer = 20;  // Set timer to 20 seconds for testing
        }
    
        startTimer();  // Start the timer with the new timer value
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
        lives = 3; // Reset lives to 3 at the start of every game
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
        diver.image.style.visibility = "visible"; // Ensure diver is visible after reset
    }
  
    function nextLevel() {
        if (level < 10) {
            level++;
            timer = 120; // Reset timer for the new level
            treasures = [];
            obstacles = [];
            fishes = [];
            diver.x = canvas.width / 4;  // Reset diver position
            diver.y = canvas.height / 2;
            diver.velocity.x = 0;
            diver.velocity.y = 0;
        
            // Ensure diver starts flashing when invincible at the beginning of the new level
            makeInvincible();  // Call makeInvincible here to ensure it works after each level
        
            // Close modal after flashing starts
            closeModal();
        
            // Start the timer and resume game immediately
            startTimer();
            gameRunning = true;
            update();  // Start the game update loop for the new level
        } else {
            // End the game after level 10
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
    
    showStartGameModal();
    updateUI();
    update(); // Keep bubbles animating in the background
  });
  








































