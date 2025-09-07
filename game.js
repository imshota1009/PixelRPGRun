// --- DOM Elements ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const stageClearScreen = document.getElementById('stage-clear-screen'); // New
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const nextStageButton = document.getElementById('next-stage-button'); // New
const finalScoreEl = document.getElementById('final-score');
const stageClearTitle = document.getElementById('stage-clear-title'); // New
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
    { name: "Plains", bg: 'bg-gray-100', canvasBg: 'bg-green-100', canvasBorder: 'border-green-400', obstacle: '#5d4037' },
    { name: "Desert", bg: 'bg-yellow-100', canvasBg: 'bg-orange-100', canvasBorder: 'border-orange-400', obstacle: '#a16207' },
    { name: "Night", bg: 'bg-indigo-900', canvasBg: 'bg-gray-800', canvasBorder: 'border-indigo-400', obstacle: '#a78bfa' },
    { name: "Volcano", bg: 'bg-red-900', canvasBg: 'bg-gray-900', canvasBorder: 'border-red-500', obstacle: '#450a0a' },
];
let currentTheme = stageThemes[0];

// Player
const player = { x: 50, y: 0, width: 40, height: 40, velocityY: 0, gravity: 0.6, jumpPower: -12, isJumping: false, image: new Image(), shieldLevel: 0 };
player.image.src = 'dino_player.png';

// Merchants, Boss, Objects...
const merchants = [ /* ... merchant data remains the same ... */ ];
let nextMerchantScore = 1000, nextBossScore = 10000;
let boss = null, bossMinions = [], minionsDefeated = 0;
const MINIONS_TO_DEFEAT = 10;
let obstacles = [], coinObjects = [], enemies = [];
let isBoosted = false, boostEndTime = 0, scoreMultiplier = 1;

// --- Main Functions ---

function applyStageTheme(stageIndex) {
    const theme = stageThemes[stageIndex % stageThemes.length];
    currentTheme = theme;
    
    // Remove old classes
    bodyEl.className = 'flex items-center justify-center h-screen'; // Reset body classes
    canvas.classList.remove(...Array.from(canvas.classList)); // Reset canvas classes

    // Add new classes
    bodyEl.classList.add(theme.bg);
    canvas.classList.add(theme.canvasBg, theme.canvasBorder, 'border-4', 'rounded-lg', 'w-full', 'transition-colors', 'duration-500');
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
    if (bgm.paused) bgm.play().catch(e => {});

    update();
}

function startNextStage() {
    gameState = 'running';
    stageClearScreen.classList.add('hidden');
    
    // Reset objects and player position for the new stage
    [obstacles, coinObjects, enemies, bossMinions].forEach(arr => arr.length = 0);
    player.y = canvas.height - player.height;
    player.velocityY = 0;
    
    // Increase base speed slightly for the new stage
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

    // Player physics
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
        if (spawnType < 0.25) { // Dummy obstacle
            obstacles.push({ x: spawnX, y: canvas.height - 40, width: 20, height: 40 });
        } else { // Real minion
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
    
    // Player Shield
    if (player.shieldLevel > 0) {
        ctx.fillStyle = player.shieldLevel === 1 ? 'rgba(0, 150, 255, 0.5)' : 'rgba(255, 215, 0, 0.6)';
        ctx.beginPath(); ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2 + 5, 0, Math.PI * 2); ctx.fill();
    }
    
    // Player
    if (player.image) ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
    else { ctx.fillStyle = 'green'; ctx.fillRect(player.x, player.y, player.width, player.height); }

    // Objects
    ctx.fillStyle = currentTheme.obstacle;
    obstacles.forEach(obs => ctx.fillRect(obs.x, obs.y, obs.width, obs.height));
    
    ctx.fillStyle = 'gold';
    coinObjects.forEach(coin => { ctx.beginPath(); ctx.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, coin.width / 2, 0, Math.PI * 2); ctx.fill(); });

    ctx.fillStyle = 'red';
    enemies.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));
    
    // Boss and Minions
    if (gameState === 'boss') {
        if (boss) {
            ctx.fillStyle = '#333'; ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
            ctx.fillStyle = 'red'; ctx.fillRect(boss.x + 20, boss.y + 20, 15, 15); ctx.fillRect(boss.x + boss.width - 35, boss.y + 20, 15, 15);
        }
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

// --- Event Listeners and Helpers ---
// resizeCanvas, showNotification, triggerMerchantEvent, updateScore, updateCoinCount, 
// generateObjects, handlePlayerDamage, updateAndCheckCollisions, checkCollision, 
// startBossBattle, activateScoreBoost, updateBoostTimer, handleJump...
// (These helper functions remain largely the same, so they are omitted for brevity, but are in the full code)

// --- Boss Battle Functions ---
function startBossBattle() {
    gameState = 'boss';
    [obstacles, enemies, coinObjects].forEach(arr => arr.length = 0);
    boss = { x: canvas.width - 150, y: 50, width: 120, height: 120, vy: 2 };
    minionsDefeated = 0;
    bossMinions = [];

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

// --- THE BIG FIX IS HERE ---
function endBossBattle() {
    // 1. STOP THE GAME LOOP to prevent any race conditions or errors
    cancelAnimationFrame(animationFrameId);

    // 2. Set the state to prevent the loop from restarting accidentally
    gameState = 'stageClear';
    
    // 3. Update game progress
    currentStage++;
    nextBossScore += 10000;
    const reward = 50;
    coins += reward;
    updateCoinCount();
    
    // 4. Update and show the Stage Clear UI
    bossUi.classList.add('hidden');
    stageClearTitle.textContent = `Stage ${currentStage - 1} Clear!`;
    stageClearScreen.classList.remove('hidden');
    showNotification(`Boss defeated! You earned ${reward} coins!`);
    
    // 5. Let the player decide when to continue
}


// Event Listeners
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
nextStageButton.addEventListener('click', startNextStage); // New listener

// (Other listeners like keydown, touchstart, muteToggle remain the same)
// --- Full helper functions would be included below this line ---
// For example:
function resizeCanvas() {
    canvas.width = document.getElementById('game-container').clientWidth - 32;
    canvas.height = window.innerHeight * 0.5;
    if (player.y === 0) player.y = canvas.height - player.height;
}
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

function showNotification(message, duration = 3000) {
    notificationEl.textContent = message;
    notificationEl.classList.remove('opacity-0', '-translate-y-20');
    setTimeout(() => {
        notificationEl.classList.add('opacity-0', '-translate-y-20');
    }, duration);
}

// ... and so on for all other helper functions.




