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

        this.friction = 0.95;
        this.minVelocity = 0.001;

        // створення спрайтів
        this.charSprites = [];

        for (let i = 0; i < this.characters.length; i++) {
            const sprite = this.add.image(this.centerX, this.centerY, this.characters[i].key);
            this.charSprites.push(sprite);
        }

        // drag input
        this.input.on('pointerdown', (pointer) => {
            this.dragging = true;
            this.prevPointerX = pointer.x;
            this.velocity = 0;
        });

        this.input.on('pointermove', (pointer) => {
            if (!this.dragging) return;

            const dx = pointer.x - this.prevPointerX;
            this.prevPointerX = pointer.x;

            const speed = 0.005;

            this.rotationAngle += dx * speed;
            this.velocity = dx * speed;

            // обмеження швидкості
            this.velocity = Phaser.Math.Clamp(this.velocity, -0.1, 0.1);

            this.updateWheel(true);
        });

        this.input.on('pointerup', () => {
            this.dragging = false;
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

        // знаходимо центрального
        this.charSprites.forEach((sprite, i) => {
            const angle = this.rotationAngle + i * this.stepAngle;
            const diff = Math.abs(Math.cos(angle) - 1);

            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        });

        // позиціонування
        this.charSprites.forEach((sprite, i) => {
            const angle = this.rotationAngle + i * this.stepAngle;

            const x = this.centerX + Math.sin(angle) * this.radius;
            const y = this.centerY + Math.cos(angle) * this.radius * 0.5;

            const depthFactor = (Math.cos(angle) + 1) / 2;

            const scale = 0.5 + depthFactor * 0.8;
            const alpha = 0.4 + depthFactor * 0.6;
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

            // активний персонаж
            if (i === closestIndex) {
                sprite.setInteractive();

                sprite.removeAllListeners();
                sprite.on('pointerdown', () => {
                    const char = this.characters[i];

                    if (char.unlocked) {
                        this.sound.play('menu_click');
                        this.scene.start('GameScene', { player: char.key });
                    }
                });
            } else {
                sprite.disableInteractive();
            }

            // glow для locked
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

            // легкий 3D tilt
            sprite.setRotation(Math.sin(angle) * 0.25);
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
