class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    preload() {
        // Load audio files (already done in Load.js)
        // this.loaed.image('heal_plus', 'path/to/plus/image.png'); // Load the plus image
    }

    init() {
        // Variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 700;
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.5;
        this.ATTACK_SPEED = 75;
        this.MAG_SIZE = 50;
        this.PLAYER_HEALTH = 100; // Player's health set to 100
        this.playerDefeated = false; // Track if player is defeated
        this.HEAL_AMOUNT = 50; // Amount to heal
        this.HEAL_DURATION = 2000; // Duration of healing in milliseconds
        this.HEAL_COOLDOWN = 10000; // Cooldown in milliseconds
        this.healing = false;
        this.healingCooldown = false;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        // Add a tileset to the map
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");
        this.bgTileset = this.map.addTilesetImage("tilemap_backgrounds_packed", "background_tiles");

        // Create a layer
        this.bgLayer = this.map.createLayer("Background", this.bgTileset, 0, 0).setScrollFactor(0.25);
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        // Adjust the position of the bgLayer
        this.bgLayer.setPosition(400, 150);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({ collides: true });

        // Set up player avatar
        this.my = { sprite: {}, text: {}, vfx: {} };
        this.my.sprite.player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0000.png");
        this.my.sprite.player.setCollideWorldBounds(true);
        this.my.sprite.player.health = this.PLAYER_HEALTH;

        // Set up targets array
        this.targets = [];
        const target1 = this.createTarget(400, 345);
        this.targets.push(target1);

        // Enable collision handling
        this.physics.add.collider(this.my.sprite.player, this.groundLayer);
        this.targets.forEach(target => this.physics.add.collider(target, this.groundLayer));

        // Set up Phaser-provided cursor key input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R); // Reload key
        this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E); // Heal key
        this.pKey = this.input.keyboard.addKey('P');

        // Set up movement VFX
        this.my.vfx.walking = this.add.particles(0, 5, "kenny-particles", {
            frame: ['smoke_01.png'],
            scale: { start: 0.01, end: 0.03 },
            lifespan: 200,
            alpha: { start: 1, end: 0.1 },
        });
        this.my.vfx.walking.stop();

        // Set up healing VFX
        this.my.vfx.healing = this.add.particles(0, 0, "kenny-particles", {
            frame: ['spark_04.png', 'spark_03.png', 'spark_01.png', 'spark_02.png'],
            scale: { start: 0.1, end: 0.2},
            lifespan: 50,
            alpha: { start: 1, end: 0.1 },
        });
        this.my.vfx.healing.stop();

        // Set up camera
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.my.sprite.player, true, 0.25, 0.25);
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        // Set game world bounds
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // Create the gun sprite and scale it down
        this.gun = this.add.sprite(0, 0, 'gun').setOrigin(0.5, 0.5).setScale(0.4);

        // Input handling for shooting
        this.input.on('pointerdown', this.startShooting, this);
        this.input.on('pointerup', this.stopShooting, this);

        this.isShooting = false;
        this.ammo = this.MAG_SIZE;
        this.reloading = false;

        // Add bitmap text display for ammo
        this.my.text.ammo = this.add.bitmapText(this.cameras.main.centerX + (this.cameras.main.displayWidth / 2), this.cameras.main.centerY - (this.cameras.main.displayHeight / 2), "platformerNums", "Ammo: " + this.ammo, 18)
            .setOrigin(1, 0)
            .setDepth(2)
            .setScrollFactor(0);
        this.my.text.ammoText = this.add.bitmapText(this.cameras.main.centerX + (this.cameras.main.displayWidth / 2) - 30, this.cameras.main.centerY - (this.cameras.main.displayHeight / 2), "tinyText", "ammo: ", 18)
            .setOrigin(1, 0)
            .setDepth(2)
            .setScrollFactor(0);

        // Add bitmap text display for health
        this.my.text.health = this.add.bitmapText(this.cameras.main.centerX - (this.cameras.main.displayWidth / 2), this.cameras.main.centerY - (this.cameras.main.displayHeight / 2), "platformerNums", "L" + this.my.sprite.player.health, 18)
            .setDepth(2)
            .setScrollFactor(0);

        // Add bitmap text display for heal ability cooldown
        this.my.text.heal = this.add.bitmapText(this.cameras.main.centerX - (this.cameras.main.displayWidth / 2) + 240, this.cameras.main.centerY - (this.cameras.main.displayHeight / 2), "platformerNums", "ready", 18)
            .setDepth(2)
            .setScrollFactor(0);

        this.my.text.healText = this.add.bitmapText(this.cameras.main.centerX - (this.cameras.main.displayWidth / 2) + 150, this.cameras.main.centerY - (this.cameras.main.displayHeight / 2), "tinyText", " ", 18)
            .setDepth(2)
            .setScrollFactor(0);

        // Defeat message
        this.my.text.defeat = this.add.bitmapText(this.cameras.main.centerX, this.cameras.main.centerY, "tinyText", "defeat", 32)
            .setOrigin(0.5)
            .setDepth(3)
            .setScrollFactor(0)
            .setVisible(false);

        // Load audio
        this.jumpSound = this.sound.add('jump');
        this.shootSound = this.sound.add('shoot');
        this.impactSound = this.sound.add('impact');
        this.reloadSound = this.sound.add('reload');
        this.healSound = this.sound.add('heal'); // Placeholder for heal sound
    }

    createTarget(x, y) {
        const target = this.physics.add.sprite(x, y, "platformer_characters", "tile_0002.png");
        target.setCollideWorldBounds(true);
        target.health = 100;
        target.healthBar = this.add.graphics({ x: target.x - 9, y: target.y - 20 });
        target.direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
        target.speed = 50;
        target.anims.play('target_idle');

        // Gun and shooting variables for target
        target.gun = this.add.sprite(target.x, target.y, 'gun').setOrigin(0.5, 0.5).setScale(0.4);
        target.isShooting = false;
        target.ammo = 30; // Different from player
        target.reloading = false;
        target.lastShotTime = 0;
        target.ATTACK_SPEED = 75; // Set target attack speed to 75
        target.MAG_SIZE = 50; // Different from player

        return target;
    }

    update() {
        if (this.playerDefeated) {
            this.targets.forEach(target => {
                target.setVelocityX(0); // Stop target movement
                this.updateTargetHealthBar(target);
                this.updateTargetGunPosition(target);
            });
            return; // Skip rest of the update if player is defeated
        }

        // Handle player movement and animations
        if (this.aKey.isDown) {
            this.my.sprite.player.setAccelerationX(-this.ACCELERATION);
            this.my.sprite.player.resetFlip();
            this.my.sprite.player.anims.play('player_walk', true);
            this.my.vfx.walking.startFollow(this.my.sprite.player, this.my.sprite.player.displayWidth / 2 - 10, this.my.sprite.player.displayHeight / 2 - 5, false);
            this.my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            if (this.my.sprite.player.body.blocked.down) {
                this.my.vfx.walking.start();
            }

        } else if (this.dKey.isDown) {
            this.my.sprite.player.setAccelerationX(this.ACCELERATION);
            this.my.sprite.player.setFlip(true, false);
            this.my.sprite.player.anims.play('player_walk', true);
            this.my.vfx.walking.startFollow(this.my.sprite.player, this.my.sprite.player.displayWidth / 2 - 10, this.my.sprite.player.displayHeight / 2 - 5, false);
            this.my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            if (this.my.sprite.player.body.blocked.down) {
                this.my.vfx.walking.start();
            }

        } else {
            this.my.sprite.player.setAccelerationX(0);
            this.my.sprite.player.setDragX(this.DRAG);
            this.my.sprite.player.anims.play('player_idle');
            this.my.vfx.walking.stop();
        }

        // Player jump
        if (!this.my.sprite.player.body.blocked.down) {
            this.my.sprite.player.anims.play('player_jump');
        }
        if (this.my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.jumpSound.play();
        }

        if (Phaser.Input.Keyboard.JustDown(this.pKey)) {
            this.scene.restart();
        }

        // Handle healing ability
        if (Phaser.Input.Keyboard.JustDown(this.eKey) && !this.healing && !this.healingCooldown) {
            this.startHealing();
        }

        // Reload when 'R' key is pressed or auto-reload when out of ammo
        if (Phaser.Input.Keyboard.JustDown(this.rKey) || (this.ammo <= 0 && !this.reloading)) {
            this.reload();
        }

        // Update gun position and rotation
        this.updateGunPosition();

        // Handle shooting
        if (this.isShooting) {
            this.shoot();
        }

        // Update ammo and health text display
        this.my.text.ammo.setText('Ammo ' + this.ammo);
        this.my.text.health.setText('L' + this.my.sprite.player.health);

        // Update heal ability cooldown text display
        if (this.healingCooldown) {
            const remaining = Math.max(0, this.HEAL_COOLDOWN - (this.time.now - this.healingStartTime));
            this.my.text.healText.setText('heal: ');
            this.my.text.heal.setText(Math.ceil(remaining / 1000));
        } else {
            this.my.text.healText.setText('heal: ');
            this.my.text.heal.setText("L");
        }

        // Update target health bars and AI
        this.targets.forEach(target => {
            if (target.active) {
                this.updateTargetHealthBar(target);
                this.updateTargetAI(target);
            }
        });

        // Check for player defeat
        if (this.my.sprite.player.health <= 0) {
            this.my.sprite.player.health = 0; // Ensure health is set to 0
            this.updateHealthText(); // Update the health text immediately
            this.gameOver();
        }
    }

    updateGunPosition() {
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.my.sprite.player.x, this.my.sprite.player.y, pointer.worldX, pointer.worldY);
        this.gun.setPosition(this.my.sprite.player.x, this.my.sprite.player.y + 8);
        this.gun.setRotation(angle);

        if (pointer.worldX < this.my.sprite.player.x) {
            this.gun.setFlipY(true);
        } else {
            this.gun.setFlipY(false);
        }
    }

    startShooting() {
        if (this.ammo > 0 && !this.reloading && !this.playerDefeated) {
            this.isShooting = true;
            this.lastShotTime = 0;
            this.shootSound.play();
        }
    }

    stopShooting() {
        this.isShooting = false;
        this.shootSound.stop();
    }

    shoot() {
        const now = this.time.now;

        if (now - this.lastShotTime < this.ATTACK_SPEED || this.ammo <= 0) {
            return;
        }

        this.lastShotTime = now;

        const graphics = this.add.graphics({ lineStyle: { width: 0.7, color: 0xffff00 } });

        // Starting point of the bullet
        const startX = this.my.sprite.player.x;
        const startY = this.my.sprite.player.y + 8;

        // Calculate the bullet direction
        const angle = Phaser.Math.Angle.Between(startX, startY, this.input.activePointer.worldX, this.input.activePointer.worldY);
        const velocity = new Phaser.Math.Vector2();
        this.physics.velocityFromRotation(angle, 1000, velocity);

        // Calculate the endpoint of the bullet trace
        let endX = startX + velocity.x;
        let endY = startY + velocity.y;

        // Variable to store the closest intersection point
        let closestIntersection = null;
        let closestDist = Infinity;
        let closestTarget = null;

        // Check if the bullet hits any target
        this.targets.forEach(target => {
            if (target.active) {
                const targetBounds = target.getBounds();
                const line = new Phaser.Geom.Line(startX, startY, endX, endY);
                if (Phaser.Geom.Intersects.LineToRectangle(line, targetBounds)) {
                    // Calculate the intersection point
                    const intersection = this.getLineIntersection(line, targetBounds);
                    if (intersection) {
                        const dist = Phaser.Math.Distance.Between(startX, startY, intersection.x, intersection.y);
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestIntersection = intersection;
                            closestTarget = target;
                        }
                    }
                }
            }
        });

        // Check if the bullet hits any map tiles
        const tileHits = this.mapLayerIntersects(startX, startY, endX, endY);
        if (tileHits) {
            const dist = Phaser.Math.Distance.Between(startX, startY, tileHits.x, tileHits.y);
            if (dist < closestDist) {
                closestDist = dist;
                closestIntersection = tileHits;
                closestTarget = null; // Hit a tile, not a target
            }
        }

        if (closestIntersection) {
            endX = closestIntersection.x;
            endY = closestIntersection.y;

            if (closestTarget) {
                closestTarget.health -= 10;
                this.impactSound.play();
                if (closestTarget.health <= 0) {
                    closestTarget.destroy();
                    closestTarget.healthBar.destroy();
                    closestTarget.gun.destroy(); // Destroy the gun when the target dies
                }
            }
        }

        // Draw the bullet trace
        graphics.lineBetween(startX, startY, endX, endY);

        // Create an animation effect for the bullet travel
        this.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 10, // Increase the duration for better visibility
            onComplete: () => {
                graphics.destroy();
            }
        });

        this.ammo--; // Decrease ammo count

        // Auto-reload if out of ammo
        if (this.ammo <= 0) {
            this.reload();
        }
    }

    reload() {
        if (this.reloading || this.playerDefeated) return;
        this.shootSound.stop();

        this.reloading = true;
        this.reloadSound.play();
        this.my.text.ammoText.setText("reload ");
        setTimeout(() => {
            this.my.text.ammoText.setText("ammo: ");
        }, 3000);
        this.time.delayedCall(3000, () => {
            this.ammo = this.MAG_SIZE;
            this.reloading = false;
            if (this.isShooting) {
                this.shootSound.play(); // Resume shooting sound if still shooting
            }
        }, [], this);
    }

    startHealing() {
        this.healing = true;
        this.healingCooldown = true;
        this.healingStartTime = this.time.now;
        this.healSound.play(); // Play heal sound
        this.my.vfx.healing.start();
        this.my.vfx.healing.startFollow(this.my.sprite.player);

        this.time.addEvent({
            delay: this.HEAL_DURATION / 10, // Spread healing over time
            repeat: 9, // Repeat 9 more times for a total of 10 ticks
            callback: () => {
                if (this.my.sprite.player.health < this.PLAYER_HEALTH && this.playerDefeated != true) {
                    this.my.sprite.player.health += this.HEAL_AMOUNT / 10;
                    if (this.my.sprite.player.health > this.PLAYER_HEALTH) {
                        this.my.sprite.player.health = this.PLAYER_HEALTH;
                    }
                    this.updateHealthText(); // Update health text after healing
                } else {
                    this.my.vfx.healing.stop();
                }
            },
            callbackScope: this
        });

        this.time.delayedCall(this.HEAL_DURATION, () => {
            this.healing = false;
            this.my.vfx.healing.stop();
        }, [], this);

        this.time.delayedCall(this.HEAL_COOLDOWN, () => {
            this.healingCooldown = false;
        }, [], this);
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

    mapLayerIntersects(startX, startY, endX, endY) {
        const line = new Phaser.Geom.Line(startX, startY, endX, endY);
        let closestPoint = null;
        let closestDist = Infinity;

        this.groundLayer.forEachTile(tile => {
            if (tile.collides) {
                const tileBounds = new Phaser.Geom.Rectangle(
                    tile.pixelX,
                    tile.pixelY,
                    tile.width,
                    tile.height
                );
                if (Phaser.Geom.Intersects.LineToRectangle(line, tileBounds)) {
                    const intersection = this.getLineIntersection(line, tileBounds);
                    if (intersection) {
                        const dist = Phaser.Math.Distance.Between(startX, startY, intersection.x, intersection.y);
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestPoint = intersection;
                        }
                    }
                }
            }
        });

        return closestPoint;
    }

    updateTargetHealthBar(target) {
        const barWidth = 18;
        const barHeight = 2;
        const healthPercentage = target.health / 100;
        target.healthBar.clear();
        target.healthBar.fillStyle(0xff0000, 1); // Red background for missing health
        target.healthBar.fillRect(0, 0, barWidth, barHeight);
        target.healthBar.fillStyle(0x00ff00, 1); // Green foreground for remaining health
        target.healthBar.fillRect(0, 0, barWidth * healthPercentage, barHeight);
        target.healthBar.x = target.x - 9;
        target.healthBar.y = target.y - 20;
    }

    updateTargetAI(target) {
        // Basic AI to move the targets left and right
        if (target.body.blocked.left || target.body.blocked.right) {
            target.direction *= -1; // Change direction when hitting a wall
            target.flipX = target.direction === 1; // Flip the sprite based on direction
        }
        target.setVelocityX(target.direction * target.speed);

        // Update target animation based on movement
        if (target.body.velocity.x !== 0) {
            target.anims.play('target_walk', true);
        } else {
            target.anims.play('target_idle', true);
        }

        // Target shooting
        if (this.canSeePlayer(target) && !target.reloading) {
            this.targetStartShooting(target);
        }

        if (target.isShooting) {
            this.targetShoot(target);
        }

        // Reload if out of ammo
        if (target.ammo <= 0 && !target.reloading) {
            this.targetReload(target);
        }

        // Update target gun position
        this.updateTargetGunPosition(target);
    }

    canSeePlayer(target) {
        const lineOfSight = new Phaser.Geom.Line(target.x, target.y, this.my.sprite.player.x, this.my.sprite.player.y);
        const tiles = this.groundLayer.getTilesWithinShape(lineOfSight);

        for (let tile of tiles) {
            if (tile.collides) {
                return false;
            }
        }

        return true;
    }

    updateTargetGunPosition(target) {
        const angle = Phaser.Math.Angle.Between(target.x, target.y, this.my.sprite.player.x);
        target.gun.setPosition(target.x, target.y + 8);
        target.gun.setRotation(angle);

        if (this.my.sprite.player.x < target.x) {
            target.gun.setFlipY(true);
        } else {
            target.gun.setFlipY(false);
        }
    }

    targetStartShooting(target) {
        if (target.ammo > 0 && !target.reloading) {
            target.isShooting = true;
        }
    }

    targetStopShooting(target) {
        target.isShooting = false;
    }

    targetShoot(target) {
        const now = this.time.now;

        if (now - target.lastShotTime < target.ATTACK_SPEED || target.ammo <= 0) {
            return;
        }

        target.lastShotTime = now;

        const graphics = this.add.graphics({ lineStyle: { width: 0.7, color: 0x00ffff } });

        // Starting point of the bullet
        const startX = target.x;
        const startY = target.y + 8;

        // Calculate the bullet direction
        const angle = Phaser.Math.Angle.Between(startX, startY, this.my.sprite.player.x, this.my.sprite.player.y);
        const velocity = new Phaser.Math.Vector2();
        this.physics.velocityFromRotation(angle, 1000, velocity);

        // Calculate the endpoint of the bullet trace
        let endX = startX + velocity.x;
        let endY = startY + velocity.y;

        // Variable to store the closest intersection point
        let closestIntersection = null;
        let closestDist = Infinity;
        let hitPlayer = false;

        // Check if the bullet hits the player
        const playerBounds = this.my.sprite.player.getBounds();
        const line = new Phaser.Geom.Line(startX, startY, endX, endY);
        if (Phaser.Geom.Intersects.LineToRectangle(line, playerBounds)) {
            const intersection = this.getLineIntersection(line, playerBounds);
            if (intersection) {
                endX = intersection.x;
                endY = intersection.y;
                hitPlayer = true;
            }
        }

        // Check if the bullet hits any map tiles
        const tileHits = this.mapLayerIntersects(startX, startY, endX, endY);
        if (tileHits) {
            const dist = Phaser.Math.Distance.Between(startX, startY, tileHits.x, tileHits.y);
            if (dist < closestDist) {
                closestDist = dist;
                closestIntersection = tileHits;
            }
        }

        if (closestIntersection) {
            endX = closestIntersection.x;
            endY = closestIntersection.y;
            hitPlayer = false; // If it hits a wall, it doesn't hit the player
        }

        // Draw the bullet trace
        graphics.lineBetween(startX, startY, endX, endY);

        // Create an animation effect for the bullet travel
        this.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 10, // Increase the duration for better visibility
            onComplete: () => {
                graphics.destroy();
            }
        });

        if (hitPlayer) {
            this.my.sprite.player.health -= 5;
            this.updateHealthText(); // Update health text after taking damage
        }

        target.ammo--; // Decrease ammo count

        // Stop shooting if out of ammo
        if (target.ammo <= 0) {
            this.targetStopShooting(target);
        }
    }

    targetReload(target) {
        target.reloading = true;
        setTimeout(() => {
            target.ammo = target.MAG_SIZE;
            target.reloading = false;
        }, 3000); // Adjust the reload time if necessary
    }

    updateHealthText() {
        this.my.text.health.setText('L' + this.my.sprite.player.health);
    }

    gameOver() {
        this.playerDefeated = true;
        this.my.text.defeat.setVisible(true);

        // Stop all player actions
        this.isShooting = false;
        this.shootSound.stop();

        // Update the health display to show 0
        this.updateHealthText();

        // Remove player and gun sprites
        this.my.sprite.player.setVisible(false);
        this.my.sprite.player.disableBody(true, true);
        this.gun.setVisible(false);

        // Stop targets from shooting and moving
        this.targets.forEach(target => {
            target.isShooting = false;
            target.setVelocityX(0);
        });
    }
}
