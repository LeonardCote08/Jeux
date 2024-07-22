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
let pondSidesImages = [];
let waterAnimationFrame = 0;
const ANIMATION_SPEED = 500; 
let animationCounter = 0;
const ANIMATION_FRAME_RATE = 60; // Nombre de frames par seconde du jeu
export let grassTexture;

export async function loadAssets() {
    await Promise.all([
        loadPlayerSprites(),
        loadTreeImages(),
        loadFlowerImages(),
        loadGrassTexture(),
        loadPondSidesImages()
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

export function drawPond(ctx, pond) {
    const pondImage = pondSidesImages[waterAnimationFrame];
    const {shape, centerX, centerY} = pond;
    const halfSize = Math.floor(shape.length / 2);

    for (let dy = 0; dy < shape.length; dy++) {
        for (let dx = 0; dx < shape[dy].length; dx++) {
            if (shape[dy][dx]) {
                const worldX = (centerX - halfSize + dx) * CONFIG.cellSize;
                const worldY = (centerY - halfSize + dy) * CONFIG.cellSize;
                const tileType = getPondTileType(shape, dx, dy);
                drawPondTile(ctx, pondImage, worldX, worldY, tileType);
            }
        }
    }
}

// Fonction modifiée dans assetLoader.js
function drawPondTile(ctx, image, x, y, tileType) {
    const tileSize = 8;
    let sx, sy;

    switch (tileType) {
        case 'topLeft': sx = 0; sy = 0; break;
        case 'top': sx = tileSize; sy = 0; break;
        case 'topRight': sx = tileSize * 2; sy = 0; break;
        case 'left': sx = 0; sy = tileSize; break;
        case 'center': sx = tileSize; sy = tileSize; break;
        case 'right': sx = tileSize * 2; sy = tileSize; break;
        case 'bottomLeft': sx = 0; sy = tileSize * 2; break;
        case 'bottom': sx = tileSize; sy = tileSize * 2; break;
        case 'bottomRight': sx = tileSize * 2; sy = tileSize * 2; break;
        case 'innerTopLeft': sx = tileSize; sy = tileSize; break;
        case 'innerTopRight': sx = tileSize; sy = tileSize; break;
        case 'innerBottomLeft': sx = tileSize; sy = tileSize; break;
        case 'innerBottomRight': sx = tileSize; sy = tileSize; break;
    }

    ctx.drawImage(image, sx, sy, tileSize, tileSize, x, y, CONFIG.cellSize, CONFIG.cellSize);
}

function getPondTileType(shape, x, y) {
    const isWater = (dx, dy) => {
        const newX = x + dx;
        const newY = y + dy;
        return newX >= 0 && newX < shape[0].length && newY >= 0 && newY < shape.length && shape[newY][newX];
    };

    const top = !isWater(0, -1);
    const bottom = !isWater(0, 1);
    const left = !isWater(-1, 0);
    const right = !isWater(1, 0);

    if (top && left) return 'topLeft';
    if (top && right) return 'topRight';
    if (bottom && left) return 'bottomLeft';
    if (bottom && right) return 'bottomRight';
    if (top) return 'top';
    if (bottom) return 'bottom';
    if (left) return 'left';
    if (right) return 'right';

    // Vérifier les diagonales pour les coins intérieurs
    const topLeft = !isWater(-1, -1);
    const topRight = !isWater(1, -1);
    const bottomLeft = !isWater(-1, 1);
    const bottomRight = !isWater(1, 1);

    if (topLeft && !top && !left) return 'innerTopLeft';
    if (topRight && !top && !right) return 'innerTopRight';
    if (bottomLeft && !bottom && !left) return 'innerBottomLeft';
    if (bottomRight && !bottom && !right) return 'innerBottomRight';

    return 'center';
}


export function updateWaterAnimation() {
    animationCounter++;
    if (animationCounter >= ANIMATION_SPEED / (1000 / ANIMATION_FRAME_RATE)) {
        waterAnimationFrame = (waterAnimationFrame + 1) % pondSidesImages.length;
        animationCounter = 0;
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

async function loadPondSidesImages() {
    pondSidesImages.push(await loadImage('Assets/props/water/WaterSides1.png'));
    pondSidesImages.push(await loadImage('Assets/props/water/WaterSides2.png'));
}

// Nouvelle fonction pour dessiner une partie spécifique de l'étang
function drawPondPart(ctx, x, y, partX, partY) {
    const partSize = 8; // Chaque partie fait 8x8 pixels
    ctx.drawImage(
        pondSidesImages[waterAnimationFrame],
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