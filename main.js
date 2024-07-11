import { CONFIG } from './config.js';
import { Game } from './game.js';
import { loadAssets, playerSprites } from './assetLoader.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.cellSize * CONFIG.gridWidth;
canvas.height = CONFIG.cellSize * CONFIG.gridHeight;

const keysPressed = new Set();

function handleKeyDown(e) {
    const key = e.key.toLowerCase();
    if (['arrowleft', 'a'].includes(key)) keysPressed.add('left');
    if (['arrowright', 'd'].includes(key)) keysPressed.add('right');
    if (['arrowup', 'w'].includes(key)) keysPressed.add('up');
    if (['arrowdown', 's'].includes(key)) keysPressed.add('down');
}

function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    if (['arrowleft', 'a'].includes(key)) keysPressed.delete('left');
    if (['arrowright', 'd'].includes(key)) keysPressed.delete('right');
    if (['arrowup', 'w'].includes(key)) keysPressed.delete('up');
    if (['arrowdown', 's'].includes(key)) keysPressed.delete('down');
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

let game;

function gameLoop() {
    game.update(keysPressed);
    game.draw();
    requestAnimationFrame(gameLoop);
}

async function initGame() {
    try {
        await loadAssets();
        game = new Game(canvas, ctx, playerSprites);
        game.startNewGame();
        gameLoop();
    } catch (error) {
        console.error("Error initializing game:", error);
    }
}

initGame();