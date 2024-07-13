import { CONFIG } from './config.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = 'downRight';
        this.lastHorizontalDirection = 'Right'; // Nouvelle propriété
        this.isMoving = false;
        this.isJumping = false;
        this.jumpHeight = 0;
        this.maxJumpHeight = 30;
        this.jumpSpeed = 2;
        this.animationFrame = 0;
        this.lastFrameTime = 0;
        this.frameDuration = 100;
        this.totalFrames = {
            walk: 6,
            jump: 6,
            idle: 16
        };
        this.jumpFrame = 0;
        this.jumpCycleComplete = false;
        this.lastMoveTime = 0;
        this.idleThreshold = 1000; // 1 seconde sans mouvement pour passer en idle
        this.idleCycleComplete = false;
        this.idlePauseDuration = 2000; // 2 secondes de pause entre les cycles idle
        this.lastIdleCycleTime = 0;
        
    }

    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpFrame = 0;
            this.jumpCycleComplete = false;
        }
    }

    updateDirection(dx, dy) {
        if (dx !== 0 || dy !== 0) {
            if (dx > 0) {
                this.lastHorizontalDirection = 'Right';
            } else if (dx < 0) {
                this.lastHorizontalDirection = 'Left';
            }

            if (dy < 0) {
                this.direction = 'up' + this.lastHorizontalDirection;
            } else if (dy > 0) {
                this.direction = 'down' + this.lastHorizontalDirection;
            } else {
                this.direction = this.lastHorizontalDirection.toLowerCase();
            }
        }
        // Si dx et dy sont tous deux 0, nous conservons la dernière direction
    }

    updateAnimation(currentTime) {
        const elapsed = currentTime - this.lastFrameTime;
        if (elapsed >= this.frameDuration) {
            this.lastFrameTime = currentTime;

            if (this.isJumping) {
                this.updateJumpAnimation();
            } else if (this.isMoving) {
                this.animationFrame = (this.animationFrame + 1) % this.totalFrames.walk;
                this.idleCycleComplete = false;
                this.lastIdleCycleTime = 0;
            } else {
                this.updateIdleAnimation(currentTime);
            }
        }
    }

    updateIdleAnimation(currentTime) {
        if (currentTime - this.lastMoveTime <= this.idleThreshold) {
            // Reste sur la première frame de l'animation de marche
            this.animationFrame = 0;
            this.idleCycleComplete = false;
            this.lastIdleCycleTime = 0;
        } else {
            if (this.idleCycleComplete) {
                if (currentTime - this.lastIdleCycleTime >= this.idlePauseDuration) {
                    // Redémarrer le cycle idle
                    this.idleCycleComplete = false;
                    this.animationFrame = 0;
                }
            } else {
                this.animationFrame = (this.animationFrame + 1) % this.totalFrames.idle;
                if (this.animationFrame === 0) {
                    // Cycle idle complet
                    this.idleCycleComplete = true;
                    this.lastIdleCycleTime = currentTime;
                }
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

        this.animationFrame = Math.min(this.jumpFrame, this.totalFrames.jump - 1);
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

        if (this.isJumping) {
            spriteKey = `jump${this.direction.charAt(0).toUpperCase() + this.direction.slice(1)}`;
        } else if (this.isMoving || Date.now() - this.lastMoveTime <= this.idleThreshold) {
            spriteKey = this.getMovingSpriteKey();
        } else {
            spriteKey = this.getIdleSpriteKey();
        }

        return spriteMap[spriteKey][this.animationFrame] || spriteMap[spriteKey][0];
    }

    getMovingSpriteKey() {
        return `walk${this.direction.charAt(0).toUpperCase() + this.direction.slice(1)}`;
    }

    getIdleSpriteKey() {
        // Utiliser la direction complète pour l'animation idle
        return `idle${this.direction.charAt(0).toUpperCase() + this.direction.slice(1)}`;
    }
}