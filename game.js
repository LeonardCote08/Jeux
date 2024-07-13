import { CONFIG } from './config.js';
import { Level } from './level.js';
import { Player } from './player.js';

export class Game {
    constructor(canvas, ctx, playerSprites, playerShadows) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.playerSprites = playerSprites;
        this.playerShadows = playerShadows;
        this.level = null;
        this.player = null;
        this.currentLevelNumber = 1;
    }

    startNewGame() {
        this.currentLevelNumber = 1;
        this.generateNewLevel();
    }

    generateNewLevel(entrancePos = null) {
        this.level = new Level(CONFIG.gridWidth, CONFIG.gridHeight, entrancePos);
        this.level.generate();
        
        const playerStartX = this.level.entrance.x * CONFIG.cellSize;
        const playerStartY = this.level.entrance.y * CONFIG.cellSize;
        this.player = new Player(playerStartX, playerStartY);
    }

    update(keysPressed, currentTime) {
        this.movePlayer(keysPressed);
        this.player.updateAnimation(currentTime);
    }

    movePlayer(keysPressed) {
        const speed = CONFIG.playerSpeed;
        let dx = 0, dy = 0;

        if (keysPressed.has('left')) dx -= speed;
        if (keysPressed.has('right')) dx += speed;
        if (keysPressed.has('up')) dy -= speed;
        if (keysPressed.has('down')) dy += speed;

        let newX = this.player.x + dx;
        let newY = this.player.y + dy;

        // Vérifier les collisions avec une hitbox plus petite
        if (!this.checkCollision(newX, this.player.y, CONFIG.playerHitboxSize)) {
            this.player.x = newX;
        }
        if (!this.checkCollision(this.player.x, newY, CONFIG.playerHitboxSize)) {
            this.player.y = newY;
        }

        this.player.isMoving = (dx !== 0 || dy !== 0);
        if (this.player.isMoving) {
            this.player.direction = this.getPlayerDirection(dx, dy);
        }
        if (dx > 0) this.player.direction = 'right';
        else if (dx < 0) this.player.direction = 'left';
        else if (dy < 0) this.player.direction = 'up';
        else if (dy > 0) this.player.direction = 'down';
    }

    checkCollision(x, y, hitboxSize) {
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
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.level.draw(this.ctx);
        this.player.draw(this.ctx, this.playerSprites, this.playerShadows);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Niveau: ${this.currentLevelNumber}`, 5, 15);
    }
}