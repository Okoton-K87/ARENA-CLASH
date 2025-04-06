class MainMenu extends Phaser.Scene {
    constructor() {
        super("MainMenu");
    }

    preload() {
        // Load assets if necessary
    }

    create() {
        // Define the colors to cycle through
        this.colors = ['#2ac5b5', '#96cbc3', '#a7eae3', '#c5e8ee', '#b9eacd', '#dbd5b5', '#d5bd7c', '#ecceb2', '#eeaea4', '#f56972'];
        this.currentColorIndex = 0;
        this.nextColorIndex = 1;
        this.transitionProgress = 0;

        // Set the initial background color
        this.cameras.main.setBackgroundColor(this.colors[this.currentColorIndex]);

        // Gradually transition between colors
        this.time.addEvent({
            delay: 16, // Run every frame (~60 FPS)
            callback: () => {
                this.transitionProgress += 0.01; // Increase progress (adjust speed as needed)

                if (this.transitionProgress >= 1) {
                    // Move to the next color
                    this.transitionProgress = 0;
                    this.currentColorIndex = this.nextColorIndex;
                    this.nextColorIndex = (this.nextColorIndex + 1) % this.colors.length;
                }

                // Get the current and next colors
                const currentColor = Phaser.Display.Color.HexStringToColor(this.colors[this.currentColorIndex]);
                const nextColor = Phaser.Display.Color.HexStringToColor(this.colors[this.nextColorIndex]);

                // Interpolate between the two colors
                const interpolatedColor = Phaser.Display.Color.Interpolate.ColorWithColor(
                    currentColor,
                    nextColor,
                    100,
                    this.transitionProgress * 100
                );

                // Convert the interpolated color back to a hex string
                const hexColor = Phaser.Display.Color.RGBToString(
                    interpolatedColor.r,
                    interpolatedColor.g,
                    interpolatedColor.b,
                    0,
                    '#'
                );

                // Set the background color
                this.cameras.main.setBackgroundColor(hexColor);
            },
            loop: true
        });

        // Add the title text
        this.my = { text: {} };
        this.my.text.title = this.add.bitmapText(this.cameras.main.centerX, this.cameras.main.centerY - 100, "tinyText", "arena clash", 64)
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
