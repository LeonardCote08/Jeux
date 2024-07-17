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

// Variables pour stocker les images des éléments du jeu
let treeImage;
let treeShadowImage;
let appleTreeImage;
let appleTreeShadowImage;
let flowerImages = {};
let pondImage;
let pondSidesImage;
export let grassTexture;

export async function loadAssets() {
    await Promise.all([
        loadPlayerSprites(),
        loadTreeImages(),
        loadFlowerImages(),
        loadGrassTexture(),
        loadPondImage(),
        loadPondSidesImage()
    ]);
}

async function loadTreeImages() {
    treeImage = await loadImage('Assets/props/SingleTree.png');
    treeShadowImage = await loadImage('Assets/props/shadows/SingleTreeShadow.png');
    appleTreeImage = await loadImage('Assets/props/SingleTreeApples.png');
    appleTreeShadowImage = await loadImage('Assets/props/shadows/SingleTreeApplesShadow.png');
}

async function loadFlowerImages() {
    const flowerTypes = ['FleurBlanche', 'FleurMauve', 'FleurRouge'];
    for (let type of flowerTypes) {
        flowerImages[type] = await loadImage(`Assets/props/fleurs/${type}.png`);
    }
}

async function loadPondImage() {
    pondImage = await loadImage('Assets/props/water/Water1.png');
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
        // Chargement des sprites de marche, saut et idle pour chaque direction
        for (let j = 0; j < 6; j++) {
            playerSprites[`walk${dir.charAt(0).toUpperCase() + dir.slice(1)}`].push(extractSprite(walkSheet, j, i));
            playerShadows[`walk${dir.charAt(0).toUpperCase() + dir.slice(1)}`].push(extractSprite(shadowWalkSheet, j, i));
            
            playerSprites[`jump${dir.charAt(0).toUpperCase() + dir.slice(1)}`].push(extractSprite(jumpSheet, j, i));
            playerShadows[`jump${dir.charAt(0).toUpperCase() + dir.slice(1)}`].push(extractSprite(shadowJumpSheet, j, i));
        }
        
        for (let j = 0; j < 16; j++) {
            playerSprites[`idle${dir.charAt(0).toUpperCase() + dir.slice(1)}`].push(extractSprite(idleSheet, j, i));
            playerShadows[`idle${dir.charAt(0).toUpperCase() + dir.slice(1)}`].push(extractSprite(shadowIdleSheet, j, i));
        }
    });

    // Ajout des directions droite et gauche
    ['right', 'left'].forEach(dir => {
        playerSprites[dir] = playerSprites[`walkDown${dir.charAt(0).toUpperCase() + dir.slice(1)}`];
        playerSprites[`walk${dir.charAt(0).toUpperCase() + dir.slice(1)}`] = playerSprites[`walkDown${dir.charAt(0).toUpperCase() + dir.slice(1)}`];
        playerSprites[`jump${dir.charAt(0).toUpperCase() + dir.slice(1)}`] = playerSprites[`jumpDown${dir.charAt(0).toUpperCase() + dir.slice(1)}`];
        playerSprites[`idle${dir.charAt(0).toUpperCase() + dir.slice(1)}`] = playerSprites[`idleDown${dir.charAt(0).toUpperCase() + dir.slice(1)}`];

        playerShadows[dir] = playerShadows[`walkDown${dir.charAt(0).toUpperCase() + dir.slice(1)}`];
        playerShadows[`walk${dir.charAt(0).toUpperCase() + dir.slice(1)}`] = playerShadows[`walkDown${dir.charAt(0).toUpperCase() + dir.slice(1)}`];
        playerShadows[`jump${dir.charAt(0).toUpperCase() + dir.slice(1)}`] = playerShadows[`jumpDown${dir.charAt(0).toUpperCase() + dir.slice(1)}`];
        playerShadows[`idle${dir.charAt(0).toUpperCase() + dir.slice(1)}`] = playerShadows[`idleDown${dir.charAt(0).toUpperCase() + dir.slice(1)}`];
    });
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Extrait un sprite individuel d'une feuille de sprites
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

export function drawPond(ctx, x, y, width, height) {
    const cellSize = CONFIG.cellSize;
    const drawX = x * cellSize;
    const drawY = y * cellSize;

    // Dessiner les coins
    drawPondPart(ctx, drawX, drawY, 0, 0); // Coin supérieur gauche
    drawPondPart(ctx, drawX + width - 8, drawY, 2, 0); // Coin supérieur droit
    drawPondPart(ctx, drawX, drawY + height - 8, 0, 2); // Coin inférieur gauche
    drawPondPart(ctx, drawX + width - 8, drawY + height - 8, 2, 2); // Coin inférieur droit

    // Dessiner les bords
    for (let i = 8; i < width - 8; i += 8) {
        drawPondPart(ctx, drawX + i, drawY, 1, 0); // Bord supérieur
        drawPondPart(ctx, drawX + i, drawY + height - 8, 1, 2); // Bord inférieur
    }
    for (let i = 8; i < height - 8; i += 8) {
        drawPondPart(ctx, drawX, drawY + i, 0, 1); // Bord gauche
        drawPondPart(ctx, drawX + width - 8, drawY + i, 2, 1); // Bord droit
    }

    // Remplir le centre
    for (let i = 8; i < width - 8; i += 8) {
        for (let j = 8; j < height - 8; j += 8) {
            drawPondPart(ctx, drawX + i, drawY + j, 1, 1);
        }
    }
}

// Charge la texture de l'herbe
async function loadGrassTexture() {
    grassTexture = await loadImage('Assets/GrassTexture.png');
}

// Fonction pour dessiner un bloc d'arbre
export function drawTreeBlock(ctx, x, y, isAppleTree) {
    const drawX = x * CONFIG.cellSize;
    const drawY = y * CONFIG.cellSize;
    const size = CONFIG.cellSize;

    ctx.drawImage(isAppleTree ? appleTreeShadowImage : treeShadowImage, drawX, drawY, size, size);
    ctx.drawImage(isAppleTree ? appleTreeImage : treeImage, drawX, drawY, size, size);
}

async function loadPondSidesImage() {
    pondSidesImage = await loadImage('Assets/props/water/WaterSides1.png');
}

// Nouvelle fonction pour dessiner une partie spécifique de l'étang
function drawPondPart(ctx, x, y, partX, partY) {
    const partSize = 8; // Chaque partie fait 8x8 pixels
    ctx.drawImage(
        pondSidesImage,
        partX * partSize, partY * partSize, partSize, partSize,
        x, y, partSize, partSize
    );
}

export function drawFlower(ctx, x, y, flowerType) {
    const drawX = x * CONFIG.cellSize;
    const drawY = y * CONFIG.cellSize;
    const size = CONFIG.cellSize * 0.75; // Réduire la taille à 75%
    const offset = (CONFIG.cellSize - size) / 2; // Centrer la fleur dans la cellule

    ctx.drawImage(
        flowerImages[flowerType], 
        drawX + offset, 
        drawY + offset, 
        size, 
        size
    );
}