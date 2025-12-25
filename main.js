console.log("🔥 main.js FINAL v5");

// ======================= TELEGRAM ========================
let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
}

// ======================= MENU SCENE =====================
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    preload() {
        this.load.image('bg_far', 'assets/backgrounds/bg_far.png');
        this.load.image('bg_mid', 'assets/backgrounds/bg_mid.png');
        this.load.image('bg_near', 'assets/backgrounds/bg_near.png');
        this.load.audio('hover', 'assets/sounds/hover.mp3');
    }

    create() {
        const { width, height } = this.scale;

        this.bgFar  = this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.bgMid  = this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.bgNear = this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.hoverSound = this.sound.add('hover',{volume:0.6});

        this.add.text(width/2, height/4, 'Pink Yupik Arcade',{
            fontFamily:'UnifrakturCook, serif',
            fontSize:'144px',
            fill:'#e8d9b0'
        }).setOrigin(0.5)
          .setShadow(0,0,'#fff2c1',40,true,true);

        const btnStyle = { fontFamily:'UnifrakturCook, serif', fontSize:'56px', fill:'#e8d9b0' };

        const play = this.add.text(width/2, height/2 - 40, 'PLAY', btnStyle)
            .setOrigin(0.5).setInteractive({useHandCursor:true});

        play.on('pointerdown',()=>{
            this.hoverSound.play();
            this.scene.start('CharacterSelectScene');
        });

        const exit = this.add.text(width/2, height/2 + 80, 'EXIT', btnStyle)
            .setOrigin(0.5).setInteractive({useHandCursor:true});

        exit.on('pointerdown',()=>{
            this.hoverSound.play();
            if (tg && tg.close) {
                tg.close();
            } else if (window.close) {
                window.close();
            } else {
                alert("Закрий вкладку вручну");
            }
        });
    }

    update(){
        this.bgFar.tilePositionX+=0.2;
        this.bgMid.tilePositionX+=0.4;
        this.bgNear.tilePositionX+=0.6;
    }
}

// =================== CHARACTER SELECT ===================
class CharacterSelectScene extends Phaser.Scene {
    constructor(){ super('CharacterSelectScene'); }

    preload(){
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');

        this.load.image('char1','assets/player1/idle.png');
        this.load.image('char2','assets/player2/idle.png');

        this.load.audio('hover','assets/sounds/hover.mp3');
    }

    create(){
        const { width, height } = this.scale;

        this.bgFar  = this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.bgMid  = this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.bgNear = this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.hoverSound=this.sound.add('hover',{volume:0.6});

        this.add.text(width/2,120,'CHOOSE YOUR HERO',{
            fontFamily:'UnifrakturCook, serif',
            fontSize:'72px',
            fill:'#e8d9b0'
        }).setOrigin(0.5);

        const frame1=this.add.rectangle(width/2-220,height/2,240,240)
            .setStrokeStyle(4,0xfff2c1).setAlpha(0);
        const frame2=this.add.rectangle(width/2+220,height/2,240,240)
            .setStrokeStyle(4,0xfff2c1).setAlpha(0);

        let selected = null;

        const makeChar = (x,key,id,frame)=>{
            const s=this.add.image(x,height/2,key)
                .setScale(1.2)
                .setInteractive({useHandCursor:true});

            s.on('pointerdown',()=>{
                this.hoverSound.play();
                selected=id;
                frame1.setAlpha(0);
                frame2.setAlpha(0);
                frame.setAlpha(1);
            });
        };

        makeChar(width/2-220,'char1','player1',frame1);
        makeChar(width/2+220,'char2','player2',frame2);

        const start=this.add.text(width/2,height-140,'START',{
            fontFamily:'UnifrakturCook, serif',
            fontSize:'56px',
            fill:'#e8d9b0'
        }).setOrigin(0.5).setInteractive({useHandCursor:true});

        start.on('pointerdown',()=>{
            if(!selected) return;
            this.hoverSound.play();
            this.scene.start('GameScene',{ character:selected });
        });
    }

    update(){
        this.bgFar.tilePositionX+=0.2;
        this.bgMid.tilePositionX+=0.4;
        this.bgNear.tilePositionX+=0.6;
    }
}

// ======================= PLAYER =========================
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y,animKey){
        super(scene,x,y,animKey);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBodySize(90,120).setOffset(26,18);

        this.maxSpeed = 260;
        this.accel = 900;
        this.jumpVelocity = 520;

        this.jumpCount = 0;
        this.maxJumps = 3;

        this.setDragX(1600);

        this.keys = scene.input.keyboard.addKeys({
            left:'A', right:'D', up:'W',
            left2:'LEFT', right2:'RIGHT', up2:'UP'
        });
    }

    preUpdate(time, delta){
        super.preUpdate(time, delta);

        const left = this.keys.left.isDown || this.keys.left2.isDown;
        const right = this.keys.right.isDown || this.keys.right2.isDown;

        if(left){
            this.setAccelerationX(-this.accel);
            this.setFlipX(true);
        } else if(right){
            this.setAccelerationX(this.accel);
            this.setFlipX(false);
        } else {
            this.setAccelerationX(0);
        }

        if (this.body.velocity.x > this.maxSpeed) this.setVelocityX(this.maxSpeed);
        if (this.body.velocity.x < -this.maxSpeed) this.setVelocityX(-this.maxSpeed);

        if((Phaser.Input.Keyboard.JustDown(this.keys.up)||
            Phaser.Input.Keyboard.JustDown(this.keys.up2)) && this.jumpCount < this.maxJumps){
            this.setVelocityY(-this.jumpVelocity);
            this.scene.jumpSound.play();
            this.jumpCount++;
        }

        if(this.body.blocked.down) this.jumpCount = 0;

        const moving = Math.abs(this.body.velocity.x) > 5;
        this.anims.play(moving ? this.walkAnim : this.idleAnim, true);
    }
}

// ======================= GAME SCENE =====================
class GameScene extends Phaser.Scene {
    constructor(){ super('GameScene'); }

    init(data){
        this.character = data.character || 'player1';
    }

    preload(){
        this.load.image('bg','assets/backgrounds/bg.png');
        this.load.image('ground','assets/platforms/ground.png');

        this.load.image('p1_idle','assets/player1/idle.png');
        this.load.spritesheet('p1_walk','assets/player1/walk.png',{frameWidth:142,frameHeight:142});

        this.load.image('p2_idle','assets/player2/idle.png');
        this.load.spritesheet('p2_walk','assets/player2/walk.png',{frameWidth:142,frameHeight:142});

        this.load.audio('jump','assets/sounds/jump.mp3');
    }

    create(){
        const idle = this.character === 'player2' ? 'p2_idle' : 'p1_idle';
        const walk = this.character === 'player2' ? 'p2_walk' : 'p1_walk';

        const idleKey = `idle_${this.character}`;
        const walkKey = `walk_${this.character}`;

        if(!this.anims.exists(idleKey)){
            this.anims.create({ key:idleKey, frames:[{key:idle}], repeat:-1 });
            this.anims.create({ key:walkKey, frames:this.anims.generateFrameNumbers(walk), frameRate:10, repeat:-1 });
        }

        this.jumpSound = this.sound.add('jump');

        this.physics.world.setBounds(0,0,6000,832);

        this.player = new Player(this,200,300,idleKey);
        this.player.idleAnim = idleKey;
        this.player.walkAnim = walkKey;

        this.cameras.main.startFollow(this.player,true,0.12,0.12);
    }
}

// ======================= CONFIG ========================
new Phaser.Game({
    type:Phaser.AUTO,
    width:1248,
    height:832,
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
    physics:{default:'arcade',arcade:{gravity:{y:900},debug:false}},
    scene:[MenuScene,CharacterSelectScene,GameScene]
});
