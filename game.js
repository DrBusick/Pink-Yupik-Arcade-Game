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
    }

    create(){
        const {width,height} = this.scale;

        this.bgFar  = this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.bgMid  = this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.bgNear = this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.add.text(width/2,height/3,'Pink Yupik Arcade',{
            fontFamily:'UnifrakturCook',
            fontSize:'120px',
            fill:'#e8d9b0'
        }).setOrigin(0.5);

        const style={fontFamily:'UnifrakturCook',fontSize:'56px',fill:'#e8d9b0'};

        this.add.text(width/2,height/2,'PLAY',style)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown',()=>this.scene.start('SelectScene'));

        this.add.text(width/2,height/2+100,'EXIT',style)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown',()=>window.close());
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

        this.add.text(width/2,120,'Select Character',{
            fontFamily:'UnifrakturCook',
            fontSize:'64px',
            fill:'#e8d9b0'
        }).setOrigin(0.5);

        const y=height/2+120;

        this.add.image(width/2-220,y,'platform');
        this.add.image(width/2+220,y,'platform');

        this.add.image(width/2-220,y-110,'player1_idle')
            .setInteractive()
            .on('pointerdown',()=>this.scene.start('GameScene',{player:'player1'}));

        this.add.image(width/2+220,y-110,'player2_idle')
            .setInteractive()
            .on('pointerdown',()=>this.scene.start('GameScene',{player:'player2'}));
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
            left:'A',right:'D',up:'W',
            left2:'LEFT',right2:'RIGHT',up2:'UP'
        });
    }

    preUpdate(t,d){
        super.preUpdate(t,d);

        const l=this.keys.left.isDown||this.keys.left2.isDown;
        const r=this.keys.right.isDown||this.keys.right2.isDown;

        if(l) this.setAccelerationX(-this.accel);
        else if(r) this.setAccelerationX(this.accel);
        else this.setAccelerationX(0);

        if(
            (Phaser.Input.Keyboard.JustDown(this.keys.up)||
             Phaser.Input.Keyboard.JustDown(this.keys.up2)) &&
            this.jumpCount<this.maxJumps
        ){
            this.setVelocityY(-this.jumpVelocity);
            this.jumpCount++;
        }

        if(this.body.blocked.down) this.jumpCount=0;

        this.setFlipX(l);
        this.anims.play(l||r?'walk':'idle',true);
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

        this.anims.play(`${this.type}_walk`,true);
    }

    die(){
        if(this.isDead) return;
        this.isDead=true;
        this.disableBody(true,true);

        for(let i=0;i<2;i++){
            const h=this.scene.physics.add.image(this.x,this.y-20,'heart_small')
                .setScale(0.4)
                .setBounce(0.4)
                .setVelocity(
                    Phaser.Math.Between(-120,120),
                    Phaser.Math.Between(-300,-200)
                )
                .setCollideWorldBounds(true);

            this.scene.physics.add.collider(h,this.scene.ground);
            this.scene.physics.add.collider(h,this.scene.platforms);

            this.scene.physics.add.overlap(this.scene.player,h,()=>{
                h.destroy();
                this.scene.hp=Math.min(this.scene.hp+1,this.scene.maxHP);
                this.scene.hpIcons[this.scene.hp-1].setAlpha(1);
            });
        }
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
        for(let i=1;i<=4;i++) this.load.image(`pf${i}`,`assets/platforms/platform_${i}.png`);

        this.load.image('heart','assets/items/heart_v4.png');
        this.load.image('heart_small','assets/items/heart_small.png');
    }

    create(){
        /* ANIMATIONS */
        this.anims.create({key:'idle',frames:[{key:`${this.selectedPlayer}_idle`}],repeat:-1});
        this.anims.create({key:'walk',frames:this.anims.generateFrameNumbers(`${this.selectedPlayer}_walk`),frameRate:10,repeat:-1});
        this.anims.create({key:`${this.enemyType}_walk`,frames:this.anims.generateFrameNumbers(`${this.enemyType}_walk`),frameRate:10,repeat:-1});

        this.physics.world.setBounds(0,0,this.worldWidth,this.worldHeight);

        /* BACKGROUND */
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

        this.spawnPlatformsSafe(); // ⭐ ГОЛОВНЕ

        /* PLAYER */
        this.player=new Player(this,200,620,`${this.selectedPlayer}_idle`);
        this.physics.add.collider(this.player,this.ground);
        this.physics.add.collider(this.player,this.platforms);
        this.physics.add.collider(this.player,this.movingPlatforms);

        /* CAMERA */
        this.cameras.main.startFollow(this.player,true,0.08,0.08);
        this.cameras.main.setBounds(0,0,this.worldWidth,this.worldHeight);

        /* UI */
        this.hpIcons=[];
        for(let i=0;i<this.maxHP;i++)
            this.hpIcons.push(this.add.image(20+i*40,100,'heart').setScrollFactor(0).setScale(0.45));

        this.heartText=this.add.text(
            20,60,`❤️ 0 / ${this.totalHearts}`,
            {fontSize:'32px',fill:'#e8d9b0'}
        ).setScrollFactor(0);

        /* ENEMIES */
        this.enemies=this.physics.add.group();
        for(let i=0;i<5;i++)
            this.enemies.add(new Enemy(this,800+i*900,620,this.enemyType));

        this.physics.add.collider(this.enemies,this.ground);
        this.physics.add.collider(this.enemies,this.platforms);

        this.physics.add.collider(this.player,this.enemies,(p,e)=>{
            if(p.body.velocity.y>0 && p.y<e.y){
                e.die();
                p.setVelocityY(-350);
            }
        });

        /* HEARTS */
        this.hearts=this.physics.add.staticGroup();
        this.spawnHeartsSafe(this.totalHearts);

        this.physics.add.overlap(this.player,this.hearts,(p,h)=>{
            h.destroy();
            this.heartsCollected++;
            this.heartText.setText(`❤️ ${this.heartsCollected} / ${this.totalHearts}`);
        });
    }

    /* =====================================================
       PLATFORM SPAWN — 20 TOTAL (15 STATIC + 5 MOVING)
    ===================================================== */
    spawnPlatformsSafe(){
        const staticRects=[];
        let x=500;

        /* 15 STATIC */
        for(let i=0;i<15;i++){
            const y=Phaser.Math.Between(260,380);
            const p=this.platforms.create(x,y,`pf${Phaser.Math.Between(1,4)}`).refreshBody();
            staticRects.push(p.getBounds());
            x+=Phaser.Math.Between(280,340);
        }

        /* 5 MOVING — NO OVERLAP */
        let attempts=0;
        let created=0;

        while(created<5 && attempts<200){
            attempts++;

            const x=Phaser.Math.Between(600,this.worldWidth-600);
            const y=Phaser.Math.Between(460,500);
            const rect=new Phaser.Geom.Rectangle(x-70,y-20,140,40);

            let bad=false;
            for(const r of staticRects)
                if(Phaser.Geom.Intersects.RectangleToRectangle(rect,r)) bad=true;

            for(const m of this.movingPlatforms.getChildren())
                if(Phaser.Geom.Intersects.RectangleToRectangle(rect,m.getBounds())) bad=true;

            if(!bad){
                const p=this.movingPlatforms.create(x,y,`pf${Phaser.Math.Between(1,4)}`);
                p.startY=y;
                p.range=120;
                p.speed=50;
                p.body.setVelocityY(p.speed);
                created++;
            }
        }
    }

    spawnHeartsSafe(count){
        const taken=[];
        const plats=[...this.platforms.getChildren(),...this.movingPlatforms.getChildren()];

        while(taken.length<count){
            const x=Phaser.Math.Between(200,this.worldWidth-200);
            const y=Phaser.Math.Between(150,520);
            const r=new Phaser.Geom.Rectangle(x-24,y-24,48,48);

            let bad=false;
            for(const t of taken)
                if(Phaser.Geom.Intersects.RectangleToRectangle(r,t)) bad=true;
            for(const p of plats)
                if(Phaser.Geom.Intersects.RectangleToRectangle(r,p.getBounds())) bad=true;

            if(!bad){
                this.hearts.create(x,y,'heart').setScale(0.45).refreshBody();
                taken.push(r);
            }
        }
    }

    update(){
        this.movingPlatforms.getChildren().forEach(p=>{
            if(p.y>p.startY+p.range) p.body.setVelocityY(-p.speed);
            if(p.y<p.startY-p.range) p.body.setVelocityY(p.speed);
        });
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
    scene:[MenuScene,SelectScene,GameScene]
});
