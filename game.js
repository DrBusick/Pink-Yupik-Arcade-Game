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
            fontSize: Math.round(height*0.15)+'px',
            fill: '#e8d9b0'
        }).setOrigin(0.5);
        title.setShadow(0, 0, '#fff2c1', 20, true, true);

        this.tweens.add({
            targets: title,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const btnStyle = { fontFamily: 'UnifrakturCook', fontSize: Math.round(height*0.07)+'px', fill: '#e8d9b0' };

        const play = this.add.text(width/2, height/2 - 60, 'PLAY', btnStyle)
            .setOrigin(0.5).setInteractive({ useHandCursor:true });
        play.on('pointerover', () => this.hoverSound.play());
        play.on('pointerdown', () => this.scene.start('SelectScene'));

        const exit = this.add.text(width/2, height/2 + 100, 'EXIT', btnStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor:true });
        exit.on('pointerover', () => {
            this.hoverSound.play();
            exit.setScale(1.15);
            exit.setTint(0xff6b6b);
        });
        exit.on('pointerout', () => {
            exit.setScale(1);
            exit.clearTint();
        });
        exit.on('pointerdown', () => window.close());
    }

    update() {
        this.bgFar.tilePositionX += 0.2;
        this.bgMid.tilePositionX += 0.5;
        this.bgNear.tilePositionX += 1;
    }
}

// ======================= SELECT SCENE =======================
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

        this.add.text(width/2, height*0.15,'Select Character',{
            fontFamily:'UnifrakturCook',
            fontSize: Math.round(height*0.08)+'px',
            fill:'#e8d9b0'
        }).setOrigin(0.5);

        const baseY = height/2 + 0.11*height;
        this.add.image(width/2 - 0.18*width, baseY, 'select_platform').setScale(1.1);
        this.add.image(width/2 + 0.18*width, baseY, 'select_platform').setScale(1.1);

        this.add.image(width/2 - 0.18*width, baseY - 110, 'p1_idle')
            .setScale(1.2)
            .setInteractive()
            .on('pointerdown',()=>this.scene.start('GameScene',{player:'player1'}));

        this.add.image(width/2 + 0.18*width, baseY - 110, 'p2_idle')
            .setScale(1.2)
            .setInteractive()
            .on('pointerdown',()=>this.scene.start('GameScene',{player:'player2'}));
    }
}

// ======================= PLAYER ========================
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, key){
        super(scene, x, y, key);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBodySize(90,120).setOffset(26,18);

        this.speed = 180;
        this.accel = 900;
        this.body.setMaxVelocity(this.speed, 1000);
        this.body.setDragX(1200);

        this.jumpVelocity = 520;
        this.jumpCount = 0;
        this.maxJumps = 3;
        this.facing = 'right';

        this.keys = scene.input.keyboard.addKeys({
            left:'A', right:'D', up:'W',
            left2:'LEFT', right2:'RIGHT', up2:'UP'
        });

        this.touchLeft=false;
        this.touchRight=false;
        this.touchJump=false;

        this.walkSound = scene.sound.add('walk',{loop:true,volume:0.5});
    }

    preUpdate(t,d){
        super.preUpdate(t,d);

        const l=this.keys.left.isDown||this.keys.left2.isDown||this.touchLeft;
        const r=this.keys.right.isDown||this.keys.right2.isDown||this.touchRight;

        if(l){ this.setAccelerationX(-this.accel); this.facing='left'; }
        else if(r){ this.setAccelerationX(this.accel); this.facing='right'; }
        else this.setAccelerationX(0);

        if((Phaser.Input.Keyboard.JustDown(this.keys.up) ||
            Phaser.Input.Keyboard.JustDown(this.keys.up2) ||
            this.touchJump) &&
            this.jumpCount < this.maxJumps){
            this.setVelocityY(-this.jumpVelocity);
            this.jumpCount++;
            this.scene.jumpSound.play();
            this.touchJump=false;
        }

        if(this.body.blocked.down){
            this.jumpCount=0;
            if((l||r)&&!this.walkSound.isPlaying) this.walkSound.play();
        } else if(this.walkSound.isPlaying) this.walkSound.stop();

        this.setFlipX(this.facing==='left');
        this.anims.play(l||r?'walk':'idle',true);
    }
}

// ======================= ENEMY ========================
class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y,type){
        super(scene,x,y,`${type}_idle`);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene=scene;
        this.setCollideWorldBounds(true);
        this.setBodySize(90,120).setOffset(26,18);

        this.speed=90;
        this.chaseRange=420;
        this.stopRange=60;

        this.isDead = false;

        this.play('enemy_idle');
    }

    preUpdate(time,delta){
        super.preUpdate(time,delta);
        if(this.isDead) return;

        const p=this.scene.player;
        if(!p) return;

        const d=Phaser.Math.Distance.Between(this.x,this.y,p.x,p.y);

        if(d<this.chaseRange && d>this.stopRange){
            const dir=p.x<this.x?-1:1;
            this.setVelocityX(this.speed*dir);
            this.setFlipX(dir<0);
            this.anims.play('enemy_walk',true);
        } else {
            this.setVelocityX(0);
            this.anims.play('enemy_idle',true);
        }
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

        this.heartsCollected = 0;
        this.selectedPlayer = 'player1';
    }

    init(data){
        if(data?.player) this.selectedPlayer = data.player;
        this.enemyType = this.selectedPlayer === 'player1' ? 'player2' : 'player1';
    }

    preload(){
        const p = this.selectedPlayer;
        const e = this.enemyType;

        this.load.image(`${p}_idle`,`assets/${p}/idle.png`);
        this.load.spritesheet(`${p}_walk`,`assets/${p}/walk.png`,{frameWidth:142,frameHeight:142});

        this.load.image(`${e}_idle`,`assets/${e}/idle.png`);
        this.load.spritesheet(`${e}_walk`,`assets/${e}/walk.png`,{frameWidth:142,frameHeight:142});

        this.load.image('bg','assets/backgrounds/bg.png');
        this.load.image('ground','assets/platforms/ground.png');
        for(let i=1;i<=4;i++)
            this.load.image(`pf${i}`,`assets/platforms/platform_${i}.png`);

        this.load.image('heart','assets/items/heart_v4.png');

        this.load.audio('jump','assets/sounds/jump.mp3');
        this.load.audio('walk','assets/sounds/walk.mp3');
        this.load.audio('collect','assets/sounds/collect.mp3');

        this.load.image('btn_left','assets/ui/btn_left.png');
        this.load.image('btn_right','assets/ui/btn_right.png');
        this.load.image('btn_jump','assets/ui/btn_jump.png');
    }

    create(){
        const p = this.selectedPlayer;
        const e = this.enemyType;

        this.anims.create({key:'idle',frames:[{key:`${p}_idle`}],repeat:-1});
        this.anims.create({key:'walk',frames:this.anims.generateFrameNumbers(`${p}_walk`),frameRate:10,repeat:-1});
        this.anims.create({key:'enemy_walk',frames:this.anims.generateFrameNumbers(`${e}_walk`),frameRate:8,repeat:-1});
        this.anims.create({key:'enemy_idle',frames:[{key:`${e}_idle`}],repeat:-1});

        this.jumpSound = this.sound.add('jump');
        this.collectSound = this.sound.add('collect');

        this.physics.world.setBounds(0,0,this.worldWidth,this.worldHeight);

        this.bg = this.add.tileSprite(0,0,1248,832,'bg').setOrigin(0).setScrollFactor(0);

        // Ґрунт
        this.ground = this.physics.add.staticGroup();
        const gW = this.textures.get('ground').getSourceImage().width;
        for(let i=0;i<this.worldWidth/gW;i++)
            this.ground.create(i*gW+gW/2,this.worldHeight,'ground').setOrigin(0.5,1).refreshBody();

        // Платформи
        this.staticPlatforms = this.physics.add.staticGroup();
        this.movingPlatforms = this.physics.add.group({allowGravity:false,immovable:true});
        this.spawnPlatforms();

        // Гравець
        this.player = new Player(this,200,300,this.selectedPlayer+'_idle');
        this.physics.add.collider(this.player,this.ground);
        this.physics.add.collider(this.player,this.staticPlatforms);
        this.physics.add.collider(this.player,this.movingPlatforms);

        // HP UI
        this.hpIcons = [];
        const {width,height} = this.scale;
        for(let i=0;i<this.maxHP;i++)
            this.hpIcons.push(this.add.image(width*0.02 + i*width*0.04,height*0.07,'heart').setScrollFactor(0).setScale(0.45));

        // Вороги
        this.enemies = this.physics.add.group();
        for(let i=0;i<6;i++)
            this.enemies.add(new Enemy(this,700+i*500,300,e));

        this.physics.add.collider(this.enemies,this.ground);
        this.physics.add.collider(this.enemies,this.staticPlatforms);
        this.physics.add.collider(this.player,this.enemies,this.handleEnemyCollision,null,this);

        // Серця на рівні
        this.hearts = this.physics.add.staticGroup();
        this.spawnHeartsSafe(25);

        this.heartText = this.add.text(width*0.02,height*0.03,`❤️ ${this.heartsCollected} / 25`,{
            fontSize: Math.round(height*0.04)+'px', fill:'#e8d9b0'
        }).setScrollFactor(0);

        this.winText = this.add.text(width/2,height/2,
            'ALL 25 HEARTS\nCOLLECTED!',
            {fontFamily:'UnifrakturCook',fontSize:Math.round(height*0.12)+'px',fill:'#fff2c1',align:'center'}
        ).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

        // Game Over UI
        this.gameOverGroup = this.add.container(width/2,height/2).setScrollFactor(0).setAlpha(0);

        const dieText = this.add.text(0,-80,'YOU DIE!',{fontFamily:'UnifrakturCook',fontSize:Math.round(height*0.12)+'px',fill:'#ff6b6b'}).setOrigin(0.5);
        const retry = this.add.text(0,20,'PLAY',{fontFamily:'UnifrakturCook',fontSize:Math.round(height*0.06)+'px',fill:'#e8d9b0'}).setOrigin(0.5);
        const menu = this.add.text(0,90,'MENU',{fontFamily:'UnifrakturCook',fontSize:Math.round(height*0.06)+'px',fill:'#e8d9b0'}).setOrigin(0.5);

        retry.setInteractive().on('pointerdown',()=>this.scene.restart({player:this.selectedPlayer}));
        menu.setInteractive().on('pointerdown',()=>this.scene.start('MenuScene'));

        this.gameOverGroup.add([dieText,retry,menu]);

        this.cameras.main.startFollow(this.player,true,0.12,0.12);
        this.cameras.main.setBounds(0,0,this.worldWidth,this.worldHeight);

        this.input.addPointer(2);
        this.createTouchControls();
    }

    // ======================= Ворог і серце =======================
    handleEnemyCollision(player, enemy) {
        if(player.body.velocity.y > 0 && player.y < enemy.y - 20 && !enemy.isDead) {
            enemy.isDead = true;
            enemy.disableBody(true,true);

            player.setVelocityY(-350);

            const heart = this.physics.add.sprite(enemy.x, enemy.y-50,'heart').setDisplaySize(40,40);
            heart.body.setAllowGravity(true);
            heart.body.setGravityY(300);

            this.tweens.add({targets: heart, angle: 360, duration: 1000, repeat: -1});

            this.physics.add.overlap(this.player, heart, (p,h)=>{
                h.destroy();
                this.collectSound.play();
                this.hp = Math.min(this.hp+1, this.maxHP);
                this.updateHPUI();
            });

        } else this.onPlayerHit(player, enemy);
    }

    updateHPUI(){
        for(let i=0;i<this.maxHP;i++){
            if(i<this.hp) this.hpIcons[i].setAlpha(1);
            else this.hpIcons[i].setAlpha(0.3);
        }
    }

    onPlayerHit(player){
        if(this.isInvulnerable) return;
        this.isInvulnerable = true;
        this.hp--;
        this.updateHPUI();

        this.tweens.add({targets:player,alpha:0,duration:80,yoyo:true,repeat:8});
        this.time.delayedCall(900,()=>{this.isInvulnerable=false;player.setAlpha(1);});

        if(this.hp <= 0){
            player.setVelocity(0,0);
            player.anims.stop();
            this.physics.pause();
            this.gameOverGroup.setAlpha(1);
            this.gameOverGroup.iterate(child=>child.setInteractive());
            this.input.enabled = true;
        }
    }

    spawnPlatforms(){
        const keys=['pf1','pf2','pf3','pf4'];
        const movingIdx=[2,6,10,14,18,22,26,29];
        let x=400;

        for(let i=0;i<30;i++){
            const y=Phaser.Math.Between(220,520);
            const key=Phaser.Utils.Array.GetRandom(keys);

            if(movingIdx.includes(i)){
                const p=this.movingPlatforms.create(x,y,key);
                p.startY=y;
                p.range=120;
                p.speed=50;
                p.body.setVelocityY(p.speed);
            } else this.staticPlatforms.create(x,y,key).refreshBody();
            x+=Phaser.Math.Between(260,320);
        }
    }

    spawnHeartsSafe(count){
        const hearts=[];
        const platforms=[...this.staticPlatforms.getChildren(),...this.movingPlatforms.getChildren()];
        while(hearts.length<count){
            const x=Phaser.Math.Between(200,this.worldWidth-200);
            const y=Phaser.Math.Between(150,500);
            const rect=new Phaser.Geom.Rectangle(x-25,y-25,50,50);
            let bad=false;
            for(const h of hearts) if(Phaser.Geom.Intersects.RectangleToRectangle(rect,h)) bad=true;
            for(const p of platforms) if(Phaser.Geom.Intersects.RectangleToRectangle(rect,p.getBounds())) bad=true;
            if(!bad){
                this.hearts.create(x,y,'heart').setDisplaySize(50,50).refreshBody();
                hearts.push(rect);
            }
        }
    }

    createTouchControls(){
        const { width, height } = this.scale;
        const btnSize = Math.min(width,height)*0.1;

        const makeBtn=(xPerc,yPerc,key)=>{
            const b = this.add.image(width*xPerc, height*yPerc,key)
                .setScrollFactor(0)
                .setDisplaySize(btnSize,btnSize)
                .setAlpha(0.55)
                .setInteractive();
            b.on('pointerdown',()=>b.setAlpha(0.85));
            b.on('pointerup',()=>b.setAlpha(0.55));
            b.on('pointerout',()=>b.setAlpha(0.55));
            return b;
        };

        const l=makeBtn(0.1,0.85,'btn_left');
        l.on('pointerdown',()=>this.player.touchLeft=true);
        l.on('pointerup',()=>this.player.touchLeft=false);
        l.on('pointerout',()=>this.player.touchLeft=false);

        const r=makeBtn(0.22,0.85,'btn_right');
        r.on('pointerdown',()=>this.player.touchRight=true);
        r.on('pointerup',()=>this.player.touchRight=false);
        r.on('pointerout',()=>this.player.touchRight=false);

        const j=makeBtn(0.9,0.85,'btn_jump');
        j.on('pointerdown',()=>this.player.touchJump=true);
        j.on('pointerup',()=>this.player.touchJump=false);
        j.on('pointerout',()=>this.player.touchJump=false);
    }

    update(){
        this.bg.tilePositionX=this.cameras.main.scrollX;
        this.movingPlatforms.getChildren().forEach(p=>{
            if(p.y>p.startY+p.range) p.body.setVelocityY(-p.speed);
            if(p.y<p.startY-p.range) p.body.setVelocityY(p.speed);
        });
    }
}

// ======================= CONFIG =======================
new Phaser.Game({
    type: Phaser.AUTO,
    width: 1248,
    height: 832,
    scale: {mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH},
    physics: {default:'arcade', arcade:{gravity:{y:900}, debug:false}},
    scene: [MenuScene, SelectScene, GameScene]
});
