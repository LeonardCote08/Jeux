import { CONFIG } from './config.js';
import { 
    drawTreeBlock, 
    drawFlower, 
    drawPond, 
    drawLeafPattern, 
    updateWaterAnimation 
} from './assetLoader.js';

export default class LevelRenderer {
    constructor() {
        this.debugMode = false;
    }

    drawLevel(ctx, level) {
        const cellSize = CONFIG.cellSize;
    
        // Draw trees
        for (let y = 0; y < level.height; y++) {
            for (let x = 0; x < level.width; x++) {
                if (level.maze[y][x] === 1) {
                    drawTreeBlock(ctx, x, y, level.treeTypes[y][x] === 'apple');
                }
            }
        }
    
        // Draw flowers
        for (const flower of level.flowers) {
            drawFlower(ctx, flower.x, flower.y, flower.type);
        }

        // Draw ponds
        for (const pond of level.ponds) {
            drawPond(ctx, pond);
        }

        // Draw leaves
        for (const leaf of level.leaves) {
            if (this.debugMode) {
               this.drawDebugLeaf(ctx, leaf);
            } else {
                drawLeafPattern(ctx, leaf.pattern, leaf.x, leaf.y);
            }
        }

        // Draw debug information if in debug mode
        if (this.debugMode) {
            this.drawDebugGrid(ctx, level);
        }

        if (level.exit) {
            this.highlightCell(ctx, level.exit.x, level.exit.y, 'rgba(255, 0, 0, 0.5)');
        }
    }

    drawDebugLeaf(ctx, leaf) {
        const cellSize = CONFIG.cellSize;
        const x = leaf.x * cellSize;
        const y = leaf.y * cellSize;

        // Draw a colored rectangle based on the pattern
        ctx.fillStyle = this.getDebugColor(leaf.pattern);
        ctx.fillRect(x, y, cellSize, cellSize);

        // Add the pattern name
        ctx.fillStyle = 'black';
        ctx.font = '10px Arial';
        ctx.fillText(leaf.pattern, x + 2, y + 10);
    }

    getDebugColor(pattern) {
        const colors = {
            'A': 'rgba(255, 0, 0, 0.5)',    // Red
            'B': 'rgba(0, 255, 0, 0.5)',    // Green
            'C': 'rgba(0, 0, 255, 0.5)',    // Blue
            'D': 'rgba(255, 255, 0, 0.5)',  // Yellow
            'E-center': 'rgba(255, 0, 255, 0.5)', // Magenta
            'E-right': 'rgba(0, 255, 255, 0.5)',  // Cyan
            'E-left': 'rgba(255, 128, 0, 0.5)',   // Orange
            'E-top': 'rgba(128, 0, 255, 0.5)',    // Purple
            'E-bottom': 'rgba(0, 128, 255, 0.5)', // Light Blue
            'X-bottomLeft': 'rgba(128, 128, 0, 0.5)',   // Olive
            'X-bottomRight': 'rgba(128, 0, 128, 0.5)',  // Dark Purple
            'X-topLeft': 'rgba(0, 128, 128, 0.5)',      // Teal
            'X-topRight': 'rgba(128, 128, 128, 0.5)',   // Gray
            'twoLeaves1': 'rgba(255, 128, 128, 0.5)',   // Light Pink
            'twoLeaves2': 'rgba(128, 255, 128, 0.5)',   // Light Green
            'singleLeaveBottomLeft': 'rgba(128, 128, 255, 0.5)',  // Lavender
            'singleLeaveBottomRight': 'rgba(255, 255, 128, 0.5)', // Light Yellow
            'singleLeaveTopLeft': 'rgba(255, 128, 255, 0.5)',     // Pink
            'singleLeaveTopRight': 'rgba(128, 255, 255, 0.5)'     // Light Cyan
        };
        return colors[pattern] || 'rgba(0, 0, 0, 0.5)'; // Black by default
    }

    drawDebugGrid(ctx, level) {
        const cellSize = CONFIG.cellSize;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 0.5;

        for (let x = 0; x <= level.width; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cellSize, 0);
            ctx.lineTo(x * cellSize, level.height * cellSize);
            ctx.stroke();
        }

        for (let y = 0; y <= level.height; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cellSize);
            ctx.lineTo(level.width * cellSize, y * cellSize);
            ctx.stroke();
        }

        // Draw cell coordinates
        ctx.fillStyle = 'white';
        ctx.font = '8px Arial';
        for (let y = 0; y < level.height; y++) {
            for (let x = 0; x < level.width; x++) {
                ctx.fillText(`${x},${y}`, x * cellSize + 2, y * cellSize + 10);
            }
        }

        // Highlight entrance and exit
        this.highlightCell(ctx, level.entrance.x, level.entrance.y, 'rgba(0, 255, 0, 0.5)');
        this.highlightCell(ctx, level.exit.x, level.exit.y, 'rgba(255, 0, 0, 0.5)');
    }

    highlightCell(ctx, x, y, color) {
        const cellSize = CONFIG.cellSize;
        ctx.fillStyle = color;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }

    setDebugMode(isDebug) {
        this.debugMode = isDebug;
    }
}