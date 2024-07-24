import { CONFIG } from './config.js';
import { PriorityQueue } from './priorityQueue.js';

export default class MazeGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.directions = [
            {dx: 0, dy: 1}, {dx: 1, dy: 0}, 
            {dx: 0, dy: -1}, {dx: -1, dy: 0}
        ];
        this.minPathLength = Math.floor(Math.max(width, height) * CONFIG.minPathLengthFactor);
    }

    generate(entrance) {
        let maze = this.initializeMaze();
        this.carvePathways(maze);
        this.createClearings(maze);
        this.openEntranceAndExit(maze, entrance);
        this.ensureEntrancePathway(maze, entrance);
        this.removeDeadEnds(maze);
        return maze;
    }

    initializeMaze() {
        return Array.from({ length: this.height }, (_, y) => 
            Array.from({ length: this.width }, (_, x) => 
                this.isBorderCell(x, y) ? 1 : (Math.random() < 0.3 ? 1 : 0)
            )
        );
    }

    carvePathways(maze) {
        const stack = [{ x: 1, y: 1 }];
        const visited = new Set();

        while (stack.length > 0) {
            const current = stack.pop();
            const key = `${current.x},${current.y}`;

            if (!visited.has(key)) {
                visited.add(key);
                maze[current.y][current.x] = 0;

                const neighbors = this.getUnvisitedNeighbors(maze, current);
                for (const neighbor of neighbors) {
                    stack.push(neighbor);
                    if (Math.random() < 0.7) {
                        const midX = Math.floor((current.x + neighbor.x) / 2);
                        const midY = Math.floor((current.y + neighbor.y) / 2);
                        maze[midY][midX] = 0;
                    }
                }

                if (Math.random() < 0.3) {
                    const randomNeighbor = this.getRandomNeighbor(maze, current);
                    if (randomNeighbor) {
                        maze[randomNeighbor.y][randomNeighbor.x] = 0;
                    }
                }
            }
        }
    }

    createClearings(maze) {
        const numClearings = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < numClearings; i++) {
            this.createClearing(maze);
        }
    }

    createClearing(maze) {
        const maxAttempts = 50;
        for (let attempts = 0; attempts < maxAttempts; attempts++) {
            const x = Math.floor(Math.random() * (this.width - 5)) + 2;
            const y = Math.floor(Math.random() * (this.height - 5)) + 2;
            
            if (this.canCreateClearing(x, y)) {
                const size = Math.random() < 0.7 ? 3 : 4;
                for (let dy = 0; dy < size; dy++) {
                    for (let dx = 0; dx < size; dx++) {
                        if (this.isValid(x + dx, y + dy)) {
                            maze[y + dy][x + dx] = 0;
                        }
                    }
                }
                return;
            }
        }
    }

    openEntranceAndExit(maze, entrance) {
        maze[entrance.y][entrance.x] = 0;
    }

    getValidExitPosition(entrance, maze) {
        console.log("Getting valid exit position");
        let exitPos;
        const maxAttempts = 200;

        for (let attempts = 0; attempts < maxAttempts; attempts++) {
            exitPos = this.getRandomBorderPosition();
            if (this.isValidExit(exitPos, entrance, maze)) {
                console.log("Valid exit found", exitPos);
                // Assurez-vous que la case de sortie est libre
                maze[exitPos.y][exitPos.x] = 0;
                return exitPos;
            }
        }

        console.warn(`Unable to find a valid exit after ${maxAttempts} attempts. Using the last generated position.`);
        // Assurez-vous que la dernière position générée est libre
        maze[exitPos.y][exitPos.x] = 0;
        return exitPos;
    }

    isValidExit(exitPos, entrance, maze) {
        if (exitPos.x === entrance.x && exitPos.y === entrance.y) {
            return false;
        }
        
        // Vérifiez si la case est un mur (1) ou déjà occupée
        if (maze[exitPos.y][exitPos.x] !== 0) {
            return false;
        }
        
        const pathLength = this.getPathLength(entrance, exitPos, maze);
        const minRequiredLength = Math.max(
            this.minPathLength,
            Math.floor(Math.max(this.width, this.height) * CONFIG.minPathLengthFactor) + CONFIG.minAdditionalPathLength
        );
        
        return pathLength >= minRequiredLength;
    }

    getPathLength(start, end, maze) {
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
    
            for (const neighbor of this.getNeighbors(maze, current)) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                const newDistance = distances.get(currentKey) + 1;
    
                if (!distances.has(neighborKey) || newDistance < distances.get(neighborKey)) {
                    distances.set(neighborKey, newDistance);
                    const priority = newDistance + this.heuristic(neighbor, end);
                    queue.enqueue(neighbor, priority);
                }
            }
        }
    
        return Infinity; // No path found
    }

    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    ensureEntrancePathway(maze, entrance) {
        for (const dir of this.directions) {
            const newX = entrance.x + dir.dx;
            const newY = entrance.y + dir.dy;
            if (this.isValid(newX, newY)) {
                maze[newY][newX] = 0;
                break;
            }
        }
    }

    removeDeadEnds(maze) {
        let hasChanges;
        do {
            hasChanges = false;
            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    if (maze[y][x] === 0) {
                        const wallCount = this.countWallNeighbors(maze, x, y);
                        if (wallCount >= 3) {
                            const openDir = this.getRandomOpenDirection(maze, x, y);
                            if (openDir) {
                                maze[y + openDir.dy][x + openDir.dx] = 0;
                                hasChanges = true;
                            }
                        }
                    }
                }
            }
        } while (hasChanges);
    }

    finalizeLevel(maze, entrance, exit) {
        this.closeUnusedBorderOpenings(maze, entrance, exit);
        // Assurez-vous que l'entrée et la sortie sont toujours ouvertes
        maze[entrance.y][entrance.x] = 0;
        maze[exit.y][exit.x] = 0;
    }

    generateTreeTypes() {
        return Array.from({ length: this.height }, () => 
            Array.from({ length: this.width }, () => Math.random() < 0.15 ? 'apple' : 'normal')
        );
    }

    generateFlowers(maze) {
        const flowers = [];
        const flowerTypes = ['FleurBlanche', 'FleurMauve', 'FleurRouge'];
        const flowerDensity = 0.05;

        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (maze[y][x] === 0 && Math.random() < flowerDensity) {
                    flowers.push({ 
                        x, 
                        y, 
                        type: flowerTypes[Math.floor(Math.random() * flowerTypes.length)]
                    });
                }
            }
        }

        return flowers;
    }

    // Helper methods
    isBorderCell(x, y) {
        return x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1;
    }

    getUnvisitedNeighbors(maze, cell) {
        return this.directions
            .map(dir => ({
                x: cell.x + dir.dx * 2,
                y: cell.y + dir.dy * 2
            }))
            .filter(newCell => 
                this.isValid(newCell.x, newCell.y) && 
                maze[newCell.y][newCell.x] === 1
            );
    }

    getRandomNeighbor(maze, cell) {
        const neighbors = this.directions
            .map(dir => ({
                x: cell.x + dir.dx,
                y: cell.y + dir.dy
            }))
            .filter(newCell => this.isValid(newCell.x, newCell.y));
        
        return neighbors[Math.floor(Math.random() * neighbors.length)];
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

    getRandomBorderPosition() {
        // Implémentation de la méthode
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

    closeUnusedBorderOpenings(maze, entrance, exit) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.isBorderCell(x, y) && maze[y][x] === 0 &&
                    !(x === entrance.x && y === entrance.y) && 
                    !(x === exit.x && y === exit.y)) {
                    maze[y][x] = 1;
                }
            }
        }
    }

    countWallNeighbors(maze, x, y) {
        return this.directions.reduce((count, dir) => 
            count + (maze[y + dir.dy][x + dir.dx] === 1 ? 1 : 0), 0);
    }

    getRandomOpenDirection(maze, x, y) {
        const openDirections = this.directions.filter(dir => 
            maze[y + dir.dy][x + dir.dx] === 1);
        return openDirections[Math.floor(Math.random() * openDirections.length)];
    }

    isValid(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    getNeighbors(maze, cell) {
        return this.directions
            .map(dir => ({ x: cell.x + dir.dx, y: cell.y + dir.dy }))
            .filter(newCell => this.isValid(newCell.x, newCell.y) && maze[newCell.y][newCell.x] === 0);
    }
}