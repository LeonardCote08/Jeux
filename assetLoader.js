import { CONFIG } from './config.js';

export const playerSprites = {
    right: [], left: [], upRight: [], upLeft: [], downRight: [], downLeft: [],
    walkRight: [], walkLeft: [], walkUpRight: [], walkUpLeft: [], walkDownRight: [], walkDownLeft: [],
    jumpRight: [], jumpLeft: [], jumpUpRight: [], jumpUpLeft: [], jumpDownRight: [], jumpDownLeft: []
};

export const playerShadows = {
    right: [], left: [], upRight: [], upLeft: [], downRight: [], downLeft: [],
    walkRight: [], walkLeft: [], walkUpRight: [], walkUpLeft: [], walkDownRight: [], walkDownLeft: [],
    jumpRight: [], jumpLeft: [], jumpUpRight: [], jumpUpLeft: [], jumpDownRight: [], jumpDownLeft: []
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
    const walkSheet = await loadImage('Assets/player/minotaur/MinotaurWalk.png');
    const jumpSheet = await loadImage('Assets/player/minotaur/MinotaurJump.png');
    const shadowWalkSheet = await loadImage('Assets/player/minotaur/shadows/ShadowWalk.png');
    const shadowJumpSheet = await loadImage('Assets/player/minotaur/shadows/ShadowJump.png');
    
    const directions = ['downRight', 'downLeft', 'upRight', 'upLeft'];
    
    directions.forEach((dir, i) => {
        // Chargement des sprites de marche
        playerSprites[dir] = [extractSprite(walkSheet, 0, i)];
        playerShadows[dir] = [extractSprite(shadowWalkSheet, 0, i)];
        playerSprites[`walk${dir.charAt(0).toUpperCase() + dir.slice(1)}`] = [];
        playerShadows[`walk${dir.charAt(0).toUpperCase() + dir.slice(1)}`] = [];

        for (let j = 0; j < 6; j++) {
            const sprite = extractSprite(walkSheet, j, i);
            const shadow = extractSprite(shadowWalkSheet, j, i);
            
            playerSprites[`walk${dir.charAt(0).toUpperCase() + dir.slice(1)}`].push(sprite);
            playerShadows[`walk${dir.charAt(0).toUpperCase() + dir.slice(1)}`].push(shadow);
        }

        // Chargement des sprites de saut
        playerSprites[`jump${dir.charAt(0).toUpperCase() + dir.slice(1)}`] = [];
        playerShadows[`jump${dir.charAt(0).toUpperCase() + dir.slice(1)}`] = [];

        for (let j = 0; j < 6; j++) {
            const jumpSprite = extractSprite(jumpSheet, j, i);
            const jumpShadow = extractSprite(shadowJumpSheet, j, i);
            
            playerSprites[`jump${dir.charAt(0).toUpperCase() + dir.slice(1)}`].push(jumpSprite);
            playerShadows[`jump${dir.charAt(0).toUpperCase() + dir.slice(1)}`].push(jumpShadow);
        }
    });

    // Ajout des directions droite et gauche
    playerSprites.right = playerSprites.downRight;
    playerSprites.left = playerSprites.downLeft;
    playerSprites.walkRight = playerSprites.walkDownRight;
    playerSprites.walkLeft = playerSprites.walkDownLeft;
    playerSprites.jumpRight = playerSprites.jumpDownRight;
    playerSprites.jumpLeft = playerSprites.jumpDownLeft;
    playerShadows.right = playerShadows.downRight;
    playerShadows.left = playerShadows.downLeft;
    playerShadows.walkRight = playerShadows.walkDownRight;
    playerShadows.walkLeft = playerShadows.walkDownLeft;
    playerShadows.jumpRight = playerShadows.jumpDownRight;
    playerShadows.jumpLeft = playerShadows.jumpDownLeft;
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