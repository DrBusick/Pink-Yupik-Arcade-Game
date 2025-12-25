console.log("🔥 FULL GAME v1");

// ================= TELEGRAM =================
let tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) { tg.ready(); tg.expand(); }

// ================= GLOBAL STATE =================
const GameState = { character:'player1', hearts:0 };

// ================= MENU =================
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

        const style={fontFamily:'UnifrakturCook, serif',fontSize:'56px',fill:'#e8d9b0'};

        this.add.text(width/2,height/2-40,'PLAY',style).setOrigin(0.5).setInteractive().on('pointerdown',()=>this.scene.start('SelectScene'));
        this.add.text(width/2,height/2+60,'EXIT',style).setOrigin(0.5).setInteractive().on('pointerdown',()=>{ if(tg) tg.close(); });
    }

    update(){ this.bgFar.tilePositionX+=0.2; this.bgMid.tilePositionX+=0.4; this.bgNear.tilePositionX+=0.6; }
}

// ================= CHARACTER SELECT =================
class SelectScene extends Phaser.Scene {
    constructor(){ super('SelectScene'); }

    preload(){
        this.load.image('char1','assets/player1/idle.png');
        this.load.image('char2','assets/player2/idle.png');
    }

    create(){
        const {width,height}=this.scale;
        this.add.image(width/2-200,height/2,'char1').setInteractive().on('pointerdown',()=>{GameState.character='player1';this.scene.start('GameScene');});
        this.add.image(width/2+200,height/2,'char2').setInteractive().on('pointerdown',()=>{GameState.character='player2';this.scene.start('GameScene');});
    }
}

// ================= PLAYER =================
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y,idle,walk){
        super(scene,x,y,idle);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.idle=idle; this.walk=walk;
        this.setCollideWorldBounds(true);
        this.setDragX(1600);
    }

    update(){
        const c=this.scene.input.keyboard.createCursorKeys();
        if(c.left.isDown){ this.setAccelerationX(-900); this.setFlipX(true); }
        else if(c.right.isDown){ this.setAccelerationX(900); this.setFlipX(false); }
        else this.setAccelerationX(0);

        this.anims.play(Math.abs(this.body.velocity.x)>5?this.walk:this.idle,true);
    }
}

// ================= GAME =================
class GameScene extends Phaser.Scene {
    constructor(){ super('GameScene'); }

    preload(){
        this.load.image('ground','assets/platforms/ground.png');
        for(let i=1;i<=4;i++) this.load.image(`pf${i}`,`assets/platforms/platform_${i}.png`);
        this.load.image('heart','assets/items/heart_v4.png');

        this.load.image('p1_idle','assets/player1/idle.png');
        this.load.spritesheet('p1_walk','assets/player1/walk.png',{frameWidth:142,frameHeight:142});
        this.load.image('p2_idle','assets/player2/idle.png');
        this.load.spritesheet('p2_walk','assets/player2/walk.png',{frameWidth:142,frameHeight:142});
    }

    create(){
        const idle=GameState.character==='player2'?'p2_idle':'p1_idle';
        const walk=GameState.character==='player2'?'p2_walk':'p1_walk';

        if(!this.anims.exists(idle)){
            this.anims.create({key:idle,frames:[{key:idle}],repeat:-1});
            this.anims.create({key:walk,frames:this.anims.generateFrameNumbers(walk),frameRate:10,repeat:-1});
        }

        this.ground=this.physics.add.staticGroup();
        for(let i=0;i<20;i++) this.ground.create(i*300,800,'ground').setOrigin(0,1).refreshBody();

        this.staticPlatforms=this.physics.add.staticGroup();
        this.movingPlatforms=this.physics.add.group({allowGravity:false,immovable:true});

        this.spawnPlatforms();

        this.player=new Player(this,200,500,idle,walk);
        this.physics.add.collider(this.player,this.ground);
        this.physics.add.collider(this.player,this.staticPlatforms);
        this.physics.add.collider(this.player,this.movingPlatforms);

        this.hearts=this.physics.add.staticGroup();
        for(let i=0;i<20;i++) this.hearts.create(Phaser.Math.Between(400,5500),Phaser.Math.Between(200,500),'heart');

        this.physics.add.overlap(this.player,this.hearts,(p,h)=>{h.destroy();GameState.hearts++;this.ui.setText(`❤️ ${GameState.hearts}`);});

        this.ui=this.add.text(20,20,'❤️ 0',{fontSize:'32px',fill:'#fff'}).setScrollFactor(0);

        this.cameras.main.startFollow(this.player,true,0.1,0.1);
        this.physics.world.setBounds(0,0,6000,832);
    }

    spawnPlatforms(){
        const keys=['pf1','pf2','pf3','pf4'];
        let x=400;
        for(let i=0;i<25;i++){
            const y=Phaser.Math.Between(220,520);
            const key=Phaser.Utils.Array.GetRandom(keys);
            if(i%5===0){
                const p=this.movingPlatforms.create(x,y,key);
                p.startY=y; p.range=100; p.speed=50; p.body.setVelocityY(50);
            } else this.staticPlatforms.create(x,y,key).refreshBody();
            x+=Phaser.Math.Between(250,350);
        }
    }

    update(){
        this.player.update();
        this.movingPlatforms.getChildren().forEach(p=>{
            if(p.y>p.startY+p.range) p.body.setVelocityY(-p.speed);
            if(p.y<p.startY-p.range) p.body.setVelocityY(p.speed);
        });
    }
}

// ================= CONFIG =================
new Phaser.Game({
    type:Phaser.AUTO,
    width:window.innerWidth,
    height:window.innerHeight,
    scale:{mode:Phaser.Scale.RESIZE},
    physics:{default:'arcade',arcade:{gravity:{y:900}}},
    scene:[MenuScene,SelectScene,GameScene]
});
