/* =========================================================
   GLOBAL
========================================================= */
let selectedPlayer = 'player1';
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
        this.load.audio('hover','assets/sounds/hover.mp3');
    }
    create(){
        const {width,height} = this.scale;
        this.bgFar  = this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.bgMid  = this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.bgNear = this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        document.fonts.ready.then(()=>{
            const titleStyle = { fontFamily:'gameFont', fontSize:'120px', fill:'#e8d9b0' };
            const optionStyle = { fontFamily:'gameFont', fontSize:'56px', fill:'#e8d9b0' };

            this.add.text(width/2,height/3,'Pink Yupik Arcade', titleStyle).setOrigin(0.5);

            this.playBtn = this.add.text(width/2,height/2,'PLAY',optionStyle)
                .setOrigin(0.5)
                .setInteractive()
                .on('pointerover',()=>this.sound.play('hover'))
                .on('pointerdown',()=>this.scene.start('SelectScene'));

            this.exitBtn = this.add.text(width/2,height/2+100,'EXIT',optionStyle)
                .setOrigin(0.5)
                .setInteractive()
                .on('pointerover',()=>this.sound.play('hover'))
                .on('pointerdown',()=>window.close());

            this.tweens.add({
                targets:[this.playBtn,this.exitBtn],
                scale:1.1,
                duration:600,
                yoyo:true,
                repeat:-1,
                ease:'Sine.easeInOut'
            });
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
        this.load.audio('hover','assets/sounds/hover.mp3');
    }
    create(){
        const {width,height} = this.scale;
        this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        document.fonts.ready.then(()=>{
            const titleStyle = { fontFamily:'gameFont', fontSize:'64px', fill:'#e8d9b0' };
            this.add.text(width/2,120,'Select Character', titleStyle).setOrigin(0.5);

            const y = height/2 + 120;
            this.add.image(width/2-220,y,'platform');
            this.add.image(width/2+220,y,'platform');

            const p1=this.add.image(width/2-220,y-110,'player1_idle')
                .setInteractive()
                .on('pointerover',()=>this.sound.play('hover'))
                .on('pointerdown',()=>this.scene.start('GameScene',{player:'player1'}));

            const p2=this.add.image(width/2+220,y-110,'player2_idle')
                .setInteractive()
                .on('pointerover',()=>this.sound.play('hover'))
                .on('pointerdown',()=>this.scene.start('GameScene',{player:'player2'}));

            this.tweens.add({
                targets:[p1,p2],
                scale:1.1,
                duration:600,
                yoyo:true,
                repeat:-1,
                ease:'Sine.easeInOut'
            });
        });
    }
}

/* =========================================================
   PLAYER
========================================================= */
class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, key) {
        super(scene, x, y, key);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;

        // ФІЗИКА
        this.setCollideWorldBounds(true);
        this.setBodySize(90, 120);
        this.setOffset(26, 18);

        // РУХ
        this.speed = 180;
        this.accel = 900;
        this.jumpVelocity = 520;

        // СТРИБКИ
        this.jumpCount = 0;
        this.maxJumps = 3;
        this.jumpRequest = false;

        this.body.setDragX(1200);
        this.body.setMaxVelocity(this.speed, 1000);

        // КЛАВІАТУРА
        this.keys = scene.input.keyboard.addKeys({
            left: 'A',
            right: 'D',
            up: 'W',
            left2: 'LEFT',
            right2: 'RIGHT',
            up2: 'UP'
        });

        // МОБІЛЬНЕ КЕРУВАННЯ
        this.moveLeft = false;
        this.moveRight = false;

        // ЗВУК
        this.walkSound = null;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        /* ---------------------------
           ГОРИЗОНТАЛЬНИЙ РУХ
        --------------------------- */
        const left =
            this.keys.left.isDown ||
            this.keys.left2.isDown ||
            this.moveLeft;

        const right =
            this.keys.right.isDown ||
            this.keys.right2.isDown ||
            this.moveRight;

        if (left) {
            this.setAccelerationX(-this.accel);
        } else if (right) {
            this.setAccelerationX(this.accel);
        } else {
            this.setAccelerationX(0);
        }

        /* ---------------------------
           СТРИБОК (1 імпульс)
        --------------------------- */
        const jumpPressed =
            Phaser.Input.Keyboard.JustDown(this.keys.up) ||
            Phaser.Input.Keyboard.JustDown(this.keys.up2) ||
            this.jumpRequest;

        if (jumpPressed && this.jumpCount < this.maxJumps) {
            this.setVelocityY(-this.jumpVelocity);
            this.jumpCount++;
            this.jumpRequest = false;
            this.scene.sound.play('jump');
        }

        if (this.body.blocked.down) {
            this.jumpCount = 0;
        }

        /* ---------------------------
           НАПРЯМОК
        --------------------------- */
        if (left) this.setFlipX(true);
        else if (right) this.setFlipX(false);

        /* ---------------------------
           АНІМАЦІЇ + ЗВУК
        --------------------------- */
        if (Math.abs(this.body.velocity.x) > 5) {
            this.anims.play('walk', true);

            if (!this.walkSound) {
                this.walkSound = this.scene.sound.add('walk', {
                    loop: true,
                    volume: 0.2
                });
            }

            if (!this.walkSound.isPlaying) {
                this.walkSound.play();
            }
        } else {
            this.anims.play('idle', true);
            if (this.walkSound?.isPlaying) {
                this.walkSound.stop();
            }
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
        this.type=type; this.speed=120; this.isDead=false;
        this.setCollideWorldBounds(true).setBodySize(90,120).setOffset(26,18);
        this.direction=Phaser.Math.Between(0,1)?1:-1;
    }

   die(){
    if (this.isDead) return;

    this.isDead = true;
    this.disableBody(true, true);

    // маленьке серце після смерті
    this.scene.time.delayedCall(50, () => {

        const h = this.scene.physics.add.image(
            this.x,
            this.y - 20,
            'heart_small'
        )
        .setScale(0.4)
        .setBounce(0.4)
        .setCollideWorldBounds(true)
        .setVelocity(
            Phaser.Math.Between(-80, 80),
            -220
        )
        .setAngularVelocity(
            Phaser.Math.Between(-180, 180)
        );

        // колізії
        this.scene.physics.add.collider(h, this.scene.ground);
        this.scene.physics.add.collider(h, this.scene.platforms);
        this.scene.physics.add.collider(h, this.scene.movingPlatforms);

        // пульсація
        this.scene.tweens.add({
            targets: h,
            scale: 0.45,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // підбір серця (ОДИН раз)
        this.scene.physics.add.overlap(
            this.scene.player,
            h,
            () => {
                if (!h.active) return;

                h.destroy();

                this.scene.hp = Math.min(
                    this.scene.hp + 1,
                    this.scene.maxHP
                );

                const iconIndex = this.scene.hp - 1;
                if (this.scene.hpIcons[iconIndex]) {
                    this.scene.hpIcons[iconIndex].setAlpha(1);
                }

                this.scene.sound.play('collect');
            },
            null,
            this
        );

    });
}


/* =========================================================
   GAME SCENE
========================================================= */
class GameScene extends Phaser.Scene {
    constructor(){
        super('GameScene');
        this.worldWidth=6000; this.worldHeight=832;
        this.maxHP=3; this.hp=3;
        this.totalHearts=25; this.heartsCollected=0;
        this.movingPlatformsList=[];
    }

    init(data){
        this.selectedPlayer=data.player;
        this.enemyType=this.selectedPlayer==='player1'?'player2':'player1';
        this.heartsCollected=0; this.hp=this.maxHP;
    }

    preload(){
        const p=this.selectedPlayer,e=this.enemyType;
        this.load.image(`${p}_idle`,`assets/${p}/idle.png`);
        this.load.spritesheet(`${p}_walk`,`assets/${p}/walk.png`,{frameWidth:142,frameHeight:142});
        this.load.image(`${e}_idle`,`assets/${e}/idle.png`);
        this.load.spritesheet(`${e}_walk`,`assets/${e}/walk.png`,{frameWidth:142,frameHeight:142});

        this.load.image('bg','assets/backgrounds/bg.png');
        this.load.image('ground','assets/platforms/ground.png');
        for(let i=1;i<=4;i++) this.load.image(`pf${i}`,'assets/platforms/platform_'+i+'.png');

        this.load.image('heart_collect','assets/items/heart_v4.png');
        this.load.image('heart_small','assets/items/heart_small.png');

        this.load.image('left_btn','assets/UI/left_btn.png');
        this.load.image('right_btn','assets/UI/right_btn.png');
        this.load.image('jump_btn','assets/UI/jump_btn.png');

        this.load.audio('jump','assets/sounds/jump.mp3');
        this.load.audio('collect','assets/sounds/collect.mp3');
        this.load.audio('walk','assets/sounds/walk.mp3');
        this.load.audio('hover','assets/sounds/hover.mp3');
    }

    create(){
        const {width,height} = this.scale;
        this.anims.create({key:'idle',frames:[{key:`${this.selectedPlayer}_idle`}],repeat:-1});
        this.anims.create({key:'walk',frames:this.anims.generateFrameNumbers(`${this.selectedPlayer}_walk`),frameRate:10,repeat:-1});
        this.anims.create({key:`${this.enemyType}_idle`,frames:[{key:`${this.enemyType}_idle`}],repeat:-1});
        this.anims.create({key:`${this.enemyType}_walk`,frames:this.anims.generateFrameNumbers(`${this.enemyType}_walk`),frameRate:10,repeat:-1});

        this.physics.world.setBounds(0,0,this.worldWidth,this.worldHeight);
        this.bg=this.add.tileSprite(0,0,this.worldWidth,832,'bg').setOrigin(0);

        // GROUND
        this.ground=this.physics.add.staticGroup();
        const gW=this.textures.get('ground').getSourceImage().width;
        for(let i=0;i<this.worldWidth/gW;i++)
            this.ground.create(i*gW+gW/2,this.worldHeight,'ground').setOrigin(0.5,1).refreshBody();

        // PLATFORMS
        this.platforms=this.physics.add.staticGroup();
        this.movingPlatforms=this.physics.add.group({allowGravity:false,immovable:true});
        this.spawnPlatforms();

        // PLAYER
        this.player=new Player(this,200,620,`${this.selectedPlayer}_idle`);
        this.physics.add.collider(this.player,this.ground);
        this.physics.add.collider(this.player,this.platforms);
        this.physics.add.collider(this.player,this.movingPlatforms);

        // CAMERA
        this.cameras.main.startFollow(this.player,true,0.12,0.12);
        this.cameras.main.setBounds(0,0,this.worldWidth,this.worldHeight);

        // UI
        document.fonts.ready.then(()=>{
            this.hpIcons=[];
            for(let i=0;i<this.maxHP;i++) this.hpIcons.push(this.add.image(20+i*40,100,'heart_small').setScrollFactor(0).setScale(0.3));
            this.heartText=this.add.text(20,60,`❤️ 0 / ${this.totalHearts}`,{
                fontSize:'32px',fill:'#e8d9b0', fontFamily:'gameFont'
            }).setScrollFactor(0);
        });

        // HEARTS
        this.hearts = this.physics.add.staticGroup();
        this.spawnHearts(this.totalHearts);
        this.physics.add.overlap(this.player,this.hearts,(p,h)=>{
            h.destroy();
            this.heartsCollected++;
            this.sound.play('collect');
            this.heartText.setText(`❤️ ${this.heartsCollected} / ${this.totalHearts}`);
            if(this.heartsCollected>=this.totalHearts){
                this.showWinText();
            }
        });

        // ENEMIES (5)
        this.enemies = this.physics.add.group();
        for(let i=0;i<5;i++){
            const x=800+i*900;
            const y=620;
            this.enemies.add(new Enemy(this,x,y,this.enemyType));
        }
        this.physics.add.collider(this.enemies,this.ground);
        this.physics.add.collider(this.enemies,this.platforms);

        // КОЛАЙДЕР ГРАВЕЦЬ ↔ ВОРОГ
        this.physics.add.collider(this.player, this.enemies, (p, e) => {

    if (e.isDead) return;

    const stompMargin = 40;

    const playerBottom = p.body.bottom;
    const enemyTop = e.body.top;

    const playerCenterX = p.body.center.x;
    const enemyCenterX  = e.body.center.x;

    const enemyHalfWidth = e.body.width * 0.35; // зона "голови"

    const isAbove =
        playerBottom <= enemyTop + stompMargin &&
        p.body.velocity.y > 0;

    const isCentered =
        Math.abs(playerCenterX - enemyCenterX) <= enemyHalfWidth;

    if (isAbove && isCentered) {

        // ✔ чистий стомп
        e.die();
        p.setVelocityY(-350);

    } else {
        // ❌ боковий контакт
        this.damage();
    }
});


        if(this.sys.game.device.os.android || this.sys.game.device.os.iOS){
            this.createMobileButtons();
        }
    }

    update(){
        this.bg.tilePositionX=this.cameras.main.scrollX*0.3;

        // ENEMIES: патрулювання всього рівня
        this.enemies.getChildren().forEach(e=>{
            if(e.isDead) return;
            const p = this.player;
            const dist = Phaser.Math.Distance.Between(e.x,e.y,p.x,p.y);

            let targetDir = e.direction;
            if(dist < 450) targetDir = p.x < e.x ? -1 : 1;

            // межі рівня
            if(e.x + targetDir * e.speed * this.game.loop.delta/1000 <= 0 ||
               e.x + targetDir * e.speed * this.game.loop.delta/1000 >= this.worldWidth){
                e.direction *= -1;
                targetDir = e.direction;
            }

            e.setVelocityX(targetDir * e.speed);
            e.setFlipX(targetDir < 0);
            if(Math.abs(e.body.velocity.x)>5) e.anims.play(`${e.type}_walk`,true);
            else e.anims.play(`${e.type}_idle`,true);
        });

        // рухомі платформи
        this.movingPlatformsList.forEach(pf=>{
            pf.y += pf.speed * pf.direction * this.game.loop.delta/1000;
            if(pf.y<260 || pf.y>480) pf.direction*=-1;
        });
    }

    damage(){
        this.hp--;
        if(this.hp<0) this.hp=0;
        this.hpIcons[this.hp]?.setAlpha(0);
        if(this.hp<=0) this.scene.start('LoseScene',{player:this.selectedPlayer});
    }

    spawnPlatforms(){
        let x=500,lastWasMoving=false;
        for(let i=0;i<20;i++){
            const y=Phaser.Math.Between(260,380);
            let isMoving=!lastWasMoving && Phaser.Math.Between(0,3)<1;
            lastWasMoving=isMoving;

            const pf = isMoving ? this.movingPlatforms.create(x,y,`pf${Phaser.Math.Between(1,4)}`) :
                                  this.platforms.create(x,y,`pf${Phaser.Math.Between(1,4)}`);
            pf.refreshBody();

            if(isMoving){
                pf.isMoving=true; pf.speed=Phaser.Math.Between(30,70); pf.direction=1;
                this.movingPlatformsList.push(pf);
            }
            x+=Phaser.Math.Between(280,340);
        }
    }

    spawnHearts(count){
        const plats=this.platforms.getChildren().concat(this.movingPlatformsList);
        for(let i=0;i<count;i++){
            let x,y,overlap;
            do{
                x=Phaser.Math.Between(50,this.worldWidth-50);
                y=Phaser.Math.Between(50,this.worldHeight-200);
                overlap = plats.some(pl=>{
                    const b=pl.getBounds();
                    return x>b.left-20 && x<b.right+20 && y>b.top-20 && y<b.bottom+20;
                }) || this.hearts.getChildren().some(h=>Math.abs(h.x-x)<40 && Math.abs(h.y-y)<40);
            } while(overlap);

            const heart=this.hearts.create(x,y,'heart_collect').setScale(0.45).refreshBody();
            this.tweens.add({targets:heart,scale:0.5,duration:800,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
        }
    }

    showWinText(){
        this.scene.start('WinScene',{player:this.selectedPlayer});
    }

   createMobileButtons(){

    const y = this.scale.height - 80;

    const left = this.add.image(60, y, 'left_btn')
        .setInteractive()
        .setScrollFactor(0);

    const right = this.add.image(160, y, 'right_btn')
        .setInteractive()
        .setScrollFactor(0);

    const jump = this.add.image(this.scale.width - 80, y, 'jump_btn')
        .setInteractive()
        .setScrollFactor(0);

    [left, right, jump].forEach(btn => {
        this.tweens.add({
            targets: btn,
            scale: 1.1,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    });

    // ←
    left.on('pointerdown', () => this.player.moveLeft = true);
    left.on('pointerup', () => this.player.moveLeft = false);
    left.on('pointerout', () => this.player.moveLeft = false);

    // →
    right.on('pointerdown', () => this.player.moveRight = true);
    right.on('pointerup', () => this.player.moveRight = false);
    right.on('pointerout', () => this.player.moveRight = false);

    // ⬆ стрибок — лише ЗАПИТ
    jump.on('pointerdown', () => {
        this.player.jumpRequest = true;
    });
}



/* =========================================================
   WIN / LOSE SCENES
========================================================= */
class EndScene extends Phaser.Scene {
    constructor(key,text){ super(key); this.label=text; }
    create(data){
        const {width,height}=this.scale;
        document.fonts.ready.then(()=>{
            const style={ fontFamily:'UnifrakturCook', fontSize:'56px', fill:'#e8d9b0' };
            this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
            this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
            this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);
            this.add.text(width/2,height/3,this.label,{fontFamily:'UnifrakturCook', fontSize:'96px', fill:'#e8d9b0'}).setOrigin(0.5);
            this.playBtn = this.add.text(width/2,height/2,'PLAY',style).setOrigin(0.5)
                .setInteractive().on('pointerdown',()=>this.scene.start('GameScene',{player:data.player}));
            this.exitBtn = this.add.text(width/2,height/2+100,'EXIT',style).setOrigin(0.5)
                .setInteractive().on('pointerdown',()=>this.scene.start('MenuScene'));
            this.tweens.add({targets:[this.playBtn,this.exitBtn],scale:1.1,duration:600,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
        });
    }
}

class WinScene extends EndScene { constructor(){ super('WinScene','YOU WIN 🏆'); } }
class LoseScene extends EndScene { constructor(){ super('LoseScene','GAME OVER 💀'); } }

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
