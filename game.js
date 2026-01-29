/* ================= GLOBAL ================= */
let selectedPlayer = 'player1';

let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
}

/* ================= MENU SCENE ================= */
class MenuScene extends Phaser.Scene {
    constructor(){ super('MenuScene'); }

    preload(){
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');
        this.load.audio('hover','assets/sounds/hover.mp3');
    }

    create(){
        const {width,height}=this.scale;

        this.bgFar=this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.bgMid=this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.bgNear=this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.hover=this.sound.add('hover',{volume:0.6});

        const title=this.add.text(width/2,height/4,'Pink Yupik Arcade',{
            fontFamily:'UnifrakturCook',
            fontSize:'120px',
            fill:'#e8d9b0'
        }).setOrigin(0.5);

        const style={fontFamily:'UnifrakturCook',fontSize:'56px',fill:'#e8d9b0'};

        const play=this.add.text(width/2,height/2-40,'PLAY',style)
            .setOrigin(0.5).setInteractive();

        const exit=this.add.text(width/2,height/2+80,'EXIT',style)
            .setOrigin(0.5).setInteractive();

        play.on('pointerover',()=>this.hover.play());
        play.on('pointerdown',()=>this.scene.start('SelectScene'));

        exit.on('pointerover',()=>this.hover.play());
        exit.on('pointerdown',()=>window.close());
    }

    update(){
        this.bgFar.tilePositionX+=0.2;
        this.bgMid.tilePositionX+=0.5;
        this.bgNear.tilePositionX+=1;
    }
}

/* ================= SELECT SCENE ================= */
class SelectScene extends Phaser.Scene {
    constructor(){ super('SelectScene'); }

    preload(){
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');
        this.load.image('p1','assets/player1/idle.png');
        this.load.image('p2','assets/player2/idle.png');
        this.load.image('platform','assets/platforms/platform_1.png');
    }

    create(){
        const {width,height}=this.scale;

        this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.add.text(width/2,120,'Select Character',{
            fontFamily:'UnifrakturCook',
            fontSize:'64px',
            fill:'#e8d9b0'
        }).setOrigin(0.5);

        const y=height/2+80;

        this.add.image(width/2-220,y,'platform');
        this.add.image(width/2+220,y,'platform');

        this.add.image(width/2-220,y-120,'p1').setInteractive()
            .on('pointerdown',()=>this.scene.start('GameScene',{player:'player1'}));

        this.add.image(width/2+220,y-120,'p2').setInteractive()
            .on('pointerdown',()=>this.scene.start('GameScene',{player:'player2'}));
    }
}

/* ================= PLAYER ================= */
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y,key){
        super(scene,x,y,key);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBodySize(90,120).setOffset(26,18);

        this.speed=180;
        this.jumpVel=520;
        this.jumpCount=0;
        this.maxJumps=3;

        this.keys=scene.input.keyboard.addKeys({
            left:'A',right:'D',up:'W',
            left2:'LEFT',right2:'RIGHT',up2:'UP'
        });

        this.touchLeft=false;
        this.touchRight=false;
        this.touchJump=false;
    }

    preUpdate(t,d){
        super.preUpdate(t,d);

        const left=this.keys.left.isDown||this.keys.left2.isDown||this.touchLeft;
        const right=this.keys.right.isDown||this.keys.right2.isDown||this.touchRight;

        if(left) this.setVelocityX(-this.speed);
        else if(right) this.setVelocityX(this.speed);
        else this.setVelocityX(0);

        if(
            (Phaser.Input.Keyboard.JustDown(this.keys.up) ||
            Phaser.Input.Keyboard.JustDown(this.keys.up2) ||
            this.touchJump) &&
            this.jumpCount<this.maxJumps
        ){
            this.setVelocityY(-this.jumpVel);
            this.jumpCount++;
            this.touchJump=false;
        }

        if(this.body.blocked.down) this.jumpCount=0;

        this.setFlipX(left);
        this.anims.play(left||right?'walk':'idle',true);
    }
}

/* ================= ENEMY ================= */
class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y,key){
        super(scene,x,y,key);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene=scene;
        this.isDead=false;
        this.speed=80;
        this.dir=1;
        this.startX=x;
        this.range=250;

        this.setCollideWorldBounds(true);
    }

    preUpdate(t,d){
        super.preUpdate(t,d);
        if(this.isDead) return;

        this.setVelocityX(this.speed*this.dir);
        if(this.x>this.startX+this.range) this.dir=-1;
        if(this.x<this.startX-this.range) this.dir=1;
    }

    die(){
        if(this.isDead) return;
        this.isDead=true;
        this.disableBody(true,true);

        const heart=this.scene.physics.add.image(this.x,this.y-20,'heart_small')
            .setBounce(0.4);

        this.scene.physics.add.collider(heart,this.scene.platforms);
        this.scene.physics.add.overlap(this.scene.player,heart,(p,h)=>{
            h.destroy();
            this.scene.hp=Math.min(this.scene.hp+1,this.scene.maxHP);
            this.scene.updateHP();
        });
    }
}

/* ================= GAME SCENE ================= */
class GameScene extends Phaser.Scene {
    constructor(){
        super('GameScene');
        this.worldWidth=6000;
        this.maxHP=3;
    }

    init(data){
        this.playerKey=data.player;
        this.enemyKey=data.player==='player1'?'player2':'player1';
        this.hp=this.maxHP;
        this.collected=0;
        this.invul=false;
    }

    preload(){
        const p=this.playerKey;
        const e=this.enemyKey;

        this.load.image(`${p}_idle`,`assets/${p}/idle.png`);
        this.load.spritesheet(`${p}_walk`,`assets/${p}/walk.png`,{frameWidth:142,frameHeight:142});
        this.load.image(`${e}_idle`,`assets/${e}/idle.png`);

        this.load.image('bg','assets/backgrounds/bg.png');
        this.load.image('ground','assets/platforms/ground.png');
        this.load.image('platform','assets/platforms/platform_1.png');

        this.load.image('heart','assets/items/heart_v4.png');
        this.load.image('heart_small','assets/items/heart_small.png');

        this.load.image('btn_left','assets/ui/btn_left.png');
        this.load.image('btn_right','assets/ui/btn_right.png');
        this.load.image('btn_jump','assets/ui/btn_jump.png');
    }

    create(){
        const p=this.playerKey;

        this.anims.create({key:'idle',frames:[{key:`${p}_idle`}],repeat:-1});
        this.anims.create({key:'walk',frames:this.anims.generateFrameNumbers(`${p}_walk`),frameRate:10,repeat:-1});

        this.physics.world.setBounds(0,0,this.worldWidth,832);
        this.bg=this.add.tileSprite(0,0,1248,832,'bg').setOrigin(0).setScrollFactor(0);

        this.platforms=this.physics.add.staticGroup();
        for(let x=0;x<this.worldWidth;x+=400)
            this.platforms.create(x+200,760,'ground');

        for(let i=0;i<30;i++)
            this.platforms.create(400+i*180,Phaser.Math.Between(300,550),'platform');

        this.player=new Player(this,200,300,`${p}_idle`);
        this.physics.add.collider(this.player,this.platforms);

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0,0,this.worldWidth,832);

        this.enemies=this.physics.add.group();
        for(let i=0;i<5;i++)
            this.enemies.add(new Enemy(this,800+i*900,300,`${this.enemyKey}_idle`));

        this.physics.add.collider(this.enemies,this.platforms);
        this.physics.add.collider(this.player,this.enemies,(p,e)=>{
            if(p.body.velocity.y>0){
                e.die();
                p.setVelocityY(-300);
            } else this.hit();
        });

        this.hearts=this.physics.add.staticGroup();
        for(let i=0;i<25;i++)
            this.hearts.create(600+i*200,250,'heart').setScale(0.4);

        this.physics.add.overlap(this.player,this.hearts,(p,h)=>{
            h.destroy();
            this.collected++;
            this.counter.setText(`${this.collected} / 25`);
            if(this.collected===25) this.end(true);
        });

        this.hpIcons=[];
        for(let i=0;i<this.maxHP;i++)
            this.hpIcons.push(this.add.image(30+i*40,40,'heart').setScale(0.4).setScrollFactor(0));

        this.counter=this.add.text(30,80,'0 / 25',{fontSize:'32px',fill:'#e8d9b0'}).setScrollFactor(0);

        this.createTouch();
    }

    update(){
        this.bg.tilePositionX=this.cameras.main.scrollX;
    }

    updateHP(){
        this.hpIcons.forEach((h,i)=>h.setAlpha(i<this.hp?1:0.3));
    }

    hit(){
        if(this.invul) return;
        this.invul=true;
        this.hp--;
        this.updateHP();

        if(this.hp<=0) this.end(false);

        this.time.delayedCall(1000,()=>this.invul=false);
    }

    end(win){
        this.physics.pause();
        const {width,height}=this.scale;

        const text=this.add.text(width/2,height/2,win?'ALL HEARTS COLLECTED':'YOU DIE',{
            fontFamily:'UnifrakturCook',
            fontSize:'96px',
            fill:'#e8d9b0'
        }).setOrigin(0.5).setScrollFactor(0);

        const play=this.add.text(width/2,height/2+100,'PLAY',{
            fontFamily:'UnifrakturCook',
            fontSize:'48px',
            fill:'#e8d9b0'
        }).setOrigin(0.5).setScrollFactor(0).setInteractive();

        const exit=this.add.text(width/2,height/2+160,'EXIT',{
            fontFamily:'UnifrakturCook',
            fontSize:'48px',
            fill:'#e8d9b0'
        }).setOrigin(0.5).setScrollFactor(0).setInteractive();

        play.on('pointerdown',()=>this.scene.restart({player:this.playerKey}));
        exit.on('pointerdown',()=>this.scene.start('MenuScene'));
    }

    createTouch(){
        const {width,height}=this.scale;

        const l=this.add.image(120,height-120,'btn_left').setScrollFactor(0).setInteractive();
        const r=this.add.image(260,height-120,'btn_right').setScrollFactor(0).setInteractive();
        const j=this.add.image(width-140,height-120,'btn_jump').setScrollFactor(0).setInteractive();

        l.on('pointerdown',()=>this.player.touchLeft=true);
        l.on('pointerup',()=>this.player.touchLeft=false);
        r.on('pointerdown',()=>this.player.touchRight=true);
        r.on('pointerup',()=>this.player.touchRight=false);
        j.on('pointerdown',()=>this.player.touchJump=true);
        j.on('pointerup',()=>this.player.touchJump=false);
    }
}

/* ================= CONFIG ================= */
new Phaser.Game({
    type:Phaser.AUTO,
    width:1248,
    height:832,
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
    physics:{default:'arcade',arcade:{gravity:{y:900},debug:false}},
    scene:[MenuScene,SelectScene,GameScene]
});
