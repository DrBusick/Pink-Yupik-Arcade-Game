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
        const glowOn  = (t, c='#fff2c1') => t.setShadow(0,0,c,18,true,true);
        const glowOff = (t) => t.setShadow(0,0,'#000',0);

        const play = this.add.text(width/2, height/2 - 60, 'PLAY', btnStyle)
            .setOrigin(0.5).setInteractive({ useHandCursor:true });

        play.on('pointerover', () => { this.hoverSound.play(); play.setScale(1.15); glowOn(play); });
        play.on('pointerout', () => { play.setScale(1); glowOff(play); });
        play.on('pointerdown', () => { this.hoverSound.play(); this.scene.start('GameScene'); });

        const exit = this.add.text(width/2, height/2 + 100, 'EXIT', btnStyle)
            .setOrigin(0.5).setInteractive({ useHandCursor:true });

        exit.on('pointerdown', () => window.close());
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

        // TOUCH FLAGS
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

        this.walkSound = scene.sound.add('walk',{loop:true,volume:0.5});
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
            this.scene.jumpSound.play();
        }

        this.touchJump = false;

        if (this.body.blocked.down) {
            this.jumpCount = 0;
            if (moving && !this.walkSound.isPlaying) this.walkSound.play();
            if (!moving && this.walkSound.isPlaying) this.walkSound.stop();
        } else if (this.walkSound.isPlaying) {
            this.walkSound.stop();
        }

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
        this.heartsCollected = 0;
    }

    preload(){
        this.load.image('bg','assets/backgrounds/bg.png');
        this.load.image('ground','assets/platforms/ground.png');
        for(let i=1;i<=4;i++)
            this.load.image(`pf${i}`,`assets/platforms/platform_${i}.png`);

        this.load.spritesheet('walk','assets/player/walk.png',{frameWidth:142,frameHeight:142});
        this.load.image('idle','assets/player/idle.png');
        this.load.image('heart','assets/items/heart_v4.png');

        // UI BUTTONS
        this.load.image('btn_left','assets/ui/btn_left.png');
        this.load.image('btn_right','assets/ui/btn_right.png');
        this.load.image('btn_jump','assets/ui/btn_jump.png');

        this.load.audio('jump','assets/sounds/jump.mp3');
        this.load.audio('walk','assets/sounds/walk.mp3');
        this.load.audio('collect','assets/sounds/collect.mp3');
        this.load.audio('hover','assets/sounds/hover.mp3');
    }

    create(){
        this.anims.create({key:'idle',frames:[{key:'idle'}],repeat:-1});
        this.anims.create({key:'walk',frames:this.anims.generateFrameNumbers('walk'),frameRate:10,repeat:-1});

        this.jumpSound = this.sound.add('jump');
        this.collectSound = this.sound.add('collect');

        this.physics.world.setBounds(0,0,this.worldWidth,this.worldHeight);

        this.bg = this.add.tileSprite(0,0,1248,832,'bg')
            .setOrigin(0).setScrollFactor(0);

        this.ground = this.physics.add.staticGroup();
        const gW = this.textures.get('ground').getSourceImage().width;
        for(let i=0;i<this.worldWidth/gW;i++)
            this.ground.create(i*gW+gW/2,this.worldHeight,'ground')
                .setOrigin(0.5,1).refreshBody();

        this.staticPlatforms = this.physics.add.staticGroup();
        this.movingPlatforms = this.physics.add.group({allowGravity:false,immovable:true});

        this.spawnPlatforms();

        this.player = new Player(this,200,300);
        this.physics.add.collider(this.player,this.ground);
        this.physics.add.collider(this.player,this.staticPlatforms);
        this.physics.add.collider(this.player,this.movingPlatforms);

        this.hearts = this.physics.add.staticGroup();
        this.spawnHeartsSafe(25);

        this.physics.add.overlap(this.player,this.hearts,(p,h)=>{
            h.destroy();
            this.collectSound.play();
            this.heartsCollected++;
        });

        this.cameras.main.startFollow(this.player,true,0.12,0.12);
        this.cameras.main.setBounds(0,0,this.worldWidth,this.worldHeight);

        // TOUCH CONTROLS
        this.createTouchControls();
    }

    createTouchControls() {
        if (!this.sys.game.device.input.touch) return;

        const cam = this.cameras.main;
        const idle = 0.9;
        const down = 0.8;

        const makeBtn = (x,y,key)=>{
            const b = this.add.image(x,y,key)
                .setScrollFactor(0)
                .setScale(idle)
                .setAlpha(0.6)
                .setInteractive();

            b.on('pointerdown',()=>{ b.setScale(down); b.setAlpha(0.9); });
            b.on('pointerup',()=>{ b.setScale(idle); b.setAlpha(0.6); });
            b.on('pointerout',()=>{ b.setScale(idle); b.setAlpha(0.6); });
            return b;
        };

        const left = makeBtn(130, cam.height-120, 'btn_left');
        left.on('pointerdown',()=>this.player.touchLeft=true);
        left.on('pointerup',()=>this.player.touchLeft=false);
        left.on('pointerout',()=>this.player.touchLeft=false);

        const right = makeBtn(260, cam.height-120, 'btn_right');
        right.on('pointerdown',()=>this.player.touchRight=true);
        right.on('pointerup',()=>this.player.touchRight=false);
        right.on('pointerout',()=>this.player.touchRight=false);

        const jump = makeBtn(cam.width-140, cam.height-120, 'btn_jump');
        jump.on('pointerdown',()=>this.player.touchJump=true);
    }

    spawnPlatforms(){
        const keys=['pf1','pf2','pf3','pf4'];
        let x=400;
        for(let i=0;i<30;i++){
            const y=Phaser.Math.Between(220,520);
            this.staticPlatforms.create(x,y,Phaser.Utils.Array.GetRandom(keys)).refreshBody();
            x+=Phaser.Math.Between(260,320);
        }
    }

    spawnHeartsSafe(count){
        for(let i=0;i<count;i++)
            this.hearts.create(
                Phaser.Math.Between(200,this.worldWidth-200),
                Phaser.Math.Between(150,500),
                'heart'
            );
    }

    update(){
        this.bg.tilePositionX=this.cameras.main.scrollX;
    }
}

// ======================= CONFIG ========================
new Phaser.Game({
    type: Phaser.AUTO,
    width: 1248,
    height: 832,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default:'arcade', arcade:{ gravity:{y:900}, debug:false }},
    scene: [MenuScene, GameScene]
});
