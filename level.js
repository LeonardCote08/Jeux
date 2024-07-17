import { CONFIG } from './config.js';
import { drawTreeBlock, drawFlower } from './assetLoader.js';
import { PriorityQueue } from './PriorityQueue.js';

export class Level {
    constructor(width, height, entrancePos = null) {
        this.width = width;
        this.height = height;
        this.maze = [];
        this.entrance = entrancePos || this.getRandomBorderPosition();
        this.exit = null;
        this.flowers = [];
        this.clearings = [];
        this.minPathLength = Math.floor(Math.max(width, height) * 1.5); // Augmenté pour un chemin plus long
    }

    generate() {
        this.initializeMaze();
        this.carvePathways();
        this.createClearings();
        this.openEntranceAndExit();
        this.ensureEntrancePathway();
        this.ensureExitPathway();
        this.addRandomFlowers();
        this.removeDeadEnds();
        this.closeUnusedBorderOpenings(); // Nouvelle méthode pour fermer les ouvertures inutilisées
    }

    initializeMaze() {
        this.maze = Array(this.height).fill().map((_, y) => 
            Array(this.width).fill().map((_, x) => 
                (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) ? 1 : 
                (Math.random() < 0.3 ? 1 : 0) // 30% de chance d'avoir un arbre à l'intérieur
            )
        );
    }

    addRandomFlowers() {
        const flowerTypes = ['FleurBlanche', 'FleurMauve', 'FleurRouge'];
        const flowerDensity = 0.05; // Ajustez cette valeur pour plus ou moins de fleurs

        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.maze[y][x] === 0 && Math.random() < flowerDensity) {
                    const flowerType = flowerTypes[Math.floor(Math.random() * flowerTypes.length)];
                    this.flowers.push({ x, y, type: flowerType });
                }
            }
        }
    }

    getUnvisitedNeighbors(cell) {
        const neighbors = [];
        const directions = [{dx: 0, dy: 2}, {dx: 2, dy: 0}, {dx: 0, dy: -2}, {dx: -2, dy: 0}];
        
        for (const dir of directions) {
            const newX = cell.x + dir.dx;
            const newY = cell.y + dir.dy;
            if (this.isValid(newX, newY) && this.maze[newY][newX] === 1) {
                neighbors.push({x: newX, y: newY});
            }
        }
        return neighbors.sort(() => Math.random() - 0.5); // Mélanger les voisins
    }

    carvePathways() {
        const stack = [{ x: 1, y: 1 }];
        const visited = new Set();

        while (stack.length > 0) {
            const current = stack.pop();
            const key = `${current.x},${current.y}`;

            if (!visited.has(key)) {
                visited.add(key);
                this.maze[current.y][current.x] = 0; // Creuser le chemin

                const neighbors = this.getUnvisitedNeighbors(current);
                for (const neighbor of neighbors) {
                    stack.push(neighbor);
                    // 50% de chance d'élargir le passage
                    if (Math.random() < 0.5) {
                        const midX = (current.x + neighbor.x) / 2;
                        const midY = (current.y + neighbor.y) / 2;
                        this.maze[Math.floor(midY)][Math.floor(midX)] = 0;
                    }
                }
            }
        }
    }

    widenPassage(x, y) {
        const directions = [{dx: -1, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: 0, dy: 1}];
        for (let dir of directions) {
            let newX = x + dir.dx;
            let newY = y + dir.dy;
            if (this.isValid(newX, newY) && this.maze[newY][newX] === 1) {
                this.maze[newY][newX] = 0;
            }
        }
    }

    createClearings() {
        const numClearings = Math.floor(Math.random() * 3) + 3; // 3 à 5 clairières
        for (let i = 0; i < numClearings; i++) {
            this.createClearing();
        }
    }

    createClearing() {
        let attempts = 0;
        while (attempts < 50) {
            let x = Math.floor(Math.random() * (this.width - 5)) + 2;
            let y = Math.floor(Math.random() * (this.height - 5)) + 2;
            
            if (this.canCreateClearing(x, y)) {
                const size = Math.random() < 0.7 ? 3 : 4; // 70% de chance d'avoir une clairière 3x3, sinon 4x4

                for (let dy = 0; dy < size; dy++) {
                    for (let dx = 0; dx < size; dx++) {
                        if (this.isValid(x + dx, y + dy)) {
                            this.maze[y + dy][x + dx] = 0;
                        }
                    }
                }
                this.clearings.push({x, y, size});
                break;
            }
            attempts++;
        }
    }
    canCreateClearing(x, y) {
        // Vérifie si une zone 4x4 autour du point (x,y) est valide pour une clairière
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
        // Ouvrir l'entrée
        this.maze[this.entrance.y][this.entrance.x] = 0;
        
        // Trouver et ouvrir la sortie
        this.exit = this.getValidExitPosition();
        this.maze[this.exit.y][this.exit.x] = 0;
    }

    getValidExitPosition() {
        let exitPos;
        let attempts = 0;
        const maxAttempts = 200; // Augmenté pour plus de tentatives

        do {
            exitPos = this.getRandomBorderPosition();
            attempts++;
            if (attempts >= maxAttempts) {
                console.warn("Impossible de trouver une sortie valide après " + maxAttempts + " tentatives. Utilisation de la dernière position générée.");
                break;
            }
        } while (!this.isValidExit(exitPos));

        return exitPos;
    }

    isValidExit(exitPos) {
        if (exitPos.x === this.entrance.x && exitPos.y === this.entrance.y) {
            return false;
        }

        const pathLength = this.getPathLength(this.entrance, exitPos);
        return pathLength >= this.minPathLength;
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        while (cameFrom[`${current.x},${current.y}`]) {
            current = cameFrom[`${current.x},${current.y}`];
            path.unshift(current);
        }
        return path;
    }

    getPathLength(start, end) {
        const queue = new PriorityQueue();
        const visited = new Set();
        const distances = {};

        distances[`${start.x},${start.y}`] = 0;
        queue.enqueue(start, 0);

        while (!queue.isEmpty()) {
            const current = queue.dequeue();
            const currentKey = `${current.x},${current.y}`;

            if (current.x === end.x && current.y === end.y) {
                return distances[currentKey];
            }

            if (visited.has(currentKey)) continue;
            visited.add(currentKey);

            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                const newDistance = distances[currentKey] + 1;

                if (!distances[neighborKey] || newDistance < distances[neighborKey]) {
                    distances[neighborKey] = newDistance;
                    const priority = newDistance + this.heuristic(neighbor, end);
                    queue.enqueue(neighbor, priority);
                }
            }
        }

        return Infinity; // Aucun chemin trouvé
    }

    getPathDistance(start, end) {
        const openSet = new PriorityQueue();
        const closedSet = new Set();
        const gScore = {};
        const fScore = {};
        const cameFrom = {};

        gScore[`${start.x},${start.y}`] = 0;
        fScore[`${start.x},${start.y}`] = this.heuristic(start, end);
        openSet.enqueue(start, fScore[`${start.x},${start.y}`]);

        while (!openSet.isEmpty()) {
            const current = openSet.dequeue();

            if (current.x === end.x && current.y === end.y) {
                return this.reconstructPath(cameFrom, current).length - 1;
            }

            closedSet.add(`${current.x},${current.y}`);

            for (const neighbor of this.getNeighbors(current)) {
                if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue;

                const tentativeGScore = gScore[`${current.x},${current.y}`] + 1;

                if (!openSet.contains(neighbor) || tentativeGScore < gScore[`${neighbor.x},${neighbor.y}`]) {
                    cameFrom[`${neighbor.x},${neighbor.y}`] = current;
                    gScore[`${neighbor.x},${neighbor.y}`] = tentativeGScore;
                    fScore[`${neighbor.x},${neighbor.y}`] = gScore[`${neighbor.x},${neighbor.y}`] + this.heuristic(neighbor, end);

                    if (!openSet.contains(neighbor)) {
                        openSet.enqueue(neighbor, fScore[`${neighbor.x},${neighbor.y}`]);
                    }
                }
            }
        }

        // Aucun chemin trouvé
        return Infinity;
    }

    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    ensureEntrancePathway() {
        this.ensurePathway(this.entrance);
    }

    getDistance(pos1, pos2) {
        return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
    }

    ensureExitPathway() {
        this.ensurePathway(this.exit);
    }

    ensurePathway(position) {
        const directions = [
            {dx: 0, dy: 1}, {dx: 0, dy: -1},
            {dx: 1, dy: 0}, {dx: -1, dy: 0}
        ];

        for (let dir of directions) {
            let newX = position.x + dir.dx;
            let newY = position.y + dir.dy;
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
                if (this.isBorderCell(x, y) && this.maze[y][x] === 0) {
                    // Si ce n'est ni l'entrée ni la sortie, fermer l'ouverture
                    if (!((x === this.entrance.x && y === this.entrance.y) || 
                          (x === this.exit.x && y === this.exit.y))) {
                        this.maze[y][x] = 1;
                    }
                }
            }
        }
    }

    isBorderCell(x, y) {
        return x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1;
    }

    getOppositeExit() {
        let x, y;
        if (this.entrance.x === 0) {
            x = this.width - 1;
            y = Math.floor(Math.random() * (this.height - 2)) + 1;
        } else if (this.entrance.x === this.width - 1) {
            x = 0;
            y = Math.floor(Math.random() * (this.height - 2)) + 1;
        } else if (this.entrance.y === 0) {
            y = this.height - 1;
            x = Math.floor(Math.random() * (this.width - 2)) + 1;
        } else {
            y = 0;
            x = Math.floor(Math.random() * (this.width - 2)) + 1;
        }
        return { x, y };
    }

    removeDeadEnds() {
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.maze[y][x] === 0) {
                    let wallCount = 0;
                    if (this.maze[y-1][x] === 1) wallCount++;
                    if (this.maze[y+1][x] === 1) wallCount++;
                    if (this.maze[y][x-1] === 1) wallCount++;
                    if (this.maze[y][x+1] === 1) wallCount++;

                    if (wallCount >= 3) {
                        // Enlever un mur aléatoirement
                        const directions = [{dx: 0, dy: 1}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: -1, dy: 0}];
                        const openDir = directions[Math.floor(Math.random() * directions.length)];
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
        const neighbors = [];
        const directions = [{dx: 0, dy: 1}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: -1, dy: 0}];
        
        for (const dir of directions) {
            const newX = cell.x + dir.dx;
            const newY = cell.y + dir.dy;
            if (this.isValid(newX, newY) && this.maze[newY][newX] === 0) {
                neighbors.push({x: newX, y: newY});
            }
        }
        return neighbors;
    }

    draw(ctx) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.maze[y][x] === 1) {
                    if (x * CONFIG.cellSize < ctx.canvas.width && y * CONFIG.cellSize < ctx.canvas.height) {
                        drawTreeBlock(ctx, x, y);
                    }
                }
            }
        }

        // Dessiner les fleurs
        for (let flower of this.flowers) {
            drawFlower(ctx, flower.x, flower.y, flower.type);
        }

        // Vous pouvez ajouter ici du code pour visualiser les clairières si nécessaire
    }
}