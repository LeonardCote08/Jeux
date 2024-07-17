import { CONFIG } from './config.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = 'downRight';
        this.lastHorizontalDirection = 'Right';
        this.isMoving = false;
        this.isJumping = false;
        this.jumpHeight = 0;
        this.maxJumpHeight = 30;
        this.jumpSpeed = 2;
        this.animationFrame = 0;
        this.lastFrameTime = 0;
        this.frameDuration = {
            idle: 200,
            walk: 200,
            jump: 100
        };
        this.totalFrames = {
            walk: 6,
            jump: 6,
            idle: 16
        };
        this.jumpFrame = 0;
        this.jumpCycleComplete = false;
        this.lastMoveTime = 0;
        this.idleThreshold = 1000;
        this.idleCycleComplete = false;
        this.idlePauseDuration = 2000;
        this.lastIdleCycleTime = 0;
        this.jumpBoost = 1.5; // Facteur de boost pendant le saut
        this.isJumpBoosting = false; // Indique si le boost est actif
        this.jumpBufferDuration = 200; // Durée de la buffer window en millisecondes
        this.lastJumpRequestTime = 0; // Moment de la dernière demande de saut
        this.canJump = true; // Indique si le joueur peut sauter
    }

    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpFrame = 0;
            this.jumpCycleComplete = false;
            this.isJumpBoosting = true; // Activer le boost au début du saut
            this.canJump = false; // Empêcher un nouveau saut pendant l'animation
        }
    }

    requestJump() {
        this.lastJumpRequestTime = performance.now();
        if (this.canJump && !this.isJumping) {
            this.jump();
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
        let currentFrameDuration = this.isJumping ? this.frameDuration.jump : 
                                   (this.isMoving ? this.frameDuration.walk : this.frameDuration.idle);
        
        const elapsed = currentTime - this.lastFrameTime;
        if (elapsed >= currentFrameDuration) {
            this.lastFrameTime = currentTime;

            if (this.isJumping) {
                this.updateJumpAnimation();
            } else if (this.isMoving) {
                this.animationFrame = (this.animationFrame + 1) % this.totalFrames.walk;
                this.idleCycleComplete = false;
                this.lastIdleCycleTime = 0;
            } 
            else if (!this.canJump && !this.isJumping && currentTime - this.lastJumpRequestTime >= this.jumpBufferDuration) {
                this.canJump = true;}
            else {
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

    updateJumpAnimation(currentTime) {
        if (this.jumpCycleComplete) {
            this.isJumping = false;
            this.jumpHeight = 0;
            this.jumpFrame = 0;
            this.isJumpBoosting = false; // Désactiver le boost à la fin du saut
            
            // Vérifier si une demande de saut a été faite pendant l'animation
            if (currentTime - this.lastJumpRequestTime < this.jumpBufferDuration) {
                this.jump();
            } else {
                this.canJump = true; // Autoriser un nouveau saut
            }
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

    getSpeedFactor() {
        return this.isJumpBoosting ? this.jumpBoost : 1;
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