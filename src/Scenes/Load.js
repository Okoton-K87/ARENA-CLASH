class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");

        // Load tilemap information
        this.load.image("tilemap_tiles", "tilemap_packed.png"); // Packed tilemap
        this.load.tilemapTiledJSON("platformer-level-1", "platformer-level-1.tmj"); // Tilemap in JSON

        // Load the tilemap as a spritesheet
        this.load.spritesheet("tilemap_sheet", "tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });

        // Load particles
        this.load.multiatlas("kenny-particles", "kenny-particles.json");

        // Load gun asset
        this.load.image("gun", "SMG-4.png");

        // Load audio assets
        this.load.audio("jump", "jump.wav");
        this.load.audio("shoot", "P90.mp3");
        this.load.audio("impact", "impactGlass_light_000.ogg");
        this.load.audio("reload", "P90_reload.mp3");

        // Load bitmap fonts
        this.load.bitmapFont("platformerNums", "platformerNums.png", "platformerNums.xml");
        this.load.bitmapFont("tinyText", "tinyski_bitmap.png", "tinyski_bitmap.xml");
    }

    create() {
        // Animations for the player
        this.anims.create({
            key: 'player_walk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 0,
                end: 1,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'player_idle',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0000.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'player_jump',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0001.png" }
            ],
        });

        // Animations for the targets
        this.anims.create({
            key: 'target_walk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 2,
                end: 3,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'target_idle',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0002.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'target_jump',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0003.png" }
            ],
        });

        // ...and pass to the next Scene
        this.scene.start("platformerScene");
    }

    update() {}
}
