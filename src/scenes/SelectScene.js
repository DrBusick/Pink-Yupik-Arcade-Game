export default class SelectScene extends Phaser.Scene {
    constructor() {
        super('SelectScene');
    }

    preload() {
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');

        this.load.image('player1_idle','assets/player1/idle.png');
        this.load.image('player2_idle','assets/player2/idle.png');
        this.load.image('question','assets/ui/question.png');

        this.load.audio('menu_hover','assets/sounds/hover.mp3');
        this.load.audio('menu_click','assets/sounds/collect.mp3');
    }

    create() {
        const { width, height } = this.scale;

        // background
        this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        // персонажі
        this.characters = [
            { key: 'player1_idle', unlocked: true },
            { key: 'player2_idle', unlocked: true },
            { key: 'question', unlocked: false },
            { key: 'question', unlocked: false },
            { key: 'question', unlocked: false }
        ];

        // wheel параметри
        this.radius = 250;
        this.centerX = width / 2;
        this.centerY = height / 2 + 50;

        this.rotationAngle = 0;
        this.stepAngle = (Math.PI * 2) / this.characters.length;

        // drag + інерція
        this.dragging = false;
        this.velocity = 0;
        this.prevPointerX = 0;
        this.pointerDownX = 0;
        this.wasDragging = false;

        this.friction = 0.95;
        this.minVelocity = 0.001;

        // hover
        this.hoveredIndex = -1;

        // створення спрайтів
        this.charSprites = [];

        for (let i = 0; i < this.characters.length; i++) {
            const sprite = this.add.image(this.centerX, this.centerY, this.characters[i].key);
            this.charSprites.push(sprite);
        }

        // INPUT

        this.input.on('pointerdown', (pointer) => {
            this.dragging = true;
            this.prevPointerX = pointer.x;

            this.pointerDownX = pointer.x;
            this.wasDragging = false;

            this.velocity = 0;
        });

        this.input.on('pointermove', (pointer) => {
            // hover визначення
            let closestIndex = -1;
            let minDist = 99999;

            this.charSprites.forEach((sprite, i) => {
                const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, sprite.x, sprite.y);
                if (dist < minDist) {
                    minDist = dist;
                    closestIndex = i;
                }
            });

            if (closestIndex !== this.hoveredIndex) {
                this.hoveredIndex = closestIndex;

                if (closestIndex !== -1) {
                    this.sound.play('menu_hover', { volume: 0.3 });
                }
            }

            if (!this.dragging) return;

            const dx = pointer.x - this.prevPointerX;
            this.prevPointerX = pointer.x;

            if (Math.abs(pointer.x - this.pointerDownX) > 10) {
                this.wasDragging = true;
            }

            const speed = 0.005;

            this.rotationAngle += dx * speed;
            this.velocity = dx * speed;

            this.velocity = Phaser.Math.Clamp(this.velocity, -0.1, 0.1);

            this.updateWheel(true);
        });

        this.input.on('pointerup', (pointer) => {
            this.dragging = false;

            if (!this.wasDragging) {
                this.handleClick(pointer);
            }
        });

        this.updateWheel(true);
    }

    update() {
        if (!this.dragging) {
            if (Math.abs(this.velocity) > this.minVelocity) {

                this.rotationAngle += this.velocity;
                this.velocity *= this.friction;

                this.updateWheel(true);

            } else if (this.velocity !== 0) {
                this.velocity = 0;
                this.snapToNearest();
            }
        }
    }

    updateWheel(instant = false) {
        let closestIndex = 0;
        let minDiff = Infinity;

        // центр
        this.charSprites.forEach((sprite, i) => {
            const angle = this.rotationAngle + i * this.stepAngle;
            const diff = Math.abs(Math.cos(angle) - 1);

            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        });

        this.charSprites.forEach((sprite, i) => {
            const angle = this.rotationAngle + i * this.stepAngle;

            const x = this.centerX + Math.sin(angle) * this.radius;
            const y = this.centerY + Math.cos(angle) * this.radius * 0.5;

            const depthFactor = (Math.cos(angle) + 1) / 2;

            let scale = 0.5 + depthFactor * 0.8;
            let alpha = 0.4 + depthFactor * 0.6;

            // hover ефект
            if (i === this.hoveredIndex) {
                scale *= 1.1;
            }

            const depth = Math.floor(depthFactor * 100);

            if (instant) {
                sprite.x = x;
                sprite.y = y;
                sprite.setScale(scale);
                sprite.setAlpha(alpha);
            } else {
                this.tweens.add({
                    targets: sprite,
                    x,
                    y,
                    scale,
                    alpha,
                    duration: 400,
                    ease: 'Cubic.easeOut'
                });
            }

            sprite.setDepth(depth);

            // glow locked
            if (!this.characters[i].unlocked) {
                sprite.setTint(0xffffaa);
                sprite.setBlendMode(Phaser.BlendModes.ADD);

                if (!sprite.glowTween) {
                    sprite.glowTween = this.tweens.add({
                        targets: sprite,
                        alpha: { from: 0.6, to: 1 },
                        duration: 800,
                        yoyo: true,
                        repeat: -1
                    });
                }
            } else {
                sprite.clearTint();
                sprite.setBlendMode(Phaser.BlendModes.NORMAL);
            }

            // tilt
            sprite.setRotation(Math.sin(angle) * 0.25);
        });
    }

    handleClick(pointer) {
        let closestIndex = 0;
        let minDist = Infinity;

        this.charSprites.forEach((sprite, i) => {
            const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, sprite.x, sprite.y);
            if (dist < minDist) {
                minDist = dist;
                closestIndex = i;
            }
        });

        const sprite = this.charSprites[closestIndex];
        const char = this.characters[closestIndex];

        if (!char.unlocked) return;

        this.sound.play('menu_click');

        // press ефект
        this.tweens.add({
            targets: sprite,
            scale: sprite.scale * 1.2,
            duration: 100,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.scene.start('GameScene', { player: char.key });
            }
        });

        // flash
        sprite.setTint(0xffffcc);
        this.time.delayedCall(150, () => {
            sprite.clearTint();
        });
    }

    snapToNearest() {
        const step = this.stepAngle;
        const target = Math.round(this.rotationAngle / step) * step;

        this.tweens.add({
            targets: this,
            rotationAngle: target,
            duration: 400,
            ease: 'Back.easeOut',
            onUpdate: () => this.updateWheel(true)
        });
    }
}
