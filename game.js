// --- DOM Elements and Canvas Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('game-container');
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const finalScoreEl = document.getElementById('final-score');
const bgm = document.getElementById('bgm');
const muteToggle = document.getElementById('mute-toggle');
const boostTimerEl = document.getElementById('boost-timer');
const notificationEl = document.getElementById('notification');

// --- Initial Settings ---
let score = 0;
let coins = 0;
let gameSpeed = 5;
let isGameRunning = false;
let animationFrameId;

// Player settings
const player = {
    x: 50,
    y: 0, // y is determined on resize
    width: 40,
    height: 40,
    velocityY: 0,
    gravity: 0.6,
    jumpPower: -12,
    isJumping: false,
    image: new Image(),
    hasShield: false
};
player.image.src = 'dino_player.png';
player.image.onerror = () => { player.image = null; }; // Handle image loading failure

// --- Merchant Data (Translated) ---
const merchants = [
    {
        name: "Weapons Dealer",
        item: "Score Boost",
        cost: 3,
        action: activateScoreBoost
    },
    {
        name: "Armor Merchant",
        item: "Shield",
        cost: 5,
        action: () => {
            if (!player.hasShield) {
                player.hasShield = true;
                return true;
            }
            return false;
        }
    }
];
let nextMerchantScore = 1000;

// --- Score Boost related ---
let isBoosted = false;
let boostEndTime = 0;
let scoreMultiplier = 1;

// --- Arrays for obstacles, coins, and enemies ---
let obstacles = [];
let coinObjects = [];
let enemies = [];
let frameCount = 0;

// --- Screen Size Adjustment ---
function resizeCanvas() {
    canvas.width = gameContainer.clientWidth - 32;
    canvas.height = window.innerHeight * 0.5;
    player.y = canvas.height - player.height;
}
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// --- Notification Function (New) ---
function showNotification(message, duration = 3000) {
    notificationEl.textContent = message;
    notificationEl.classList.remove('opacity-0', '-translate-y-20');
    notificationEl.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
        notificationEl.classList.remove('opacity-100', 'translate-y-0');
        notificationEl.classList.add('opacity-0', '-translate-y-20');
    }, duration);
}

// --- Merchant Event Function (Heavily Modified) ---
function triggerMerchantEvent() {
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    
    if (coins >= merchant.cost) {
        const purchaseSuccess = merchant.action();
        
        if(purchaseSuccess || purchaseSuccess === undefined) {
             coins -= merchant.cost;
             updateCoinCount();
             showNotification(`Purchased ${merchant.item} for ${merchant.cost} coins!`);
        } else {
             showNotification(`You already have the ${merchant.item}.`);
        }
    } else {
        showNotification(`${merchant.name} appeared, but you were short on coins...`);
    }
    
    nextMerchantScore += 1000;
}

// --- Game Initialization ---
function init() {
    score = 0;
    coins = 0;
    gameSpeed = 5;
    nextMerchantScore = 1000;
    player.y = canvas.height - player.height;
    player.velocityY = 0;
    player.isJumping = false;
    player.hasShield = false;
    isBoosted = false;
    scoreMultiplier = 1;
    boostTimerEl.textContent = '';
    
    obstacles = [];
    coinObjects = [];
    enemies = [];
    frameCount = 0;

    updateScore();
    updateCoinCount();
}

// --- Update Score/Coin Display ---
function updateScore() { scoreEl.textContent = `Score: ${score}`; }
function updateCoinCount() { coinsEl.textContent = `Coins: ${coins}`; }

// --- Game Object Generation ---
function generateObjects() {
    frameCount++;
    if (frameCount % 90 === 0) {
        const height = Math.random() * 30 + 20;
        obstacles.push({ x: canvas.width, y: canvas.height - height, width: 20, height: height });
    }
    if (frameCount % 150 === 0) {
        coinObjects.push({ x: canvas.width, y: canvas.height - 120, width: 20, height: 20, collected: false });
    }
    if (frameCount % 200 === 0) {
        const size = 30;
        enemies.push({ x: canvas.width, y: canvas.height - size, width: size, height: size });
    }
}

// --- Draw Function ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Player Shield
    if (player.hasShield) {
        ctx.fillStyle = 'rgba(0, 150, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2 + 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Player
    if (player.image) {
        ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = 'green';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // Obstacles
    ctx.fillStyle = '#5d4037';
    obstacles.forEach(obs => ctx.fillRect(obs.x, obs.y, obs.width, obs.height));
    
    // Coins
    ctx.fillStyle = 'gold';
    coinObjects.forEach(coin => {
        ctx.beginPath();
        ctx.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, coin.width / 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // Enemies
    ctx.fillStyle = 'red';
    enemies.forEach(enemy => ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height));
}

// --- Game Loop ---
function update() {
    if (!isGameRunning) return;

    // Player movement
    player.velocityY += player.gravity;
    player.y += player.velocityY;
    if (player.y > canvas.height - player.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.isJumping = false;
    }

    // Update objects and check collisions
    updateAndCheckCollisions(obstacles, (obs, index) => {
        if (checkCollision(player, obs)) {
            if (player.hasShield) {
                player.hasShield = false;
                obstacles.splice(index, 1);
                showNotification("Your shield absorbed the damage!");
            } else {
                gameOver();
            }
        }
    });

    updateAndCheckCollisions(coinObjects, (coin, index) => {
        if (checkCollision(player, coin)) {
            coins++;
            updateCoinCount();
            coinObjects.splice(index, 1);
        }
    });

    updateAndCheckCollisions(enemies, (enemy, index) => {
        if (enemy.x < player.x + player.width + 50 && enemy.x > player.x) {
            score += (10 * scoreMultiplier);
            updateScore();
            enemies.splice(index, 1);
        } else if (checkCollision(player, enemy)) {
             if (player.hasShield) {
                player.hasShield = false;
                enemies.splice(index, 1);
                showNotification("Your shield absorbed the damage!");
            } else {
                gameOver();
            }
        }
    });
    
    generateObjects();
    draw();

    // Update score and game speed
    score++;
    updateScore();
    if (score % 200 === 0) gameSpeed += 0.1;

    updateBoostTimer();

    // Trigger merchant event
    if (score >= nextMerchantScore) {
        triggerMerchantEvent();
    }

    animationFrameId = requestAnimationFrame(update);
}

function updateAndCheckCollisions(array, onCollision) {
    for (let i = array.length - 1; i >= 0; i--) {
        const item = array[i];
        item.x -= gameSpeed;
        if (onCollision) onCollision(item, i);
        if (item.x + item.width < 0) array.splice(i, 1);
    }
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// --- Game Start/End ---
function startGame() {
    init();
    isGameRunning = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    if (bgm.paused) {
        bgm.play().catch(e => console.log("BGM failed to play. User interaction may be required."));
    }
    update();
}

function gameOver() {
    isGameRunning = false;
    cancelAnimationFrame(animationFrameId);
    gameOverScreen.classList.remove('hidden');
    finalScoreEl.textContent = `Final Score: ${score}, Coins: ${coins}`;
    bgm.pause();
    bgm.currentTime = 0;
}

// --- Event Listeners ---
function handleJump(e) {
    if (isGameRunning && !player.isJumping) {
        player.velocityY = player.jumpPower;
        player.isJumping = true;
    }
}

document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!isGameRunning && !startScreen.classList.contains('hidden')) {
            startButton.click();
        } else if (!isGameRunning && !gameOverScreen.classList.contains('hidden')) {
            restartButton.click();
        } else {
            handleJump(e);
        }
    }
});
canvas.addEventListener('touchstart', handleJump);
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// --- BGM Mute Function ---
let isMuted = false;
muteToggle.addEventListener('click', () => {
    isMuted = !isMuted;
    bgm.muted = isMuted;
    muteToggle.textContent = isMuted ? '🔇' : '🔊';
});

// --- Score Boost Function ---
function activateScoreBoost() {
    if (isBoosted) {
        boostEndTime += 30000;
    } else {
        isBoosted = true;
        scoreMultiplier = 2;
        boostEndTime = Date.now() + 30000; // 30 seconds
    }
    return true; // Purchase successful
}

function updateBoostTimer() {
    if (isBoosted) {
        const remaining = Math.ceil((boostEndTime - Date.now()) / 1000);
        if (remaining > 0) {
            boostTimerEl.textContent = `Score x2: ${remaining}s`;
        } else {
            isBoosted = false;
            scoreMultiplier = 1;
            boostTimerEl.textContent = '';
        }
    }
}



