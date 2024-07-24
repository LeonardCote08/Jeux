import { CONFIG } from './config.js';
import MazeGenerator from './mazeGenerator.js';
import PondGenerator from './pondGenerator.js';
import LeafGenerator from './leafGenerator.js';
import LevelRenderer from './levelRenderer.js';

export class Level {
    constructor(width, height, entrancePos = null) {
        this.width = width;
        this.height = height;
        this.mazeGenerator = new MazeGenerator(width, height);
        this.pondGenerator = new PondGenerator(width, height);
        this.leafGenerator = new LeafGenerator(width, height);
        this.renderer = new LevelRenderer();

        this.entrance = entrancePos || this.mazeGenerator.getRandomBorderPosition();
        this.exit = null;
        this.debugMode = false;

        this.maze = [];
        this.treeTypes = [];
        this.flowers = [];
        this.ponds = [];
        this.leaves = [];
    }

    generate() {
        console.log("Level.generate() called");
        this.maze = this.mazeGenerator.generate(this.entrance);
        console.log("Maze generated", this.maze);
        
        this.exit = this.mazeGenerator.getValidExitPosition(this.entrance, this.maze);
        console.log("Exit position set", this.exit);
        
        this.treeTypes = this.mazeGenerator.generateTreeTypes();
        this.flowers = this.mazeGenerator.generateFlowers(this.maze);
        
        this.ponds = this.pondGenerator.generatePonds(this.maze);
        console.log("Ponds generated", this.ponds);
        
        this.leaves = this.leafGenerator.generateLeaves(this.maze, this.ponds);
        console.log("Leaves generated", this.leaves);

        this.mazeGenerator.finalizeLevel(this.maze, this.entrance, this.exit);
        
        // Vérification finale pour s'assurer que l'entrée et la sortie sont libres
        this.maze[this.entrance.y][this.entrance.x] = 0;
        this.maze[this.exit.y][this.exit.x] = 0;
        
        console.log("Level generation completed");
    }

    draw(ctx) {
        this.renderer.setDebugMode(this.debugMode);
        this.renderer.drawLevel(ctx, this);
    }

    getRandomBorderPosition() {
        return this.mazeGenerator.getRandomBorderPosition();
    }

    setDebugMode(isDebug) {
        this.debugMode = isDebug;
        this.renderer.setDebugMode(isDebug);
    }

    isValid(x, y) {
        return this.mazeGenerator.isValid(x, y);
    }

    isBorderCell(x, y) {
        return this.mazeGenerator.isBorderCell(x, y);
    }
}