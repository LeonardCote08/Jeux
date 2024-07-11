import { CONFIG } from './config.js';
import { Level } from './level.js';
import { Player } from './player.js';

export class Game {
    constructor(canvas, ctx, playerSprites) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.playerSprites = playerSprites;
        this.level = null;
        this.player = null;
        this.currentLevelNumber = 1;
        this.transitionToNextLevel = false;
        this.transitionTimer = 0;
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
        
        this.transitionToNextLevel = false;
        this.transitionTimer = 0;
    }

    update(keysPressed) {
        if (this.transitionToNextLevel) {
            this.transitionTimer++;
            if (this.transitionTimer > 60) {  // 1 second at 60 FPS
                this.currentLevelNumber++;
                const nextEntrancePos = this.getOppositePosition(this.level.exit);
                this.generateNewLevel(nextEntrancePos);
            }
            return;
        }

        this.movePlayer(keysPressed);
        this.player.updateAnimation();
        this.checkLevelCompletion();
    }

    getOppositePosition(pos) {
        return {
            x: pos.x === 0 ? CONFIG.gridWidth - 1 : (pos.x === CONFIG.gridWidth - 1 ? 0 : pos.x),
            y: pos.y === 0 ? CONFIG.gridHeight - 1 : (pos.y === CONFIG.gridHeight - 1 ? 0 : pos.y)
        };
    }

    checkLevelCompletion() {
        const playerCellX = Math.floor(this.player.x / CONFIG.cellSize);
        const playerCellY = Math.floor(this.player.y / CONFIG.cellSize);
        
        if (playerCellX === this.level.exit.x && playerCellY === this.level.exit.y) {
            this.transitionToNextLevel = true;
        }
    }

    movePlayer(keysPressed) {
        const speed = CONFIG.playerSpeed;
        let dx = 0, dy = 0;

        if (keysPressed.has('left')) dx -= speed;
        if (keysPressed.has('right')) dx += speed;
        if (keysPressed.has('up')) dy -= speed;
        if (keysPressed.has('down')) dy += speed;

        if (dx !== 0 && dy !== 0) {
            dx *= Math.SQRT1_2;
            dy *= Math.SQRT1_2;
        }

        let newX = this.player.x + dx;
        let newY = this.player.y + dy;

        if (!this.checkCollision(newX, this.player.y)) {
            this.player.x = newX;
        }
        if (!this.checkCollision(this.player.x, newY)) {
            this.player.y = newY;
        }

        this.player.move(this.player.x - this.player.x, this.player.y - this.player.y);
    }

    checkCollision(x, y) {
        const playerSize = CONFIG.cellSize - 2 * CONFIG.hitboxReduction;
        if (x < 0 || y < 0 || x + playerSize > this.level.width * CONFIG.cellSize || y + playerSize > this.level.height * CONFIG.cellSize) {
            return true;
        }

        const topLeftCell = {
            x: Math.floor((x + CONFIG.hitboxReduction) / CONFIG.cellSize),
            y: Math.floor((y + CONFIG.hitboxReduction) / CONFIG.cellSize)
        };
        const bottomRightCell = {
            x: Math.floor((x + playerSize - 1) / CONFIG.cellSize),
            y: Math.floor((y + playerSize - 1) / CONFIG.cellSize)
        };

        for (let cellY = topLeftCell.y; cellY <= bottomRightCell.y; cellY++) {
            for (let cellX = topLeftCell.x; cellX <= bottomRightCell.x; cellX++) {
                if (this.level.maze[cellY][cellX] === 1) {
                    return true;
                }
            }
        }

        return false;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.level.draw(this.ctx);
        this.player.draw(this.ctx, this.playerSprites);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Niveau: ${this.currentLevelNumber}`, 10, 30);

        if (this.transitionToNextLevel) {
            this.drawTransitionScreen();
        }
    }

    drawTransitionScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Niveau ${this.currentLevelNumber} terminé !`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(`Préparation du niveau ${this.currentLevelNumber + 1}...`, this.canvas.width / 2, this.canvas.height / 2 + 40);
        this.ctx.textAlign = 'left';
    }
}