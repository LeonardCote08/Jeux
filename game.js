import { CONFIG } from './config.js';
import { Level } from './level.js';
import { Player } from './player.js';
import { grassTexture } from './assetLoader.js';

export class Game {
    constructor(canvas, ctx, playerSprites, playerShadows) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.playerSprites = playerSprites;
        this.playerShadows = playerShadows;
        this.level = null;
        this.player = null;
        this.currentLevelNumber = 1;
        this.lastUpdateTime = 0;
        
        // Pré-calcul du pattern d'herbe pour optimiser le rendu
        this.grassPattern = this.createGrassPattern();
    }

    // Crée et met en cache le pattern d'herbe pour une utilisation répétée
    createGrassPattern() {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = grassTexture.width;
        patternCanvas.height = grassTexture.height;
        const patternCtx = patternCanvas.getContext('2d');
        patternCtx.drawImage(grassTexture, 0, 0);
        return this.ctx.createPattern(patternCanvas, 'repeat');
    }

    startNewGame() {
        this.currentLevelNumber = 1;
        this.generateNewLevel();
    }

    generateNewLevel(entrancePos = null) {
        this.level = new Level(CONFIG.gridWidth, CONFIG.gridHeight, entrancePos);
        this.level.generate(); // Assurez-vous que cette ligne est présente et exécutée
        
        // Calcul optimisé de la position de départ du joueur
        const inset = CONFIG.cellSize * 0.1;
        const playerStartX = this.level.entrance.x === 0 ? inset : 
                             this.level.entrance.x === CONFIG.gridWidth - 1 ? (CONFIG.gridWidth - 1) * CONFIG.cellSize - inset :
                             this.level.entrance.x * CONFIG.cellSize;
        const playerStartY = this.level.entrance.y === 0 ? inset : 
                             this.level.entrance.y === CONFIG.gridHeight - 1 ? (CONFIG.gridHeight - 1) * CONFIG.cellSize - inset :
                             this.level.entrance.y * CONFIG.cellSize;
        
        this.player = new Player(playerStartX, playerStartY);
    }

    update(input, currentTime) {
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;
    
        this.movePlayer(input, deltaTime);
        this.player.updateAnimation(currentTime);
    
        if (this.hasReachedExit()) {
            this.goToNextLevel();
            return; // Arrêter le traitement après la transition
        }
    }

    goToNextLevel() {
        this.currentLevelNumber++;
        const entrancePos = {
            x: this.level.exit.x === 0 ? CONFIG.gridWidth - 1 : (this.level.exit.x === CONFIG.gridWidth - 1 ? 0 : this.level.exit.x),
            y: this.level.exit.y === 0 ? CONFIG.gridHeight - 1 : (this.level.exit.y === CONFIG.gridHeight - 1 ? 0 : this.level.exit.y)
        };
        this.generateNewLevel(entrancePos);
        
        // Réinitialiser l'état du joueur
        this.player.isJumping = false;
        this.player.jumpHeight = 0;
        this.player.jumpFrame = 0;
        this.player.isJumpBoosting = false;
    }

    // Vérification optimisée de l'atteinte de la sortie
    hasReachedExit() {
        const playerCellX = Math.floor(this.player.x / CONFIG.cellSize);
        const playerCellY = Math.floor(this.player.y / CONFIG.cellSize);
        const exitX = this.level.exit.x;
        const exitY = this.level.exit.y;
    
        // Fonction pour vérifier si une cellule est à l'intérieur du labyrinthe
        const isInsideMaze = (x, y) => x > 0 && x < CONFIG.gridWidth - 1 && y > 0 && y < CONFIG.gridHeight - 1;
    
        // Vérifier si le joueur est sur la case de sortie
        if (playerCellX === exitX && playerCellY === exitY) {
            return true;
        }
    
        // Vérifier la zone élargie uniquement vers l'extérieur du labyrinthe
        if (exitX === 0) {
            return playerCellX === exitX && Math.abs(playerCellY - exitY) <= 1;
        }
        if (exitX === CONFIG.gridWidth - 1) {
            return playerCellX === exitX && Math.abs(playerCellY - exitY) <= 1;
        }
        if (exitY === 0) {
            return playerCellY === exitY && Math.abs(playerCellX - exitX) <= 1;
        }
        if (exitY === CONFIG.gridHeight - 1) {
            return playerCellY === exitY && Math.abs(playerCellX - exitX) <= 1;
        }
    
        // Si la sortie n'est pas sur un bord (ce qui ne devrait pas arriver normalement)
        return false;
    }

    // Gestion optimisée du mouvement du joueur
    movePlayer(input, deltaTime) {
        const baseSpeed = (CONFIG.playerSpeed * deltaTime) / 16;
        const speedFactor = this.player.getSpeedFactor();
        const speed = baseSpeed * speedFactor;
        
        let dx = 0, dy = 0;
        if (input.left) dx -= speed;
        if (input.right) dx += speed;
        if (input.up) dy -= speed;
        if (input.down) dy += speed;
    
        // Normalisation du mouvement diagonal
        if (dx !== 0 && dy !== 0) {
            const factor = 1 / Math.sqrt(2);
            dx *= factor;
            dy *= factor;
        }
    
        // Appliquer le mouvement avec gestion des collisions
        this.applyMovement(dx, dy);
    
        this.player.isMoving = (dx !== 0 || dy !== 0);
        if (this.player.isMoving) {
            this.player.lastMoveTime = performance.now();
            this.player.updateDirection(dx, dy);
        }
    
        // Gestion du saut
        if (input.jump) {
            this.player.jump();
        }
    }
    
    applyMovement(dx, dy) {
        const steps = 4; // Nombre d'étapes pour le mouvement progressif
        const stepX = dx / steps;
        const stepY = dy / steps;
    
        for (let i = 0; i < steps; i++) {
            const newX = this.player.x + stepX;
            const newY = this.player.y + stepY;
    
            const { collision: collisionX, slideX } = this.checkCollision(newX, this.player.y);
            const { collision: collisionY, slideY } = this.checkCollision(this.player.x, newY);
    
            if (!collisionX) {
                this.player.x = newX;
            } else if (Math.abs(slideX) > Math.abs(stepX) * 0.1) {
                this.player.x += slideX;
            }
    
            if (!collisionY) {
                this.player.y = newY;
            } else if (Math.abs(slideY) > Math.abs(stepY) * 0.1) {
                this.player.y += slideY;
            }
    
            if (collisionX && collisionY) {
                break; // Arrêter le mouvement si collision dans les deux directions
            }
        }
    }

    // Système de collision optimisé
    checkCollision(x, y) {
        const hitboxSize = CONFIG.playerHitboxSize;
        const treeHitboxSize = CONFIG.treeHitboxSize * 0.8;
        const hitboxOffset = (CONFIG.cellSize - hitboxSize) / 2;
        const treeHitboxOffset = (CONFIG.cellSize - treeHitboxSize) / 2;
    
        const playerLeft = x + hitboxOffset;
        const playerTop = y + hitboxOffset;
        const playerRight = playerLeft + hitboxSize;
        const playerBottom = playerTop + hitboxSize;
    
        const leftCell = Math.floor(playerLeft / CONFIG.cellSize);
        const topCell = Math.floor(playerTop / CONFIG.cellSize);
        const rightCell = Math.floor(playerRight / CONFIG.cellSize);
        const bottomCell = Math.floor(playerBottom / CONFIG.cellSize);
    
        let collision = false;
        let slideX = 0;
        let slideY = 0;
    
        for (let cellY = topCell; cellY <= bottomCell; cellY++) {
            for (let cellX = leftCell; cellX <= rightCell; cellX++) {
                if (this.isTreeOrWall(cellX, cellY)) {
                    const treeLeft = cellX * CONFIG.cellSize + treeHitboxOffset;
                    const treeTop = cellY * CONFIG.cellSize + treeHitboxOffset;
                    const treeRight = treeLeft + treeHitboxSize;
                    const treeBottom = treeTop + treeHitboxSize;
    
                    // Vérifier la collision
                    if (playerRight > treeLeft && playerLeft < treeRight &&
                        playerBottom > treeTop && playerTop < treeBottom) {
                        collision = true;
    
                        // Calculer les distances de chevauchement
                        const overlapLeft = playerRight - treeLeft;
                        const overlapRight = treeRight - playerLeft;
                        const overlapTop = playerBottom - treeTop;
                        const overlapBottom = treeBottom - playerTop;
    
                        // Trouver la plus petite distance de chevauchement
                        const minOverlapX = Math.min(overlapLeft, overlapRight);
                        const minOverlapY = Math.min(overlapTop, overlapBottom);
    
                        // Ajuster la direction de glissement
                        if (minOverlapX < minOverlapY) {
                            slideX = (overlapLeft < overlapRight) ? -minOverlapX : minOverlapX;
                        } else {
                            slideY = (overlapTop < overlapBottom) ? -minOverlapY : minOverlapY;
                        }
                    }
                }
            }
        }
        // Ajout d'un seuil minimal pour le glissement
        const minSlideThreshold = 0.1;
        if (Math.abs(slideX) < minSlideThreshold) slideX = 0;
        if (Math.abs(slideY) < minSlideThreshold) slideY = 0;
        
        return { collision, slideX, slideY };
    }
    
    isTreeOrWall(x, y) {
        return (y < 0 || y >= this.level.maze.length ||
                x < 0 || x >= this.level.maze[0].length ||
                this.level.maze[y][x] === 1);
    }

    // Méthode de rendu optimisée
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Utilisation du pattern d'herbe pré-calculé
        this.ctx.fillStyle = this.grassPattern;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Rendu optimisé du niveau
        this.level.draw(this.ctx);
        
        // Rendu du joueur
        this.player.draw(this.ctx, this.playerSprites, this.playerShadows);
        
        // Affichage du numéro de niveau
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Niveau: ${this.currentLevelNumber}`, 10, 30);
    }
}