import { CONFIG } from './config.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = 'downRight';
        this.isMoving = false;
        this.isJumping = false;
        this.jumpHeight = 0;
        this.maxJumpHeight = 30;
        this.jumpSpeed = 2;
        this.animationFrame = 0;
        this.lastFrameTime = 0;
        this.frameDuration = 100;
        this.totalFrames = 6;
        this.jumpFrame = 0;
        this.jumpCycleComplete = false;
    }

    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpFrame = 0;
            this.jumpCycleComplete = false;
        }
    }

    updateAnimation(currentTime) {
        const elapsed = currentTime - this.lastFrameTime;
        if (elapsed >= this.frameDuration) {
            this.lastFrameTime = currentTime;

            if (this.isJumping) {
                this.updateJumpAnimation();
            } else if (this.isMoving) {
                this.animationFrame = (this.animationFrame + 1) % this.totalFrames;
            } else {
                this.animationFrame = 0;
            }
        }
    }

    updateJumpAnimation() {
        if (this.jumpCycleComplete) {
            this.isJumping = false;
            this.jumpHeight = 0;
            this.jumpFrame = 0;
            return;
        }

        this.jumpFrame++;
        if (this.jumpFrame < 3) {
            this.jumpHeight += this.jumpSpeed;
        } else if (this.jumpFrame < 5) {
            this.jumpHeight -= this.jumpSpeed;
        } else {
            this.jumpHeight = 0;
            this.jumpCycleComplete = true;
        }
    }

    draw(ctx, playerSprites, playerShadows) {
        const sprite = this.getSprite(playerSprites);
        const shadow = this.getSprite(playerShadows);
        
        const drawX = Math.round(this.x - (CONFIG.spriteSize - CONFIG.cellSize) / 2);
        const drawY = Math.round(this.y - (CONFIG.spriteSize - CONFIG.cellSize) / 2 - this.jumpHeight);

        if (shadow) {
            ctx.drawImage(shadow, drawX, drawY + this.jumpHeight, CONFIG.spriteSize, CONFIG.spriteSize);
        }
        if (sprite) {
            ctx.drawImage(sprite, drawX, drawY, CONFIG.spriteSize, CONFIG.spriteSize);
        }
    }

    getSprite(spriteMap) {
        let spriteKey;
        let frame = this.animationFrame;

        if (this.isJumping) {
            spriteKey = this.direction === 'left' ? 'jumpLeft' : 'jumpRight';
            frame = Math.min(this.jumpFrame, 4); // Assurez-vous que frame ne dépasse pas 4
        } else if (this.isMoving) {
            spriteKey = this.getMovingSpriteKey();
        } else {
            spriteKey = this.getIdleSpriteKey();
        }

        return spriteMap[spriteKey][frame] || spriteMap[spriteKey][0];
    }

    getMovingSpriteKey() {
        return `walk${this.direction.charAt(0).toUpperCase() + this.direction.slice(1)}`;
    }

    getIdleSpriteKey() {
        return this.direction;
    }
}