import { CONFIG } from './config.js';

const WATER_TILE_SIZE = 8;
const SCALED_WATER_TILE_SIZE = WATER_TILE_SIZE * CONFIG.waterTileScale;

export default class LeafGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.leafDensityMap = Array(height).fill().map(() => Array(width).fill(0));
    }

    generateLeaves(maze, ponds) {
        this.leafDensityMap = Array(this.height).fill().map(() => Array(this.width).fill(0));
        const leaves = [];
        
        this.generateCompactLeafClusters(leaves, maze, ponds);
        this.addMandatoryLeafBorders(leaves);
        this.addPatternX(leaves, maze, ponds);
        this.addTransitionLeaves(leaves, maze, ponds);

        return leaves;
    }

    generateCompactLeafClusters(leaves, maze, ponds) {
        const mainPatterns = ['B', 'C', 'D', 'E-center'];
        const clusterCount = Math.floor(this.width * this.height * CONFIG.leafDensity * 0.7);

        for (let i = 0; i < clusterCount; i++) {
            const startX = Math.floor(Math.random() * this.width);
            const startY = Math.floor(Math.random() * this.height);
            if (this.isEmptyCell(startX, startY, maze, ponds)) {
                this.growRectangularLeafCluster(startX, startY, mainPatterns, leaves, maze, ponds);
            }
        }
    }

    growRectangularLeafCluster(startX, startY, patterns, leaves, maze, ponds) {
        const clusterSizes = [
            {width: 1, height: 1},  // 1x1
            {width: 2, height: 1},  // 2x1
            {width: 1, height: 2},  // 1x2
            {width: 2, height: 2}   // 2x2
        ];

        const chosenSize = clusterSizes[Math.floor(Math.random() * clusterSizes.length)];
        const canPlaceCluster = this.canPlaceRectangularCluster(startX, startY, chosenSize.width, chosenSize.height, maze, ponds);

        if (canPlaceCluster) {
            for (let dy = 0; dy < chosenSize.height; dy++) {
                for (let dx = 0; dx < chosenSize.width; dx++) {
                    const x = startX + dx;
                    const y = startY + dy;
                    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
                    leaves.push({x, y, pattern});
                    this.leafDensityMap[y][x] = 1;
                }
            }
        }
    }

    addMandatoryLeafBorders(leaves) {
        const borderPatterns = {
            'right': 'E-right',
            'left': 'E-left',
            'top': 'E-top',
            'bottom': 'E-bottom'
        };

        const newLeaves = [];

        for (const leaf of leaves) {
            if (this.isMainLeafPattern(leaf.pattern)) {
                for (const [direction, [dx, dy]] of Object.entries({
                    'right': [1, 0],
                    'left': [-1, 0],
                    'top': [0, -1],
                    'bottom': [0, 1]
                })) {
                    const newX = leaf.x + dx;
                    const newY = leaf.y + dy;
                    if (this.isValidCell(newX, newY) && !this.isMainLeafPattern(this.getLeafPattern(leaves, newX, newY))) {
                        const existingLeaf = leaves.find(l => l.x === newX && l.y === newY);
                        if (existingLeaf) {
                            existingLeaf.pattern = borderPatterns[direction];
                        } else {
                            newLeaves.push({x: newX, y: newY, pattern: borderPatterns[direction]});
                        }
                    }
                }
            }
        }

        leaves.push(...newLeaves);
    }

    addPatternX(leaves, maze, ponds) {
        const patternXCount = Math.floor(this.width * this.height * CONFIG.leafDensity * 0.3);

        for (let i = 0; i < patternXCount; i++) {
            const startX = Math.floor(Math.random() * (this.width - 1));
            const startY = Math.floor(Math.random() * (this.height - 1));
            if (this.canPlacePatternX(startX, startY, maze, ponds)) {
                this.placePatternX(startX, startY, leaves);
            }
        }
    }

    addTransitionLeaves(leaves, maze, ponds) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.isEmptyCell(x, y, maze, ponds) && !this.hasLeaf(leaves, x, y)) {
                    const nearbyDensity = this.getNearbyLeafDensity(x, y);
                    if (nearbyDensity > 0) {
                        const pattern = this.chooseTransitionPattern(nearbyDensity);
                        if (pattern) {
                            leaves.push({ x, y, pattern });
                            this.leafDensityMap[y][x] = 0.3;
                        }
                    }
                }
            }
        }
    }

    isEmptyCell(x, y, maze, ponds) {
        if (!this.isValidCell(x, y) || maze[y][x] !== 0) {
            return false;
        }
        
        if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
            return false;
        }
        
        const adjacentCells = [
            [x-1, y], [x+1, y], [x, y-1], [x, y+1]
        ];
        
        for (const [adjX, adjY] of adjacentCells) {
            if (!this.isValidCell(adjX, adjY) || maze[adjY][adjX] === 1) {
                return false;
            }
        }

        // Check if the cell is not part of a pond
        for (const pond of ponds) {
            if (this.isCellInPond(x, y, pond)) {
                return false;
            }
        }
        
        return true;
    }

    isCellInPond(x, y, pond) {
        const cellX = x * CONFIG.cellSize;
        const cellY = y * CONFIG.cellSize;
        const pondHalfSize = Math.floor(pond.shape.length / 2) * SCALED_WATER_TILE_SIZE;
        const pondLeft = pond.centerX - pondHalfSize;
        const pondTop = pond.centerY - pondHalfSize;
        const pondRight = pondLeft + pond.shape.length * SCALED_WATER_TILE_SIZE;
        const pondBottom = pondTop + pond.shape.length * SCALED_WATER_TILE_SIZE;

        return cellX >= pondLeft && cellX < pondRight && cellY >= pondTop && cellY < pondBottom;
    }

    canPlaceRectangularCluster(startX, startY, width, height, maze, ponds) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                if (!this.isEmptyCell(startX + dx, startY + dy, maze, ponds)) {
                    return false;
                }
            }
        }
        return true;
    }

    canPlacePatternX(x, y, maze, ponds) {
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                if (!this.isEmptyCell(x + dx, y + dy, maze, ponds)) {
                    return false;
                }
            }
        }
        return true;
    }

    placePatternX(x, y, leaves) {
        const patterns = ['X-topLeft', 'X-topRight', 'X-bottomLeft', 'X-bottomRight'];
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                const newX = x + dx;
                const newY = y + dy;
                const patternIndex = dy * 2 + dx;
                leaves.push({x: newX, y: newY, pattern: patterns[patternIndex]});
                this.leafDensityMap[newY][newX] = 1;
            }
        }
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
        return totalDensity / 25;  // 25 is the total number of cells checked (5x5)
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

    isMainLeafPattern(pattern) {
        const mainPatterns = ['B', 'C', 'D', 'E-center'];
        return mainPatterns.includes(pattern);
    }

    isValidCell(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    hasLeaf(leaves, x, y) {
        return leaves.some(leaf => leaf.x === x && leaf.y === y);
    }

    getLeafPattern(leaves, x, y) {
        const leaf = leaves.find(l => l.x === x && l.y === y);
        return leaf ? leaf.pattern : null;
    }
}