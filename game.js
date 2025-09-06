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
const bossBgm = document.getElementById('boss-bgm');
const muteToggle = document.getElementById('mute-toggle');
const boostTimerEl = document.getElementById('boost-timer');
const notificationEl = document.getElementById('notification');
const bossUi = document.getElementById('boss-ui');
const bossObjectiveText = document.getElementById('boss-objective-text');
const bossWarning = document.getElementById('boss-warning');

// --- Game State and Settings ---
let gameState = 'start'; // 'start', 'running', 'boss', 'gameOver'
let score = 0;
let coins = 0;
let gameSpeed = 5;
let animationFrameId;
let frameCount = 0;

// Player settings
const player = {
    x: 50, y: 0, width: 40, height: 40,
    velocityY: 0, gravity: 0.6, jumpPower: -12, isJumping: false,
    image: new Image(), shieldLevel: 0 // 0: none, 1: blue, 2: gold
};
player.image.src = 'dino_player.png';
player.image.onerror = () => { player.image = null; };

// --- Merchant Data ---
const merchants = [
    { name: "Weapons Dealer", item: "Score Boost", cost: 3, action: activateScoreBoost },
    { name: "Armor Merchant", 
      getItem: () => {
          if (player.shieldLevel === 0) return { item: "Shield", cost: 5 };
          if (player.shieldLevel === 1) return { item: "Shield Upgrade", cost: 10 };
          return { item: "Shield is Max", cost: 999 };
      },
      action: () => {
          if (player.shieldLevel < 2) {
              const details = merchants[1].getItem();
              if(coins >= details.cost) {
                  coins -= details.cost;
                  player.shieldLevel++;
                  showNotification(`Purchased ${details.item}!`);
              } else {
                  showNotification(`Not enough coins for ${details.item}.`);
              }
          } else {
              showNotification(`Your shield is already at max level!`);
          }
      }
    }
];
let nextMerchantScore = 1000;

// Boss settings
let boss = null;
let nextBossScore = 10000;
let bossMinions = [];
let minionsDefeated = 0;
const MINIONS_TO_DEFEAT = 10;

// --- Score Boost ---
let isBoosted = false;
let boostEndTime = 0;
let scoreMultiplier = 1;

// --- Arrays for objects ---
let obstacles = [], coinObjects = [], enemies = [];

// --- Screen Size Adjustment ---
function resizeCanvas() {
    canvas.width = gameContainer.clientWidth - 32;
    canvas.height = window.innerHeight * 0.5;
    if (player.y === 0) {
      player.y = canvas.height - player.height;
    }
}
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// --- Notification Function ---
function showNotification(message, duration = 3000) {
    notificationEl.textContent = message;
    notificationEl.classList.remove('opacity-0', '-translate-y-20');
    setTimeout(() => {
        notificationEl.classList.add('opacity-0', '-translate-y-20');
    }, duration);
}

// --- Merchant Event ---
function triggerMerchantEvent() {
    const merchantIndex = Math.floor(Math.random() * 2);
    if (merchantIndex === 0) {
        const merchant = merchants[0];
        if (coins >= merchant.cost) {
            merchant.action();
            coins -= merchant.cost;
            showNotification(`Purchased ${merchant.item} for ${merchant.cost} coins!`);
        } else {
            showNotification(`${merchant.name} appeared, but not enough coins.`);
        }
    } else {
        merchants[1].action();
        updateCoinCount();
    }
    nextMerchantScore += 1000;
}

// --- Game Initialization ---
function init() {
    score = 0; coins = 0; gameSpeed = 5;
    nextMerchantScore = 1000; nextBossScore = 10000;
    player.y = canvas.height - player.height;
    player.velocityY = 0; player.isJumping = false; player.shieldLevel = 0;
    isBoosted = false; scoreMultiplier = 1; boostTimerEl.textContent = '';
    obstacles = []; coinObjects = []; enemies = [];
    boss = null; bossMinions = []; minionsDefeated = 0;
    bossUi.classList.add('hidden');
    frameCount = 0;
    updateScore(); updateCoinCount();
}

// --- Score/Coin Display ---
function updateScore() { scoreEl.textContent = `Score: ${score}`; }
function updateCoinCount() { coinsEl.textContent = `Coins: ${coins}`; }

// --- Game Object Generation (Running State) ---
function generateObjects() {
    frameCount++;
    if (frameCount % 90 === 0) obstacles.push({ x: canvas.width, y: canvas.height - (Math.random() * 30 + 20), width: 20, height: 40 });
    if (frameCount % 150 === 0) coinObjects.push({ x: canvas.width, y: canvas.height - 120, width: 20, height: 20 });
    if (frameCount % 200 === 0) enemies.push({ x: canvas.width, y: canvas.height - 30, width: 30, height: 30 });
}

// --- Drawing ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Player Shield
    if (player.shieldLevel > 0) {
        ctx.fillStyle = player.shieldLevel === 1 ? 'rgba(0, 150, 255, 0.5)' : 'rgba(255, 215, 0, 0.6)';
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2 + 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Player
    if (player.image) ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
    else { ctx.fillStyle = 'green'; ctx.fillRect(player.x, player.y, player.width, player.height); }

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

    // Red Enemies
    ctx.fillStyle = 'red';
    enemies.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));
    
    // Boss and Minions
    if (gameState === 'boss') {
        if (boss) {
            ctx.fillStyle = '#333';
            ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
            ctx.fillStyle = 'red';
            ctx.fillRect(boss.x + 20, boss.y + 20, 15, 15);
            ctx.fillRect(boss.x + boss.width - 35, boss.y + 20, 15, 15);
        }
        // Green Minions
        ctx.fillStyle = 'lime';
        bossMinions.forEach(m => ctx.fillRect(m.x, m.y, m.width, m.height));
    }
}

// --- Main Game Loop ---
function update() {
    if (gameState === 'gameOver') return;

    // Player physics
    player.velocityY += player.gravity;
    player.y += player.velocityY;
    if (player.y > canvas.height - player.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0; player.isJumping = false;
    }

    if (gameState === 'running') {
        updateRunningState();
    } else if (gameState === 'boss') {
        updateBossState();
    }
    
    draw();
    animationFrameId = requestAnimationFrame(update);
}

// --- Running State Logic ---
function updateRunningState() {
    score++;
    updateScore();
    if (score % 200 === 0 && gameSpeed < 15) gameSpeed += 0.1;

    updateAndCheckCollisions(obstacles, (obs, i) => {
        if (player.shieldLevel > 0) {
            player.shieldLevel--;
            obstacles.splice(i, 1);
            showNotification(`Shield protected you! Level: ${player.shieldLevel}`);
        } else {
            gameOver();
        }
    });

    updateAndCheckCollisions(coinObjects, (coin, i) => { coins++; updateCoinCount(); coinObjects.splice(i, 1); });
    updateAndCheckCollisions(enemies, (enemy, i) => {
        score += (10 * scoreMultiplier);
        updateScore();
        enemies.splice(i, 1);
    });
    
    generateObjects();
    
    if (score >= nextMerchantScore) triggerMerchantEvent();
    if (score >= nextBossScore) startBossBattle();
    updateBoostTimer();
}

// --- Boss State Logic (Major Changes Here) ---
function updateBossState() {
    score++;
    updateScore();
    if (score % 200 === 0 && gameSpeed < 15) gameSpeed += 0.1;

    boss.y += boss.vy;
    if (boss.y < 0 || boss.y + boss.height > canvas.height) boss.vy *= -1;

    // --- NEW: Boss spawns minions OR dummy obstacles ---
    if (frameCount % 100 === 0) {
        if (Math.random() < 0.25) { // 25% chance for a dummy obstacle
            obstacles.push({
                x: boss.x - 30,
                y: canvas.height - 40, // On the ground
                width: 20,
                height: 40
            });
        } else { // 75% chance for a real minion
            bossMinions.push({
                x: boss.x - 30,
                y: canvas.height - 30,
                width: 30,
                height: 30
            });
        }
    }
    
    // Update and check collisions for green minions
    updateAndCheckCollisions(bossMinions, (minion, i) => {
        bossMinions.splice(i, 1);
        minionsDefeated++;
        bossObjectiveText.textContent = `Minions Defeated: ${minionsDefeated} / ${MINIONS_TO_DEFEAT}`;
        
        if (minionsDefeated >= MINIONS_TO_DEFEAT) {
            endBossBattle();
        }
    });

    // --- NEW: Update and check collisions for dummy obstacles during boss fight ---
    updateAndCheckCollisions(obstacles, (obs, i) => {
        if (player.shieldLevel > 0) {
            player.shieldLevel--;
            obstacles.splice(i, 1);
            showNotification(`Shield protected you! Level: ${player.shieldLevel}`);
        } else {
            gameOver();
        }
    });

    // Check collision with the boss's main body
    if (checkCollision(player, boss)) {
        if (player.shieldLevel > 0) {
            player.shieldLevel--;
            showNotification(`Shield protected you! Level: ${player.shieldLevel}`);
        } else {
            gameOver();
        }
    }
    frameCount++;
}


function updateAndCheckCollisions(array, onCollision) {
    for (let i = array.length - 1; i >= 0; i--) {
        const item = array[i];
        item.x -= gameSpeed;
        if (checkCollision(player, item)) onCollision(item, i);
        if (item.x + item.width < 0) array.splice(i, 1);
    }
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
}

// --- Boss Battle Functions ---
function startBossBattle() {
    gameState = 'boss';
    // Clear all previous objects
    obstacles = []; enemies = []; coinObjects = [];
    boss = { x: canvas.width - 150, y: 50, width: 120, height: 120, vy: 2 };
    minionsDefeated = 0;
    bossMinions = [];

    bossUi.classList.remove('hidden');
    bossObjectiveText.textContent = `Minions Defeated: ${minionsDefeated} / ${MINIONS_TO_DEFEAT}`;
    
    bgm.pause();
    if (!bgm.muted) {
        bossBgm.currentTime = 0;
        bossBgm.play().catch(e => console.log("Boss BGM failed to play."));
    }

    bossWarning.classList.remove('hidden');
    bossWarning.classList.remove('opacity-0', '-translate-y-10');
    setTimeout(() => {
        bossWarning.classList.add('opacity-0', '-translate-y-10');
        setTimeout(() => bossWarning.classList.add('hidden'), 500);
    }, 2000);
}

function endBossBattle() {
    gameState = 'running';
    boss = null;
    bossMinions = [];
    // Clear any remaining obstacles from the boss fight
    obstacles = []; 
    bossUi.classList.add('hidden');
    nextBossScore += 10000;
    const reward = 50;
    coins += reward;
    updateCoinCount();
    showNotification(`Boss defeated! You earned ${reward} coins!`);
    
    bossBgm.pause();
    if (!bgm.muted) {
        bgm.currentTime = 0;
        bgm.play().catch(e => console.log("BGM failed to play."));
    }
}

// --- Game Start/End ---
function startGame() {
    init();
    gameState = 'running';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    bossBgm.pause();
    bossBgm.currentTime = 0;

    if (bgm.paused) {
        bgm.play().catch(e => console.log("BGM failed to play."));
    }
    update();
}

function gameOver() {
    gameState = 'gameOver';
    cancelAnimationFrame(animationFrameId);
    gameOverScreen.classList.remove('hidden');
    finalScoreEl.textContent = `Final Score: ${score}, Coins: ${coins}`;
    bgm.pause();
    bgm.currentTime = 0;
    bossBgm.pause();
    bossBgm.currentTime = 0;
}

// --- Event Listeners ---
function handleJump() {
    if ((gameState === 'running' || gameState === 'boss') && !player.isJumping) {
        player.velocityY = player.jumpPower;
        player.isJumping = true;
    }
}

document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'start') startButton.click();
        else if (gameState === 'gameOver') restartButton.click();
        else handleJump();
    }
});
document.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'start') startButton.click();
    else if (gameState === 'gameOver') restartButton.click();
    else handleJump();
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// --- BGM Mute Function ---
muteToggle.addEventListener('click', () => {
    const isMuted = !bgm.muted;
    bgm.muted = isMuted;
    bossBgm.muted = isMuted;
    muteToggle.textContent = isMuted ? '🔇' : '🔊';
});

// --- Score Boost Function ---
function activateScoreBoost() {
    if (isBoosted) boostEndTime += 30000;
    else {
        isBoosted = true; scoreMultiplier = 2;
        boostEndTime = Date.now() + 30000;
    }
}
function updateBoostTimer() {
    if (isBoosted) {
        const remaining = Math.ceil((boostEndTime - Date.now()) / 1000);
        if (remaining > 0) boostTimerEl.textContent = `Score x2: ${remaining}s`;
        else { isBoosted = false; scoreMultiplier = 1; boostTimerEl.textContent = ''; }
    }
}






