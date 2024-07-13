import { CONFIG } from './config.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = 'down';
        this.isMoving = false;
        this.animationFrame = 0;
        this.animationCounter = 0;
        this.frameDuration = 200; // Durée d'une frame en millisecondes
        this.lastFrameTime = 0;
        this.totalFrames = 6; // Nombre total de frames dans l'animation
    }

    updateAnimation(currentTime) {
        if (this.isMoving) {
            const elapsed = currentTime - this.lastFrameTime;
            if (elapsed >= this.frameDuration) {
                // Calculer combien de frames doivent être avancées
                const framesToAdvance = Math.floor(elapsed / this.frameDuration);
                this.animationFrame = (this.animationFrame + framesToAdvance) % this.totalFrames;
                this.lastFrameTime = currentTime - (elapsed % this.frameDuration);
            }
        } else {
            // Réinitialiser à la première frame quand immobile
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
        switch(this.direction) {
            case 'right':
            case 'left':
                spriteKey = this.isMoving ? `walk${this.direction.charAt(0).toUpperCase() + this.direction.slice(1)}` : this.direction;
                break;
            case 'up':
                spriteKey = this.isMoving ? 'walkUpRight' : 'upRight';
                break;
            case 'down':
                spriteKey = this.isMoving ? 'walkRight' : 'right';
                break;
        }
        return spriteMap[spriteKey][this.animationFrame];
    }
}