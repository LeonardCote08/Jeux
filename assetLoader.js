import { CONFIG } from './config.js';

export const playerSprites = {
    right: [], left: [], upRight: [], upLeft: [], downRight: [], downLeft: [],
    walkRight: [], walkLeft: [], walkUpRight: [], walkUpLeft: [], walkDownRight: [], walkDownLeft: [],
    jumpRight: [], jumpLeft: [], jumpUpRight: [], jumpUpLeft: [], jumpDownRight: [], jumpDownLeft: [],
    idleRight: [], idleLeft: [], idleUpRight: [], idleUpLeft: [], idleDownRight: [], idleDownLeft: []
};

export const playerShadows = {
    right: [], left: [], upRight: [], upLeft: [], downRight: [], downLeft: [],
    walkRight: [], walkLeft: [], walkUpRight: [], walkUpLeft: [], walkDownRight: [], walkDownLeft: [],
    jumpRight: [], jumpLeft: [], jumpUpRight: [], jumpUpLeft: [], jumpDownRight: [], jumpDownLeft: [],
    idleRight: [], idleLeft: [], idleUpRight: [], idleUpLeft: [], idleDownRight: [], idleDownLeft: []
};

let treeImage;
let treeShadowImage;
let flowerImages = {};

export let grassTexture;

export async function loadAssets() {
    await Promise.all([
        loadPlayerSprites(),
        loadTreeImages(),
        loadFlowerImages(),
        loadGrassTexture()
    ]);
}

async function loadTreeImages() {
    treeImage = await loadImage('Assets/props/SingleTree.png');
    treeShadowImage = await loadImage('Assets/props/shadows/SingleTreeShadow.png');
}

async function loadFlowerImages() {
    const flowerTypes = ['FleurBlanche', 'FleurMauve', 'FleurRouge'];
    for (let type of flowerTypes) {
        flowerImages[type] = await loadImage(`Assets/props/fleurs/${type}.png`);
    }
}

async function loadPlayerSprites() {
    const walkSheet = await loadImage('Assets/player/minotaur/MinotaurWalk.png');
    const jumpSheet = await loadImage('Assets/player/minotaur/MinotaurJump.png');
    const idleSheet = await loadImage('Assets/player/minotaur/MinotaurIdle.png');
    const shadowWalkSheet = await loadImage('Assets/player/minotaur/shadows/ShadowWalk.png');
    const shadowJumpSheet = await loadImage('Assets/player/minotaur/shadows/ShadowJump.png');
    const shadowIdleSheet = await loadImage('Assets/player/minotaur/shadows/ShadowIdle.png');
    
    const directions = ['downRight', 'downLeft', 'upRight', 'upLeft'];
    
    directions.forEach((dir, i) => {
        // Chargement des sprites de marche
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

        // Chargement des sprites idle
        playerSprites[`idle${dir.charAt(0).toUpperCase() + dir.slice(1)}`] = [];
        playerShadows[`idle${dir.charAt(0).toUpperCase() + dir.slice(1)}`] = [];
        for (let j = 0; j < 16; j++) {
            const idleSprite = extractSprite(idleSheet, j, i);
            const idleShadow = extractSprite(shadowIdleSheet, j, i);
            playerSprites[`idle${dir.charAt(0).toUpperCase() + dir.slice(1)}`].push(idleSprite);
            playerShadows[`idle${dir.charAt(0).toUpperCase() + dir.slice(1)}`].push(idleShadow);
        }
    });

    // Ajout des directions droite et gauche
    playerSprites.right = playerSprites.walkDownRight;
    playerSprites.left = playerSprites.walkDownLeft;
    playerSprites.walkRight = playerSprites.walkDownRight;
    playerSprites.walkLeft = playerSprites.walkDownLeft;
    playerSprites.jumpRight = playerSprites.jumpDownRight;
    playerSprites.jumpLeft = playerSprites.jumpDownLeft;
    playerSprites.idleRight = playerSprites.idleDownRight;
    playerSprites.idleLeft = playerSprites.idleDownLeft;

    playerShadows.right = playerShadows.walkDownRight;
    playerShadows.left = playerShadows.walkDownLeft;
    playerShadows.walkRight = playerShadows.walkDownRight;
    playerShadows.walkLeft = playerShadows.walkDownLeft;
    playerShadows.jumpRight = playerShadows.jumpDownRight;
    playerShadows.jumpLeft = playerShadows.jumpDownLeft;
    playerShadows.idleRight = playerShadows.idleDownRight;
    playerShadows.idleLeft = playerShadows.idleDownLeft;
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
    const drawX = x * CONFIG.cellSize;
    const drawY = y * CONFIG.cellSize;
    const size = CONFIG.cellSize;

    // Dessiner l'ombre de l'arbre
    ctx.drawImage(treeShadowImage, drawX, drawY, size, size);
    
    // Dessiner l'arbre
    ctx.drawImage(treeImage, drawX, drawY, size, size);
}

export function drawFlower(ctx, x, y, flowerType) {
    const drawX = x * CONFIG.cellSize;
    const drawY = y * CONFIG.cellSize;
    const size = CONFIG.cellSize;

    ctx.drawImage(flowerImages[flowerType], drawX, drawY, size, size);
}