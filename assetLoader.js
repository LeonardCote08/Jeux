import { CONFIG } from './config.js';

export const playerSprites = {
    right: [], left: [], upRight: [], upLeft: [],
    walkRight: [], walkLeft: [], walkUpRight: [], walkUpLeft: []
};

export const playerShadows = {
    right: [], left: [], upRight: [], upLeft: [],
    walkRight: [], walkLeft: [], walkUpRight: [], walkUpLeft: []
};

const treeImages = {};
const imageNames = ['corner_top_left', 'corner_top_right', 'trunk_left', 'trunk_right'];

export async function loadAssets() {
    await Promise.all([loadPlayerSprites(), loadTreeImages()]);
}

async function loadTreeImages() {
    const loadPromises = imageNames.map(name => 
        loadImage(`Assets/sprites_decoupes_arbres/${name}.png`)
            .then(img => treeImages[name] = img)
    );
    await Promise.all(loadPromises);
}

async function loadSprites() {
    const directions = ['down', 'up', 'right', 'left'];
    const loadPromises = directions.flatMap(dir => {
        const baseIndex = dir === 'down' ? '0' : dir === 'up' ? '2' : '1';
        return [
            loadImage(`Assets/sprites_decoupes/sprite_0_${baseIndex}.png`).then(img => playerSprites[dir].push(img)),
            loadImage(`Assets/sprites_decoupes/sprite_1_${baseIndex}.png`).then(img => playerSprites[`walk${dir.charAt(0).toUpperCase() + dir.slice(1)}`].push(img)),
            loadImage(`Assets/sprites_decoupes/sprite_2_${baseIndex}.png`).then(img => playerSprites[`walk${dir.charAt(0).toUpperCase() + dir.slice(1)}`].push(img))
        ];
    });
    await Promise.all(loadPromises);
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function extractSprite(sheet, col, row) {
    const canvas = document.createElement('canvas');
    canvas.width = CONFIG.spriteSize;
    canvas.height = CONFIG.spriteSize;
    const ctx = canvas.getContext('2d');
    
    const spriteWidth = 32;  // Largeur d'un sprite dans la feuille
    const spriteHeight = 32; // Hauteur d'un sprite dans la feuille
    
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, 
        col * spriteWidth, row * spriteHeight,
        spriteWidth, spriteHeight,
        0, 0,
        CONFIG.spriteSize, CONFIG.spriteSize
    );
    return canvas;
}

async function loadPlayerSprites() {
    const spriteSheet = await loadImage('Assets/player/minotaur/MinotaurWalk.png');
    const shadowSheet = await loadImage('Assets/player/minotaur/ShadowWalk.png');
    
    const directions = ['right', 'left', 'upRight', 'upLeft'];
    
    directions.forEach((dir, i) => {
        for (let j = 0; j < 6; j++) {
            const sprite = extractSprite(spriteSheet, j, i);
            const shadow = extractSprite(shadowSheet, j, i);
            
            if (j === 0) {
                playerSprites[dir].push(sprite);
                playerShadows[dir].push(shadow);
            } else {
                playerSprites[`walk${dir.charAt(0).toUpperCase() + dir.slice(1)}`].push(sprite);
                playerShadows[`walk${dir.charAt(0).toUpperCase() + dir.slice(1)}`].push(shadow);
            }
        }
    });
}

export function drawTreeBlock(ctx, x, y) {
    imageNames.forEach((type, i) => {
        const img = treeImages[type];
        if (img) {
            ctx.drawImage(
                img,
                x * CONFIG.cellSize + (i % 2) * (CONFIG.cellSize / 2),
                y * CONFIG.cellSize + Math.floor(i / 2) * (CONFIG.cellSize / 2),
                CONFIG.cellSize / 2,
                CONFIG.cellSize / 2
            );
        }
    });
}