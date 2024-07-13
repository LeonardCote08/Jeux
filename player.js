import { CONFIG } from './config.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = 'right';
        this.isMoving = false;
        this.animationFrame = 0;
        this.lastFrameTime = 0;
        this.frameDuration = 400; // Durée d'une frame en millisecondes
        this.totalFrames = 6; // Nombre total de frames dans l'animation
    }

    updateAnimation(currentTime) {
        if (this.isMoving) {
            const elapsed = currentTime - this.lastFrameTime;
            if (elapsed >= this.frameDuration) {
                this.animationFrame = (this.animationFrame + 1) % this.totalFrames;
                this.lastFrameTime = currentTime;
            }
        } else {
            this.animationFrame = 0;
            this.lastFrameTime = currentTime;
        }
    }

    draw(ctx, playerSprites, playerShadows) {
        const sprite = this.getSprite(playerSprites);
        const shadow = this.getSprite(playerShadows);
        
        const drawX = Math.round(this.x - (CONFIG.spriteSize - CONFIG.cellSize) / 2);
        const drawY = Math.round(this.y - (CONFIG.spriteSize - CONFIG.cellSize) / 2);

        if (shadow) {
            ctx.drawImage(shadow, drawX, drawY, CONFIG.spriteSize, CONFIG.spriteSize);
        }
        if (sprite) {
            ctx.drawImage(sprite, drawX, drawY, CONFIG.spriteSize, CONFIG.spriteSize);
        }

        // Dessiner la hitbox du joueur (pour le débogage)
        const hitboxOffset = (CONFIG.cellSize - CONFIG.playerHitboxSize) / 2;
        ctx.strokeStyle = 'red';
        ctx.strokeRect(
            this.x + hitboxOffset, 
            this.y + hitboxOffset, 
            CONFIG.playerHitboxSize, 
            CONFIG.playerHitboxSize
        );
    }

    getSprite(spriteMap) {
        let spriteKey;
        if (this.isMoving) {
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