let selectedPlayer = 'player';

// ======================= MENU SCENE ========================
let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
}

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
        }).setOrigin(0.5).setShadow(0,0,'#fff2c1',20,true,true);

        this.tweens.add({
            targets: title,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const btnStyle = { fontFamily:'UnifrakturCook', fontSize:'56px', fill:'#e8d9b0' };

        const play = this.add.text(width/2, height/2 - 60, 'PLAY', btnStyle)
            .setOrigin(0.5).setInteractive({ useHandCursor:true });

        play.on('pointerover', () => this.hoverSound.play());
        play.on('pointerdown', () => this.scene.start('SelectScene'));

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

// ======================= SELECT SCENE ========================
class SelectScene extends Phaser.Scene {
    constructor(){ super('SelectScene'); }

    preload() {
        this.load.image('bg_far', 'assets/backgrounds/bg_far.png');
        this.load.image('bg_mid', 'assets/backgrounds/bg_mid.png');
        this.load.image('bg_near', 'assets/backgrounds/bg_near.png');

        this.load.image('p1_idle','assets/player1/idle.png');
        this.load.image('p2_idle','assets/player2/idle.png');
        this.load.image('select_platform','assets/platforms/platform_1.png');
    }

    create(){
        const {width,height}=this.scale;

        this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.add.text(width/2,120,'Select Character',{
            fontFamily:'UnifrakturCook',fontSize:'64px',fill:'#e8d9b0'
        }).setOrigin(0.5);

        const baseY = height/2 + 90;

        this.add.image(width/2 - 220, baseY, 'select_platform');
        this.add.image(width/2 + 220, baseY, 'select_platform');

        this.add.image(width/2 - 220, baseY - 110, 'p1_idle')
            .setInteractive()
            .on('pointerdown',()=>this.scene.start('GameScene',{player:'player1'}));

        this.add.image(width/2 + 220, baseY - 110, 'p2_idle')
            .setInteractive()
            .on('pointerdown',()=>this.scene.start('GameScene',{player:'player2'}));
    }
}

// ======================= PLAYER ========================
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type) {
        super(scene, x, y, `${type}_idle`);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBodySize(90,120).setOffset(26,18);

        this.speed = 260;
        this.accel = 1200;
        this.jumpVelocity = 520;

        this.jumpCount = 0;
        this.maxJumps = 3;

        this.facing = 'right';

        this.keys = scene.input.keyboard.addKeys({
            left:'A', right:'D', up:'W',
            left2:'LEFT', right2:'RIGHT', up2:'UP'
        });
    }

    preUpdate(t,d){
        super.preUpdate(t,d);

        const l=this.keys.left.isDown||this.keys.left2.isDown;
        const r=this.keys.right.isDown||this.keys.right2.isDown;

        if(l){ this.setAccelerationX(-this.accel); this.facing='left'; }
        else if(r){ this.setAccelerationX(this.accel); this.facing='right'; }
        else this.setAccelerationX(0);

        if(
            (Phaser.Input.Keyboard.JustDown(this.keys.up) ||
             Phaser.Input.Keyboard.JustDown(this.keys.up2)) &&
            this.jumpCount < this.maxJumps
        ){
            this.setVelocityY(-this.jumpVelocity);
            this.jumpCount++;
        }

        if(this.body.blocked.down) this.jumpCount = 0;

        this.setFlipX(this.facing==='left');
        this.anims.play(l||r?'walk':'idle',true);
    }
}

// ======================= ENEMY (AI) ========================
class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y,type){
        super(scene,x,y,`${type}_idle`);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.setCollideWorldBounds(true);
        this.setBodySize(90,120).setOffset(26,18);

        this.speed = 90;
        this.chaseRange = 450;
        this.stopRange = 60;

        this.play('enemy_walk');
    }

    preUpdate(){
        const p=this.scene.player;
        if(!p) return;

        const d=Phaser.Math.Distance.Between(this.x,this.y,p.x,p.y);
        if(d < this.chaseRange && d > this.stopRange){
            const dir = p.x < this.x ? -1 : 1;
            this.setVelocityX(this.speed * dir);
            this.setFlipX(dir < 0);
        } else this.setVelocityX(0);
    }
}

// ======================= GAME SCENE ========================
class GameScene extends Phaser.Scene {
    constructor(){
        super('GameScene');
        this.worldWidth = 6000;
        this.worldHeight = 832;

        this.maxHP = 3;
        this.hp = 3;
        this.isInvulnerable = false;
    }

    init(data){
        this.selectedPlayer = data.player;
        this.enemyType = this.selectedPlayer === 'player1' ? 'player2' : 'player1';
    }

    preload(){
        const p=this.selectedPlayer;
        const e=this.enemyType;

        this.load.image(`${p}_idle`,`assets/${p}/idle.png`);
        this.load.spritesheet(`${p}_walk`,`assets/${p}/walk.png`,
            {frameWidth:142,frameHeight:142});

        this.load.image(`${e}_idle`,`assets/${e}/idle.png`);
        this.load.spritesheet(`${e}_walk`,`assets/${e}/walk.png`,
            {frameWidth:142,frameHeight:142});

        this.load.image('ground','assets/platforms/ground.png');
        this.load.image('heart','assets/items/heart_v4.png');
    }

    create(){
        const p=this.selectedPlayer;
        const e=this.enemyType;

        this.anims.create({key:'idle',frames:[{key:`${p}_idle`}],repeat:-1});
        this.anims.create({
            key:'walk',
            frames:this.anims.generateFrameNumbers(`${p}_walk`),
            frameRate:10,
            repeat:-1
        });

        this.anims.create({
            key:'enemy_walk',
            frames:this.anims.generateFrameNumbers(`${e}_walk`),
            frameRate:8,
            repeat:-1
        });

        this.physics.world.setBounds(0,0,this.worldWidth,this.worldHeight);

        this.ground=this.physics.add.staticGroup();
        const gW=this.textures.get('ground').getSourceImage().width;
        for(let i=0;i<this.worldWidth/gW;i++)
            this.ground.create(i*gW+gW/2,this.worldHeight,'ground')
                .setOrigin(0.5,1).refreshBody();

        this.player=new Player(this,200,300,p);
        this.physics.add.collider(this.player,this.ground);

        // HP UI
        this.hpIcons=[];
        for(let i=0;i<this.maxHP;i++){
            this.hpIcons.push(
                this.add.image(20+i*40,40,'heart')
                    .setScrollFactor(0).setScale(0.5)
            );
        }

        // Enemies
        this.enemies=this.physics.add.group();
        for(let i=0;i<6;i++){
            this.enemies.add(new Enemy(this,600+i*500,300,e));
        }

        this.physics.add.collider(this.enemies,this.ground);
        this.physics.add.collider(
            this.player,
            this.enemies,
            this.handleEnemyCollision,
            null,
            this
        );

        // Heart drops
        this.dropHearts=this.physics.add.group();
        this.physics.add.collider(this.dropHearts,this.ground);
        this.physics.add.overlap(this.player,this.dropHearts,this.collectDropHeart,null,this);

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0,0,this.worldWidth,this.worldHeight);
    }

    handleEnemyCollision(player,enemy){
        if(player.body.velocity.y>0 && player.y<enemy.y-20){
            enemy.disableBody(true,true);
            player.setVelocityY(-350);
            this.spawnHeartDrop(enemy.x,enemy.y);
        } else this.onPlayerHit(player,enemy);
    }

    onPlayerHit(player){
        if(this.isInvulnerable) return;
        this.isInvulnerable=true;

        this.hp--;
        if(this.hpIcons[this.hp]) this.hpIcons[this.hp].setAlpha(0.3);

        this.tweens.add({
            targets:player,
            alpha:0,
            duration:80,
            yoyo:true,
            repeat:8
        });

        this.time.delayedCall(900,()=>{
            this.isInvulnerable=false;
            player.setAlpha(1);
        });

        if(this.hp<=0) this.scene.restart({player:this.selectedPlayer});
    }

    spawnHeartDrop(x,y){
        const h=this.dropHearts.create(x,y,'heart');
        h.setVelocity(Phaser.Math.Between(-120,120),-300);
        h.setScale(0.4);
    }

    collectDropHeart(player,heart){
        heart.destroy();
        if(this.hp<this.maxHP){
            this.hp++;
            this.hpIcons[this.hp-1].setAlpha(1);
        }
    }
}

// ======================= CONFIG ========================
new Phaser.Game({
    type:Phaser.AUTO,
    width:1248,
    height:832,
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
    physics:{default:'arcade',arcade:{gravity:{y:900},debug:false}},
    scene:[MenuScene,SelectScene,GameScene]
});
