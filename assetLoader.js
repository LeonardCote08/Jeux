import { CONFIG } from './config.js';

export const playerSprites = {
    down: [], up: [], right: [], left: [],
    walkDown: [], walkUp: [], walkRight: [], walkLeft: []
};

const treeImages = {};
const imageNames = ['corner_top_left', 'corner_top_right', 'trunk_left', 'trunk_right'];

export async function loadAssets() {
    await Promise.all([loadSprites(), loadTreeImages()]);
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