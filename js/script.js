const mario = document.querySelector('.mario');
const pipe = document.querySelector('.pipe');
const clouds = document.querySelector('.clouds');
const gameOverImg = document.querySelector('.game-over-img');

let isGameOver = false;


const jump = () => {
    if (isGameOver) return;
    mario.classList.add('jump');

    setTimeout(() => {
        mario.classList.remove('jump');
    }, 500);
}

const loop = setInterval(() => {

    const pipePosition = pipe.offsetLeft;
    const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '');


    if (pipePosition <= 120 && pipePosition > 0 && marioPosition < 80) {

        pipe.style.animation = 'none';
        pipe.style.left = `${pipePosition}px`;

        mario.style.animation = 'none';
        mario.style.bottom = `${marioPosition}px`;

        mario.src = './imagens/game-over.png';
        mario.style.width = '75px';
        mario.style.marginLeft = '50px';

        const cloudsPosition = clouds.offsetLeft;

        clouds.style.animation = 'none';
        clouds.style.left = `${cloudsPosition}px`;

       gameOverImg.style.display = 'block';

        clearInterval(loop);
        isGameOver = true;
    }

}, 10)

document.addEventListener('keydown', jump);
document.addEventListener('keydown', () => {
    if (isGameOver) {
        location.reload();
    }
});