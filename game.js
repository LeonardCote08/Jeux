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

    update(keysPressed, currentTime) {
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;
    
        this.movePlayer(keysPressed, deltaTime);
        this.player.updateAnimation(currentTime);

        if (this.hasReachedExit()) {
            this.goToNextLevel();
        }
    }

    goToNextLevel() {
        this.currentLevelNumber++;
        const entrancePos = {
            x: this.level.exit.x === 0 ? CONFIG.gridWidth - 1 : (this.level.exit.x === CONFIG.gridWidth - 1 ? 0 : this.level.exit.x),
            y: this.level.exit.y === 0 ? CONFIG.gridHeight - 1 : (this.level.exit.y === CONFIG.gridHeight - 1 ? 0 : this.level.exit.y)
        };
        this.generateNewLevel(entrancePos);
    }

    // Vérification optimisée de l'atteinte de la sortie
    hasReachedExit() {
        const playerCellX = Math.floor(this.player.x / CONFIG.cellSize);
        const playerCellY = Math.floor(this.player.y / CONFIG.cellSize);
        return playerCellX === this.level.exit.x && playerCellY === this.level.exit.y;
    }

    // Gestion optimisée du mouvement du joueur
    movePlayer(keysPressed, deltaTime) {
        const baseSpeed = (CONFIG.playerSpeed * deltaTime) / 16;
        const speedFactor = this.player.getSpeedFactor();
        const speed = baseSpeed * speedFactor;
        
        let dx = 0, dy = 0;
        if (keysPressed.has('left')) dx -= speed;
        if (keysPressed.has('right')) dx += speed;
        if (keysPressed.has('up')) dy -= speed;
        if (keysPressed.has('down')) dy += speed;
    
        // Normalisation du mouvement diagonal
        if (dx !== 0 && dy !== 0) {
            const factor = 1 / Math.sqrt(2);
            dx *= factor;
            dy *= factor;
        }
    
        // Vérification des collisions et ajustement de la position
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
    
        if (!this.checkCollision(newX, this.player.y)) {
            this.player.x = newX;
        }
        if (!this.checkCollision(this.player.x, newY)) {
            this.player.y = newY;
        }
    
        this.player.isMoving = (dx !== 0 || dy !== 0);
        if (this.player.isMoving) {
            this.player.lastMoveTime = performance.now();
            this.player.updateDirection(dx, dy);
        }
    }

    // Système de collision optimisé
    checkCollision(x, y) {
        const hitboxSize = CONFIG.playerHitboxSize;
        const treeHitboxSize = CONFIG.treeHitboxSize;
        const hitboxOffset = (CONFIG.cellSize - hitboxSize) / 2;
        const treeHitboxOffset = (CONFIG.cellSize - treeHitboxSize) / 2;

        const playerLeft = x + hitboxOffset;
        const playerTop = y + hitboxOffset;
        const playerRight = playerLeft + hitboxSize - 1;
        const playerBottom = playerTop + hitboxSize - 1;
        const playerCenterX = (playerLeft + playerRight) / 2;
        const playerCenterY = (playerTop + playerBottom) / 2;

        const leftCell = Math.floor(playerLeft / CONFIG.cellSize);
        const topCell = Math.floor(playerTop / CONFIG.cellSize);
        const rightCell = Math.floor(playerRight / CONFIG.cellSize);
        const bottomCell = Math.floor(playerBottom / CONFIG.cellSize);

        for (let cellY = topCell; cellY <= bottomCell; cellY++) {
            for (let cellX = leftCell; cellX <= rightCell; cellX++) {
                if (cellY < 0 || cellY >= this.level.maze.length || 
                    cellX < 0 || cellX >= this.level.maze[0].length ||
                    this.level.maze[cellY][cellX] === 1) {
                    
                    const treeCenterX = cellX * CONFIG.cellSize + CONFIG.cellSize / 2;
                    const treeCenterY = cellY * CONFIG.cellSize + CONFIG.cellSize / 2;
                    const treeRadius = treeHitboxSize / 2;

                    // Vérifier si le joueur est à l'intérieur du cercle inscrit dans la hitbox de l'arbre
                    const distanceX = Math.abs(playerCenterX - treeCenterX);
                    const distanceY = Math.abs(playerCenterY - treeCenterY);

                    if (distanceX > (treeHitboxSize / 2 + hitboxSize / 2)) continue;
                    if (distanceY > (treeHitboxSize / 2 + hitboxSize / 2)) continue;

                    if (distanceX <= (treeHitboxSize / 2)) return true;
                    if (distanceY <= (treeHitboxSize / 2)) return true;

                    const cornerDistance = Math.pow(distanceX - treeHitboxSize / 2, 2) +
                                           Math.pow(distanceY - treeHitboxSize / 2, 2);

                    if (cornerDistance <= Math.pow(treeRadius + hitboxSize / 2, 2)) return true;
                }
            }
        }
        return false; // Pas de collision
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