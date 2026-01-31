/* =========================================================
   GLOBAL
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

        document.fonts.ready.then(()=>{
            const title={fontFamily:'UnifrakturCook',fontSize:'120px',fill:'#e8d9b0'};
            const btn={fontFamily:'UnifrakturCook',fontSize:'56px',fill:'#e8d9b0'};

            this.add.text(width/2,height/3,'Pink Yupik Arcade',title).setOrigin(0.5);

            const play=this.add.text(width/2,height/2,'PLAY',btn).setOrigin(0.5).setInteractive();
            const exit=this.add.text(width/2,height/2+100,'EXIT',btn).setOrigin(0.5).setInteractive();

            play.on('pointerdown',()=>this.scene.start('SelectScene'));
            exit.on('pointerdown',()=>tg?.close());

            this.tweens.add({targets:[play,exit],scale:1.1,duration:600,yoyo:true,repeat:-1});
        });
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

        document.fonts.ready.then(()=>{
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
        });
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

        this.body.setDragX(1200);
        this.body.setMaxVelocity(this.speed,1000);

        this.keys=scene.input.keyboard.addKeys({
            left:'A',right:'D',up:'W',
            left2:'LEFT',right2:'RIGHT',up2:'UP'
        });

        this.moveLeft=false;
        this.moveRight=false;
        this.jump=false;
    }

    preUpdate(t,d){
        super.preUpdate(t,d);

        const left=this.keys.left.isDown||this.keys.left2.isDown||this.moveLeft;
        const right=this.keys.right.isDown||this.keys.right2.isDown||this.moveRight;

        if(left) this.setVelocityX(-this.speed);
        else if(right) this.setVelocityX(this.speed);
        else this.setVelocityX(0);

        if((Phaser.Input.Keyboard.JustDown(this.keys.up)||Phaser.Input.Keyboard.JustDown(this.keys.up2)||this.jump)
            && this.jumpCount<this.maxJumps){
            this.setVelocityY(-this.jumpVelocity);
            this.jumpCount++;
        }

        if(this.body.blocked.down) this.jumpCount=0;

        if(Math.abs(this.body.velocity.x)>10) this.anims.play('walk',true);
        else this.anims.play('idle',true);
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
        this.load.image('heart_small','assets/items/heart_small.png');
    }

    create(){
        this.anims.create({key:'idle',frames:[{key:`${this.selectedPlayer}_idle`}],repeat:-1});
        this.anims.create({key:'walk',frames:this.anims.generateFrameNumbers(`${this.selectedPlayer}_walk`),frameRate:10,repeat:-1});
        this.anims.create({key:`${this.enemyType}_walk`,frames:this.anims.generateFrameNumbers(`${this.enemyType}_walk`),frameRate:10,repeat:-1});

        this.physics.world.setBounds(0,0,this.worldWidth,this.worldHeight);

        this.bg=this.add.tileSprite(0,0,this.worldWidth,this.worldHeight,'bg').setOrigin(0);

        /* GROUND */
        this.ground=this.physics.add.staticGroup();
        const gW=this.textures.get('ground').getSourceImage().width;
        for(let i=0;i<this.worldWidth/gW;i++)
            this.ground.create(i*gW+gW/2,this.worldHeight,'ground').setOrigin(0.5,1).refreshBody();

        /* PLATFORMS */
        this.platforms=this.physics.add.staticGroup();
        this.movingPlatforms=this.physics.add.group({allowGravity:false,immovable:true});
        this.movingList=[];

        let x=500;
        for(let i=0;i<20;i++){
            const y=Phaser.Math.Between(260,380);
            const moving=i%4===0;
            const key=`pf${Phaser.Math.Between(1,4)}`;

            const pf=moving?this.movingPlatforms.create(x,y,key):this.platforms.create(x,y,key);
            pf.refreshBody();

            if(moving){
                pf.isMoving=true;
                pf.speed=50;
                pf.dir=1;
                this.movingList.push(pf);
            }
            x+=300;
        }

        /* PLAYER */
        this.player=new Player(this,200,620,`${this.selectedPlayer}_idle`);
        this.physics.add.collider(this.player,this.ground);
        this.physics.add.collider(this.player,this.platforms);
        this.physics.add.collider(this.player,this.movingPlatforms);

        /* CAMERA */
        this.cameras.main.startFollow(this.player,true,0.1,0.1);
        this.cameras.main.setBounds(0,0,this.worldWidth,this.worldHeight);

        /* UI */
        document.fonts.ready.then(()=>{
            this.hpIcons=[];
            for(let i=0;i<this.maxHP;i++)
                this.hpIcons.push(this.add.image(20+i*40,100,'heart_small').setScrollFactor(0).setScale(0.3));

            this.heartText=this.add.text(20,60,`❤️ 0 / ${this.totalHearts}`,{
                fontFamily:'UnifrakturCook',fontSize:'32px',fill:'#e8d9b0'
            }).setScrollFactor(0);
        });

        /* HEARTS */
        this.hearts=this.physics.add.staticGroup();
        for(let i=0;i<this.totalHearts;i++){
            const h=this.hearts.create(
                Phaser.Math.Between(200,this.worldWidth-200),
                Phaser.Math.Between(100,500),
                'heart_collect'
            ).setScale(0.45);
        }

        this.physics.add.overlap(this.player,this.hearts,(p,h)=>{
            h.destroy();
            this.heartsCollected++;
            this.heartText.setText(`❤️ ${this.heartsCollected} / ${this.totalHearts}`);
            if(this.heartsCollected>=this.totalHearts){
                this.scene.start('WinScene',{player:this.selectedPlayer});
            }
        });

        /* ENEMIES */
        this.enemies=this.physics.add.group();
        for(let i=0;i<5;i++)
            this.enemies.add(new Enemy(this,800+i*900,620,this.enemyType));

        this.physics.add.collider(this.enemies,this.ground);
        this.physics.add.collider(this.enemies,this.platforms);

        this.physics.add.collider(this.player,this.enemies,(p,e)=>{
            if(p.body.velocity.y>0 && p.y<e.y){
                e.die();
                p.setVelocityY(-300);
            } else {
                this.damage();
            }
        });
    }

    update(){
        this.bg.tilePositionX=this.cameras.main.scrollX*0.3;

        this.movingList.forEach(p=>{
            p.x+=p.speed*p.dir*(1/60);
            if(p.x<200||p.x>this.worldWidth-200) p.dir*=-1;
            p.body.updateFromGameObject();
        });

        this.enemies.getChildren().forEach(e=>{
            if(e.isDead) return;
            const dir=this.player.x<e.x?-1:1;
            e.setVelocityX(dir*e.speed);
            e.setFlipX(dir<0);
            e.anims.play(`${this.enemyType}_walk`,true);
        });
    }

    damage(){
        if(this.hp<=0) return;
        this.hp--;
        if(this.hpIcons[this.hp]) this.hpIcons[this.hp].setAlpha(0);
        if(this.hp<=0) this.scene.start('LoseScene',{player:this.selectedPlayer});
    }
}

/* =========================================================
   END SCENES
========================================================= */
class EndScene extends Phaser.Scene {
    constructor(key,text){ super(key); this.text=text; }
    create(data){
        const {width,height}=this.scale;
        document.fonts.ready.then(()=>{
            this.add.text(width/2,height/2,this.text,{
                fontFamily:'UnifrakturCook',fontSize:'96px',fill:'#e8d9b0'
            }).setOrigin(0.5);

            this.add.text(width/2,height/2+120,'MENU',{
                fontFamily:'UnifrakturCook',fontSize:'48px',fill:'#e8d9b0'
            }).setOrigin(0.5).setInteractive()
            .on('pointerdown',()=>this.scene.start('MenuScene'));
        });
    }
}

class WinScene extends EndScene{constructor(){super('WinScene','YOU WIN 🏆');}}
class LoseScene extends EndScene{constructor(){super('LoseScene','GAME OVER 💀');}}

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
