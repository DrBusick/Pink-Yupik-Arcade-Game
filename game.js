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
   GLOBAL
========================================================= */
let selectedPlayer = 'player1';

/* =========================================================
   MENU SCENE
========================================================= */
class MenuScene extends Phaser.Scene {
    constructor(){ super('MenuScene'); }
    preload(){
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');

        this.load.audio('menu_hover','assets/sounds/hover.mp3');
        this.load.audio('menu_click','assets/sounds/collect.mp3');
    }
    create(){
        const {width,height} = this.scale;
        this.bgFar  = this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.bgMid  = this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.bgNear = this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        document.fonts.ready.then(()=>{
            const titleStyle = { fontFamily:'UnifrakturCook', fontSize:'120px', fill:'#e8d9b0' };
            const optionStyle = { fontFamily:'UnifrakturCook', fontSize:'56px', fill:'#e8d9b0' };

            this.add.text(width/2,height/3,'Pink Yupik Arcade', titleStyle).setOrigin(0.5);

            this.playBtn = this.add.text(width/2,height/2,'PLAY',optionStyle)
                .setOrigin(0.5)
                .setInteractive()
                .on('pointerover',()=>this.sound.play('menu_hover'))
                .on('pointerdown',()=>{
                    this.sound.play('menu_click');
                    this.scene.start('SelectScene');
                });

            this.exitBtn = this.add.text(width/2,height/2+100,'EXIT',optionStyle)
                .setOrigin(0.5)
                .setInteractive()
                .on('pointerover',()=>this.sound.play('menu_hover'))
                .on('pointerdown',()=>{
                    this.sound.play('menu_click');
                    window.Telegram?.WebApp?.close();
                });

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

        this.load.audio('menu_hover','assets/sounds/hover.mp3');
        this.load.audio('menu_click','assets/sounds/collect.mp3');
    }
    create(){
        const {width,height} = this.scale;
        this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        document.fonts.ready.then(()=>{
            const titleStyle = { fontFamily:'UnifrakturCook', fontSize:'64px', fill:'#e8d9b0' };
            this.add.text(width/2,120,'Select Character', titleStyle).setOrigin(0.5);

            const y = height/2 + 120;
            this.add.image(width/2-220,y,'platform');
            this.add.image(width/2+220,y,'platform');

            const p1=this.add.image(width/2-220,y-110,'player1_idle')
                .setInteractive()
                .on('pointerover',()=>this.sound.play('menu_hover'))
                .on('pointerdown',()=>{
                    this.sound.play('menu_click');
                    this.scene.start('GameScene',{player:'player1'});
                });

            const p2=this.add.image(width/2+220,y-110,'player2_idle')
                .setInteractive()
                .on('pointerover',()=>this.sound.play('menu_hover'))
                .on('pointerdown',()=>{
                    this.sound.play('menu_click');
                    this.scene.start('GameScene',{player:'player2'});
                });

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
    constructor(scene,x,y,key){
        super(scene,x,y,key);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true).setBodySize(90,120).setOffset(26,18);

        this.speed=180; this.accel=900; this.jumpVelocity=520;
        this.jumpCount=0; this.maxJumps=3;
        this.body.setDragX(1200).setMaxVelocity(this.speed,1000);

        this.keys=scene.input.keyboard.addKeys({
            left:'A', right:'D', up:'W',
            left2:'LEFT', right2:'RIGHT', up2:'UP'
        });
        this.moveLeft=false; this.moveRight=false; this.jump=false;
        this.touchLeft=false; this.touchRight=false; this.touchJump=false;
        this.scene=scene;
        this.invulnerable=false;
        this.stepTimer=0;
    }

    takeHit(fromX){
        if(this.invulnerable) return;
        this.invulnerable=true;
        const dir=this.x<fromX?-1:1;
        this.setVelocityX(dir*250);
        this.setVelocityY(-250);
        this.scene.sound.play('hit');

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

        const l = this.keys.left.isDown || this.keys.left2.isDown || this.moveLeft || this.touchLeft;
        const r = this.keys.right.isDown || this.keys.right2.isDown || this.moveRight || this.touchRight;
        const j = (Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.up2) || this.jump || this.touchJump);

        if(l) this.setAccelerationX(-this.accel);
        else if(r) this.setAccelerationX(this.accel);
        else this.setAccelerationX(0);

        if(j && this.jumpCount<this.maxJumps){
            this.setVelocityY(-this.jumpVelocity);
            this.jumpCount++;
            this.scene.sound.play('jump');
        }

        if(this.body.blocked.down) this.jumpCount=0;

        if(l) this.setFlipX(true);
        else if(r) this.setFlipX(false);

        if(Math.abs(this.body.velocity.x) > 5){
            this.anims.play('walk', true);
            if(this.body.blocked.down && t > this.stepTimer){
                this.scene.sound.play('step',{volume:0.5});
                this.stepTimer = t + 350;
            }
        } else {
            this.anims.play('idle', true);
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
        this.direction=1;
    }

    die(){
        if(this.isDead) return;
        this.isDead=true;
        this.scene.sound.play('enemy_die');
        this.disableBody(true,true);

        const h = this.scene.physics.add.image(this.x,this.y-20,'heart_small')
            .setScale(0.4).setBounce(0.6)
            .setVelocity(Phaser.Math.Between(-80,80),-260)
            .setCollideWorldBounds(true);

        this.scene.physics.add.collider(h,this.scene.ground);
        this.scene.physics.add.collider(h,this.scene.platforms);
        this.scene.physics.add.collider(h,this.scene.movingPlatforms);

        this.scene.physics.add.overlap(this.scene.player,h,()=>{
            h.destroy();
            this.scene.hp = Math.min(this.scene.hp+1,this.scene.maxHP);
            this.scene.hpIcons[this.scene.hp-1].setAlpha(1);
            this.scene.sound.play('heart_pick');
        });
    }
}

/* =========================================================
   GAME SCENE
========================================================= */
class GameScene extends Phaser.Scene {
    constructor(){
        super('GameScene');
        this.worldWidth=6000; this.worldHeight=832;
        this.maxHP=5; this.hp=5;
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
        this.load.image('btn_left',  'assets/ui/btn_left.png');
        this.load.image('btn_right', 'assets/ui/btn_right.png');
        this.load.image('btn_jump',  'assets/ui/btn_jump.png');
        this.load.audio('jump','assets/sounds/jump.mp3');
        this.load.audio('step','assets/sounds/walk.mp3');
        this.load.audio('heart_pick','assets/sounds/collect.mp3');
        this.load.audio('hit','assets/sounds/hover.mp3');
        this.load.audio('enemy_die','assets/sounds/collect.mp3');
    }

    create(){
        const {width,height} = this.scale;
        this.anims.create({key:'idle',frames:[{key:`${this.selectedPlayer}_idle`}],repeat:-1});
        this.anims.create({key:'walk',frames:this.anims.generateFrameNumbers(`${this.selectedPlayer}_walk`),frameRate:10,repeat:-1});
        this.anims.create({key:`${this.enemyType}_idle`,frames:[{key:`${this.enemyType}_idle`}],repeat:-1});
        this.anims.create({key:`${this.enemyType}_walk`,frames:this.anims.generateFrameNumbers(`${this.enemyType}_walk`),frameRate:10,repeat:-1});

        this.physics.world.setBounds(0,0,this.worldWidth,this.worldHeight);
        this.bg=this.add.tileSprite(0,0,this.worldWidth,832,'bg').setOrigin(0);

        this.ground=this.physics.add.staticGroup();
        const gW=this.textures.get('ground').getSourceImage().width;
        for(let i=0;i<this.worldWidth/gW;i++)
            this.ground.create(i*gW+gW/2,this.worldHeight,'ground').setOrigin(0.5,1).refreshBody();

        this.platforms=this.physics.add.staticGroup();
        this.movingPlatforms=this.physics.add.group({allowGravity:false,immovable:true});
        this.spawnPlatforms();

        this.player=new Player(this,200,620,`${this.selectedPlayer}_idle`);
        this.physics.add.collider(this.player,this.ground);
        this.physics.add.collider(this.player,this.platforms);
        this.physics.add.collider(this.player,this.movingPlatforms);

        this.cameras.main.startFollow(this.player,true,0.12,0.12);
        this.cameras.main.setBounds(0,0,this.worldWidth,this.worldHeight);

        document.fonts.ready.then(()=>{
            this.hpIcons=[];
            for(let i=0;i<this.maxHP;i++)
                this.hpIcons.push(this.add.image(20+i*40,100,'heart_small').setScrollFactor(0).setScale(0.3));

            this.heartText=this.add.text(20,60,`❤️ 0 / ${this.totalHearts}`,{
                fontSize:'32px',fill:'#e8d9b0', fontFamily:'UnifrakturCook'
            }).setScrollFactor(0);
        });

        this.hearts = this.physics.add.staticGroup();
        this.spawnHearts(this.totalHearts);
        this.physics.add.overlap(this.player,this.hearts,(p,h)=>{
            h.destroy();
            this.heartsCollected++;
            this.sound.play('heart_pick');
            this.heartText.setText(`❤️ ${this.heartsCollected} / ${this.totalHearts}`);
            if(this.heartsCollected>=this.totalHearts) this.showWinText();
        });

        this.enemies = this.physics.add.group();
        for(let i=0;i<5;i++)
            this.enemies.add(new Enemy(this,800+i*900,620,this.enemyType));
        this.physics.add.collider(this.enemies,this.ground);
        this.physics.add.collider(this.enemies,this.platforms);

        this.physics.add.collider(this.player,this.enemies,(p,e)=>{
            if(!e.isDead && p.body.velocity.y>0 && (p.y + p.body.height/2) < (e.y - 10)){
                e.die();
                p.setVelocityY(-350);
            } else if(!e.isDead){
                p.takeHit(e.x);
                this.damage();
            }
        });

        if(this.sys.game.device.os.android || this.sys.game.device.os.iOS){
            this.createTouchControls();
        }
    }

    update(){
        this.bg.tilePositionX=this.cameras.main.scrollX*0.3;

        this.enemies.getChildren().forEach(e=>{
            if(e.isDead) return;
            const p=this.player;
            const dist=Phaser.Math.Distance.Between(e.x,e.y,p.x,p.y);

            const plats=this.platforms.getChildren().concat(this.movingPlatformsList);
            const platBelow=plats.find(pl=>Math.abs(pl.x - e.x) < pl.displayWidth/2+10 && Math.abs(pl.y - e.y) < 10);

            if(dist < 450){
                const dir = p.x<e.x?-1:1;
                e.setFlipX(dir<0);
                if(e.body.blocked.down || platBelow) e.setVelocityX(dir*e.speed);
                if(platBelow && (!platBelow || p.y < platBelow.y - 10)){
                    if(e.body.blocked.down) e.setVelocityY(-this.player.jumpVelocity*0.7);
                }
            } else {
                const leftEdge = platBelow ? platBelow.x - platBelow.displayWidth/2 : 0;
                const rightEdge = platBelow ? platBelow.x + platBelow.displayWidth/2 : this.worldWidth;
                if(e.x < leftEdge || e.x > rightEdge){
                    e.direction*=-1;
                    e.setFlipX(e.direction<0);
                }
                e.setVelocityX(e.direction*e.speed);
            }

            if(platBelow && platBelow.isMoving)
                e.x += platBelow.speed * platBelow.direction * (1/60);

            if(Math.abs(e.body.velocity.x)>5)
                e.anims.play(`${e.type}_walk`,true);
            else
                e.anims.play(`${e.type}_idle`,true);
        });
    }

    damage(){
        this.hp--;
        if(this.hp<0) this.hp=0;
        this.hpIcons[this.hp]?.setAlpha(0);
        if(this.hp<=0) this.scene.start('LoseScene',{player:this.selectedPlayer});
    }

    spawnPlatforms(){
        let x=400,lastWasMoving=false;
        for(let i=0;i<20;i++){
            const y = i%2===0
                ? Phaser.Math.Between(260,360)
                : Phaser.Math.Between(460,560);

            let isMoving=!lastWasMoving && this.movingPlatformsList.length<5 && Phaser.Math.Between(0,3)<1;
            lastWasMoving=isMoving;

            const pf = isMoving
                ? this.movingPlatforms.create(x,y,`pf${Phaser.Math.Between(1,4)}`)
                : this.platforms.create(x,y,`pf${Phaser.Math.Between(1,4)}`);

            pf.refreshBody();

            if(isMoving){
                pf.isMoving=true;
                pf.speed=50;
                pf.direction=1;
                this.movingPlatformsList.push(pf);
            }

            x+=Phaser.Math.Between(260,340);
        }
    }

    spawnHearts(count){
        const plats=this.platforms.getChildren().concat(this.movingPlatformsList);
        for(let i=0;i<count;i++){
            let x,y,overlap;
            do{
                x=Phaser.Math.Between(80,this.worldWidth-80);
                y=Phaser.Math.Between(100,this.worldHeight-200);
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
        const {width,height}=this.scale;
        const txt=this.add.text(this.cameras.main.scrollX+width/2,height/2,'YOU WIN 🏆',{
            fontFamily:'UnifrakturCook', fontSize:'128px', fill:'#ffea00'
        }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);
        this.tweens.add({targets:txt,alpha:1,duration:1000,ease:'Sine.easeInOut'});
        this.time.delayedCall(2000,()=>this.scene.start('MenuScene'));
    }

    createTouchControls() {
        const { width, height } = this.scale;

        const scaleIdle = 0.9;
        const scaleDown = 0.8;

        const makeBtn = (x, y, key) => {
            const btn = this.add.image(x, y, key)
                .setScrollFactor(0)
                .setDepth(9999)
                .setScale(scaleIdle)
                .setAlpha(0.55)
                .setInteractive({ pointerDownOutside: true });

            btn.on('pointerdown', () => {
                btn.setScale(scaleDown);
                btn.setAlpha(0.85);
            });

            btn.on('pointerup', () => {
                btn.setScale(scaleIdle);
                btn.setAlpha(0.55);
            });

            btn.on('pointerout', () => {
                btn.setScale(scaleIdle);
                btn.setAlpha(0.55);
            });

            return btn;
        };

        const left = makeBtn(130, height - 120, 'btn_left');
        left.on('pointerdown', () => this.player.touchLeft = true);
        left.on('pointerup',   () => this.player.touchLeft = false);
        left.on('pointerout',  () => this.player.touchLeft = false);

        const right = makeBtn(260, height - 120, 'btn_right');
        right.on('pointerdown', () => this.player.touchRight = true);
        right.on('pointerup',   () => this.player.touchRight = false);
        right.on('pointerout',  () => this.player.touchRight = false);

        const jump = makeBtn(width - 140, height - 120, 'btn_jump');
        jump.on('pointerdown', () => this.player.touchJump = true);
        jump.on('pointerup',   () => this.player.touchJump = false);
        jump.on('pointerout',  () => this.player.touchJump = false);
    }
}

/* =========================================================
   WIN / LOSE SCENES
========================================================= */
class EndScene extends Phaser.Scene {
    constructor() { super(); this.label=''; }
    
    init(data){ this.data = data; }

    preload(){
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');
        this.load.audio('menu_hover','assets/sounds/hover.mp3');
        this.load.audio('menu_click','assets/sounds/collect.mp3');
    }

    create(){
        const {width,height}=this.scale;
        document.fonts.ready.then(()=>{
            const style={ fontFamily:'UnifrakturCook', fontSize:'56px', fill:'#e8d9b0' };
            this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
            this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
            this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);
            this.add.text(width/2,height/3,this.label,{fontFamily:'UnifrakturCook', fontSize:'96px', fill:'#e8d9b0'}).setOrigin(0.5);

            this.playBtn = this.add.text(width/2,height/2,'PLAY',style).setOrigin(0.5)
                .setInteractive()
                .on('pointerover',()=>this.sound.play('menu_hover'))
                .on('pointerdown',()=>{
                    this.sound.play('menu_click');
                    this.scene.start('GameScene',{player:this.data.player});
                });

            this.exitBtn = this.add.text(width/2,height/2+100,'EXIT',style).setOrigin(0.5)
                .setInteractive()
                .on('pointerover',()=>this.sound.play('menu_hover'))
                .on('pointerdown',()=>{
                    this.sound.play('menu_click');
                    this.scene.start('MenuScene');
                });

            this.tweens.add({targets:[this.playBtn,this.exitBtn],scale:1.1,duration:600,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
        });
    }
}

class WinScene extends EndScene { 
    constructor(){ super(); this.label='YOU WIN 🏆'; this.sceneKey='WinScene'; } 
}
class LoseScene extends EndScene { 
    constructor(){ super(); this.label='GAME OVER 💀'; this.sceneKey='LoseScene'; } 
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
