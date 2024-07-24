import { CONFIG } from './config.js';

const WATER_TILE_SIZE = 8;
const SCALED_WATER_TILE_SIZE = WATER_TILE_SIZE * CONFIG.waterTileScale;

export default class PondGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.directions = [
            {dx: 0, dy: 1}, {dx: 1, dy: 0}, 
            {dx: 0, dy: -1}, {dx: -1, dy: 0}
        ];
    }

    generatePonds(maze) {
        const ponds = [];
        const pondDensity = 0.10;
        const minPondRadius = 2;
        const maxPondRadius = 4;
    
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (maze[y][x] === 0 && Math.random() < pondDensity) {
                    const radius = Math.floor(Math.random() * (maxPondRadius - minPondRadius + 1) + minPondRadius);
                    const pond = this.generateOrganicPondShape(x, y, radius);
                    
                    if (pond && this.canPlacePond(pond, maze)) {
                        ponds.push(pond);
                        this.markPondArea(pond, maze);
                    }
                }
            }
        }

        return ponds;
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

    canPlacePond(pond, maze) {
        const {shape, centerX, centerY} = pond;
        const halfSize = Math.floor(shape.length / 2) * SCALED_WATER_TILE_SIZE;
    
        for (let dy = 0; dy < shape.length; dy++) {
            for (let dx = 0; dx < shape[dy].length; dx++) {
                if (shape[dy][dx]) {
                    const worldX = Math.floor((centerX - halfSize + dx * SCALED_WATER_TILE_SIZE) / CONFIG.cellSize);
                    const worldY = Math.floor((centerY - halfSize + dy * SCALED_WATER_TILE_SIZE) / CONFIG.cellSize);
                    if (worldX < 1 || worldX >= this.width - 1 || worldY < 1 || worldY >= this.height - 1 || maze[worldY][worldX] !== 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    markPondArea(pond, maze) {
        const {shape, centerX, centerY} = pond;
        const halfSize = Math.floor(shape.length / 2) * SCALED_WATER_TILE_SIZE;
    
        for (let dy = 0; dy < shape.length; dy++) {
            for (let dx = 0; dx < shape[dy].length; dx++) {
                if (shape[dy][dx]) {
                    const worldX = Math.floor((centerX - halfSize + dx * SCALED_WATER_TILE_SIZE) / CONFIG.cellSize);
                    const worldY = Math.floor((centerY - halfSize + dy * SCALED_WATER_TILE_SIZE) / CONFIG.cellSize);
                    maze[worldY][worldX] = 2; // 2 represents a pond
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

    isValidPondTile(x, y, size) {
        return x >= 0 && x < size && y >= 0 && y < size;
    }

    countWaterNeighbors(shape, x, y) {
        return this.directions.filter(({dx, dy}) => {
            const newX = x + dx;
            const newY = y + dy;
            return this.isValidPondTile(newX, newY, shape.length) && shape[newY][newX];
        }).length;
    }

    widenCell(shape, x, y) {
        for (const {dx, dy} of this.directions) {
            const newX = x + dx;
            const newY = y + dy;
            if (this.isValidPondTile(newX, newY, shape.length) && !shape[newY][newX]) {
                shape[newY][newX] = true;
                return; // Only widen in one direction
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
}