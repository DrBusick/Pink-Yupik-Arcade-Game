/* =========================================================
   TELEGRAM
========================================================= */
const tg = window.Telegram?.WebApp || null;

/* =========================================================
   MENU SCENE
========================================================= */
class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        this.load.image('bg_far', 'assets/backgrounds/bg_far.png');
        this.load.image('bg_mid', 'assets/backgrounds/bg_mid.png');
        this.load.image('bg_near', 'assets/backgrounds/bg_near.png');
        this.load.audio('hover', 'assets/sounds/hover.mp3');
    }

    create() {
        const { width, height } = this.scale;

        /* === unlock audio (Telegram / mobile) === */
        this.input.once('pointerdown', () => {
            this.sound.unlock();
        });

        /* === backgrounds === */
        this.bgFar  = this.add.tileSprite(0, 0, width, height, 'bg_far').setOrigin(0);
        this.bgMid  = this.add.tileSprite(0, 0, width, height, 'bg_mid').setOrigin(0);
        this.bgNear = this.add.tileSprite(0, 0, width, height, 'bg_near').setOrigin(0);

        this.hoverSound = this.sound.add('hover', { volume: 0.6 });

        /* === title === */
        const title = this.add.text(width / 2, height / 4, 'Pink Yupik Arcade', {
            fontFamily: 'UnifrakturCook',
            fontSize: '96px',
            fill: '#e8d9b0'
        }).setOrigin(0.5);

        title.setShadow(0, 0, '#fff2c1', 20, true, true);

        this.tweens.add({
            targets: title,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onUpdate: tween => {
                const blur = Phaser.Math.Linear(18, 48, tween.progress);
                title.setShadow(0, 0, '#fff2c1', blur, true, true);
            }
        });

        /* === buttons === */
        const btnStyle = {
            fontFamily: 'UnifrakturCook',
            fontSize: '56px',
            fill: '#e8d9b0'
        };

        const glowOn  = (t, c='#fff2c1') => t.setShadow(0,0,c,18,true,true);
        const glowOff = (t) => t.setShadow(0,0,'#000',0);

        const play = this.add.text(width/2, height/2 - 40, 'PLAY', btnStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor:true });

        play.on('pointerover', () => {
            this.hoverSound.play();
            play.setScale(1.15);
            glowOn(play);
        });
        play.on('pointerout', () => {
            play.setScale(1);
            glowOff(play);
        });
        play.on('pointerdown', () => {
            this.hoverSound.play();
            this.scene.start('GameScene');
        });

        const exit = this.add.text(width/2, height/2 + 120, 'EXIT', btnStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor:true });

        exit.on('pointerover', () => {
            this.hoverSound.play();
            exit.setScale(1.15);
            exit.setTint(0xff6b6b);
            glowOn(exit, '#ff6b6b');
        });
        exit.on('pointerout', () => {
            exit.setScale(1);
            exit.clearTint();
            glowOff(exit);
        });
        exit.on('pointerdown', () => {
            this.hoverSound.play();
            if (tg) tg.close();
        });
    }

    update() {
        this.bgFar.tilePositionX  += 0.2;
        this.bgMid.tilePositionX  += 0.5;
        this.bgNear.tilePositionX += 1;
    }
}

/* =========================================================
   PLAYER
========================================================= */
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'idle');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBodySize(90, 120).setOffset(26, 18);

        this.speed = 260;
        this.accel = 1200;
        this.jumpVelocity = 520;

        this.body.setMaxVelocity(this.speed, 1000);
        this.body.setDragX(1000);

        this.facing = 'right';
        this.jumpCount = 0;
        this.maxJumps = 3;

        this.keys = scene.input.keyboard.addKeys({
            left: 'A', right: 'D', up: 'W',
            left2: 'LEFT', right2: 'RIGHT', up2: 'UP'
        });

        this.touchLeft = false;
        this.touchRight = false;
        this.touchJump = false;

        this.walkSound = scene.sound.add('walk', { loop:true, volume:0.5 });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        const moveLeft  = this.keys.left.isDown  || this.keys.left2.isDown  || this.touchLeft;
        const moveRight = this.keys.right.isDown || this.keys.right2.isDown || this.touchRight;

        if (moveLeft) {
            this.setAccelerationX(-this.accel);
            this.facing = 'left';
        } else if (moveRight) {
            this.setAccelerationX(this.accel);
            this.facing = 'right';
        } else {
            this.setAccelerationX(0);
        }

        const jumpPressed =
            Phaser.Input.Keyboard.JustDown(this.keys.up) ||
            Phaser.Input.Keyboard.JustDown(this.keys.up2) ||
            this.touchJump;

        if (jumpPressed && this.jumpCount < this.maxJumps) {
            this.setVelocityY(-this.jumpVelocity);
            this.jumpCount++;
            this.scene.jumpSound.play();
            this.touchJump = false;
        }

        if (this.body.blocked.down) {
            this.jumpCount = 0;
        }

        this.setFlipX(this.facing === 'left');
        this.anims.play(moveLeft || moveRight ? 'walk' : 'idle', true);
    }
}

/* =========================================================
   GAME SCENE
========================================================= */
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.worldWidth = 6000;
        this.worldHeight = 832;
        this.heartsCollected = 0;
    }

    preload() {
        this.load.image('bg','assets/backgrounds/bg.png');
        this.load.image('ground','assets/platforms/ground.png');
        for (let i=1;i<=4;i++)
            this.load.image(`pf${i}`,`assets/platforms/platform_${i}.png`);

        this.load.spritesheet('walk','assets/player/walk.png',{frameWidth:142,frameHeight:142});
        this.load.image('idle','assets/player/idle.png');
        this.load.image('heart','assets/items/heart_v4.png');

        this.load.audio('jump','assets/sounds/jump.mp3');
        this.load.audio('walk','assets/sounds/walk.mp3');
        this.load.audio('collect','assets/sounds/collect.mp3');
    }

    create() {
        const { width, height } = this.scale;

        this.anims.create({ key:'idle', frames:[{key:'idle'}], repeat:-1 });
        this.anims.create({ key:'walk', frames:this.anims.generateFrameNumbers('walk'), frameRate:10, repeat:-1 });

        this.jumpSound = this.sound.add('jump');
        this.collectSound = this.sound.add('collect');

        this.physics.world.setBounds(0,0,this.worldWidth,this.worldHeight);

        this.bg = this.add.tileSprite(0,0,width,height,'bg')
            .setOrigin(0).setScrollFactor(0);

        this.player = new Player(this,200,300);
        this.cameras.main.startFollow(this.player,true,0.12,0.12);
        this.cameras.main.setBounds(0,0,this.worldWidth,this.worldHeight);
    }

    update() {
        this.bg.tilePositionX = this.cameras.main.scrollX;
    }
}

/* =========================================================
   PHASER CONFIG (TELEGRAM SAFE)
========================================================= */
new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#000000',

    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 900 },
            debug: false
        }
    },

    scene: [MenuScene, GameScene]
});
