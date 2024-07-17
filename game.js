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
    }

    startNewGame() {
        this.currentLevelNumber = 1;
        this.generateNewLevel();
    }

    generateNewLevel(entrancePos = null) {
        this.level = new Level(CONFIG.gridWidth, CONFIG.gridHeight, entrancePos);
        this.level.generate();
        
        // Calculer la position légèrement à l'intérieur du labyrinthe
        let playerStartX, playerStartY;
        const inset = CONFIG.cellSize * 0.1; // 10% de la taille d'une cellule
        
        if (this.level.entrance.x === 0) {
            playerStartX = inset; // Légèrement à l'intérieur depuis le bord gauche
        } else if (this.level.entrance.x === CONFIG.gridWidth - 1) {
            playerStartX = (CONFIG.gridWidth - 1) * CONFIG.cellSize - inset; // Légèrement à l'intérieur depuis le bord droit
        } else {
            playerStartX = this.level.entrance.x * CONFIG.cellSize;
        }
        
        if (this.level.entrance.y === 0) {
            playerStartY = inset; // Légèrement à l'intérieur depuis le bord supérieur
        } else if (this.level.entrance.y === CONFIG.gridHeight - 1) {
            playerStartY = (CONFIG.gridHeight - 1) * CONFIG.cellSize - inset; // Légèrement à l'intérieur depuis le bord inférieur
        } else {
            playerStartY = this.level.entrance.y * CONFIG.cellSize;
        }
        
        this.player = new Player(playerStartX, playerStartY);
    }

    update(keysPressed, currentTime) {
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;
    
        this.movePlayer(keysPressed, deltaTime);
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

    updateAnimation(currentTime) {
        const elapsed = currentTime - this.lastFrameTime;
        if (elapsed >= this.frameDuration) {
            this.lastFrameTime = currentTime;
    
            if (this.isJumping) {
                this.updateJumpAnimation();
            } else if (this.isMoving) {
                this.animationFrame = (this.animationFrame + 1) % this.totalFrames.walk;
            } else {
                if (currentTime - this.lastMoveTime > this.idleThreshold) {
                    // Passage en animation idle
                    this.animationFrame = (this.animationFrame + 1) % this.totalFrames.idle;
                } else {
                    // Reste sur la première frame de l'animation de marche
                    this.animationFrame = 0;
                }
            }
        }
    }

    movePlayer(keysPressed, deltaTime) {
        const baseSpeed = (CONFIG.playerSpeed * deltaTime) / 16;
        const speedFactor = this.player.getSpeedFactor();
        const speed = baseSpeed * speedFactor;
        let dx = 0, dy = 0;
    
        if (keysPressed.has('left')) dx -= speed;
        if (keysPressed.has('right')) dx += speed;
        if (keysPressed.has('up')) dy -= speed;
        if (keysPressed.has('down')) dy += speed;
    
        // Normaliser le mouvement diagonal
        if (dx !== 0 && dy !== 0) {
            const factor = 1 / Math.sqrt(2);
            dx *= factor;
            dy *= factor;
        }
    
        // Vérifier les collisions et ajuster la position
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
    
        if (!this.checkCollision(newX, this.player.y)) {
            this.player.x = newX;
        }
        if (!this.checkCollision(this.player.x, newY)) {
            this.player.y = newY;
        }
    
        this.player.isMoving = (dx !== 0 || dy !== 0);
        if (this.player.isMoving) {
            this.player.lastMoveTime = performance.now();
            this.player.updateDirection(dx, dy);
        }
    }

    checkCollision(x, y) {
        const hitboxSize = CONFIG.playerHitboxSize;
        const hitboxOffset = (CONFIG.cellSize - hitboxSize) / 2;
        const left = Math.floor((x + hitboxOffset) / CONFIG.cellSize);
        const top = Math.floor((y + hitboxOffset) / CONFIG.cellSize);
        const right = Math.floor((x + hitboxOffset + hitboxSize - 1) / CONFIG.cellSize);
        const bottom = Math.floor((y + hitboxOffset + hitboxSize - 1) / CONFIG.cellSize);

        for (let cellY = top; cellY <= bottom; cellY++) {
            for (let cellX = left; cellX <= right; cellX++) {
                if (cellY < 0 || cellY >= this.level.maze.length || 
                    cellX < 0 || cellX >= this.level.maze[0].length ||
                    this.level.maze[cellY][cellX] === 1) {
                    return true; // Collision détectée
                }
            }
        }
        return false; // Pas de collision
    }

    getPlayerDirection(dx, dy) {
        if (dx > 0 && dy > 0) return 'downRight';
        if (dx < 0 && dy > 0) return 'downLeft';
        if (dx > 0 && dy < 0) return 'upRight';
        if (dx < 0 && dy < 0) return 'upLeft';
        if (dx > 0) return 'downRight';
        if (dx < 0) return 'downLeft';
        if (dy > 0) return 'downRight';
        if (dy < 0) return 'upRight';
        return this.player.direction; // Garder la direction actuelle si aucun mouvement
    }

    drawBackground() {
        const pattern = this.ctx.createPattern(grassTexture, 'repeat');
        this.ctx.fillStyle = pattern;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBackground();
        this.level.draw(this.ctx);
        this.player.draw(this.ctx, this.playerSprites, this.playerShadows);
        
        // Afficher le numéro du niveau
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Niveau: ${this.currentLevelNumber}`, 10, 30);
    }
}