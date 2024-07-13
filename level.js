import { CONFIG } from './config.js';
import { drawTreeBlock, drawFlower } from './assetLoader.js';

export class Level {
    constructor(width, height, entrancePos = null) {
        this.width = width;
        this.height = height;
        this.maze = [];
        this.entrance = entrancePos || this.getRandomBorderPosition();
        this.exit = null; // We'll set this later
        this.flowers = [];
    }

    generate() {
        this.initializeMaze();
        this.carvePathways();
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
                walls.push(...this.getNeighbors(x, y));
            }
            walls.splice(wallIndex, 1);
        }
    }

    openEntranceAndExit() {
        this.maze[this.entrance.y][this.entrance.x] = 0;
        this.exit = this.getValidExitPosition();
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

    getOppositePosition(pos) {
        return {
            x: pos.x === 0 ? this.width - 1 : (pos.x === this.width - 1 ? 0 : pos.x),
            y: pos.y === 0 ? this.height - 1 : (pos.y === this.height - 1 ? 0 : pos.y)
        };
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
    }
}