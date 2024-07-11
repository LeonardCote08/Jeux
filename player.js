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
                this.animationFrame = (this.animationFrame + 1) % 2;
                this.animationCounter = 0;
            }
        } else {
            this.animationFrame = 0;
            this.animationCounter = 0;
        }
    }

    draw(ctx, playerSprites) {
        const sprite = this.getSprite(playerSprites);
        if (sprite) {
            ctx.save();
            if (this.direction === 'left') {
                ctx.scale(-1, 1);
                ctx.translate(-CONFIG.cellSize - this.x * 2, 0);
            }
            ctx.drawImage(
                sprite,
                this.x + CONFIG.hitboxReduction,
                this.y + CONFIG.hitboxReduction,
                CONFIG.cellSize - 2 * CONFIG.hitboxReduction,
                CONFIG.cellSize - 2 * CONFIG.hitboxReduction
            );
            ctx.restore();
        }
    }

    getSprite(playerSprites) {
        const spriteKey = this.direction === 'left' ? 'walkRight' : `walk${this.direction.charAt(0).toUpperCase() + this.direction.slice(1)}`;
        return playerSprites[spriteKey][this.animationFrame];
    }
}