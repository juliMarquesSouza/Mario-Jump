const mario = document.getElementById('mario');
const pipe = document.querySelector('.pipe');
const coinsContainer = document.getElementById('coinsContainer');
const scoreDisplay = document.getElementById('score');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const finalScoreDisplay = document.getElementById('finalScore');
const gameBoard = document.getElementById('gameBoard');

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let countLoop = 0;
let score = 0;
let pipesPassed = 0;
let pipeSpeed = 3;
let pipePosition = -80;
let isJumping = false;
let isGameOver = false;
let isGameStarted = false;
let coins = [];
let jumpY = 0;
let jumpVelocity = 0;
let jumpAnimationId = null;
let gameLoopId = null;
let coinInterval = null;
let pipePassedThisCycle = false;

const coinSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#ffd700" stroke="#b8860b" stroke-width="5"/><text x="50" y="65" font-size="40" text-anchor="middle" fill="#b8860b" font-weight="bold">$</text></svg>';

function createOscillator(frequency, type, duration, volume = 0.3) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playJumpSound() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    createOscillator(400, 'square', 0.1, 0.2);
}

function playCoinSound() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    createOscillator(988, 'square', 0.1, 0.2);
    setTimeout(() => createOscillator(1319, 'square', 0.15, 0.15), 100);
}

function playGameOverSound() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    createOscillator(200, 'sawtooth', 0.3, 0.3);
    setTimeout(() => createOscillator(150, 'sawtooth', 0.4, 0.25), 200);
}

function animateScore() {
    scoreDisplay.classList.add('pop');
    setTimeout(() => scoreDisplay.classList.remove('pop'), 200);
}

function jump() {

    if (isGameOver || isJumping || !isGameStarted) return;

    playJumpSound();

    isJumping = true;

    mario.classList.remove('jump');

    void mario.offsetWidth;

    if (window.innerWidth <= 400) {
        mario.style.transform = 'translateX(0)';
    }

    mario.classList.add('jump');

    setTimeout(() => {

        mario.classList.remove('jump');

        mario.style.transform = 'translateX(0)';

        isJumping = false;

    }, 500);
}

function createCoin() {

    const coin = document.createElement('div');

    coin.className = 'coin';

    coin.innerHTML = `
        <img src="data:image/svg+xml,${encodeURIComponent(coinSVG)}" class="coin-icon"/>
    `;

    let minY;
    let maxY;

    if (window.innerWidth <= 400) {

        minY = 90;
        maxY = 170;

    } else if (window.innerWidth <= 600) {

        minY = 110;
        maxY = 220;

    } else {

        minY = 130;
        maxY = 280;
    }

    const randomY = minY + Math.random() * (maxY - minY);

    coin.style.bottom = randomY + 'px';

    coin.style.right = '-50px';

    coinsContainer.appendChild(coin);

    coins.push({
        element: coin,
        right: -50,
        bottom: randomY,
        collected: false
    });
}

function updateCoins() {
    const boardWidth = gameBoard.offsetWidth;

    coins = coins.filter(coin => {

        if (coin.collected) return false;

        coin.right += 0.5;

        coin.element.style.right = coin.right + 'px';

        if (coin.right > boardWidth + 50) {
            coin.element.remove();
            return false;
        }

        const marioRect = mario.getBoundingClientRect();

        const coinRect = coin.element.getBoundingClientRect();

        const mobileCoinOffset = window.innerWidth <= 400 ? 18 : 8;

        const collected =
            marioRect.right > coinRect.left + mobileCoinOffset &&
            marioRect.left < coinRect.right - mobileCoinOffset &&
            marioRect.bottom > coinRect.top + mobileCoinOffset &&
            marioRect.top < coinRect.bottom - mobileCoinOffset;

        if (collected) {

            coin.collected = true;

            coin.element.classList.add('collected');

            score += 5;

            scoreDisplay.textContent = score;

            animateScore();

            playCoinSound();

            setTimeout(() => {
                coin.element.remove();
            }, 300);

            return false;
        }

        return true;
    });
}

function setLoop(speed) {
    return new Promise((resolve, reject) => {
        countLoop++;
        const result = gameLoop();

        setTimeout(() => {
            if(result) {
                setLoop(speed);
            }

            resolve();
        }, speed);
    });
    // gameLoopId = requestAnimationFrame(gameLoop);
}

function gameLoop(calback) {
    if (isGameOver || !isGameStarted) return;
    const boardWidth = gameBoard.offsetWidth;

    pipePosition += (boardWidth / (pipeSpeed * 60));
    pipe.style.right = pipePosition + 'px';

    const pipeWidth = parseInt(getComputedStyle(pipe).width) || 55;

    const pipeLeft = boardWidth - pipePosition - pipeWidth;

    const marioLeft = parseInt(getComputedStyle(mario).left);

    const marioWidth = parseInt(getComputedStyle(mario).width);

    const marioRight = marioLeft + marioWidth;

    const pipeRight = pipeLeft + pipeWidth;

    const marioBottom = parseInt(getComputedStyle(mario).bottom);

    const groundLevel = window.innerWidth <= 400
        ? marioBottom <= 60
        : window.innerWidth <= 600
            ? marioBottom <= 72
            : marioBottom <= 92;

    if (pipePosition > boardWidth + 80) {
        pipePosition = -80;
        pipePassedThisCycle = false;
    }

    if (
        pipeLeft > marioLeft + 10 &&
        pipeLeft < marioRight &&
        !pipePassedThisCycle
    ) {
        pipePassedThisCycle = true;

        pipesPassed++;

        score += 1;

        scoreDisplay.textContent = score;

        animateScore();

        if (pipesPassed % 10 === 0 && pipeSpeed > 1) {
            pipeSpeed = pipeSpeed * 0.95;
        }
    }

    const collisionOffset = window.innerWidth <= 600 ? 5 : 10;

    if (
        groundLevel &&
        marioRight > pipeLeft + collisionOffset &&
        marioLeft < pipeRight - collisionOffset
    ) {
        gameOver();
        return false;
    }
    
    updateCoins();
    return true;
}


function gameOver() {
    isGameOver = true;
    isGameStarted = false;

    if (jumpAnimationId) cancelAnimationFrame(jumpAnimationId);
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    if (coinInterval) clearInterval(coinInterval);

    playGameOverSound();

    pipe.style.animationPlayState = 'paused';

    mario.src = './imagens/game-over.png';
    mario.style.width = window.innerWidth <= 400 ? '46px' : '60px';

    setTimeout(() => {
        finalScoreDisplay.textContent = score;
        gameOverScreen.classList.remove('hidden');
    }, 800);
}

function startGame(speed) {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    score = 0;
    pipesPassed = 0;
    pipeSpeed = 3;
    pipePosition = -80;

    if (window.innerWidth <= 400) {
        pipeSpeed = 2.1;
    } else if (window.innerWidth <= 600) {
        pipeSpeed = 2.5;
    } else {
        pipeSpeed = 3;
    }

    // alert("Velocidade da tela: " + pipeSpeed);

    pipePassedThisCycle = false;
    isGameOver = false;
    isJumping = false;
    isGameStarted = true;
    coins = [];
    jumpY = 0;
    jumpVelocity = 0;

    if (jumpAnimationId) cancelAnimationFrame(jumpAnimationId);
    if (gameLoopId) cancelAnimationFrame(gameLoopId);

    scoreDisplay.textContent = '0';
    mario.src = './imagens/mario.gif';
    if (window.innerWidth <= 400) {

        mario.style.width = '46px';
        mario.style.bottom = '60px';
        mario.style.left = '12px';

    } else if (window.innerWidth <= 600) {

        mario.style.width = '70px';
        mario.style.bottom = '70px';
        mario.style.left = '45px';

    } else {

        mario.style.width = '100px';
        mario.style.bottom = '90px';
        mario.style.left = '100px';
    }

    pipe.style.animation = 'none';
    pipe.style.right = pipePosition + 'px';

    coinsContainer.innerHTML = '';

    setLoop(6).then(() => console.log(`Loop ${countLoop} Finalizado`))
    // gameLoopId = requestAnimationFrame(gameLoop, 100);

    coinInterval = setInterval(() => {
        if (!isGameOver && Math.random() < 0.15) {
            createCoin();
        }
    }, 800);
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!startScreen.classList.contains('hidden') || !gameOverScreen.classList.contains('hidden')) {
            startGame();
        } else {
            jump();
        }
    }
});

gameBoard.addEventListener('touchstart', (e) => {
    if (e.target.closest('.start-btn') || e.target.closest('.restart-btn')) return;
    e.preventDefault();
    if (!startScreen.classList.contains('hidden') || !gameOverScreen.classList.contains('hidden')) {
        startGame();
    } else {
        jump();
    }
});

document.addEventListener('click', (e) => {
    if (e.target === startBtn || e.target === restartBtn) return;
});

function changeSpeed(speed) {
    startGame(speed);
}