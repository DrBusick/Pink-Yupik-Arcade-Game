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

        document.fonts.ready.then(()=>{
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
                .on('pointerdown',()=>window.Telegram?.WebApp?.close());

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
        this.scene=scene;
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
            this.scene.sound.play('jump');
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
        this.isDead=false;
        this.setCollideWorldBounds(true);
        this.setBodySize(90,120).setOffset(26,18);
        this.direction=1;
    }

    die(){
        if(this.isDead) return;
        this.isDead=true;
        this.disableBody(true,true);

        const h = this.scene.physics.add.image(this.x, this.y - 20, 'heart_small')
            .setScale(0.4)
            .setBounce(0.4)
            .setVelocity(Phaser.Math.Between(-80,80), -260)
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
        this.movingPlatformsList=[];
    }

    init(data){
        this.selectedPlayer=data.player;
        this.enemyType=this.selectedPlayer==='player1'?'player2':'player1';
        this.heartsCollected=0;
        this.hp=this.maxHP;
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

        this.load.image('heart_collect','assets/items/heart_v4.png');
        this.load.image('heart_small','assets/items/heart_small.png');

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
            for(let i=0;i<this.maxHP;i++)
                this.hpIcons.push(this.add.image(20+i*40,100,'heart_small').setScrollFactor(0).setScale(0.3));

            this.heartText=this.add.text(20,60,`❤️ 0 / ${this.totalHearts}`,{
                fontSize:'32px',fill:'#e8d9b0', fontFamily:'UnifrakturCook'
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
                this.scene.start('WinScene',{player:this.selectedPlayer});
            }
        });

        // ENEMIES
        this.enemies = this.physics.add.group();
        for(let i=0;i<5;i++)
            this.enemies.add(new Enemy(this,800+i*900,620,this.enemyType));
        this.physics.add.collider(this.enemies,this.ground);
        this.physics.add.collider(this.enemies,this.platforms);

        // Стрибок на ворога зверху
        this.physics.add.collider(this.player,this.enemies,(p,e)=>{
            if(!e.isDead && p.body.velocity.y>0 && p.y<e.y){
                e.die();
                p.setVelocityY(-350);
            } else if(!e.isDead){
                this.damage();
            }
        });

        // MOBILE BUTTONS
        if(this.sys.game.device.os.android || this.sys.game.device.os.iOS){
            this.createMobileButtons();
        }
    }

    update(){
        this.bg.tilePositionX=this.cameras.main.scrollX*0.3;

        // ENEMIES PATROL & JUMP
        this.enemies.getChildren().forEach(e=>{
            if(e.isDead) return;
            const p=this.player;
            const dist=Phaser.Math.Distance.Between(e.x,e.y,p.x,p.y);

            const plats=this.platforms.getChildren().concat(this.movingPlatformsList);
            const platBelow=plats.find(pl=>Math.abs(pl.x - e.x) < pl.displayWidth/2+10 && Math.abs(pl.y - e.y) < 10);
            const playerPlat=plats.find(pl=>Math.abs(pl.x - p.x)<pl.displayWidth/2+10 && Math.abs(pl.y - p.y)<10);

            if(dist < 450){
                const dir = p.x<e.x?-1:1;
                e.setFlipX(dir<0);
                if(e.body.blocked.down || platBelow) e.setVelocityX(dir*e.speed);
                if(playerPlat && (!platBelow || playerPlat.y < platBelow.y -10)){
                    if(e.body.blocked.down) e.setVelocityY(-this.player.jumpVelocity*0.7);
                }
            } else {
                if(platBelow){
                    if(e.x < platBelow.x - platBelow.displayWidth/2 || e.x > platBelow.x + platBelow.displayWidth/2){
                        e.direction*=-1;
                        e.setFlipX(e.direction<0);
                    }
                    e.setVelocityX(e.direction*e.speed);
                }
            }

            if(platBelow && platBelow.isMoving) e.y += platBelow.speed * platBelow.direction * (1/60);

            if(Math.abs(e.body.velocity.x)>5) e.anims.play(`${e.type}_walk`,true);
            else e.anims.play(`${e.type}_idle`,true);
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

    spawnPlatforms(){
        let x=500;
        let lastWasMoving=false;
        for(let i=0;i<20;i++){
            const y=Phaser.Math.Between(260,380);
            let isMoving=false;
            if(!lastWasMoving && i<20 && Phaser.Math.Between(0,4)<1){
                isMoving=true; // приблизно 5 рухомих платформ
                lastWasMoving=true;
            } else lastWasMoving=false;

            const pf = isMoving ?
                this.movingPlatforms.create(x,y,`pf${Phaser.Math.Between(1,4)}`) :
                this.platforms.create(x,y,`pf${Phaser.Math.Between(1,4)}`);
            pf.refreshBody();

            if(isMoving){
                pf.isMoving=true;
                pf.speed=50;
                pf.direction=1;
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
                    const bounds=pl.getBounds();
                    return x>bounds.left-20 && x<bounds.right+20 && y>bounds.top-20 && y<bounds.bottom+20;
                });
                if(!overlap){
                    overlap=this.hearts.getChildren().some(h=>Math.abs(h.x-x)<40 && Math.abs(h.y-y)<40);
                }
            } while(overlap);

            const heart=this.hearts.create(x,y,'heart_collect').setScale(0.45).refreshBody();
            this.tweens.add({
                targets:heart,
                scale:0.5,
                duration:800,
                yoyo:true,
                repeat:-1,
                ease:'Sine.easeInOut'
            });
        }
    }

    createMobileButtons(){
        const left=this.add.dom(20,this.scale.height-80,'div','class=button','◀').setOrigin(0);
        const right=this.add.dom(100,this.scale.height-80,'div','class=button','▶').setOrigin(0);
        const jump=this.add.dom(this.scale.width-80,this.scale.height-80,'div','class=button','▲').setOrigin(0);

        [left,right,jump].forEach(btn=>{
            this.tweens.add({
                targets:btn,
                scale:1.1,
                duration:600,
                yoyo:true,
                repeat:-1,
                ease:'Sine.easeInOut'
            });
        });

        left.addListener('pointerdown'); left.on('pointerdown',()=>this.player.moveLeft=true);
        left.addListener('pointerup'); left.on('pointerup',()=>this.player.moveLeft=false);

        right.addListener('pointerdown'); right.on('pointerdown',()=>this.player.moveRight=true);
        right.addListener('pointerup'); right.on('pointerup',()=>this.player.moveRight=false);

        jump.addListener('pointerdown'); jump.on('pointerdown',()=>this.player.jump=true);
        jump.addListener('pointerup'); jump.on('pointerup',()=>this.player.jump=false);
    }
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
