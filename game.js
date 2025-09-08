// --- DOM Elements ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const stageClearScreen = document.getElementById('stage-clear-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const nextStageButton = document.getElementById('next-stage-button');
const finalScoreEl = document.getElementById('final-score');
const stageClearTitle = document.getElementById('stage-clear-title');
const bgm = document.getElementById('bgm');
const bossBgm = document.getElementById('boss-bgm');
const muteToggle = document.getElementById('mute-toggle');
const boostTimerEl = document.getElementById('boost-timer');
const notificationEl = document.getElementById('notification');
const bossUi = document.getElementById('boss-ui');
const bossObjectiveText = document.getElementById('boss-objective-text');
const bossWarning = document.getElementById('boss-warning');
const bodyEl = document.body;

// --- Game State and Settings ---
let gameState = 'start'; // 'start', 'running', 'boss', 'gameOver', 'stageClear'
let score = 0, coins = 0, gameSpeed = 5;
let currentStage = 1;
let animationFrameId;
let frameCount = 0;

// --- Stage Themes ---
const stageThemes = [
    { name: "Plains", bg: 'bg-gray-100', canvasBg: 'bg-green-100', canvasBorder: 'border-green-400', obstacle: '#5d4037', text: 'text-gray-800' },
    { name: "Desert", bg: 'bg-yellow-100', canvasBg: 'bg-orange-100', canvasBorder: 'border-orange-400', obstacle: '#a16207', text: 'text-gray-800' },
    { name: "Night", bg: 'bg-indigo-900', canvasBg: 'bg-gray-800', canvasBorder: 'border-indigo-400', obstacle: '#a78bfa', text: 'text-white' },
    { name: "Volcano", bg: 'bg-red-900', canvasBg: 'bg-gray-900', canvasBorder: 'border-red-500', obstacle: '#450a0a', text: 'text-white' },
];
let currentTheme = stageThemes[0];

// Player
const player = { x: 50, y: 0, width: 40, height: 40, velocityY: 0, gravity: 0.6, jumpPower: -12, isJumping: false, image: new Image(), shieldLevel: 0 };
player.image.src = 'dino_player.png';
player.image.onerror = () => { player.image = null; };

// Merchants
const merchants = [
    { name: "Weapons Dealer", item: "Score Boost", cost: 3, action: activateScoreBoost },
    { name: "Armor Merchant", 
      getItem: () => {
          if (player.shieldLevel === 0) return { item: "Shield", cost: 5 };
          if (player.shieldLevel === 1) return { item: "Shield Upgrade", cost: 10 };
          return null; // Already max level
      },
      action: () => {
          const itemDetails = merchants[1].getItem();
          if (itemDetails) {
              if (coins >= itemDetails.cost) {
                  coins -= itemDetails.cost;
                  player.shieldLevel++;
                  updateCoinCount();
                  showNotification(`Purchased ${itemDetails.item}!`);
              } else {
                  showNotification(`Not enough coins for ${itemDetails.item}.`);
              }
          } else {
              showNotification(`Your shield is already at max level!`);
          }
      }
    }
];
let nextMerchantScore = 1000, nextBossScore = 10000;
let boss = null, bossMinions = [], minionsDefeated = 0;
const MINIONS_TO_DEFEAT = 10;
let obstacles = [], coinObjects = [], enemies = [];
let isBoosted = false, boostEndTime = 0, scoreMultiplier = 1;

// --- Main Functions ---

function applyStageTheme(stageIndex) {
    const theme = stageThemes[stageIndex % stageThemes.length];
    currentTheme = theme;
    
    // Reset body classes
    bodyEl.className = 'flex items-center justify-center h-screen transition-colors duration-500';
    // Reset canvas classes
    canvas.className = '';
    canvas.classList.add('border-4', 'rounded-lg', 'w-full', 'transition-colors', 'duration-500');

    // Add new classes
    bodyEl.classList.add(theme.bg, theme.text);
    canvas.classList.add(theme.canvasBg, theme.canvasBorder);
}

function init() {
    score = 0; coins = 0; currentStage = 1;
    gameSpeed = 5;
    nextMerchantScore = 1000; nextBossScore = 10000;
    
    player.y = canvas.height - player.height;
    player.velocityY = 0; player.isJumping = false; player.shieldLevel = 0;
    
    isBoosted = false; scoreMultiplier = 1; boostTimerEl.textContent = '';
    
    [obstacles, coinObjects, enemies, bossMinions].forEach(arr => arr.length = 0);
    boss = null; minionsDefeated = 0;
    
    bossUi.classList.add('hidden');
    frameCount = 0;
    
    applyStageTheme(0);
    updateScore(); updateCoinCount();
}

function startGame() {
    init();
    gameState = 'running';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    stageClearScreen.classList.add('hidden');
    
    bossBgm.pause();
    bossBgm.currentTime = 0;
    if (bgm.paused && !muteToggle.textContent.includes('🔇')) bgm.play().catch(e => {});

    update();
}

function startNextStage() {
    gameState = 'running';
    stageClearScreen.classList.add('hidden');
    
    [obstacles, coinObjects, enemies, bossMinions].forEach(arr => arr.length = 0);
    player.y = canvas.height - player.height;
    player.velocityY = 0;
    
    gameSpeed += 1;
    
    applyStageTheme(currentStage - 1);
    
    bossBgm.pause();
    if (!bgm.muted) {
        bgm.currentTime = 0;
        bgm.play().catch(e => {});
    }

    animationFrameId = requestAnimationFrame(update);
}

function gameOver() {
    gameState = 'gameOver';
    cancelAnimationFrame(animationFrameId);
    gameOverScreen.classList.remove('hidden');
    finalScoreEl.textContent = `Final Score: ${score}, Coins: ${coins}`;
    bgm.pause();
    bossBgm.pause();
}

// --- Game Loop and States ---

function update() {
    if (gameState === 'gameOver' || gameState === 'stageClear') return;

    player.velocityY += player.gravity;
    player.y += player.velocityY;
    if (player.y > canvas.height - player.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0; player.isJumping = false;
    }

    if (gameState === 'running') updateRunningState();
    else if (gameState === 'boss') updateBossState();
    
    draw();
    animationFrameId = requestAnimationFrame(update);
}

function updateRunningState() {
    score++;
    updateScore();
    if (score % 200 === 0 && gameSpeed < 20) gameSpeed += 0.1;

    updateAndCheckCollisions(obstacles, handleObstacleCollision);
    updateAndCheckCollisions(coinObjects, (coin, i) => { coins++; updateCoinCount(); coinObjects.splice(i, 1); });
    updateAndCheckCollisions(enemies, (enemy, i) => { score += (10 * scoreMultiplier); updateScore(); enemies.splice(i, 1); });
    
    generateObjects();
    
    if (score >= nextMerchantScore) triggerMerchantEvent();
    if (score >= nextBossScore) startBossBattle();
    updateBoostTimer();
}

function updateBossState() {
    score++;
    updateScore();
    if (score % 200 === 0 && gameSpeed < 20) gameSpeed += 0.1;

    boss.y += boss.vy;
    if (boss.y < 0 || boss.y + boss.height > canvas.height) boss.vy *= -1;

    if (frameCount % 100 === 0) {
        const spawnType = Math.random();
        const spawnX = boss.x - 30;
        if (spawnType < 0.25) {
            obstacles.push({ x: spawnX, y: canvas.height - 40, width: 20, height: 40 });
        } else {
            bossMinions.push({ x: spawnX, y: canvas.height - 30, width: 30, height: 30 });
        }
    }
    
    updateAndCheckCollisions(bossMinions, (minion, i) => {
        bossMinions.splice(i, 1);
        minionsDefeated++;
        bossObjectiveText.textContent = `Minions Defeated: ${minionsDefeated} / ${MINIONS_TO_DEFEAT}`;
        if (minionsDefeated >= MINIONS_TO_DEFEAT) endBossBattle();
    });

    updateAndCheckCollisions(obstacles, handleObstacleCollision);

    if (checkCollision(player, boss)) handlePlayerDamage();
    frameCount++;
}

// --- Drawing and Collision ---

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (player.shieldLevel > 0) {
        ctx.fillStyle = player.shieldLevel === 1 ? 'rgba(0, 150, 255, 0.5)' : 'rgba(255, 215, 0, 0.6)';
        ctx.beginPath(); ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2 + 5, 0, Math.PI * 2); ctx.fill();
    }
    
    if (player.image && player.image.complete) ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
    else { ctx.fillStyle = 'green'; ctx.fillRect(player.x, player.y, player.width, player.height); }

    ctx.fillStyle = currentTheme.obstacle;
    obstacles.forEach(obs => ctx.fillRect(obs.x, obs.y, obs.width, obs.height));
    
    ctx.fillStyle = 'gold';
    coinObjects.forEach(coin => { ctx.beginPath(); ctx.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, coin.width / 2, 0, Math.PI * 2); ctx.fill(); });

    ctx.fillStyle = 'red';
    enemies.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));
    
    if (gameState === 'boss' && boss) {
        ctx.fillStyle = '#333'; ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
        ctx.fillStyle = 'red'; ctx.fillRect(boss.x + 20, boss.y + 20, 15, 15); ctx.fillRect(boss.x + boss.width - 35, boss.y + 20, 15, 15);
        ctx.fillStyle = 'lime'; bossMinions.forEach(m => ctx.fillRect(m.x, m.y, m.width, m.height));
    }
}

function handleObstacleCollision(obs, i) {
    if (player.shieldLevel > 0) {
        player.shieldLevel--;
        obstacles.splice(i, 1);
        showNotification(`Shield protected you! Level: ${player.shieldLevel}`);
    } else {
        gameOver();
    }
}

function handlePlayerDamage() {
    if (player.shieldLevel > 0) {
        player.shieldLevel--;
        showNotification(`Shield protected you! Level: ${player.shieldLevel}`);
    } else {
        gameOver();
    }
}

// --- Helper Functions ---
function resizeCanvas() {
    canvas.width = document.getElementById('game-container').clientWidth - 32;
    canvas.height = window.innerHeight * 0.5;
    if (player.y === 0 || player.y > canvas.height) player.y = canvas.height - player.height;
}

function showNotification(message, duration = 3000) {
    notificationEl.textContent = message;
    notificationEl.classList.remove('opacity-0', '-translate-y-20');
    setTimeout(() => {
        notificationEl.classList.add('opacity-0', '-translate-y-20');
    }, duration);
}

function triggerMerchantEvent() {
    const merchantIndex = Math.floor(Math.random() * 2);
    if (merchantIndex === 0) { // Weapon's Dealer
        const merchant = merchants[0];
        if (coins >= merchant.cost) {
            merchant.action(); // This is activateScoreBoost
            coins -= merchant.cost;
            updateCoinCount();
            showNotification(`Purchased ${merchant.item}!`);
        } else {
             showNotification(`${merchant.name} appeared, but not enough coins.`);
        }
    } else { // Armor Merchant
        merchants[1].action();
    }
    nextMerchantScore += 1000;
}

function updateScore() { scoreEl.textContent = `Score: ${score}`; }
function updateCoinCount() { coinsEl.textContent = `Coins: ${coins}`; }

function generateObjects() {
    frameCount++;
    if (frameCount % 90 === 0) obstacles.push({ x: canvas.width, y: canvas.height - (Math.random() * 30 + 20), width: 20, height: 40 });
    if (frameCount % 150 === 0) coinObjects.push({ x: canvas.width, y: canvas.height - 120, width: 20, height: 20 });
    if (frameCount % 200 === 0) enemies.push({ x: canvas.width, y: canvas.height - 30, width: 30, height: 30 });
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

function startBossBattle() {
    gameState = 'boss';
    [obstacles, enemies, coinObjects].forEach(arr => arr.length = 0);
    boss = { x: canvas.width - 150, y: 50, width: 120, height: 120, vy: 2 };
    minionsDefeated = 0; bossMinions = [];

    bossUi.classList.remove('hidden');
    bossObjectiveText.textContent = `Minions Defeated: ${minionsDefeated} / ${MINIONS_TO_DEFEAT}`;
    
    bgm.pause();
    if (!bgm.muted) { bossBgm.currentTime = 0; bossBgm.play().catch(e => {}); }

    bossWarning.classList.remove('hidden');
    bossWarning.classList.remove('opacity-0', '-translate-y-10');
    setTimeout(() => {
        bossWarning.classList.add('opacity-0', '-translate-y-10');
        setTimeout(() => bossWarning.classList.add('hidden'), 500);
    }, 2000);
}

function endBossBattle() {
    cancelAnimationFrame(animationFrameId);
    gameState = 'stageClear';
    currentStage++;
    nextBossScore += 10000;
    const reward = 50;
    coins += reward;
    updateCoinCount();
    
    bossUi.classList.add('hidden');
    stageClearTitle.textContent = `Stage ${currentStage - 1} Clear!`;
    stageClearScreen.classList.remove('hidden');
    showNotification(`Boss defeated! You earned ${reward} coins!`);
}

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

function handleJump() {
    if ((gameState === 'running' || gameState === 'boss') && !player.isJumping) {
        player.velocityY = player.jumpPower;
        player.isJumping = true;
    }
}

// --- Event Listeners ---
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
nextStageButton.addEventListener('click', startNextStage);

document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'start') startButton.click();
        else if (gameState === 'gameOver') restartButton.click();
        else if (gameState === 'stageClear') nextStageButton.click();
        else handleJump();
    }
});

document.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'start') startButton.click();
    else if (gameState === 'gameOver') restartButton.click();
    else if (gameState === 'stageClear') nextStageButton.click();
    else handleJump();
});

muteToggle.addEventListener('click', () => {
    const isMuted = !bgm.muted;
    bgm.muted = isMuted;
    bossBgm.muted = isMuted;
    muteToggle.textContent = isMuted ? '🔇' : '🔊';
});





