import { CONFIG } from './config.js';
import { Game } from './game.js';
import { loadAssets, playerSprites, playerShadows, updateWaterAnimation } from './assetLoader.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.cellSize * CONFIG.gridWidth;
canvas.height = CONFIG.cellSize * CONFIG.gridHeight;

ctx.imageSmoothingEnabled = false;

const keysPressed = new Set();
let jumpRequested = false;

function handleKeyDown(e) {
    const key = e.key.toLowerCase();
    if (['arrowleft', 'a', 'arrowright', 'd', 'arrowup', 'w', 'arrowdown', 's'].includes(key)) {
        keysPressed.add(key);
        e.preventDefault();
    }
    if (key === ' ') {
        jumpRequested = true;
        e.preventDefault();
    }
}

function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    if (['arrowleft', 'a', 'arrowright', 'd', 'arrowup', 'w', 'arrowdown', 's'].includes(key)) {
        keysPressed.delete(key);
    }
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

let game;
let lastTime = 0;

function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    const input = {
        left: keysPressed.has('arrowleft') || keysPressed.has('a'),
        right: keysPressed.has('arrowright') || keysPressed.has('d'),
        up: keysPressed.has('arrowup') || keysPressed.has('w'),
        down: keysPressed.has('arrowdown') || keysPressed.has('s'),
        jump: jumpRequested
    };

    game.update(input, currentTime);
    updateWaterAnimation();
    game.draw();
    
    if (jumpRequested) {
        game.player.requestJump();
        jumpRequested = false;
    }
    
    requestAnimationFrame(gameLoop);
}

async function initGame() {
    try {
        await loadAssets();
        game = new Game(canvas, ctx, playerSprites, playerShadows);
        game.startNewGame();
        requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error("Erreur lors de l'initialisation du jeu:", error);
    }
}

initGame();