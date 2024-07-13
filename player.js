import { CONFIG } from './config.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = 'right';
        this.isMoving = false;
        this.isJumping = false;
        this.jumpHeight = 0;
        this.maxJumpHeight = 30; // Hauteur maximale du saut en pixels
        this.jumpSpeed = 2; // Vitesse de saut
        this.animationFrame = 0;
        this.lastFrameTime = 0;
        this.frameDuration = 100; // Durée d'une frame en millisecondes
        this.totalFrames = 6; // Nombre total de frames dans l'animation
        this.jumpFrame = 0;
    }

    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpFrame = 0;
        }
    }

    updateAnimation(currentTime) {
        const elapsed = currentTime - this.lastFrameTime;
        if (elapsed >= this.frameDuration) {
            if (this.isJumping) {
                this.jumpFrame = (this.jumpFrame + 1) % 4;
                if (this.jumpFrame < 2) {
                    this.jumpHeight += this.jumpSpeed;
                } else {
                    this.jumpHeight -= this.jumpSpeed;
                }
                if (this.jumpFrame === 0 && this.jumpHeight <= 0) {
                    this.isJumping = false;
                    this.jumpHeight = 0;
                }
            } else if (this.isMoving) {
                this.animationFrame = (this.animationFrame + 1) % this.totalFrames;
            } else {
                this.animationFrame = 0;
            }
            this.lastFrameTime = currentTime;
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

        // La partie de dessin de la hitbox a été retirée
    }

    getSprite(spriteMap) {
        let spriteKey;
        if (this.isJumping) {
            spriteKey = this.direction === 'left' ? 'jumpLeft' : 'jumpRight';
            return spriteMap[spriteKey][this.jumpFrame + 1]; // +1 car la première frame est la position neutre
        } else if (this.isMoving) {
            switch(this.direction) {
                case 'right':
                    spriteKey = 'walkRight';
                    break;
                case 'left':
                    spriteKey = 'walkLeft';
                    break;
                case 'up':
                    spriteKey = 'walkUpRight';
                    break;
                case 'down':
                    spriteKey = 'walkRight';
                    break;
            }
        } else {
            switch(this.direction) {
                case 'right':
                case 'down':
                    spriteKey = 'right';
                    break;
                case 'left':
                    spriteKey = 'left';
                    break;
                case 'up':
                    spriteKey = 'upRight';
                    break;
            }
        }
        return spriteMap[spriteKey][this.animationFrame];
    }
}