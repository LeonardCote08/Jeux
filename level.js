import { CONFIG } from './config.js';
import { drawTreeBlock, drawFlower, drawPond } from './assetLoader.js';
import { PriorityQueue } from './PriorityQueue.js';

export class Level {
    constructor(width, height, entrancePos = null) {
        this.width = width;
        this.height = height;
        this.maze = [];
        this.treeTypes = [];
        this.entrance = entrancePos || this.getRandomBorderPosition();
        this.exit = null;
        this.flowers = [];
        this.clearings = [];
        this.ponds = [];
        this.minPondSize = 1;
        this.maxPondSize = 4;
        this.minPathLength = Math.floor(Math.max(width, height) * CONFIG.minPathLengthFactor);
        
        // Pré-calcul des directions pour optimiser les boucles
        this.directions = [
            {dx: 0, dy: 1}, {dx: 1, dy: 0}, 
            {dx: 0, dy: -1}, {dx: -1, dy: 0}
        ];
    }

    generate() {
        this.initializeMaze();
        this.carvePathways();
        this.createClearings();
        this.openEntranceAndExit();
        this.ensureEntrancePathway();
        this.ensureExitPathway();
        this.addRandomFlowers();
        this.addRandomPonds();
        this.removeDeadEnds();
        this.closeUnusedBorderOpenings();
    }

    initializeMaze() {
        this.maze = Array(this.height).fill().map((_, y) => 
            Array(this.width).fill().map((_, x) => 
                (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) ? 1 : 
                (Math.random() < 0.3 ? 1 : 0)
            )
        );
        
        this.treeTypes = Array(this.height).fill().map(() => 
            Array(this.width).fill().map(() => 
                Math.random() < 0.15 ? 'apple' : 'normal'
            )
        );
    }

    addRandomFlowers() {
        const flowerTypes = ['FleurBlanche', 'FleurMauve', 'FleurRouge'];
        const flowerDensity = 0.05;

        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.maze[y][x] === 0 && Math.random() < flowerDensity) {
                    this.flowers.push({ 
                        x, 
                        y, 
                        type: flowerTypes[Math.floor(Math.random() * flowerTypes.length)]
                    });
                }
            }
        }
    }

    addRandomPonds() {
        const pondDensity = 0.10;
        const minPondRadius = 2;
        const maxPondRadius = 4;
    
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.maze[y][x] === 0 && Math.random() < pondDensity) {
                    const radius = Math.floor(Math.random() * (maxPondRadius - minPondRadius + 1) + minPondRadius);
                    const pond = this.generateOrganicPondShape(x, y, radius);
                    
                    if (this.canPlacePond(pond)) {
                        this.ponds.push(pond);
                        this.markPondArea(pond);
                    }
                }
            }
        }
    }

    canPlacePond(pond) {
        const {shape, centerX, centerY} = pond;
        const halfSize = Math.floor(shape.length / 2);
    
        for (let dy = 0; dy < shape.length; dy++) {
            for (let dx = 0; dx < shape[dy].length; dx++) {
                if (shape[dy][dx]) {
                    const worldX = centerX - halfSize + dx;
                    const worldY = centerY - halfSize + dy;
                    if (worldX < 1 || worldX >= this.width - 1 || worldY < 1 || worldY >= this.height - 1 || this.maze[worldY][worldX] !== 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    markPondArea(pond) {
        const {shape, centerX, centerY} = pond;
        const halfSize = Math.floor(shape.length / 2);
    
        for (let dy = 0; dy < shape.length; dy++) {
            for (let dx = 0; dx < shape[dy].length; dx++) {
                if (shape[dy][dx]) {
                    const worldX = centerX - halfSize + dx;
                    const worldY = centerY - halfSize + dy;
                    this.maze[worldY][worldX] = 2; // 2 représente un étang
                }
            }
        }
    }

    isNearBorder(x, y) {
        const borderDistance = 2;
        return x < borderDistance || x >= this.width - borderDistance ||
               y < borderDistance || y >= this.height - borderDistance;
    }

    getUnvisitedNeighbors(cell) {
        return this.directions
            .map(dir => ({
                x: cell.x + dir.dx * 2,
                y: cell.y + dir.dy * 2
            }))
            .filter(newCell => 
                this.isValid(newCell.x, newCell.y) && 
                this.maze[newCell.y][newCell.x] === 1
            );
    }

    carvePathways() {
        const stack = [{ x: 1, y: 1 }];
        const visited = new Set();
    
        while (stack.length > 0) {
            const current = stack.pop();
            const key = `${current.x},${current.y}`;
    
            if (!visited.has(key)) {
                visited.add(key);
                this.maze[current.y][current.x] = 0;
    
                const neighbors = this.getUnvisitedNeighbors(current);
                for (const neighbor of neighbors) {
                    stack.push(neighbor);
                    // Augmenter la probabilité de créer des chemins supplémentaires
                    if (Math.random() < 0.7) {  // Augmenté de 0.5 à 0.7
                        const midX = (current.x + neighbor.x) / 2;
                        const midY = (current.y + neighbor.y) / 2;
                        this.maze[Math.floor(midY)][Math.floor(midX)] = 0;
                    }
                }
    
                // Ajouter des chemins supplémentaires aléatoires
                if (Math.random() < 0.3) {  // 30% de chance d'ajouter un chemin supplémentaire
                    const randomNeighbor = this.getRandomNeighbor(current);
                    if (randomNeighbor) {
                        this.maze[randomNeighbor.y][randomNeighbor.x] = 0;
                    }
                }
            }
        }
    }

    getRandomNeighbor(cell) {
        const neighbors = this.directions
            .map(dir => ({
                x: cell.x + dir.dx,
                y: cell.y + dir.dy
            }))
            .filter(newCell => this.isValid(newCell.x, newCell.y));
        
        return neighbors[Math.floor(Math.random() * neighbors.length)];
    }

    createClearings() {
        const numClearings = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < numClearings; i++) {
            this.createClearing();
        }
    }

    createClearing() {
        const maxAttempts = 50;
        for (let attempts = 0; attempts < maxAttempts; attempts++) {
            const x = Math.floor(Math.random() * (this.width - 5)) + 2;
            const y = Math.floor(Math.random() * (this.height - 5)) + 2;
            
            if (this.canCreateClearing(x, y)) {
                const size = Math.random() < 0.7 ? 3 : 4;
                for (let dy = 0; dy < size; dy++) {
                    for (let dx = 0; dx < size; dx++) {
                        if (this.isValid(x + dx, y + dy)) {
                            this.maze[y + dy][x + dx] = 0;
                        }
                    }
                }
                this.clearings.push({x, y, size});
                return;
            }
        }
    }

    canCreateClearing(x, y) {
        for (let dy = -1; dy <= 4; dy++) {
            for (let dx = -1; dx <= 4; dx++) {
                if (!this.isValid(x + dx, y + dy)) {
                    return false;
                }
            }
        }
        return true;
    }

    openEntranceAndExit() {
        this.maze[this.entrance.y][this.entrance.x] = 0;
        this.exit = this.getValidExitPosition();
        this.maze[this.exit.y][this.exit.x] = 0;
    }

    getValidExitPosition() {
        let exitPos;
        const maxAttempts = 200;

        for (let attempts = 0; attempts < maxAttempts; attempts++) {
            exitPos = this.getRandomBorderPosition();
            if (this.isValidExit(exitPos)) {
                return exitPos;
            }
        }

        console.warn(`Impossible de trouver une sortie valide après ${maxAttempts} tentatives. Utilisation de la dernière position générée.`);
        return exitPos;
    }

    isValidExit(exitPos) {
        if (exitPos.x === this.entrance.x && exitPos.y === this.entrance.y) {
            return false;
        }
        
        const pathLength = this.getPathLength(this.entrance, exitPos);
        const minRequiredLength = Math.max(
            this.minPathLength,
            Math.floor(Math.max(this.width, this.height) * CONFIG.minPathLengthFactor) + CONFIG.minAdditionalPathLength
        );
        
        return pathLength >= minRequiredLength;
    }

    getPathLength(start, end) {
        const queue = new PriorityQueue();
        const visited = new Set();
        const distances = new Map();
    
        distances.set(`${start.x},${start.y}`, 0);
        queue.enqueue(start, 0);
    
        while (!queue.isEmpty()) {
            const current = queue.dequeue();
            const currentKey = `${current.x},${current.y}`;
    
            if (current.x === end.x && current.y === end.y) {
                return distances.get(currentKey);
            }
    
            if (visited.has(currentKey)) continue;
            visited.add(currentKey);
    
            for (const neighbor of this.getNeighbors(current)) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                const newDistance = distances.get(currentKey) + 1;
    
                if (!distances.has(neighborKey) || newDistance < distances.get(neighborKey)) {
                    distances.set(neighborKey, newDistance);
                    const priority = newDistance + this.heuristic(neighbor, end);
                    queue.enqueue(neighbor, priority);
                }
            }
        }
    
        return Infinity; // Aucun chemin trouvé
    }

    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    ensurePathway(position) {
        for (const dir of this.directions) {
            const newX = position.x + dir.dx;
            const newY = position.y + dir.dy;
            if (this.isValid(newX, newY)) {
                this.maze[newY][newX] = 0;
                break;
            }
        }
    }

    getRandomBorderPosition() {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        switch (side) {
            case 0: x = Math.floor(Math.random() * (this.width - 2)) + 1; y = 0; break;
            case 1: x = this.width - 1; y = Math.floor(Math.random() * (this.height - 2)) + 1; break;
            case 2: x = Math.floor(Math.random() * (this.width - 2)) + 1; y = this.height - 1; break;
            case 3: x = 0; y = Math.floor(Math.random() * (this.height - 2)) + 1; break;
        }
        return { x, y };
    }

    closeUnusedBorderOpenings() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.isBorderCell(x, y) && this.maze[y][x] === 0 &&
                    !(x === this.entrance.x && y === this.entrance.y) && 
                    !(x === this.exit.x && y === this.exit.y)) {
                    this.maze[y][x] = 1;
                }
            }
        }
    }

    
    // Nouvelle fonction dans level.js
    generateOrganicPondShape(centerX, centerY, maxRadius) {
        const shape = Array(maxRadius * 2 + 1).fill().map(() => Array(maxRadius * 2 + 1).fill(false));
        const queue = [{x: maxRadius, y: maxRadius}];
        shape[maxRadius][maxRadius] = true;
    
        while (queue.length > 0) {
            const {x, y} = queue.shift();
            const directions = [{dx: -1, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: 0, dy: 1}];
    
            for (const {dx, dy} of directions) {
                const newX = x + dx;
                const newY = y + dy;
                if (newX >= 0 && newX < shape.length && newY >= 0 && newY < shape[0].length) {
                    const distance = Math.sqrt(Math.pow(newX - maxRadius, 2) + Math.pow(newY - maxRadius, 2));
                    if (!shape[newX][newY] && distance <= maxRadius && Math.random() < 0.7) {
                        shape[newX][newY] = true;
                        queue.push({x: newX, y: newY});
                    }
                }
            }
        }
    
        // Assurons-nous que les extrémités sont correctement formées
        this.ensureValidPondExtremities(shape);
    
        // Vérification de la taille minimale
        let waterTiles = shape.flat().filter(tile => tile).length;
        if (waterTiles < 4) {
            return null;
        }
    
        return {shape, centerX, centerY};
    }

    ensureValidPondExtremities(shape) {
        const width = shape.length;
        const height = shape[0].length;
    
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (shape[y][x]) {
                    // Vérifier et corriger les extrémités
                    if (y === 0 || !shape[y-1][x]) { // Extrémité supérieure
                        if (x > 0) shape[y][x-1] = true;
                        if (x < width - 1) shape[y][x+1] = true;
                    }
                    if (y === height - 1 || !shape[y+1][x]) { // Extrémité inférieure
                        if (x > 0) shape[y][x-1] = true;
                        if (x < width - 1) shape[y][x+1] = true;
                    }
                    if (x === 0 || !shape[y][x-1]) { // Extrémité gauche
                        if (y > 0) shape[y-1][x] = true;
                        if (y < height - 1) shape[y+1][x] = true;
                    }
                    if (x === width - 1 || !shape[y][x+1]) { // Extrémité droite
                        if (y > 0) shape[y-1][x] = true;
                        if (y < height - 1) shape[y+1][x] = true;
                    }
                }
            }
        }
    }

    isBorderCell(x, y) {
        return x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1;
    }

    removeDeadEnds() {
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.maze[y][x] === 0) {
                    const wallCount = this.directions.reduce((count, dir) => 
                        count + (this.maze[y + dir.dy][x + dir.dx] === 1 ? 1 : 0), 0);

                    if (wallCount >= 3) {
                        const openDir = this.directions[Math.floor(Math.random() * this.directions.length)];
                        this.maze[y + openDir.dy][x + openDir.dx] = 0;
                    }
                }
            }
        }
    }

    isValid(x, y) {
        return x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1;
    }

    getNeighbors(cell) {
        return this.directions
            .map(dir => ({ x: cell.x + dir.dx, y: cell.y + dir.dy }))
            .filter(newCell => this.isValid(newCell.x, newCell.y) && this.maze[newCell.y][newCell.x] === 0);
    }

    draw(ctx) {
        const cellSize = CONFIG.cellSize;
    
        // Dessiner les arbres
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.maze[y][x] === 1) {
                    drawTreeBlock(ctx, x, y, this.treeTypes[y][x] === 'apple');
                }
            }
        }
    
        // Dessiner les fleurs
        for (const flower of this.flowers) {
            drawFlower(ctx, flower.x, flower.y, flower.type);
        }

            // Dessiner les étangs
        for (const pond of this.ponds) {
            drawPond(ctx, pond);
        }
    }

    ensureEntrancePathway() {
        this.ensurePathway(this.entrance);
    }

    ensureExitPathway() {
        this.ensurePathway(this.exit);
    }
}