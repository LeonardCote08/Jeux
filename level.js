import { CONFIG } from './config.js';
import { drawTreeBlock, drawFlower } from './assetLoader.js';

export class Level {
    constructor(width, height, entrancePos = null) {
        this.width = width;
        this.height = height;
        this.maze = [];
        this.entrance = entrancePos || this.getRandomBorderPosition();
        this.exit = null;
        this.flowers = [];
        this.clearings = [];
    }

    generate() {
        this.initializeMaze();
        this.carvePathways();
        this.createClearings();
        this.openEntranceAndExit();
        this.ensureEntrancePathway();
        this.ensureExitPathway();
        this.addRandomFlowers();
    }

    initializeMaze() {
        // Create the outer border
        this.maze = Array(this.height).fill().map((_, y) => 
            Array(this.width).fill().map((_, x) => 
                (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) ? 1 : 0
            )
        );

        // Fill the interior with walls (1s)
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                this.maze[y][x] = 1;
            }
        }
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

    carvePathways() {
        let startX = 1 + 2 * Math.floor(Math.random() * ((this.width - 3) / 2));
        let startY = 1 + 2 * Math.floor(Math.random() * ((this.height - 3) / 2));
        this.maze[startY][startX] = 0;

        let walls = this.getNeighbors(startX, startY);
        while (walls.length > 0) {
            let wallIndex = Math.floor(Math.random() * walls.length);
            let wall = walls[wallIndex];
            let { x, y, wx, wy } = wall;

            if (this.maze[y][x] === 1) {
                this.maze[y][x] = 0;
                this.maze[wy][wx] = 0;

                // Chance de créer un passage plus large
                if (Math.random() < 0.3) { // 30% de chance
                    this.widenPassage(x, y);
                }

                walls.push(...this.getNeighbors(x, y));
            }
            walls.splice(wallIndex, 1);
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
        const numClearings = Math.floor(Math.random() * 4) + 3; // 3 à 6 clairières
        for (let i = 0; i < numClearings; i++) {
            this.createClearing();
        }
    }

    createClearing() {
        let attempts = 0;
        while (attempts < 50) { // Limite les tentatives pour éviter une boucle infinie
            let x = Math.floor(Math.random() * (this.width - 3)) + 2;
            let y = Math.floor(Math.random() * (this.height - 3)) + 2;
            
            if (this.canCreateClearing(x, y)) {
                // Nouvelle logique pour déterminer la taille de la clairière
                let size;
                const randomValue = Math.random();
                if (randomValue < 0.5) {
                    size = 2; // 50% de chance d'avoir une clairière 2x2
                } else if (randomValue < 0.8) {
                    size = 3; // 30% de chance d'avoir une clairière 3x3
                } else {
                    size = 4; // 20% de chance d'avoir une clairière 4x4
                }

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
        this.maze[this.entrance.y][this.entrance.x] = 0;
        this.exit = this.getOppositeExit();
        this.maze[this.exit.y][this.exit.x] = 0;
    }

    getValidExitPosition() {
        let exitPos;
        do {
            exitPos = this.getRandomBorderPosition();
        } while (this.getDistance(this.entrance, exitPos) < CONFIG.minEntranceExitDistance);
        return exitPos;
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

    isValid(x, y) {
        return x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1;
    }

    getNeighbors(x, y) {
        const directions = [{dx: -1, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: -1}, {dx: 0, dy: 1}];
        return directions
            .map(dir => ({
                x: x + dir.dx * 2,
                y: y + dir.dy * 2,
                wx: x + dir.dx,
                wy: y + dir.dy
            }))
            .filter(({x, y}) => this.isValid(x, y));
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