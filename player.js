import { CONFIG } from './config.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = 'down';
        this.isMoving = false;
        this.animationFrame = 0;
        this.animationCounter = 0;
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
        this.isMoving = (dx !== 0 || dy !== 0);
        if (this.isMoving) {
            this.direction = this.getDirection(dx, dy);
        }
    }

    getDirection(dx, dy) {
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }

    updateAnimation() {
        if (this.isMoving) {
            this.animationCounter++;
            if (this.animationCounter >= CONFIG.animationSpeed) {
                this.animationFrame = (this.animationFrame + 1) % 3;
                this.animationCounter = 0;
            }
        } else {
            this.animationFrame = 0;
            this.animationCounter = 0;
        }
    }

    draw(ctx, playerSprites, playerShadows) {
        const sprite = this.getSprite(playerSprites);
        const shadow = this.getSprite(playerShadows);
        if (sprite && shadow) {
            // Draw shadow first
            ctx.drawImage(
                shadow,
                this.x - CONFIG.spriteSize / 2 + CONFIG.cellSize / 2,
                this.y - CONFIG.spriteSize / 2 + CONFIG.cellSize / 2,
                CONFIG.spriteSize,
                CONFIG.spriteSize
            );
            // Then draw player
            ctx.drawImage(
                sprite,
                this.x - CONFIG.spriteSize / 2 + CONFIG.cellSize / 2,
                this.y - CONFIG.spriteSize / 2 + CONFIG.cellSize / 2,
                CONFIG.spriteSize,
                CONFIG.spriteSize
            );
        }
    }

    getSprite(spriteMap) {
        const spriteKey = this.isMoving 
            ? `walk${this.direction.charAt(0).toUpperCase() + this.direction.slice(1)}`
            : this.direction;
        return spriteMap[spriteKey][this.animationFrame];
    }
}