/* ===================== GLOBAL ===================== */
let selectedPlayer = 'player1';

/* ===================== TELEGRAM ===================== */
let tg = null;
if (window.Telegram?.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
}

/* ===================== MENU SCENE ===================== */
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    preload() {
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');
    }

    create() {
        const { width, height } = this.scale;

        this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        const style = { fontFamily:'UnifrakturCook', fontSize:'64px', fill:'#e8d9b0' };

        this.add.text(width/2, height/3, 'Pink Yupik', style).setOrigin(0.5);

        const play = this.add.text(width/2, height/2, 'PLAY', style)
            .setOrigin(0.5).setInteractive();
        play.on('pointerdown', ()=>this.scene.start('SelectScene'));
    }
}

/* ===================== SELECT SCENE ===================== */
class SelectScene extends Phaser.Scene {
    constructor(){ super('SelectScene'); }

    preload() {
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');
        this.load.image('p1','assets/player1/idle.png');
        this.load.image('p2','assets/player2/idle.png');
    }

    create() {
        const { width, height } = this.scale;

        this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        const style = { fontFamily:'UnifrakturCook', fontSize:'48px', fill:'#e8d9b0' };

        this.add.text(width/2,100,'Select Hero',style).setOrigin(0.5);

        this.add.image(width/2-150,height/2,'p1')
            .setInteractive()
            .on('pointerdown',()=>{
                selectedPlayer='player1';
                this.scene.start('GameScene');
            });

        this.add.image(width/2+150,height/2,'p2')
            .setInteractive()
            .on('pointerdown',()=>{
                selectedPlayer='player2';
                this.scene.start('GameScene');
            });
    }
}

/* ===================== GAME SCENE ===================== */
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.worldWidth = 5000;
        this.maxEnemies = 5;
        this.totalBigHearts = 25;
        this.hp = 3;
    }

    preload() {
        const p = selectedPlayer;
        const e = p === 'player1' ? 'player2' : 'player1';

        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');

        this.load.image('ground','assets/platforms/ground.png');
        this.load.image('platform','assets/platforms/platform_1.png');

        this.load.image('bigHeart','assets/items/heart_v4.png');
        this.load.image('smallHeart','assets/items/heart_small.png');

        this.load.spritesheet('playerWalk',`assets/${p}/walk.png`,{frameWidth:142,frameHeight:142});
        this.load.image('playerIdle',`assets/${p}/idle.png`);

        this.load.spritesheet('enemyWalk',`assets/${e}/walk.png`,{frameWidth:142,frameHeight:142});
        this.load.image('enemyIdle',`assets/${e}/idle.png`);
    }

    create() {
        const { width, height } = this.scale;

        /* --- BG --- */
        this.bgFar = this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0).setScrollFactor(0);
        this.bgMid = this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0).setScrollFactor(0);
        this.bgNear= this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0).setScrollFactor(0);

        /* --- WORLD --- */
        this.physics.world.setBounds(0,0,this.worldWidth,height);

        /* --- GROUND --- */
        this.ground = this.physics.add.staticGroup();
        for(let x=0;x<this.worldWidth;x+=256){
            this.ground.create(x, height-32,'ground').setOrigin(0,1);
        }

        /* --- PLATFORMS --- */
        this.platforms = this.physics.add.staticGroup();
        for(let i=0;i<20;i++){
            this.platforms.create(
                300+i*200,
                Phaser.Math.Between(300,550),
                'platform'
            );
        }

        /* --- PLAYER --- */
        this.player = this.physics.add.sprite(100,400,'playerIdle');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0);

        this.anims.create({
            key:'walk',
            frames:this.anims.generateFrameNumbers('playerWalk',{start:0,end:7}),
            frameRate:10,
            repeat:-1
        });

        this.physics.add.collider(this.player,this.ground);
        this.physics.add.collider(this.player,this.platforms);

        /* --- CAMERA --- */
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0,0,this.worldWidth,height);

        /* --- INPUT --- */
        this.cursors = this.input.keyboard.createCursorKeys();

        /* --- BIG HEARTS --- */
        this.bigHearts = this.physics.add.staticGroup();
        for(let i=0;i<this.totalBigHearts;i++){
            this.bigHearts.create(
                400 + i*180,
                Phaser.Math.Between(200,500),
                'bigHeart'
            );
        }

        this.collectedBigHearts = 0;

        this.physics.add.overlap(this.player,this.bigHearts,(p,h)=>{
            h.destroy();
            this.collectedBigHearts++;
            if(this.collectedBigHearts >= this.totalBigHearts){
                this.endScreen(true);
            }
        });

        /* --- ENEMIES --- */
        this.enemies = this.physics.add.group();
        for(let i=0;i<this.maxEnemies;i++){
            const enemy = this.enemies.create(
                800 + i*600,
                400,
                'enemyIdle'
            );
            enemy.startX = enemy.x;
            enemy.setCollideWorldBounds(true);
            enemy.direction = 1;
        }

        this.physics.add.collider(this.enemies,this.ground);
        this.physics.add.collider(this.enemies,this.platforms);

        this.physics.add.collider(this.player,this.enemies,(player,enemy)=>{
            if(player.body.velocity.y > 0 && player.y < enemy.y){
                enemy.disableBody(true,true);
                const heart = this.physics.add.image(enemy.x,enemy.y,'smallHeart');
                heart.setBounce(0.3);
                this.physics.add.collider(heart,this.ground);
                this.physics.add.overlap(player,heart,(p,h)=>{
                    h.destroy();
                    this.hp = Math.min(this.hp+1,3);
                });
                player.setVelocityY(-300);
            } else {
                this.endScreen(false);
            }
        });
    }

    endScreen(win){
        this.physics.pause();

        const { width, height } = this.scale;
        this.add.rectangle(
            this.cameras.main.scrollX,
            0,
            width,
            height,
            0x000000,
            0.6
        ).setOrigin(0);

        const style = { fontFamily:'UnifrakturCook', fontSize:'64px', fill:'#e8d9b0' };

        this.add.text(
            this.cameras.main.scrollX + width/2,
            height/3,
            win?'YOU WIN':'YOU DIED',
            style
        ).setOrigin(0.5);

        const play = this.add.text(
            this.cameras.main.scrollX + width/2,
            height/2,
            'PLAY',
            style
        ).setOrigin(0.5).setInteractive();

        play.on('pointerdown',()=>this.scene.restart());

        const exit = this.add.text(
            this.cameras.main.scrollX + width/2,
            height/2+100,
            'EXIT',
            style
        ).setOrigin(0.5).setInteractive();

        exit.on('pointerdown',()=>this.scene.start('MenuScene'));
    }

    update() {
        this.bgFar.tilePositionX = this.cameras.main.scrollX * 0.2;
        this.bgMid.tilePositionX = this.cameras.main.scrollX * 0.4;
        this.bgNear.tilePositionX= this.cameras.main.scrollX * 0.6;

        if(this.cursors.left.isDown){
            this.player.setVelocityX(-200);
            this.player.anims.play('walk',true);
            this.player.setFlipX(true);
        } else if(this.cursors.right.isDown){
            this.player.setVelocityX(200);
            this.player.anims.play('walk',true);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.stop();
        }

        if(this.cursors.up.isDown && this.player.body.blocked.down){
            this.player.setVelocityY(-500);
        }

        this.enemies.children.iterate(enemy=>{
            if(!enemy.active) return;
            enemy.setVelocityX(80 * enemy.direction);
            if(Math.abs(enemy.x - enemy.startX) > 200){
                enemy.direction *= -1;
            }
        });
    }
}

/* ===================== CONFIG ===================== */
new Phaser.Game({
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default:'arcade',
        arcade:{ gravity:{y:900}, debug:false }
    },
    scene:[MenuScene,SelectScene,GameScene]
});
