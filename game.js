/* =========================================================
   TELEGRAM INIT
========================================================= */
let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes();
}

/* =========================================================
   MENU SCENE
========================================================= */
class MenuScene extends Phaser.Scene {
    constructor(){ super('MenuScene'); }

    preload(){
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');
    }

    create(){
        const {width,height}=this.scale;

        this.bgFar=this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.bgMid=this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.bgNear=this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.add.text(width/2,height/3,'Pink Yupik Arcade',{
            fontFamily:'UnifrakturCook',fontSize:'120px',fill:'#e8d9b0'
        }).setOrigin(0.5);

        const btnStyle={fontFamily:'UnifrakturCook',fontSize:'56px',fill:'#e8d9b0'};
        const play=this.add.text(width/2,height/2,'PLAY',btnStyle).setOrigin(0.5).setInteractive();
        const exit=this.add.text(width/2,height/2+100,'EXIT',btnStyle).setOrigin(0.5).setInteractive();

        play.on('pointerdown',()=>this.scene.start('SelectScene'));
        exit.on('pointerdown',()=>tg?.close());

        this.tweens.add({targets:[play,exit],scale:1.1,duration:600,yoyo:true,repeat:-1});
    }

    update(){
        this.bgFar.tilePositionX+=0.2;
        this.bgMid.tilePositionX+=0.5;
        this.bgNear.tilePositionX+=1;
    }
}

/* =========================================================
   SELECT SCENE
========================================================= */
class SelectScene extends Phaser.Scene {
    constructor(){ super('SelectScene'); }

    preload(){
        this.load.image('platform','assets/platforms/platform_1.png');
        this.load.image('player1_idle','assets/player1/idle.png');
        this.load.image('player2_idle','assets/player2/idle.png');
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');
    }

    create(){
        const {width,height}=this.scale;

        this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.add.text(width/2,120,'Select Character',{
            fontFamily:'UnifrakturCook',fontSize:'64px',fill:'#e8d9b0'
        }).setOrigin(0.5);

        const y=height/2+120;
        this.add.image(width/2-220,y,'platform');
        this.add.image(width/2+220,y,'platform');

        this.add.image(width/2-220,y-110,'player1_idle')
            .setInteractive().on('pointerdown',()=>this.scene.start('GameScene',{player:'player1'}));

        this.add.image(width/2+220,y-110,'player2_idle')
            .setInteractive().on('pointerdown',()=>this.scene.start('GameScene',{player:'player2'}));
    }
}

/* =========================================================
   PLAYER
========================================================= */
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y,key){
        super(scene,x,y,key);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBodySize(90,120).setOffset(26,18);

        this.speed=180;
        this.jumpVelocity=520;
        this.jumpCount=0;
        this.maxJumps=3;

        this.invulnerable=false;

        this.body.setDragX(1200);
        this.body.setMaxVelocity(this.speed,1000);

        this.keys=scene.input.keyboard.addKeys({
            left:'A',right:'D',up:'W',
            left2:'LEFT',right2:'RIGHT',up2:'UP'
        });
    }

    takeHit(fromX){
        if(this.invulnerable) return;

        this.invulnerable=true;
        const dir=this.x<fromX?-1:1;
        this.setVelocityX(dir*250);
        this.setVelocityY(-250);

        this.scene.tweens.add({
            targets:this,
            alpha:0,
            duration:100,
            yoyo:true,
            repeat:10,
            onComplete:()=>{
                this.alpha=1;
                this.invulnerable=false;
            }
        });
    }

    preUpdate(t,d){
        super.preUpdate(t,d);

        const left=this.keys.left.isDown||this.keys.left2.isDown;
        const right=this.keys.right.isDown||this.keys.right2.isDown;

        if(left){
            this.setVelocityX(-this.speed);
            this.setFlipX(true);
        } else if(right){
            this.setVelocityX(this.speed);
            this.setFlipX(false);
        } else {
            this.setVelocityX(0);
        }

        if((Phaser.Input.Keyboard.JustDown(this.keys.up)||Phaser.Input.Keyboard.JustDown(this.keys.up2))
            && this.jumpCount<this.maxJumps){
            this.setVelocityY(-this.jumpVelocity);
            this.jumpCount++;
        }

        if(this.body.blocked.down) this.jumpCount=0;

        const prefix=this.texture.key.replace('_idle','');
        if(Math.abs(this.body.velocity.x)>10){
            this.anims.play(`${prefix}_walk`,true);
        } else {
            this.anims.play(`${prefix}_idle`,true);
        }
    }
}

/* =========================================================
   ENEMY
========================================================= */
class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y,type){
        super(scene,x,y,`${type}_idle`);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.type=type;
        this.speed=100;
        this.isDead=false;

        this.setCollideWorldBounds(true);
        this.setBodySize(90,120).setOffset(26,18);
        this.body.setGravityY(900);
    }

    die(){
        if(this.isDead) return;
        this.isDead=true;
        this.body.stop();
        this.body.enable=false;
        this.setActive(false);
        this.setVisible(false);
        this.disableBody(true,true);
    }
}

/* =========================================================
   GAME SCENE
========================================================= */
class GameScene extends Phaser.Scene {
    constructor(){
        super('GameScene');
        this.worldWidth=6000;
        this.worldHeight=832;
        this.maxHP=3;
        this.totalHearts=25;
    }

    init(data){
        this.selectedPlayer=data.player;
        this.enemyType=this.selectedPlayer==='player1'?'player2':'player1';
        this.hp=this.maxHP;
        this.heartsCollected=0;
    }

    preload(){
        const p=this.selectedPlayer,e=this.enemyType;

        this.load.image(`${p}_idle`,`assets/${p}/idle.png`);
        this.load.spritesheet(`${p}_walk`,`assets/${p}/walk.png`,{frameWidth:142,frameHeight:142});
        this.load.image(`${e}_idle`,`assets/${e}/idle.png`);
        this.load.spritesheet(`${e}_walk`,`assets/${e}/walk.png`,{frameWidth:142,frameHeight:142});

        this.load.image('bg','assets/backgrounds/bg.png');
        this.load.image('ground','assets/platforms/ground.png');
        for(let i=1;i<=4;i++) this.load.image(`pf${i}`,`assets/platforms/platform_${i}.png`);
        this.load.image('heart_collect','assets/items/heart_v4.png');
    }

    create(){
        const p=this.selectedPlayer;

        if(!this.anims.exists(`${p}_idle`)){
            this.anims.create({key:`${p}_idle`,frames:[{key:`${p}_idle`}],repeat:-1});
            this.anims.create({
                key:`${p}_walk`,
                frames:this.anims.generateFrameNumbers(`${p}_walk`),
                frameRate:10,
                repeat:-1
            });
        }

        this.physics.world.setBounds(0,0,this.worldWidth,this.worldHeight);
        this.bg=this.add.tileSprite(0,0,this.worldWidth,this.worldHeight,'bg').setOrigin(0);

        /* GROUND */
        this.ground=this.physics.add.staticGroup();
        const gW=this.textures.get('ground').getSourceImage().width;
        for(let i=0;i<this.worldWidth/gW;i++)
            this.ground.create(i*gW+gW/2,this.worldHeight,'ground').setOrigin(0.5,1).refreshBody();

        /* PLAYER */
        this.player=new Player(this,200,620,`${this.selectedPlayer}_idle`);
        this.physics.add.collider(this.player,this.ground);

        /* HEARTS */
        this.hearts=this.physics.add.staticGroup();
        for(let i=0;i<this.totalHearts;i++){
            const h=this.hearts.create(
                Phaser.Math.Between(300,this.worldWidth-300),
                Phaser.Math.Between(120,520),
                'heart_collect'
            ).setScale(0.45);

            this.tweens.add({targets:h,scale:0.55,duration:800,yoyo:true,repeat:-1});
        }

        this.physics.add.overlap(this.player,this.hearts,(p,h)=>{
            h.destroy();
            this.heartsCollected++;
            if(this.heartsCollected>=this.totalHearts){
                this.scene.start('WinScene');
            }
        });

        /* ENEMIES */
        this.enemies=this.physics.add.group();
        for(let i=0;i<5;i++)
            this.enemies.add(new Enemy(this,800+i*900,620,this.enemyType));

        this.physics.add.collider(this.enemies,this.ground);

        this.physics.add.collider(this.player,this.enemies,(p,e)=>{
            if(!e.active||e.isDead) return;

            if(p.body.velocity.y>0 && p.y<e.y){
                e.die();
                p.setVelocityY(-300);
            } else {
                p.takeHit(e.x);
                this.damage();
            }
        });

        this.cameras.main.startFollow(this.player,true,0.1,0.1);
        this.cameras.main.setBounds(0,0,this.worldWidth,this.worldHeight);
    }

    update(){
        this.bg.tilePositionX=this.cameras.main.scrollX*0.3;

        this.enemies.getChildren().forEach(e=>{
            if(!e.active||e.isDead) return;
            const dir=this.player.x<e.x?-1:1;
            e.setVelocityX(dir*e.speed);
            e.setFlipX(dir<0);
            e.anims.play(`${this.enemyType}_walk`,true);
        });
    }

    damage(){
        if(this.hp<=0) return;
        this.hp--;
        if(this.hp<=0){
            this.scene.start('LoseScene');
        }
    }
}

/* =========================================================
   WIN / LOSE SCENES
========================================================= */
class WinScene extends Phaser.Scene {
    constructor(){ super('WinScene'); }

    create(){
        const {width,height}=this.scale;
        this.bgFar=this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.bgMid=this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.bgNear=this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.add.text(width/2,height/2,'YOU WIN 🏆',{
            fontFamily:'UnifrakturCook',fontSize:'96px',fill:'#e8d9b0'
        }).setOrigin(0.5);

        this.add.text(width/2,height/2+120,'MENU',{
            fontFamily:'UnifrakturCook',fontSize:'48px',fill:'#e8d9b0'
        }).setOrigin(0.5).setInteractive()
          .on('pointerdown',()=>this.scene.start('MenuScene'));
    }

    update(){
        this.bgFar.tilePositionX+=0.2;
        this.bgMid.tilePositionX+=0.5;
        this.bgNear.tilePositionX+=1;
    }
}

class LoseScene extends Phaser.Scene {
    constructor(){ super('LoseScene'); }

    create(){
        const {width,height}=this.scale;
        this.bgFar=this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.bgMid=this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.bgNear=this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.add.text(width/2,height/2,'GAME OVER 💀',{
            fontFamily:'UnifrakturCook',fontSize:'96px',fill:'#e8d9b0'
        }).setOrigin(0.5);

        this.add.text(width/2,height/2+120,'MENU',{
            fontFamily:'UnifrakturCook',fontSize:'48px',fill:'#e8d9b0'
        }).setOrigin(0.5).setInteractive()
          .on('pointerdown',()=>this.scene.start('MenuScene'));
    }

    update(){
        this.bgFar.tilePositionX+=0.2;
        this.bgMid.tilePositionX+=0.5;
        this.bgNear.tilePositionX+=1;
    }
}

/* =========================================================
   CONFIG
========================================================= */
new Phaser.Game({
    type:Phaser.AUTO,
    width:1248,
    height:832,
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
    physics:{default:'arcade',arcade:{gravity:{y:900},debug:false}},
    scene:[MenuScene,SelectScene,GameScene,WinScene,LoseScene]
});
