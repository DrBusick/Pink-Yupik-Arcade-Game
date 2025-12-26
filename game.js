let selectedPlayer = 'player';

// ======================= MENU =======================
class MenuScene extends Phaser.Scene {
    constructor(){ super('MenuScene'); }

    preload(){
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');
    }

    create(){
        const {width,height}=this.scale;

        this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.add.text(width/2,200,'Pink Yupik Arcade',{
            fontFamily:'UnifrakturCook',fontSize:'72px',fill:'#e8d9b0'
        }).setOrigin(0.5);

        const start=this.add.text(width/2,400,'Start',{
            fontFamily:'UnifrakturCook',fontSize:'48px',fill:'#ffffff'
        }).setOrigin(0.5).setInteractive();

        start.on('pointerdown',()=>this.scene.start('SelectScene'));
    }
}

// ======================= SELECT =======================
class SelectScene extends Phaser.Scene {
    constructor(){ super('SelectScene'); }

    preload(){
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');

        this.load.image('p1_idle','assets/player/idle.png');
        this.load.image('p2_idle','assets/player2/idle.png');
    }

    create(){
        const {width,height}=this.scale;

        this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.add.text(width/2,120,'Select Character',{
            fontFamily:'UnifrakturCook',fontSize:'64px',fill:'#e8d9b0'
        }).setOrigin(0.5);

        const p1=this.add.image(width/2-220,height/2,'p1_idle').setScale(1.2).setInteractive();
        const p2=this.add.image(width/2+220,height/2,'p2_idle').setScale(1.2).setInteractive();

        p1.on('pointerdown',()=>{ selectedPlayer='player'; this.scene.start('GameScene'); });
        p2.on('pointerdown',()=>{ selectedPlayer='player2'; this.scene.start('GameScene'); });
    }
}

// ======================= PLAYER =======================
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y){
        const prefix = selectedPlayer === 'player2' ? 'p2_' : '';
        super(scene,x,y,prefix+'idle');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBodySize(90,120).setOffset(26,18);

        this.speed=260; this.accel=1200; this.jumpVelocity=520;
        this.body.setMaxVelocity(this.speed,1000);
        this.body.setDragX(1000);

        this.facing='right'; this.jumpCount=0; this.maxJumps=3;

        this.keys=scene.input.keyboard.addKeys({left:'A',right:'D',up:'W',left2:'LEFT',right2:'RIGHT',up2:'UP'});
        this.touchLeft=false; this.touchRight=false; this.touchJump=false;

        this.walkSound=scene.sound.add('walk',{loop:true,volume:0.5});
    }

    preUpdate(time,delta){
        super.preUpdate(time,delta);
        const L=this.keys.left.isDown||this.keys.left2.isDown||this.touchLeft;
        const R=this.keys.right.isDown||this.keys.right2.isDown||this.touchRight;

        if(L){ this.setAccelerationX(-this.accel); this.facing='left'; }
        else if(R){ this.setAccelerationX(this.accel); this.facing='right'; }
        else this.setAccelerationX(0);

        const moving=L||R;
        const jump = Phaser.Input.Keyboard.JustDown(this.keys.up)||Phaser.Input.Keyboard.JustDown(this.keys.up2)||this.touchJump;

        if(jump && this.jumpCount<this.maxJumps){
            this.setVelocityY(-this.jumpVelocity);
            this.jumpCount++;
            this.scene.jumpSound.play();
            this.touchJump=false;
        }

        if(this.body.blocked.down){
            this.jumpCount=0;
            if(moving && !this.walkSound.isPlaying) this.walkSound.play();
            if(!moving && this.walkSound.isPlaying) this.walkSound.stop();
        }

        this.setFlipX(this.facing==='left');
        this.anims.play(moving?'walk':'idle',true);
    }
}

// ======================= GAME =======================
class GameScene extends Phaser.Scene {
    constructor(){ super('GameScene'); }

    preload(){
        const prefix = selectedPlayer === 'player2' ? 'p2_' : '';
        this.load.spritesheet(prefix+'walk',`assets/${selectedPlayer}/walk.png`,{frameWidth:142,frameHeight:142});
        this.load.image(prefix+'idle',`assets/${selectedPlayer}/idle.png`);
        this.load.audio('jump','assets/sounds/jump.mp3');
        this.load.audio('walk','assets/sounds/walk.mp3');
    }

    create(){
        const prefix = selectedPlayer === 'player2' ? 'p2_' : '';
        this.anims.create({key:'idle',frames:[{key:prefix+'idle'}],repeat:-1});
        this.anims.create({key:'walk',frames:this.anims.generateFrameNumbers(prefix+'walk'),frameRate:10,repeat:-1});

        this.jumpSound=this.sound.add('jump');
        this.player=new Player(this,200,300);
    }
}

// ======================= CONFIG =======================
new Phaser.Game({
    type:Phaser.AUTO,
    width:1248,
    height:832,
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
    physics:{default:'arcade',arcade:{gravity:{y:900},debug:false}},
    scene:[MenuScene,SelectScene,GameScene]
});
