import { CONFIG } from './config.js';
import { drawTreeBlock, drawFlower, drawPond, drawLeafPattern } from './assetLoader.js';
import { PriorityQueue } from './PriorityQueue.js';

const WATER_TILE_SIZE = 8;
const SCALED_WATER_TILE_SIZE = WATER_TILE_SIZE * CONFIG.waterTileScale;

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
        this.leaves = [];
        this.leafDensityMap = Array(height).fill().map(() => Array(width).fill(0));
        this.minPondSize = 1;
        this.maxPondSize = 4;
        this.debugMode = false;
        this.minPathLength = Math.floor(Math.max(width, height) * CONFIG.minPathLengthFactor);
        
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
        this.generateLeaves();
        this.closeUnusedBorderOpenings();
    }

    initializeMaze() {
        this.maze = Array.from({ length: this.height }, (_, y) => 
            Array.from({ length: this.width }, (_, x) => 
                this.isBorderCell(x, y) ? 1 : (Math.random() < 0.3 ? 1 : 0)
            )
        );
        
        this.treeTypes = Array.from({ length: this.height }, () => 
            Array.from({ length: this.width }, () => Math.random() < 0.15 ? 'apple' : 'normal')
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
                    
                    if (pond && this.canPlacePond(pond)) {
                        this.ponds.push(pond);
                        this.markPondArea(pond);
                    }
                }
            }
        }
    }

    generateLeaves() {
        this.leafDensityMap = Array(this.height).fill().map(() => Array(this.width).fill(0));
        this.generateMainLeafAreas();
        this.addMandatoryLeafBorders();
        this.addPatternX();
        this.addTransitionLeaves();
    }

    isEmptyCell(x, y) {
        // Vérifier si la cellule est valide et vide
        if (!this.isValidCell(x, y) || this.maze[y][x] !== 0) {
            return false;
        }
        
        // Vérifier si la cellule fait partie de la bordure du labyrinthe
        if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
            return false;
        }
        
        // Vérifier si la cellule est adjacente à une cellule de bordure
        const adjacentCells = [
            [x-1, y], [x+1, y], [x, y-1], [x, y+1]
        ];
        
        for (const [adjX, adjY] of adjacentCells) {
            if (!this.isValidCell(adjX, adjY) || this.maze[adjY][adjX] === 1) {
                return false;
            }
        }
        
        return true;
    }

    addTransitionLeaves() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.isEmptyCell(x, y) && this.leafDensityMap[y][x] === 0) {
                    const nearbyDensity = this.getNearbyLeafDensity(x, y);
                    if (nearbyDensity > 0) {
                        const pattern = this.chooseTransitionPattern(nearbyDensity);
                        if (pattern) {
                            this.leaves.push({ x, y, pattern });
                            this.leafDensityMap[y][x] = 0.3;
                        }
                    }
                }
            }
        }
    }
    chooseTransitionPattern(density) {
        if (density > 0.4) return 'A';
        if (density > 0.2) return Math.random() < 0.5 ? 'twoLeaves1' : 'twoLeaves2';
        if (density > 0.05 && Math.random() < 0.3) {
            const singleLeaves = ['singleLeaveBottomLeft', 'singleLeaveBottomRight', 'singleLeaveTopLeft', 'singleLeaveTopRight'];
            return singleLeaves[Math.floor(Math.random() * singleLeaves.length)];
        }
        return null;
    }

    getNearbyLeafDensity(x, y) {
        let totalDensity = 0;
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                if (this.isValidCell(x + dx, y + dy)) {
                    totalDensity += this.leafDensityMap[y + dy][x + dx];
                }
            }
        }
        return totalDensity / 25;  // 25 est le nombre total de cellules vérifiées (5x5)
    }

    addLeafBorders() {
        const borderPatterns = ['E-right', 'E-left', 'E-top', 'E-bottom'];
        const directions = [[1, 0], [-1, 0], [0, -1], [0, 1]];

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.isMainLeafPattern(x, y)) {
                    for (let i = 0; i < directions.length; i++) {
                        const [dx, dy] = directions[i];
                        const newX = x + dx;
                        const newY = y + dy;
                        if (this.isEmptyCell(newX, newY) && !this.isMainLeafPattern(newX, newY)) {
                            this.leaves.push({ x: newX, y: newY, pattern: borderPatterns[i] });
                            this.leafDensityMap[newY][newX] = 0.7;
                        }
                    }
                }
            }
        }
    }

    isMainLeafPattern(x, y) {
        const mainPatterns = ['B', 'C', 'D', 'E-center'];
        const leaf = this.leaves.find(l => l.x === x && l.y === y);
        return leaf && mainPatterns.includes(leaf.pattern);
    }

    addBorderLeaves(x, y, patterns) {
        const directions = [
            { dx: 1, dy: 0, key: 'right' },
            { dx: -1, dy: 0, key: 'left' },
            { dx: 0, dy: -1, key: 'top' },
            { dx: 0, dy: 1, key: 'bottom' },
            { dx: -1, dy: -1, key: 'topLeft' },
            { dx: 1, dy: -1, key: 'topRight' },
            { dx: -1, dy: 1, key: 'bottomLeft' },
            { dx: 1, dy: 1, key: 'bottomRight' }
        ];

        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            if (this.isEmptyCell(newX, newY) && this.leafDensityMap[newY][newX] === 0) {
                this.leaves.push({ x: newX, y: newY, pattern: patterns[dir.key] });
                this.leafDensityMap[newY][newX] = 0.7;
            }
        }
    }

    generateMainLeafAreas() {
        const mainPatterns = ['B', 'C', 'D', 'E-center'];
        const clusterCount = Math.floor(this.width * this.height * CONFIG.leafDensity);

        for (let i = 0; i < clusterCount; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            if (this.isEmptyCell(x, y)) {
                const pattern = mainPatterns[Math.floor(Math.random() * mainPatterns.length)];
                this.generateLeafCluster(x, y, pattern);
            }
        }
    }

    generateLeafCluster(x, y, pattern, size = 3) {
        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                const newX = x + dx;
                const newY = y + dy;
                if (this.isEmptyCell(newX, newY)) {
                    this.leaves.push({ x: newX, y: newY, pattern });
                    this.leafDensityMap[newY][newX] = 1;
                }
            }
        }
    }

    addMandatoryLeafBorders() {
        const directions = [
            { dx: 1, dy: 0, pattern: 'E-right' },
            { dx: -1, dy: 0, pattern: 'E-left' },
            { dx: 0, dy: -1, pattern: 'E-top' },
            { dx: 0, dy: 1, pattern: 'E-bottom' }
        ];

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.isMainLeafPattern(x, y)) {
                    for (const dir of directions) {
                        const newX = x + dir.dx;
                        const newY = y + dir.dy;
                        if (this.isValidCell(newX, newY) && !this.isMainLeafPattern(newX, newY)) {
                            // Si la cellule adjacente est vide ou contient déjà un pattern E, nous le remplaçons
                            this.removeExistingLeaf(newX, newY);
                            this.leaves.push({ x: newX, y: newY, pattern: dir.pattern });
                            this.leafDensityMap[newY][newX] = 0.7;
                        }
                    }
                }
            }
        }
    }

    removeExistingLeaf(x, y) {
        const index = this.leaves.findIndex(leaf => leaf.x === x && leaf.y === y);
        if (index !== -1) {
            this.leaves.splice(index, 1);
        }
    }

    addClusterCorner(x, y, pattern) {
        if (this.isEmptyCell(x, y)) {
            this.leaves.push({ x, y, pattern });
            this.leafDensityMap[y][x] = 1;
        }
    }

    isValidCell(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    addPatternE(x, y) {
        this.leaves.push({ x, y, pattern: 'E-center' });
        if (x > 0) this.leaves.push({ x: x-1, y, pattern: 'E-left' });
        if (x < this.width - 1) this.leaves.push({ x: x+1, y, pattern: 'E-right' });
        if (y > 0) this.leaves.push({ x, y: y-1, pattern: 'E-top' });
        if (y < this.height - 1) this.leaves.push({ x, y: y+1, pattern: 'E-bottom' });
    }

    addPatternX() {
        for (let y = 0; y < this.height - 1; y++) {
            for (let x = 0; x < this.width - 1; x++) {
                if (this.canPlacePatternX(x, y)) {
                    this.placePatternX(x, y);
                }
            }
        }
    }

    canPlacePatternX(x, y) {
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                if (!this.isEmptyCell(x + dx, y + dy) || this.leafDensityMap[y + dy][x + dx] !== 0) {
                    return false;
                }
            }
        }
        return true;
    }

    placePatternX(x, y) {
        const patterns = ['X-topLeft', 'X-topRight', 'X-bottomLeft', 'X-bottomRight'];
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                const newX = x + j;
                const newY = y + i;
                const patternIndex = i * 2 + j;
                this.leaves.push({ x: newX, y: newY, pattern: patterns[patternIndex] });
                this.leafDensityMap[newY][newX] = 0.5;
            }
        }
    }

    canPlacePond(pond) {
        const {shape, centerX, centerY} = pond;
        const halfSize = Math.floor(shape.length / 2) * SCALED_WATER_TILE_SIZE;
    
        for (let dy = 0; dy < shape.length; dy++) {
            for (let dx = 0; dx < shape[dy].length; dx++) {
                if (shape[dy][dx]) {
                    const worldX = Math.floor((centerX - halfSize + dx * SCALED_WATER_TILE_SIZE) / CONFIG.cellSize);
                    const worldY = Math.floor((centerY - halfSize + dy * SCALED_WATER_TILE_SIZE) / CONFIG.cellSize);
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
        const halfSize = Math.floor(shape.length / 2) * SCALED_WATER_TILE_SIZE;
    
        for (let dy = 0; dy < shape.length; dy++) {
            for (let dx = 0; dx < shape[dy].length; dx++) {
                if (shape[dy][dx]) {
                    const worldX = Math.floor((centerX - halfSize + dx * SCALED_WATER_TILE_SIZE) / CONFIG.cellSize);
                    const worldY = Math.floor((centerY - halfSize + dy * SCALED_WATER_TILE_SIZE) / CONFIG.cellSize);
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
                    if (Math.random() < 0.7) {
                        const midX = Math.floor((current.x + neighbor.x) / 2);
                        const midY = Math.floor((current.y + neighbor.y) / 2);
                        this.maze[midY][midX] = 0;
                    }
                }
    
                if (Math.random() < 0.3) {
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

    widenUnicellularPaths(shape) {
        const width = shape.length;
        const height = shape[0].length;
    
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (shape[y][x] && this.countWaterNeighbors(shape, x, y) === 1) {
                    this.widenCell(shape, x, y);
                }
            }
        }
    }

    countWaterNeighbors(shape, x, y) {
        const directions = [{dx: -1, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: 0, dy: 1}];
        return directions.filter(({dx, dy}) => {
            const newX = x + dx;
            const newY = y + dy;
            return newX >= 0 && newX < shape.length && newY >= 0 && newY < shape[0].length && shape[newY][newX];
        }).length;
    }
    
    // Nouvelle fonction auxiliaire dans level.js
    widenCell(shape, x, y) {
        const directions = [{dx: -1, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: 0, dy: 1}];
        for (const {dx, dy} of directions) {
            const newX = x + dx;
            const newY = y + dy;
            if (newX >= 0 && newX < shape.length && newY >= 0 && newY < shape[0].length && !shape[newY][newX]) {
                shape[newY][newX] = true;
                return; // On n'élargit que dans une direction
            }
        }
    }

    generateOrganicPondShape(centerX, centerY, maxRadius) {
        const pondSizeInTiles = Math.floor(maxRadius * 2 * CONFIG.cellSize / SCALED_WATER_TILE_SIZE);
        const shape = Array.from({ length: pondSizeInTiles }, () => Array(pondSizeInTiles).fill(false));
        const queue = [{x: Math.floor(pondSizeInTiles / 2), y: Math.floor(pondSizeInTiles / 2)}];
        shape[Math.floor(pondSizeInTiles / 2)][Math.floor(pondSizeInTiles / 2)] = true;
    
        while (queue.length > 0) {
            const {x, y} = queue.shift();
    
            for (const {dx, dy} of this.directions) {
                const newX = x + dx;
                const newY = y + dy;
                if (this.isValidPondTile(newX, newY, pondSizeInTiles)) {
                    const distance = Math.hypot(newX - pondSizeInTiles / 2, newY - pondSizeInTiles / 2);
                    if (!shape[newY][newX] && distance <= pondSizeInTiles / 2 && Math.random() < 0.7) {
                        shape[newY][newX] = true;
                        queue.push({x: newX, y: newY});
                    }
                }
            }
        }
    
        this.widenUnicellularPaths(shape);
        this.ensureValidPondExtremities(shape);
    
        const waterTiles = shape.flat().filter(Boolean).length;
        return waterTiles >= 4 ? {
            shape,
            centerX: centerX * CONFIG.cellSize,
            centerY: centerY * CONFIG.cellSize
        } : null;
    }

    isValidPondTile(x, y, size) {
        return x >= 0 && x < size && y >= 0 && y < size;
    }


    ensureValidPondExtremities(shape) {
        const width = shape.length;
        const height = shape[0].length;
    
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (shape[y][x] && this.countWaterNeighbors(shape, x, y) === 1) {
                    this.formLShape(shape, x, y);
                }
            }
        }
    }

    formLShape(shape, x, y) {
        const diagonals = [
            {dx: -1, dy: -1}, {dx: 1, dy: -1},
            {dx: -1, dy: 1},  {dx: 1, dy: 1}
        ];
    
        for (const {dx, dy} of diagonals) {
            const newX = x + dx;
            const newY = y + dy;
            if (this.isValidPondTile(newX, newY, shape.length) && !shape[newY][newX]) {
                shape[newY][newX] = true;
                return;
            }
        }
    }

    isBorderCell(x, y) {
        return x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1;
    }

    countWallNeighbors(x, y) {
        return this.directions.reduce((count, dir) => 
            count + (this.maze[y + dir.dy][x + dir.dx] === 1 ? 1 : 0), 0);
    }
    getRandomOpenDirection(x, y) {
        const openDirections = this.directions.filter(dir => 
            this.maze[y + dir.dy][x + dir.dx] === 1);
        return openDirections[Math.floor(Math.random() * openDirections.length)];
    }

    removeDeadEnds() {
        let hasChanges;
        do {
            hasChanges = false;
            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    if (this.maze[y][x] === 0) {
                        const wallCount = this.countWallNeighbors(x, y);
                        if (wallCount >= 3) {
                            const openDir = this.getRandomOpenDirection(x, y);
                            if (openDir) {
                                this.maze[y + openDir.dy][x + openDir.dx] = 0;
                                hasChanges = true;
                            }
                        }
                    }
                }
            }
        } while (hasChanges);
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

        // Dessiner les feuilles
        for (const leaf of this.leaves) {
            if (this.debugMode) {
               this.drawDebugLeaf(ctx, leaf);
            } else {
                drawLeafPattern(ctx, leaf.pattern, leaf.x, leaf.y);
            }
        }
    }

    

    drawDebugLeaf(ctx, leaf) {
        const cellSize = CONFIG.cellSize;
        const x = leaf.x * cellSize;
        const y = leaf.y * cellSize;

        // Dessiner un rectangle de couleur en fonction du pattern
        ctx.fillStyle = this.getDebugColor(leaf.pattern);
        ctx.fillRect(x, y, cellSize, cellSize);

        // Ajouter le nom du pattern
        ctx.fillStyle = 'black';
        ctx.font = '10px Arial';
        ctx.fillText(leaf.pattern, x + 2, y + 10);
    }

    getDebugColor(pattern) {
        const colors = {
            'A': 'rgba(255, 0, 0, 0.5)',    // Rouge
            'B': 'rgba(0, 255, 0, 0.5)',    // Vert
            'C': 'rgba(0, 0, 255, 0.5)',    // Bleu
            'D': 'rgba(255, 255, 0, 0.5)',  // Jaune
            'E-center': 'rgba(255, 0, 255, 0.5)', // Magenta
            'E-right': 'rgba(0, 255, 255, 0.5)',  // Cyan
            'E-left': 'rgba(255, 128, 0, 0.5)',   // Orange
            'E-top': 'rgba(128, 0, 255, 0.5)',    // Violet
            'E-bottom': 'rgba(0, 128, 255, 0.5)', // Bleu clair
            'X-bottomLeft': 'rgba(128, 128, 0, 0.5)',   // Olive
            'X-bottomRight': 'rgba(128, 0, 128, 0.5)',  // Violet foncé
            'X-topLeft': 'rgba(0, 128, 128, 0.5)',      // Sarcelle
            'X-topRight': 'rgba(128, 128, 128, 0.5)',   // Gris
            'twoLeaves1': 'rgba(255, 128, 128, 0.5)',   // Rose clair
            'twoLeaves2': 'rgba(128, 255, 128, 0.5)',   // Vert clair
            'singleLeaveBottomLeft': 'rgba(128, 128, 255, 0.5)',  // Bleu lavande
            'singleLeaveBottomRight': 'rgba(255, 255, 128, 0.5)', // Jaune clair
            'singleLeaveTopLeft': 'rgba(255, 128, 255, 0.5)',     // Rose
            'singleLeaveTopRight': 'rgba(128, 255, 255, 0.5)'     // Cyan clair
        };
        return colors[pattern] || 'rgba(0, 0, 0, 0.5)'; // Noir par défaut
    }

    ensureEntrancePathway() {
        this.ensurePathway(this.entrance);
    }

    ensureExitPathway() {
        this.ensurePathway(this.exit);
    }
}