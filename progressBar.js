export class ProgressBar {
    constructor(maxLevel) {
        this.maxLevel = maxLevel;
        this.progressBarElement = document.getElementById('progress-bar');
        this.levelIndicatorElement = document.getElementById('level-indicator');
    }

    update(currentLevel) {
        const progress = (currentLevel - 1) / (this.maxLevel - 1) * 100;
        this.progressBarElement.style.setProperty('--progress', `${progress}%`);
        this.levelIndicatorElement.textContent = `Niveau ${currentLevel}/${this.maxLevel}`;
    }
}