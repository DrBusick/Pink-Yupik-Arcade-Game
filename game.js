// ======================= TELEGRAM =======================
let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
}

// ======================= MENU =======================
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    preload() {
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');
    }

    create() {
        const { width, height } = this.scale;

        this.bgFar  = this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.bgMid  = this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.bgNear = this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        const title = this.add.text(width/2,height/4,'Pink Yupik Arcade',{
            fontFamily:'UnifrakturCook',
            fontSize:'144px',
            fill:'#e8d9b0'
        }).setOrigin(0.5);

        const btn = { fontFamily:'UnifrakturCook', fontSize:'56px', fill:'#e8d9b0' };

        this.add.text(width/2,height/2-40,'PLAY',btn)
            .setOrigin(0.5).setInteractive()
            .on('pointerdown',()=>this.scene.start('SelectScene'));

        this.add.text(width/2,height/2+80,'EXIT',btn)
            .setOrigin(0.5).setInteractive()
            .on('pointerdown',()=>window.close());
    }

    update() {
        this.bgFar.tilePositionX += 0.2;
        this.bgMid.tilePositionX += 0.4;
        this.bgNear.tilePositionX += 0.8;
    }
}

// ======================= SELECT =======================
class SelectScene extends Phaser.Scene {
    constructor(){ super('SelectScene'); }

    preload(){
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');
        this.load.image('p1','assets/player1/idle.png');
        this.load.image('p2','assets/player2/idle.png');
        this.load.image('pf1','assets/platforms/platform_1.png');
    }

    create(){
        const { width, height } = this.scale;

        this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.add.text(width/2,120,'Select Character',{
            fontFamily:'UnifrakturCook',
            fontSize:'64px',
            fill:'#e8d9b0'
        }).setOrigin(0.5);

        this.add.image(width/2-200,height/2+120,'pf1');
        this.add.image(width/2+200,height/2+120,'pf1');

        this.add.image(width/2-200,height/2,'p1')
            .setInteractive()
            .on('pointerdown',()=>this.scene.start('GameScene',{player:'player1'}));

        this.add.image(width/2+200,height/2,'p2')
            .setInteractive()
            .on('pointerdown',()=>this.scene.start('GameScene',{player:'player2'}));
    }
}

// ======================= PLAYER =======================
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y,key){
        super(scene,x,y,key);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBodySize(90,120).setOffset(26,18);

        this.speed=180;
        this.jumpPower=520;
        this.jumpCount=0;
        this.maxJumps=3;

        this.keys = scene.input.keyboard.addKeys({
            left:'A', right:'D', up:'W',
            left2:'LEFT', right2:'RIGHT', up2:'UP'
        });

        this.touchLeft=false;
        this.touchRight=false;
        this.touchJump=false;
    }

    preUpdate(t,d){
        super.preUpdate(t,d);

        const l=this.keys.left.isDown||this.keys.left2.isDown||this.touchLeft;
        const r=this.keys.right.isDown||this.keys.right2.isDown||this.touchRight;

        this.setVelocityX(l?-this.speed:r?this.speed:0);
        if(l) this.setFlipX(true);
        if(r) this.setFlipX(false);

        if((Phaser.Input.Keyboard.JustDown(this.keys.up)||this.touchJump)&&this.jumpCount<this.maxJumps){
            this.setVelocityY(-this.jumpPower);
            this.jumpCount++;
            this.touchJump=false;
        }

        if(this.body.blocked.down) this.jumpCount=0;

        this.anims.play(l||r?'walk':'idle',true);
    }
}

// ======================= ENEMY =======================
class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y,key){
        super(scene,x,y,key);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene=scene;
        this.speed=80;
        this.dir=1;
        this.isDead=false;
    }

    preUpdate(){
        if(this.isDead) return;
        this.setVelocityX(this.speed*this.dir);
        this.anims.play('enemy_walk',true);
        if(this.body.blocked.left||this.body.blocked.right) this.dir*=-1;
        this.setFlipX(this.dir<0);
    }

    die(){
        if(this.isDead) return;
        this.isDead=true;
        this.disableBody(true,true);

        const h=this.scene.physics.add.image(this.x,this.y,'heart_small')
            .setScale(0.35);
        this.scene.physics.add.collider(h,this.scene.ground);
        this.scene.physics.add.collider(h,this.scene.platforms);
        this.scene.physics.add.overlap(this.scene.player,h,()=>{
            h.destroy();
            this.scene.heal();
        });
    }
}

// ======================= GAME =======================
class GameScene extends Phaser.Scene {
    constructor(){ super('GameScene'); }

    init(d){
        this.playerKey=d.player;
        this.enemyKey=d.player==='player1'?'player2':'player1';
        this.hp=3;
        this.heartsCollected=0;
    }

    preload(){
        this.load.image(`${this.playerKey}_idle`,`assets/${this.playerKey}/idle.png`);
        this.load.spritesheet(`${this.playerKey}_walk`,`assets/${this.playerKey}/walk.png`,
            {frameWidth:142,frameHeight:142});

        this.load.image(`${this.enemyKey}_idle`,`assets/${this.enemyKey}/idle.png`);
        this.load.spritesheet(`${this.enemyKey}_walk`,`assets/${this.enemyKey}/walk.png`,
            {frameWidth:142,frameHeight:142});

        this.load.image('ground','assets/platforms/ground.png');
        for(let i=1;i<=4;i++)
            this.load.image(`pf${i}`,`assets/platforms/platform_${i}.png`);

        this.load.image('heart','assets/items/heart_v4.png');
        this.load.image('heart_small','assets/items/heart_small.png');

        this.load.image('btn_left','assets/ui/btn_left.png');
        this.load.image('btn_right','assets/ui/btn_right.png');
        this.load.image('btn_jump','assets/ui/btn_jump.png');
    }

    create(){
        this.anims.create({key:'idle',frames:[{key:`${this.playerKey}_idle`}],repeat:-1});
        this.anims.create({key:'walk',
            frames:this.anims.generateFrameNumbers(`${this.playerKey}_walk`),
            frameRate:10,repeat:-1});

        this.anims.create({key:'enemy_walk',
            frames:this.anims.generateFrameNumbers(`${this.enemyKey}_walk`),
            frameRate:8,repeat:-1});

        this.physics.world.setBounds(0,0,6000,832);

        this.ground=this.physics.add.staticGroup();
        for(let i=0;i<20;i++)
            this.ground.create(i*300+150,832,'ground').setOrigin(0.5,1);

        this.platforms=this.physics.add.staticGroup();
        let x=400;
        for(let i=0;i<30;i++){
            this.platforms.create(
                x,
                Phaser.Math.Between(200,500),
                `pf${Phaser.Math.Between(1,4)}`
            );
            x+=200;
        }

        this.player=new Player(this,200,300,`${this.playerKey}_idle`);
        this.physics.add.collider(this.player,this.ground);
        this.physics.add.collider(this.player,this.platforms);

        this.enemies=this.physics.add.group();
        for(let i=0;i<5;i++){
            const e=new Enemy(this,800+i*600,300,`${this.enemyKey}_idle`);
            this.enemies.add(e);
        }

        this.physics.add.collider(this.enemies,this.ground);
        this.physics.add.collider(this.enemies,this.platforms);

        this.physics.add.collider(this.player,this.enemies,(p,e)=>{
            if(p.body.velocity.y>0){
                e.die();
                p.setVelocityY(-300);
            } else this.hit();
        });

        this.hearts=this.physics.add.staticGroup();
        for(let i=0;i<25;i++)
            this.hearts.create(400+i*200,200,'heart').setScale(0.7);

        this.physics.add.overlap(this.player,this.hearts,(p,h)=>{
            h.destroy();
            this.heartsCollected++;
        });

        this.createTouch();
        this.cameras.main.startFollow(this.player,true,0.1,0.1);
        this.cameras.main.setBounds(0,0,6000,832);
    }

    hit(){
        this.hp--;
        if(this.hp<=0){
            this.scene.start('MenuScene');
        }
    }

    heal(){
        this.hp=Math.min(3,this.hp+1);
    }

    createTouch(){
        const h=this.scale.height;
        const l=this.add.image(100,h-100,'btn_left').setInteractive();
        const r=this.add.image(220,h-100,'btn_right').setInteractive();
        const j=this.add.image(this.scale.width-120,h-100,'btn_jump').setInteractive();

        l.on('pointerdown',()=>this.player.touchLeft=true);
        l.on('pointerup',()=>this.player.touchLeft=false);
        r.on('pointerdown',()=>this.player.touchRight=true);
        r.on('pointerup',()=>this.player.touchRight=false);
        j.on('pointerdown',()=>this.player.touchJump=true);
        j.on('pointerup',()=>this.player.touchJump=false);
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
