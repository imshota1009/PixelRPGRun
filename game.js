// DOM Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const startButton = document.getElementById('startButton');
const container = document.getElementById('game-container');
const muteToggle = document.getElementById('mute-toggle');
const bgm = document.getElementById('bgm');
const boostStatusEl = document.getElementById('boost-status');

// Merchant Modal Elements
const merchantModal = document.getElementById('merchant-modal');
const merchantNameEl = document.getElementById('merchant-name');
const merchantImageEl = document.getElementById('merchant-image');
const merchantDialogueEl = document.getElementById('merchant-dialogue');
const itemNameEl = document.getElementById('item-name');
const itemDescriptionEl = document.getElementById('item-description');
const buyItemButton = document.getElementById('buyItemButton');
const continueButton = document.getElementById('continueButton');


// BGM and Mute Control
const speakerOnIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>`;
const speakerOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>`;
bgm.volume = 0.3;
muteToggle.innerHTML = bgm.muted ? speakerOffIcon : speakerOnIcon;
muteToggle.addEventListener('click', () => {
    bgm.muted = !bgm.muted;
    muteToggle.innerHTML = bgm.muted ? speakerOffIcon : speakerOnIcon;
});

function resizeCanvas() {
    canvas.width = container.clientWidth - 32;
    canvas.height = window.innerHeight * 0.6;
    const groundPosition = canvas.height - player.height;
    if (player.y > groundPosition || player.y === 0) {
        player.y = groundPosition;
    }
}
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// Game State
let score = 0, coins = 0, gameSpeed = 5, gravity = 0.8;
let isGameOver = true, isMerchantActive = false;
let nextMerchantScore = 1000, animationFrameId;
let scoreBoostTimer = 0;
let currentMerchant = null; // 現在の商人を保持する変数

// Image Loading
const playerImage = new Image();
playerImage.src = 'dino_player.png';
const merchantImage1 = new Image();
merchantImage1.src = 'merchant1.png';
const merchantImage2 = new Image();
merchantImage2.src = 'merchant2.png';

// Merchant Data
const merchants = [
    {
        name: "武器商人",
        image: merchantImage1,
        dialogue: "「へっへっへ…いい武器、あるぜ？」",
        item: "スコアブースト",
        description: "30秒間、敵を倒した時のスコアが2倍になる！",
        cost: 30,
        id: "scoreBoost"
    },
    {
        name: "防具商人",
        image: merchantImage2,
        dialogue: "「旅のお方、ご武運を。この盾はいかがです？」",
        item: "シールド",
        description: "障害物から1回だけ身を守るぞ！",
        cost: 25,
        id: "shield"
    }
];

// Player
const player = {
    x: 50, y: 0, width: 50, height: 60,
    velocityY: 0, isJumping: false, hasShield: false,
    draw() {
        if(playerImage.complete && playerImage.naturalHeight !== 0){
            ctx.drawImage(playerImage, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#2E8B57';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        if (this.hasShield) {
            ctx.fillStyle = 'rgba(52, 152, 219, 0.4)';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 10, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    jump() {
        if (!this.isJumping) { this.isJumping = true; this.velocityY = -18; }
    },
    update() {
        this.velocityY += gravity;
        this.y += this.velocityY;
        const groundPosition = canvas.height - this.height;
        if (this.y > groundPosition) {
            this.y = groundPosition;
            this.velocityY = 0;
            this.isJumping = false;
        }
        this.draw();
    }
};

// ... (Effects and other game logic are mostly the same)
// Effects
const attackEffect = {
    active: false, duration: 15, counter: 0,
    draw(playerX, playerY) {
        if(!this.active) return;
        const color = scoreBoostTimer > 0 ? 'rgba(255, 100, 0, 0.8)' : 'rgba(255, 255, 0, 0.7)';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(playerX + player.width, playerY + player.height / 2);
        ctx.lineTo(playerX + player.width + 50, playerY);
        ctx.lineTo(playerX + player.width + 50, playerY + player.height);
        ctx.closePath();
        ctx.fill();
        this.counter++;
        if(this.counter > this.duration){ this.active = false; this.counter = 0; }
    }
};
const shieldBreakEffect = {
    active: false, duration: 20, counter: 0, x: 0, y: 0,
    trigger(x, y) { this.active = true; this.counter = 0; this.x = x; this.y = y; },
    draw() {
        if(this.active){
            const alpha = 1 - (this.counter / this.duration);
            ctx.strokeStyle = `rgba(52, 152, 219, ${alpha})`;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 20 + this.counter * 2, 0, Math.PI * 2);
            ctx.stroke();
            this.counter++;
            if(this.counter > this.duration){ this.active = false; }
        }
    }
};
let obstacles = [], enemies = [], coinObjects = [];
let obstacleTimer = 0, enemyTimer = 200, coinTimer = 80;
function spawnObstacle() { const size = Math.random() * 30 + 30; obstacles.push({ x: canvas.width, y: canvas.height - size, width: size, height: size, draw() { ctx.fillStyle = '#A0522D'; ctx.fillRect(this.x, this.y, this.width, this.height); } }); }
function spawnEnemy() { const size = 40; enemies.push({ x: canvas.width, y: canvas.height - size, width: size, height: size, draw() { ctx.fillStyle = '#DC143C'; ctx.beginPath(); ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, Math.PI, 0); ctx.closePath(); ctx.fill(); } }); }
function spawnCoin() { const size = 20; const yPos = Math.random() > 0.5 ? canvas.height - 150 : canvas.height - 50; coinObjects.push({ x: canvas.width, y: yPos, width: size, height: size, draw() { ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2); ctx.fill(); } }); }
function updateObjects(array) { for (let i = array.length - 1; i >= 0; i--) { const obj = array[i]; obj.x -= gameSpeed; obj.draw(); if (obj.x + obj.width < 0) { array.splice(i, 1); } } }

function checkCollisions() {
    // Obstacle collision
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (player.x < obs.x + obs.width && player.x + player.width > obs.x && player.y < obs.y + obs.height && player.y + player.height > obs.y) {
            if (player.hasShield) {
                player.hasShield = false;
                shieldBreakEffect.trigger(obs.x + obs.width/2, obs.y + obs.height/2);
                obstacles.splice(i, 1);
            } else { gameOver(); }
        }
    }
    // Coin collision
    for (let i = coinObjects.length - 1; i >= 0; i--) {
         const coin = coinObjects[i];
         if (player.x < coin.x + coin.width && player.x + player.width > coin.x && player.y < coin.y + coin.height && player.y + player.height > coin.y) {
            coins++; coinsEl.textContent = coins;
            coinObjects.splice(i, 1);
        }
    }
    // Enemy collision (auto-attack)
    const attackRange = player.x + player.width + 60;
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (enemy.x < attackRange && enemy.x > player.x) {
            attackEffect.active = true;
            enemies.splice(i, 1);
            score += scoreBoostTimer > 0 ? 100 : 50; // Score boost check
        }
    }
}

function showMerchant() {
    isMerchantActive = true;
    bgm.pause();
    
    // 2人の商人からランダムに1人を選ぶ
    currentMerchant = merchants[Math.floor(Math.random() * merchants.length)];

    // モーダルの内容を選ばれた商人の情報で更新
    merchantNameEl.textContent = currentMerchant.name;
    merchantImageEl.src = currentMerchant.image.src;
    merchantDialogueEl.textContent = currentMerchant.dialogue;
    itemNameEl.textContent = currentMerchant.item;
    itemDescriptionEl.textContent = currentMerchant.description;
    buyItemButton.textContent = `${currentMerchant.cost}コインで購入`;

    // 購入ボタンの状態を更新
    let canBuy = true;
    let reason = "";
    if (coins < currentMerchant.cost) {
        canBuy = false;
        reason = "コインが足りない";
    } else if (currentMerchant.id === 'shield' && player.hasShield) {
        canBuy = false;
        reason = "シールドは装備済み";
    } else if (currentMerchant.id === 'scoreBoost' && scoreBoostTimer > 0) {
        canBuy = false;
        reason = "ブースト効果は発動中";
    }

    buyItemButton.disabled = !canBuy;
    if (!canBuy) {
        buyItemButton.textContent = reason;
    }

    merchantModal.style.display = 'flex';
}

function hideMerchant() {
    isMerchantActive = false;
    merchantModal.style.display = 'none';
    if (!isGameOver) {
        bgm.play().catch(e => console.log("BGM could not be resumed."));
    }
    gameLoop();
}

function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(animationFrameId);
    bgm.pause();
    bgm.currentTime = 0;
    modal.style.display = 'flex';
    modalTitle.textContent = 'ゲームオーバー';
    modalText.textContent = `最終スコア: ${score}`;
    startButton.textContent = 'リトライ';
}

function resetGame() {
    score = 0; coins = 0; gameSpeed = 5;
    obstacles = []; enemies = []; coinObjects = [];
    resizeCanvas();
    player.y = canvas.height - player.height;
    player.velocityY = 0; player.isJumping = false; player.hasShield = false;
    isGameOver = false; nextMerchantScore = 1000;
    scoreBoostTimer = 0;
    scoreEl.textContent = score; coinsEl.textContent = coins;
    boostStatusEl.classList.add('hidden');
}

function gameLoop() {
    if (isGameOver || isMerchantActive) return;
    animationFrameId = requestAnimationFrame(gameLoop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.update();
    
    // スコアブーストのタイマー処理
    if (scoreBoostTimer > 0) {
        scoreBoostTimer--;
        if (scoreBoostTimer === 0) {
            boostStatusEl.classList.add('hidden');
        }
    }

    obstacleTimer++; enemyTimer++; coinTimer++;
    if (obstacleTimer > 100 + Math.random() * 100) { spawnObstacle(); obstacleTimer = 0; }
    if (enemyTimer > 250 + Math.random() * 200) { spawnEnemy(); enemyTimer = 0; }
    if (coinTimer > 120 + Math.random() * 50) { spawnCoin(); coinTimer = 0; }
    updateObjects(obstacles); updateObjects(enemies); updateObjects(coinObjects);
    attackEffect.draw(player.x, player.y);
    shieldBreakEffect.draw();
    checkCollisions();
    score++; scoreEl.textContent = score;
    if (score > 0 && score % 200 === 0) { gameSpeed += 0.1; }
    if (score >= nextMerchantScore) {
        nextMerchantScore += 1000;
        showMerchant();
    }
}

function startGame() {
    resetGame();
    modal.style.display = 'none';
    bgm.play().catch(e => console.log("BGM playback requires user interaction."));
    gameLoop();
}

// Event Listeners
startButton.addEventListener('click', startGame);
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (isGameOver) startGame();
        else if (!isMerchantActive) player.jump();
    }
});
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (isGameOver) startGame();
    else if (!isMerchantActive) player.jump();
});

buyItemButton.addEventListener('click', () => {
    if (!currentMerchant || coins < currentMerchant.cost) return;

    coins -= currentMerchant.cost;
    coinsEl.textContent = coins;

    if (currentMerchant.id === 'shield') {
        player.hasShield = true;
    } else if (currentMerchant.id === 'scoreBoost') {
        scoreBoostTimer = 1800; // 60fps * 30 seconds
        boostStatusEl.classList.remove('hidden');
    }
    
    hideMerchant();
});
continueButton.addEventListener('click', hideMerchant);

