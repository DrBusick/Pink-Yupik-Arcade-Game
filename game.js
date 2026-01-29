// ================== GLOBAL ==================
let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
}

// ================== MENU ==================
class MenuScene extends Phaser.Scene {
    constructor(){ super('MenuScene'); }

    preload(){
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');
    }

    create(){
        const {width,height} = this.scale;

        this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        const style = {
            fontFamily:'UnifrakturCook',
            fontSize:'64px',
            fill:'#e8d9b0'
        };

        this.add.text(width/2,200,'Pink Yupik Arcade',style).setOrigin(0.5);

        const play = this.add.text(width/2,360,'PLAY',style)
            .setOrigin(0.5).setInteractive();
        const exit = this.add.text(width/2,460,'EXIT',style)
            .setOrigin(0.5).setInteractive();

        play.on('pointerdown',()=>this.scene.start('SelectScene'));
        exit.on('pointerdown',()=>window.close());
    }
}

// ================== SELECT ==================
class SelectScene extends Phaser.Scene {
    constructor(){ super('SelectScene'); }

    preload(){
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');
        this.load.image('p1','assets/player1/idle.png');
        this.load.image('p2','assets/player2/idle.png');
    }

    create(){
        const {width,height} = this.scale;

        this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.add.text(width/2,120,'Select Character',{
            fontFamily:'UnifrakturCook',
            fontSize:'56px',
            fill:'#e8d9b0'
        }).setOrigin(0.5);

        this.add.image(width/2-200,height/2,'p1')
            .setInteractive()
            .on('pointerdown',()=>this.scene.start('GameScene',{player:'player1'}));

        this.add.image(width/2+200,height/2,'p2')
            .setInteractive()
            .on('pointerdown',()=>this.scene.start('GameScene',{player:'player2'}));
    }
}

// ================== ENEMY ==================
class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y){
        super(scene,x,y,'enemy_idle');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.body.setSize(80,100);
        this.speed = 60;
        this.chaseRange = 400;
        this.isDead = false;
        this.dir = 1;
    }

    update(player){
        if(this.isDead) return;

        const dx = player.x - this.x;
        const dy = Math.abs(player.y - this.y);

        if(dy < 40) {
            this.setVelocityX(0);
            return;
        }

        if(Math.abs(dx) < this.chaseRange){
            this.dir = Math.sign(dx);
        }

        this.setVelocityX(this.speed * this.dir);
        this.setFlipX(this.dir < 0);
    }

    die(){
        this.isDead = true;
        this.disableBody(true,true);
    }
}

// ================== GAME ==================
class GameScene extends Phaser.Scene {
    constructor(){
        super('GameScene');
        this.worldWidth = 5000;
        this.maxHP = 3;
    }

    init(data){
        this.playerKey = data.player || 'player1';
        this.enemyKey = this.playerKey === 'player1' ? 'player2' : 'player1';
    }

    preload(){
        const p = this.playerKey;
        const e = this.enemyKey;

        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');
        this.load.image('ground','assets/platforms/ground.png');

        for(let i=1;i<=4;i++){
            this.load.image(`pf${i}`,`assets/platforms/platform_${i}.png`);
        }

        this.load.image(`${p}_idle`,`assets/${p}/idle.png`);
        this.load.spritesheet(`${p}_walk`,`assets/${p}/walk.png`,
            {frameWidth:142,frameHeight:142});

        this.load.image('enemy_idle',`assets/${e}/idle.png`);
        this.load.spritesheet('enemy_walk',`assets/${e}/walk.png`,
            {frameWidth:142,frameHeight:142});

        this.load.image('heart_big','assets/items/heart_v4.png');
        this.load.image('heart_small','assets/items/heart_small.png');
    }

    create(){
        const {width,height} = this.scale;

        // ----- PARALLAX -----
        this.bgFar = this.add.tileSprite(0,0,width,height,'bg_far')
            .setOrigin(0).setScrollFactor(0);
        this.bgMid = this.add.tileSprite(0,0,width,height,'bg_mid')
            .setOrigin(0).setScrollFactor(0);
        this.bgNear = this.add.tileSprite(0,0,width,height,'bg_near')
            .setOrigin(0).setScrollFactor(0);

        this.physics.world.setBounds(0,0,this.worldWidth,height);

        // ----- GROUND -----
        this.ground = this.physics.add.staticGroup();
        const gW = this.textures.get('ground').getSourceImage().width;
        for(let i=0;i<this.worldWidth/gW;i++){
            this.ground.create(i*gW+gW/2,height,'ground')
                .setOrigin(0.5,1).refreshBody();
        }

        // ----- PLAYER -----
        this.player = this.physics.add.sprite(200,300,`${this.playerKey}_idle`);
        this.player.setCollideWorldBounds(true);
        this.player.hp = this.maxHP;
        this.player.invul = false;

        this.physics.add.collider(this.player,this.ground);

        // ----- ENEMIES -----
        this.enemies = this.physics.add.group();
        for(let i=0;i<5;i++){
            const e = new Enemy(this,800+i*600,300);
            this.enemies.add(e);
        }

        this.physics.add.collider(this.enemies,this.ground);

        this.physics.add.collider(this.player,this.enemies,(p,e)=>{
            if(e.isDead) return;

            const stomp =
                p.body.velocity.y > 0 &&
                p.body.bottom <= e.body.top + 10;

            if(stomp){
                e.die();
                this.spawnSmallHeart(e.x,e.y);
                p.setVelocityY(-300);
            } else {
                this.hitPlayer();
            }
        });

        // ----- BIG HEARTS -----
        this.bigHearts = this.physics.add.staticGroup();
        for(let i=0;i<25;i++){
            this.bigHearts.create(
                Phaser.Math.Between(300,this.worldWidth-300),
                Phaser.Math.Between(200,450),
                'heart_big'
            );
        }

        this.physics.add.overlap(this.player,this.bigHearts,(p,h)=>{
            h.destroy();
            this.collected++;
            this.counter.setText(`${this.collected} / 25`);
            if(this.collected === 25) this.showEndScreen(true);
        });

        // ----- SMALL HEARTS -----
        this.smallHearts = this.physics.add.group({allowGravity:true});
        this.physics.add.collider(this.smallHearts,this.ground);

        this.physics.add.overlap(this.player,this.smallHearts,(p,h)=>{
            h.destroy();
            if(p.hp < this.maxHP) p.hp++;
            this.updateHP();
        });

        // ----- UI -----
        this.collected = 0;
        this.ui = this.add.container(0,0).setScrollFactor(0);

        this.counter = this.add.text(20,20,'0 / 25',{
            fontSize:'32px',
            fill:'#e8d9b0'
        });

        this.ui.add(this.counter);

        this.hpIcons = [];
        for(let i=0;i<this.maxHP;i++){
            const h = this.add.image(20+i*40,70,'heart_big')
                .setScale(0.4);
            this.hpIcons.push(h);
            this.ui.add(h);
        }

        // ----- CAMERA -----
        this.cameras.main.startFollow(this.player,true,0.1,0.1);
        this.cameras.main.setBounds(0,0,this.worldWidth,height);
    }

    spawnSmallHeart(x,y){
        const h = this.smallHearts.create(x,y,'heart_small');
        h.setBounce(0.3);
    }

    hitPlayer(){
        if(this.player.invul) return;
        this.player.invul = true;
        this.player.hp--;
        this.updateHP();

        this.time.delayedCall(800,()=>this.player.invul=false);

        if(this.player.hp <= 0){
            this.showEndScreen(false);
        }
    }

    updateHP(){
        this.hpIcons.forEach((h,i)=>{
            h.setAlpha(i < this.player.hp ? 1 : 0.3);
        });
    }

    showEndScreen(win){
        this.physics.pause();

        const {width,height} = this.scale;

        const bg = this.add.container(0,0).setScrollFactor(0);
        bg.add(this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0));
        bg.add(this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0));
        bg.add(this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0));

        const color = '#e8d9b0';

        const text = this.add.text(width/2,height/2-80,
            win ? 'YOU WIN!' : 'GAME OVER',{
            fontFamily:'UnifrakturCook',
            fontSize:'72px',
            fill:color
        }).setOrigin(0.5);

        const play = this.add.text(width/2,height/2,'PLAY',{
            fontFamily:'UnifrakturCook',
            fontSize:'48px',
            fill:color
        }).setOrigin(0.5).setInteractive();

        const exit = this.add.text(width/2,height/2+80,'EXIT',{
            fontFamily:'UnifrakturCook',
            fontSize:'48px',
            fill:color
        }).setOrigin(0.5).setInteractive();

        play.on('pointerdown',()=>this.scene.restart({player:this.playerKey}));
        exit.on('pointerdown',()=>this.scene.start('MenuScene'));
    }

    update(){
        this.bgFar.tilePositionX = this.cameras.main.scrollX * 0.2;
        this.bgMid.tilePositionX = this.cameras.main.scrollX * 0.4;
        this.bgNear.tilePositionX = this.cameras.main.scrollX * 0.6;

        this.enemies.getChildren().forEach(e=>e.update(this.player));
    }
}

// ================== CONFIG ==================
new Phaser.Game({
    type: Phaser.AUTO,
    width: 1248,
    height: 832,
    scale:{
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics:{
        default:'arcade',
        arcade:{gravity:{y:900},debug:false}
    },
    scene:[MenuScene,SelectScene,GameScene]
});
