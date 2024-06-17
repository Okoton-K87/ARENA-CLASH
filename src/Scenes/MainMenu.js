class MainMenu extends Phaser.Scene {
    constructor() {
        super("MainMenu");
    }

    preload() {
        // Load assets if necessary
    }

    create() {
        // Add the title text
        this.my = { text: {} };
        this.my.text.title = this.add.bitmapText(this.cameras.main.centerX, this.cameras.main.centerY - 100, "tinyText", "arena clash", 32)
            .setOrigin(0.5)
            .setDepth(3)
            .setScrollFactor(0);

        // Add the start button text
        this.my.text.start = this.add.bitmapText(this.cameras.main.centerX, this.cameras.main.centerY, "tinyText", "start game", 24)
            .setOrigin(0.5)
            .setDepth(3)
            .setScrollFactor(0);

        // Make the start button interactive
        this.my.text.start.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.startGame());

        // Optional: Add hover effects
        this.my.text.start.on('pointerover', () => {
            this.my.text.start.setTint(0xff0000);
        });
        this.my.text.start.on('pointerout', () => {
            this.my.text.start.clearTint();
        });
    }

    startGame() {
        this.scene.start('platformerScene');
    }
}
