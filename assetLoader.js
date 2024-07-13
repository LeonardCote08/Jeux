import { CONFIG } from './config.js';

export const playerSprites = {
    right: [], left: [], upRight: [], upLeft: [], downRight: [], downLeft: [],
    walkRight: [], walkLeft: [], walkUpRight: [], walkUpLeft: [], walkDownRight: [], walkDownLeft: []
};

export const playerShadows = {
    right: [], left: [], upRight: [], upLeft: [], downRight: [], downLeft: [],
    walkRight: [], walkLeft: [], walkUpRight: [], walkUpLeft: [], walkDownRight: [], walkDownLeft: []
};

const treeImages = {};
const imageNames = ['corner_top_left', 'corner_top_right', 'trunk_left', 'trunk_right'];

export let grassTexture; // Nouvelle variable pour stocker la texture d'herbe

export async function loadAssets() {
    await Promise.all([loadPlayerSprites(), loadTreeImages(), loadGrassTexture()]);
}

async function loadTreeImages() {
    const loadPromises = imageNames.map(name => 
        loadImage(`Assets/sprites_decoupes_arbres/${name}.png`)
            .then(img => treeImages[name] = img)
    );
    await Promise.all(loadPromises);
}

async function loadPlayerSprites() {
    const spriteSheet = await loadImage('Assets/player/minotaur/MinotaurWalk.png');
    const shadowSheet = await loadImage('Assets/player/minotaur/shadows/ShadowWalk.png');
    
    const directions = ['downRight', 'downLeft', 'upRight', 'upLeft'];
    
    directions.forEach((dir, i) => {
        playerSprites[dir] = [extractSprite(spriteSheet, 0, i)];
        playerShadows[dir] = [extractSprite(shadowSheet, 0, i)];
        playerSprites[`walk${dir.charAt(0).toUpperCase() + dir.slice(1)}`] = [];
        playerShadows[`walk${dir.charAt(0).toUpperCase() + dir.slice(1)}`] = [];

        for (let j = 0; j < 6; j++) {
            const sprite = extractSprite(spriteSheet, j, i);
            const shadow = extractSprite(shadowSheet, j, i);
            
            playerSprites[`walk${dir.charAt(0).toUpperCase() + dir.slice(1)}`].push(sprite);
            playerShadows[`walk${dir.charAt(0).toUpperCase() + dir.slice(1)}`].push(shadow);
        }
    });

    // Ajout des directions droite et gauche
    playerSprites.right = playerSprites.downRight;
    playerSprites.left = playerSprites.downLeft;
    playerSprites.walkRight = playerSprites.walkDownRight;
    playerSprites.walkLeft = playerSprites.walkDownLeft;
    playerShadows.right = playerShadows.downRight;
    playerShadows.left = playerShadows.downLeft;
    playerShadows.walkRight = playerShadows.walkDownRight;
    playerShadows.walkLeft = playerShadows.walkDownLeft;
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

async function loadGrassTexture() {
    grassTexture = await loadImage('Assets/GrassTexture.png');
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