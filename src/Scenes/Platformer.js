class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.ATTACK_SPEED = 50; // Attack speed in milliseconds
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        // Add a tileset to the map
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // set up targets array
        this.targets = [];

        // create target sprites
        const target1 = this.physics.add.sprite(400, 345, "platformer_characters", "tile_0003.png");
        target1.setCollideWorldBounds(true);
        target1.health = 100; // Set target health
        this.targets.push(target1);

        const target2 = this.physics.add.sprite(450, 345, "platformer_characters", "tile_0003.png");
        target2.setCollideWorldBounds(true);
        target2.health = 100;
        this.targets.push(target2);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.targets.forEach(target => {
            this.physics.add.collider(target, this.groundLayer);
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();
        this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.pKey = this.input.keyboard.addKey('P');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true;
            this.physics.world.debugGraphic.clear();
        }, this);

        // movement vfx
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            scale: {start: 0.03, end: 0.1},
            lifespan: 350,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();

        // set up camera
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        // set game world bounds
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // Create the gun sprite and scale it down
        this.gun = this.add.sprite(0, 0, 'gun').setOrigin(0.5, 0.5).setScale(0.4);

        // Input handling for shooting
        this.input.on('pointerdown', this.startShooting, this);
        this.input.on('pointerup', this.stopShooting, this);

        this.isShooting = false;

        // Load audio
        this.jumpSound = this.sound.add('jump');
        this.shootSound = this.sound.add('shoot', { loop: true });
        this.impactSound = this.sound.add('impact');
    }

    update() {
        if (this.aKey.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }

        } else if (this.dKey.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }

        } else {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            my.vfx.walking.stop();
        }

        // player jump
        if (!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.jumpSound.play();
        }

        if (Phaser.Input.Keyboard.JustDown(this.pKey)) {
            this.scene.restart();
        }

        // Update gun position and rotation
        this.updateGunPosition();

        // Handle shooting
        if (this.isShooting) {
            this.shoot();
        }
    }

    updateGunPosition() {
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(my.sprite.player.x, my.sprite.player.y, pointer.worldX, pointer.worldY);
        this.gun.setPosition(my.sprite.player.x, my.sprite.player.y + 8);
        this.gun.setRotation(angle);

        if (pointer.worldX < my.sprite.player.x) {
            this.gun.setFlipY(true);
        } else {
            this.gun.setFlipY(false);
        }
    }

    startShooting() {
        this.isShooting = true;
        this.lastShotTime = 0;
        this.shootSound.play();
    }

    stopShooting() {
        this.isShooting = false;
        this.shootSound.stop();
    }

    shoot() {
        const now = this.time.now;

        if (now - this.lastShotTime < this.ATTACK_SPEED) {
            return;
        }

        this.lastShotTime = now;

        const graphics = this.add.graphics({ lineStyle: { width: 2, color: 0xffff00 } });

        // Starting point of the bullet
        const startX = my.sprite.player.x;
        const startY = my.sprite.player.y + 8;

        // Calculate the bullet direction
        const angle = Phaser.Math.Angle.Between(startX, startY, this.input.activePointer.worldX, this.input.activePointer.worldY);
        const velocity = new Phaser.Math.Vector2();
        this.physics.velocityFromRotation(angle, 1000, velocity);

        // Calculate the endpoint of the bullet trace
        let endX = startX + velocity.x;
        let endY = startY + velocity.y;

        // Check if the bullet hits any target
        let hitTarget = false;
        this.targets.forEach(target => {
            if (!hitTarget && target.active) {
                const targetBounds = target.getBounds();
                const line = new Phaser.Geom.Line(startX, startY, endX, endY);
                if (Phaser.Geom.Intersects.LineToRectangle(line, targetBounds)) {
                    // Calculate the intersection point
                    const intersection = this.getLineIntersection(line, targetBounds);
                    if (intersection) {
                        endX = intersection.x;
                        endY = intersection.y;
                    }

                    target.health -= 10;
                    this.impactSound.play();
                    if (target.health <= 0) {
                        target.destroy();
                    }
                    hitTarget = true;
                }
            }
        });

        // Draw the bullet trace
        graphics.lineBetween(startX, startY, endX, endY);

        // Create an animation effect for the bullet travel
        this.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                graphics.destroy();
            }
        });
    }

    getLineIntersection(line, rect) {
        let closestPoint = null;
        let closestDist = Infinity;

        const checkIntersection = (x1, y1, x2, y2) => {
            const intersection = Phaser.Geom.Intersects.GetLineToLine(
                line,
                new Phaser.Geom.Line(x1, y1, x2, y2)
            );
            if (intersection) {
                const dist = Phaser.Math.Distance.Between(line.x1, line.y1, intersection.x, intersection.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestPoint = intersection;
                }
            }
        };

        checkIntersection(rect.x, rect.y, rect.right, rect.y);
        checkIntersection(rect.right, rect.y, rect.right, rect.bottom);
        checkIntersection(rect.right, rect.bottom, rect.x, rect.bottom);
        checkIntersection(rect.x, rect.bottom, rect.x, rect.y);

        return closestPoint;
    }
}
