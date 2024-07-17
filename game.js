import { CONFIG } from './config.js';
import { Level } from './level.js';
import { Player } from './player.js';
import { grassTexture } from './assetLoader.js';

export class Game {
    constructor(canvas, ctx, playerSprites, playerShadows) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.playerSprites = playerSprites;
        this.playerShadows = playerShadows;
        this.level = null;
        this.player = null;
        this.currentLevelNumber = 1;
        this.lastUpdateTime = 0;
        
        // Pré-calcul du pattern d'herbe pour optimiser le rendu
        this.grassPattern = this.createGrassPattern();
        
        // Pré-calcul des positions de cellules pour optimiser les collisions
        this.cellPositions = this.precalculateCellPositions();
    }

    createGrassPattern() {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = grassTexture.width;
        patternCanvas.height = grassTexture.height;
        const patternCtx = patternCanvas.getContext('2d');
        patternCtx.drawImage(grassTexture, 0, 0);
        return this.ctx.createPattern(patternCanvas, 'repeat');
    }

    precalculateCellPositions() {
        const positions = new Array(CONFIG.gridHeight);
        for (let y = 0; y < CONFIG.gridHeight; y++) {
            positions[y] = new Array(CONFIG.gridWidth);
            for (let x = 0; x < CONFIG.gridWidth; x++) {
                positions[y][x] = {
                    left: x * CONFIG.cellSize,
                    top: y * CONFIG.cellSize,
                    right: (x + 1) * CONFIG.cellSize,
                    bottom: (y + 1) * CONFIG.cellSize
                };
            }
        }
        return positions;
    }

    startNewGame() {
        this.currentLevelNumber = 1;
        this.generateNewLevel();
    }

    generateNewLevel(entrancePos = null) {
        this.level = new Level(CONFIG.gridWidth, CONFIG.gridHeight, entrancePos);
        this.level.generate();
        
        const inset = CONFIG.cellSize * 0.1;
        const playerStartX = this.level.entrance.x === 0 ? inset : 
                             this.level.entrance.x === CONFIG.gridWidth - 1 ? (CONFIG.gridWidth - 1) * CONFIG.cellSize - inset :
                             this.level.entrance.x * CONFIG.cellSize;
        const playerStartY = this.level.entrance.y === 0 ? inset : 
                             this.level.entrance.y === CONFIG.gridHeight - 1 ? (CONFIG.gridHeight - 1) * CONFIG.cellSize - inset :
                             this.level.entrance.y * CONFIG.cellSize;
        
        this.player = new Player(playerStartX, playerStartY);
    }

    update(input, currentTime) {
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;
    
        this.movePlayer(input, deltaTime);
        this.player.updateAnimation(currentTime);

        if (this.hasReachedExit()) {
            this.goToNextLevel();
        }
    }

    goToNextLevel() {
        this.currentLevelNumber++;
        const entrancePos = {
            x: this.level.exit.x === 0 ? CONFIG.gridWidth - 1 : (this.level.exit.x === CONFIG.gridWidth - 1 ? 0 : this.level.exit.x),
            y: this.level.exit.y === 0 ? CONFIG.gridHeight - 1 : (this.level.exit.y === CONFIG.gridHeight - 1 ? 0 : this.level.exit.y)
        };
        this.generateNewLevel(entrancePos);
    }

    hasReachedExit() {
        const playerCellX = Math.floor(this.player.x / CONFIG.cellSize);
        const playerCellY = Math.floor(this.player.y / CONFIG.cellSize);
        return playerCellX === this.level.exit.x && playerCellY === this.level.exit.y;
    }

    movePlayer(input, deltaTime) {
        const baseSpeed = (CONFIG.playerSpeed * deltaTime) / 16;
        const speedFactor = this.player.getSpeedFactor();
        const speed = baseSpeed * speedFactor;
        
        let dx = 0, dy = 0;
        if (input.left) dx -= speed;
        if (input.right) dx += speed;
        if (input.up) dy -= speed;
        if (input.down) dy += speed;
    
        if (dx !== 0 && dy !== 0) {
            const factor = 1 / Math.sqrt(2);
            dx *= factor;
            dy *= factor;
        }
    
        this.applyMovement(dx, dy);
    
        this.player.isMoving = (dx !== 0 || dy !== 0);
        if (this.player.isMoving) {
            this.player.lastMoveTime = performance.now();
            this.player.updateDirection(dx, dy);
        }
    
        if (input.jump) {
            this.player.jump();
        }
    }
    
    applyMovement(dx, dy) {
        const steps = 4;
        const stepX = dx / steps;
        const stepY = dy / steps;
    
        for (let i = 0; i < steps; i++) {
            const newX = this.player.x + stepX;
            const newY = this.player.y + stepY;
    
            const { collision: collisionX, slideX } = this.checkCollision(newX, this.player.y);
            const { collision: collisionY, slideY } = this.checkCollision(this.player.x, newY);
    
            if (!collisionX) {
                this.player.x = newX;
            } else if (Math.abs(slideX) > Math.abs(stepX) * 0.1) {
                this.player.x += slideX;
            }
    
            if (!collisionY) {
                this.player.y = newY;
            } else if (Math.abs(slideY) > Math.abs(stepY) * 0.1) {
                this.player.y += slideY;
            }
    
            if (collisionX && collisionY) {
                break;
            }
        }
    }

    checkCollision(x, y) {
        const hitboxSize = CONFIG.playerHitboxSize;
        const treeHitboxSize = CONFIG.treeHitboxSize * 0.8;
        const hitboxOffset = (CONFIG.cellSize - hitboxSize) / 2;
        const treeHitboxOffset = (CONFIG.cellSize - treeHitboxSize) / 2;
    
        const playerLeft = x + hitboxOffset;
        const playerTop = y + hitboxOffset;
        const playerRight = playerLeft + hitboxSize;
        const playerBottom = playerTop + hitboxSize;
    
        const leftCell = Math.floor(playerLeft / CONFIG.cellSize);
        const topCell = Math.floor(playerTop / CONFIG.cellSize);
        const rightCell = Math.floor(playerRight / CONFIG.cellSize);
        const bottomCell = Math.floor(playerBottom / CONFIG.cellSize);
    
        let collision = false;
        let slideX = 0;
        let slideY = 0;
    
        for (let cellY = topCell; cellY <= bottomCell; cellY++) {
            for (let cellX = leftCell; cellX <= rightCell; cellX++) {
                if (this.isTreeOrWall(cellX, cellY)) {
                    const cell = this.cellPositions[cellY][cellX];
                    const treeLeft = cell.left + treeHitboxOffset;
                    const treeTop = cell.top + treeHitboxOffset;
                    const treeRight = treeLeft + treeHitboxSize;
                    const treeBottom = treeTop + treeHitboxSize;
    
                    if (playerRight > treeLeft && playerLeft < treeRight &&
                        playerBottom > treeTop && playerTop < treeBottom) {
                        collision = true;
    
                        const overlapLeft = playerRight - treeLeft;
                        const overlapRight = treeRight - playerLeft;
                        const overlapTop = playerBottom - treeTop;
                        const overlapBottom = treeBottom - playerTop;
    
                        const minOverlapX = Math.min(overlapLeft, overlapRight);
                        const minOverlapY = Math.min(overlapTop, overlapBottom);
    
                        if (minOverlapX < minOverlapY) {
                            slideX = (overlapLeft < overlapRight) ? -minOverlapX : minOverlapX;
                        } else {
                            slideY = (overlapTop < overlapBottom) ? -minOverlapY : minOverlapY;
                        }
                    }
                }
            }
        }
        
        const minSlideThreshold = 0.1;
        if (Math.abs(slideX) < minSlideThreshold) slideX = 0;
        if (Math.abs(slideY) < minSlideThreshold) slideY = 0;
        
        return { collision, slideX, slideY };
    }
    
    isTreeOrWall(x, y) {
        return (y < 0 || y >= this.level.maze.length ||
                x < 0 || x >= this.level.maze[0].length ||
                this.level.maze[y][x] === 1);
    }

    draw() {
        this.ctx.fillStyle = this.grassPattern;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.level.draw(this.ctx);
        
        this.player.draw(this.ctx, this.playerSprites, this.playerShadows);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Niveau: ${this.currentLevelNumber}`, 10, 30);
    }
}