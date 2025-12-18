// ======================= MENU SCENE ========================
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    preload() {
        this.load.image('bg_far', 'assets/backgrounds/bg_far.png');
        this.load.image('bg_mid', 'assets/backgrounds/bg_mid.png');
        this.load.image('bg_near', 'assets/backgrounds/bg_near.png');
        this.load.audio('hover', 'assets/sounds/hover.mp3');
    }

    create() {
        const { width, height } = this.sys.game.config;

        this.bgFar  = this.add.tileSprite(0, 0, width, height, 'bg_far').setOrigin(0);
        this.bgMid  = this.add.tileSprite(0, 0, width, height, 'bg_mid').setOrigin(0);
        this.bgNear = this.add.tileSprite(0, 0, width, height, 'bg_near').setOrigin(0);

        this.hoverSound = this.sound.add('hover', { volume: 0.6 });

        const title = this.add.text(width / 2, height / 4, 'Pink Yupik Arcade', {
            fontFamily: 'UnifrakturCook',
            fontSize: '144px',
            fill: '#e8d9b0'
        }).setOrigin(0.5);

        title.setShadow(0, 0, '#fff2c1', 20, true, true);

        this.tweens.add({
            targets: title,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                const blur = Phaser.Math.Linear(18, 48, tween.progress);
                title.setShadow(0, 0, '#fff2c1', blur, true, true);
            }
        });

        const btnStyle = { fontFamily: 'UnifrakturCook', fontSize: '56px', fill: '#e8d9b0' };

        const play = this.add.text(width/2, height/2 - 60, 'PLAY', btnStyle)
            .setOrigin(0.5).setInteractive();

        play.on('pointerdown', () => this.scene.start('GameScene'));
    }

    update() {
        this.bgFar.tilePositionX += 0.2;
        this.bgMid.tilePositionX += 0.5;
        this.bgNear.tilePositionX += 1;
    }
}

// ======================= PLAYER ========================
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y){
        super(scene,x,y,'idle');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBodySize(90,120).setOffset(26,18);

        this.keys = scene.input.keyboard.addKeys({
            left:'A', right:'D', up:'W',
            left2:'LEFT', right2:'RIGHT', up2:'UP'
        });

        this.touchLeft = false;
        this.touchRight = false;
        this.touchJump = false;

        this.speed = 260;
        this.accel = 1200;
        this.jumpVelocity = 520;
        this.jumpCount = 0;
        this.maxJumps = 3;

        this.body.setMaxVelocity(this.speed,1000);
        this.body.setDragX(1000);
    }

    preUpdate(time,delta){
        super.preUpdate(time,delta);

        let moving = false;

        if (this.keys.left.isDown || this.keys.left2.isDown || this.touchLeft) {
            this.setAccelerationX(-this.accel);
            moving = true;
        } else if (this.keys.right.isDown || this.keys.right2.isDown || this.touchRight) {
            this.setAccelerationX(this.accel);
            moving = true;
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
        }

        this.touchJump = false;

        if (this.body.blocked.down) this.jumpCount = 0;

        this.setFlipX(this.body.velocity.x < 0);
        this.anims.play(moving ? 'walk' : 'idle', true);
    }
}

// ======================= GAME SCENE ========================
class GameScene extends Phaser.Scene {
    constructor(){
        super('GameScene');
        this.worldWidth = 6000;
        this.worldHeight = 832;
    }

    preload(){
        this.load.image('bg','assets/backgrounds/bg.png');
        this.load.image('ground','assets/platforms/ground.png');
        this.load.image('btn_left','assets/ui/btn_left.png');
        this.load.image('btn_right','assets/ui/btn_right.png');
        this.load.image('btn_jump','assets/ui/btn_jump.png');
        this.load.image('idle','assets/player/idle.png');
        this.load.spritesheet('walk','assets/player/walk.png',{frameWidth:142,frameHeight:142});
    }

    create(){
        this.anims.create({key:'idle',frames:[{key:'idle'}],repeat:-1});
        this.anims.create({key:'walk',frames:this.anims.generateFrameNumbers('walk'),frameRate:10,repeat:-1});

        this.physics.world.setBounds(0,0,this.worldWidth,this.worldHeight);

        this.bg = this.add.tileSprite(0,0,1248,832,'bg')
            .setOrigin(0).setScrollFactor(0);

        this.player = new Player(this,200,300);
        this.physics.add.collider(this.player,this.physics.add.staticImage(0,832,'ground').setOrigin(0,1));

        this.cameras.main.startFollow(this.player,true,0.12,0.12);
        this.cameras.main.setBounds(0,0,this.worldWidth,this.worldHeight);

        this.input.addPointer(2);
        this.createTouchControls();
    }

    createTouchControls() {
        const { width, height } = this.scale;

        const makeBtn = (x,y,key)=>{
            const b = this.add.image(x,y,key)
                .setScrollFactor(0)
                .setScale(0.9)
                .setAlpha(0.65)
                .setDepth(9999)
                .setInteractive();

            b.on('pointerdown',()=>b.setScale(0.8));
            b.on('pointerup',()=>b.setScale(0.9));
            b.on('pointerout',()=>b.setScale(0.9));
            return b;
        };

        const left = makeBtn(120, height-120, 'btn_left');
        left.on('pointerdown',()=>this.player.touchLeft=true);
        left.on('pointerup',()=>this.player.touchLeft=false);
        left.on('pointerout',()=>this.player.touchLeft=false);

        const right = makeBtn(260, height-120, 'btn_right');
        right.on('pointerdown',()=>this.player.touchRight=true);
        right.on('pointerup',()=>this.player.touchRight=false);
        right.on('pointerout',()=>this.player.touchRight=false);

        const jump = makeBtn(width-140, height-120, 'btn_jump');
        jump.on('pointerdown',()=>this.player.touchJump=true);
    }

    update(){
        this.bg.tilePositionX = this.cameras.main.scrollX;
    }
}

// ======================= CONFIG ========================
new Phaser.Game({
    type: Phaser.AUTO,
    width: 1248,
    height: 832,
    scale:{ mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics:{ default:'arcade', arcade:{ gravity:{y:900}, debug:false }},
    scene:[MenuScene,GameScene]
});
