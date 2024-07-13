import { CONFIG } from './config.js';
import { Game } from './game.js';
import { loadAssets, playerSprites, playerShadows } from './assetLoader.js';

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
    console.log('Key pressed:', key); // Log pour le débogage
    console.log('Keys currently pressed:', Array.from(keysPressed)); // Log pour le débogage
}

function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    if (['arrowleft', 'a'].includes(key)) keysPressed.delete('left');
    if (['arrowright', 'd'].includes(key)) keysPressed.delete('right');
    if (['arrowup', 'w'].includes(key)) keysPressed.delete('up');
    if (['arrowdown', 's'].includes(key)) keysPressed.delete('down');
    console.log('Key released:', key); // Log pour le débogage
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

let game;

function gameLoop(currentTime) {
    game.update(keysPressed, currentTime);
    game.draw();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

async function initGame() {
    try {
        await loadAssets();
        game = new Game(canvas, ctx, playerSprites, playerShadows);
        game.startNewGame();
        gameLoop();
    } catch (error) {
        console.error("Error initializing game:", error);
    }
}

initGame();