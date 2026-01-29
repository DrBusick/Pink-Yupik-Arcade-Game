/* =========================================================
   GLOBAL
========================================================= */
let selectedPlayer = 'player1';
let tg = null;

// Telegram WebApp
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
        const {width,height} = this.scale;

        this.bgFar  = this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.bgMid  = this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.bgNear = this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        const titleStyle = { fontFamily:'UnifrakturCook', fontSize:'120px', fill:'#e8d9b0' };
        const optionStyle = { fontFamily:'UnifrakturCook', fontSize:'56px', fill:'#e8d9b0' };

        this.add.text(width/2,height/3,'Pink Yupik Arcade', titleStyle).setOrigin(0.5);

        this.playBtn = this.add.text(width/2,height/2,'PLAY',optionStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown',()=>this.scene.start('SelectScene'));

        this.exitBtn = this.add.text(width/2,height/2+100,'EXIT',optionStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown',()=>{
                if(window.Telegram?.WebApp) window.Telegram.WebApp.close();
            });

        // Анімація кнопок
        this.tweens.add({
            targets:[this.playBtn,this.exitBtn],
            scale:1.1,
            duration:600,
            yoyo:true,
            repeat:-1,
            ease:'Sine.easeInOut'
        });
    }

    update(){
        this.bgFar.tilePositionX += 0.2;
        this.bgMid.tilePositionX += 0.5;
        this.bgNear.tilePositionX += 1;
    }
}

/* =========================================================
   SELECT SCENE
========================================================= */
class SelectScene extends Phaser.Scene {
    constructor(){ super('SelectScene'); }

    preload(){
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');
        this.load.image('platform','assets/platforms/platform_1.png');
        this.load.image('player1_idle','assets/player1/idle.png');
        this.load.image('player2_idle','assets/player2/idle.png');
    }

    create(){
        const {width,height} = this.scale;
        const titleStyle = { fontFamily:'UnifrakturCook', fontSize:'64px', fill:'#e8d9b0' };
        const optionStyle = { fontFamily:'UnifrakturCook', fontSize:'56px', fill:'#e8d9b0' };

        this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.add.text(width/2,120,'Select Character', titleStyle).setOrigin(0.5);

        const y = height/2 + 120;
        this.add.image(width/2-220,y,'platform');
        this.add.image(width/2+220,y,'platform');

        const p1=this.add.image(width/2-220,y-110,'player1_idle')
            .setInteractive()
            .on('pointerdown',()=>this.scene.start('GameScene',{player:'player1'}));

        const p2=this.add.image(width/2+220,y-110,'player2_idle')
            .setInteractive()
            .on('pointerdown',()=>this.scene.start('GameScene',{player:'player2'}));

        this.tweens.add({
            targets:[p1,p2],
            scale:1.1,
            duration:600,
            yoyo:true,
            repeat:-1,
            ease:'Sine.easeInOut'
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
        this.accel=900;
        this.jumpVelocity=520;
        this.jumpCount=0;
        this.maxJumps=3;

        this.body.setDragX(1200);
        this.body.setMaxVelocity(this.speed,1000);

        this.keys=scene.input.keyboard.addKeys({
            left:'A', right:'D', up:'W',
            left2:'LEFT', right2:'RIGHT', up2:'UP'
        });

        this.moveLeft=false;
        this.moveRight=false;
        this.jump=false;
    }

    preUpdate(t,d){
        super.preUpdate(t,d);

        const l=this.keys.left.isDown||this.keys.left2.isDown||this.moveLeft;
        const r=this.keys.right.isDown||this.keys.right2.isDown||this.moveRight;

        if(l) this.setAccelerationX(-this.accel);
        else if(r) this.setAccelerationX(this.accel);
        else this.setAccelerationX(0);

        if(((Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.up2)) || this.jump) &&
            this.jumpCount<this.maxJumps){
            this.setVelocityY(-this.jumpVelocity);
            this.jumpCount++;
        }

        if(this.body.blocked.down) this.jumpCount=0;

        if(l) this.setFlipX(true);
        else if(r) this.setFlipX(false);

        if(Math.abs(this.body.velocity.x)>5) this.anims.play('walk',true);
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
        this.speed=120;
        this.startX=x;
        this.direction=1;
        this.chaseRange=450;
        this.isDead=false;

        this.setCollideWorldBounds(true);
        this.setBodySize(90,120).setOffset(26,18);
    }

    preUpdate(t,d){
        super.preUpdate(t,d);
        if(this.isDead) return;

        const p=this.scene.player;
        const dist=Phaser.Math.Distance.Between(this.x,this.y,p.x,p.y);

        if(dist<this.chaseRange){
            const dir=p.x<this.x?-1:1;
            this.setVelocityX(dir*this.speed);
            this.setFlipX(dir<0);
        } else {
            this.setVelocityX(this.direction*this.speed);
            if(Math.abs(this.x-this.startX)>300) this.direction*=-1;
            this.setFlipX(this.direction<0);
        }

        if(Math.abs(this.body.velocity.x)>5)
            this.anims.play(`${this.type}_walk`,true);
        else
            this.anims.play(`${this.type}_idle`,true);
    }

    die(){
        if(this.isDead) return;
        this.isDead=true;
        this.disableBody(true,true);

        // маленьке серце для відновлення HP
        const h = this.scene.physics.add.image(this.x, this.y - 20, 'heart_small')
            .setScale(0.4)
            .setBounce(0.4)
            .setVelocity(Phaser.Math.Between(-80, 80), -260)
            .setCollideWorldBounds(true);

        this.scene.physics.add.collider(h,this.scene.ground);
        this.scene.physics.add.collider(h,this.scene.platforms);
        this.scene.physics.add.collider(h,this.scene.movingPlatforms);

        this.scene.physics.add.overlap(this.scene.player,h,()=>{
            h.destroy();
            this.scene.hp = Math.min(this.scene.hp + 1, this.scene.maxHP);
            this.scene.hpIcons[this.scene.hp-1].setAlpha(1);
        });
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
        this.hp=3;
        this.totalHearts=25;
        this.heartsCollected=0;
    }

    init(data){
        this.selectedPlayer=data.player;
        this.enemyType=this.selectedPlayer==='player1'?'player2':'player1';
    }

    preload(){
        const p=this.selectedPlayer,e=this.enemyType;

        this.load.image(`${p}_idle`,`assets/${p}/idle.png`);
        this.load.spritesheet(`${p}_walk`,`assets/${p}/walk.png`,{frameWidth:142,frameHeight:142});
        this.load.image(`${e}_idle`,`assets/${e}/idle.png`);
        this.load.spritesheet(`${e}_walk`,`assets/${e}/walk.png`,{frameWidth:142,frameHeight:142});

        this.load.image('bg','assets/backgrounds/bg.png');
        this.load.image('ground','assets/platforms/ground.png');

        for(let i=1;i<=4;i++)
            this.load.image(`pf${i}`,'assets/platforms/platform_'+i+'.png');

        this.load.image('heart_collect','assets/items/heart_v4.png'); // великі серця
        this.load.image('heart_small','assets/items/heart_small.png');  // малі серця
    }

    create(){
        /* ANIMS */
        this.anims.create({key:'idle',frames:[{key:`${this.selectedPlayer}_idle`}],repeat:-1});
        this.anims.create({key:'walk',frames:this.anims.generateFrameNumbers(`${this.selectedPlayer}_walk`),frameRate:10,repeat:-1});
        this.anims.create({key:`${this.enemyType}_idle`,frames:[{key:`${this.enemyType}_idle`}],repeat:-1});
        this.anims.create({key:`${this.enemyType}_walk`,frames:this.anims.generateFrameNumbers(`${this.enemyType}_walk`),frameRate:10,repeat:-1});

        this.physics.world.setBounds(0,0,this.worldWidth,this.worldHeight);
        this.bg=this.add.tileSprite(0,0,this.worldWidth,832,'bg').setOrigin(0);

        /* GROUND */
        this.ground=this.physics.add.staticGroup();
        const gW=this.textures.get('ground').getSourceImage().width;
        for(let i=0;i<this.worldWidth/gW;i++)
            this.ground.create(i*gW+gW/2,this.worldHeight,'ground')
                .setOrigin(0.5,1).refreshBody();

        /* PLATFORMS */
        this.platforms=this.physics.add.staticGroup();
        this.movingPlatforms=this.physics.add.group({allowGravity:false,immovable:true});
        this.spawnPlatformsSafe();

        /* PLAYER */
        this.player=new Player(this,200,620,`${this.selectedPlayer}_idle`);
        this.physics.add.collider(this.player,this.ground);
        this.physics.add.collider(this.player,this.platforms);
        this.physics.add.collider(this.player,this.movingPlatforms);

        if(this.sys.game.device.os.android || this.sys.game.device.os.iOS){
            this.createMobileButtons();
        }

        /* CAMERA */
        this.cameras.main.startFollow(this.player,true,0.12,0.12);
        this.cameras.main.setBounds(0,0,this.worldWidth,this.worldHeight);

        /* UI */
        this.hpIcons=[];
        for(let i=0;i<this.maxHP;i++)
            this.hpIcons.push(this.add.image(20+i*40,100,'heart_small').setScrollFactor(0).setScale(0.3));

        this.heartText=this.add.text(20,60,`❤️ 0 / ${this.totalHearts}`,{
            fontSize:'32px',fill:'#e8d9b0', fontFamily:'UnifrakturCook'
        }).setScrollFactor(0);

        /* HEARTS (великий рахунок) */
        this.hearts = this.physics.add.staticGroup();
        this.spawnHeartsSafe(this.totalHearts);

        this.physics.add.overlap(this.player,this.hearts,(p,h)=>{
            h.destroy();
            this.heartsCollected++;
            this.heartText.setText(`❤️ ${this.heartsCollected} / ${this.totalHearts}`);
            if(this.heartsCollected>=this.totalHearts){
                this.scene.start('WinScene',{player:this.selectedPlayer});
            }
        });

        /* ENEMIES */
        this.enemies = this.physics.add.group();
        for(let i=0;i<5;i++)
            this.enemies.add(new Enemy(this, 800+i*900, 620, this.enemyType));

        this.physics.add.collider(this.enemies,this.ground);
        this.physics.add.collider(this.enemies,this.platforms);

        // Вбивство ворога зверху
        this.physics.add.collider(this.player,this.enemies,(p,e)=>{
            if(!e.isDead && p.body.velocity.y>0 && p.y<e.y){
                e.die();
                p.setVelocityY(-350);
            } else if(!e.isDead){
                this.damage();
            }
        });
    }

    damage(){
        this.hp--;
        if(this.hp<0) this.hp=0;
        this.hpIcons[this.hp]?.setAlpha(0);

        if(this.hp<=0){
            this.scene.start('LoseScene',{player:this.selectedPlayer});
        }
    }

    spawnPlatformsSafe(){
        let x=500;
        for(let i=0;i<15;i++){
            const y=Phaser.Math.Between(260,380);
            this.platforms.create(x,y,`pf${Phaser.Math.Between(1,4)}`).refreshBody();
            x+=Phaser.Math.Between(280,340);
        }
    }

    spawnHeartsSafe(count){
        const plats=this.platforms.getChildren();
        for(let i=0;i<count;i++){
            const p=Phaser.Utils.Array.GetRandom(plats);
            this.hearts.create(p.x,p.getBounds().top-30,'heart_collect')
                .setScale(0.45).refreshBody();
        }
    }

    createMobileButtons(){
        const left=this.add.dom(20,this.scale.height-80,'div','class=button','◀').setOrigin(0);
        const right=this.add.dom(100,this.scale.height-80,'div','class=button','▶').setOrigin(0);
        const jump=this.add.dom(this.scale.width-80,this.scale.height-80,'div','class=button','▲').setOrigin(0);

        left.addListener('pointerdown'); left.on('pointerdown',()=>this.player.moveLeft=true);
        left.addListener('pointerup'); left.on('pointerup',()=>this.player.moveLeft=false);

        right.addListener('pointerdown'); right.on('pointerdown',()=>this.player.moveRight=true);
        right.addListener('pointerup'); right.on('pointerup',()=>this.player.moveRight=false);

        jump.addListener('pointerdown'); jump.on('pointerdown',()=>this.player.jump=true);
        jump.addListener('pointerup'); jump.on('pointerup',()=>this.player.jump=false);
    }

    update(){
        this.bg.tilePositionX=this.cameras.main.scrollX*0.3;
    }
}

/* =========================================================
   WIN / LOSE SCENES
========================================================= */
class EndScene extends Phaser.Scene {
    constructor(key,text){
        super(key);
        this.label=text;
    }

    create(data){
        const {width,height}=this.scale;
        const style={ fontFamily:'UnifrakturCook', fontSize:'56px', fill:'#e8d9b0' };

        this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.add.text(width/2,height/3,this.label,{
            fontFamily:'UnifrakturCook', fontSize:'96px', fill:'#e8d9b0'
        }).setOrigin(0.5);

        this.playBtn = this.add.text(width/2,height/2,'PLAY',style)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown',()=>this.scene.start('GameScene',{player:data.player}));

        this.exitBtn = this.add.text(width/2,height/2+100,'EXIT',style)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown',()=>this.scene.start('MenuScene'));

        this.tweens.add({
            targets:[this.playBtn,this.exitBtn],
            scale:1.1,
            duration:600,
            yoyo:true,
            repeat:-1,
            ease:'Sine.easeInOut'
        });
    }
}

class WinScene extends EndScene {
    constructor(){ super('WinScene','YOU WIN 🏆'); }
}
class LoseScene extends EndScene {
    constructor(){ super('LoseScene','GAME OVER 💀'); }
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
