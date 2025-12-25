console.log("🔥 main.js FINAL v4");

// ======================= TELEGRAM ========================
let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
}

// ======================= GLOBAL =========================
let selectedCharacter = null;

// ======================= MENU SCENE =====================
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    preload() {
        this.load.image('bg_far', 'assets/backgrounds/bg_far.png');
        this.load.image('bg_mid', 'assets/backgrounds/bg_mid.png');
        this.load.image('bg_near', 'assets/backgrounds/bg_near.png');
        this.load.audio('hover', 'assets/sounds/hover.mp3');
    }

    create() {
        const { width, height } = this.scale;

        this.bgFar  = this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.bgMid  = this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.bgNear = this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.hoverSound = this.sound.add('hover',{volume:0.6});

        this.add.text(width/2, height/4, 'Pink Yupik Arcade',{
            fontFamily:'UnifrakturCook, serif',
            fontSize:'144px',
            fill:'#e8d9b0'
        }).setOrigin(0.5)
          .setShadow(0,0,'#fff2c1',40,true,true);

        const btnStyle = { fontFamily:'UnifrakturCook, serif', fontSize:'56px', fill:'#e8d9b0' };

        const play = this.add.text(width/2, height/2 - 40, 'PLAY', btnStyle)
            .setOrigin(0.5).setInteractive({useHandCursor:true});

        play.on('pointerdown',()=>{
            this.hoverSound.play();
            this.scene.start('CharacterSelectScene');
        });

        const exit = this.add.text(width/2, height/2 + 80, 'EXIT', btnStyle)
            .setOrigin(0.5).setInteractive({useHandCursor:true});

        exit.on('pointerdown',()=>{
            this.hoverSound.play();
            if (tg) tg.close();
        });
    }

    update(){
        this.bgFar.tilePositionX+=0.2;
        this.bgMid.tilePositionX+=0.4;
        this.bgNear.tilePositionX+=0.6;
    }
}

// =================== CHARACTER SELECT ===================
class CharacterSelectScene extends Phaser.Scene {
    constructor(){ super('CharacterSelectScene'); }

    preload(){
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');

        this.load.image('char1','assets/player1/idle.png');
        this.load.image('char2','assets/player2/idle.png');

        this.load.audio('hover','assets/sounds/hover.mp3');
    }

    create(){
        const { width, height } = this.scale;

        this.bgFar  = this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.bgMid  = this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.bgNear = this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.hoverSound=this.sound.add('hover',{volume:0.6});

        this.add.text(width/2,120,'CHOOSE YOUR HERO',{
            fontFamily:'UnifrakturCook, serif',
            fontSize:'72px',
            fill:'#e8d9b0'
        }).setOrigin(0.5);

        const frame1=this.add.rectangle(width/2-220,height/2,240,240)
            .setStrokeStyle(4,0xfff2c1).setAlpha(0);
        const frame2=this.add.rectangle(width/2+220,height/2,240,240)
            .setStrokeStyle(4,0xfff2c1).setAlpha(0);

        const makeChar = (x,key,id,frame)=>{
            const s=this.add.image(x,height/2,key)
                .setScale(1.2)
                .setInteractive({useHandCursor:true});

            s.on('pointerdown',()=>{
                this.hoverSound.play();
                selectedCharacter=id;
                frame1.setAlpha(0);
                frame2.setAlpha(0);
                frame.setAlpha(1);
            });
        };

        makeChar(width/2-220,'char1','player1',frame1);
        makeChar(width/2+220,'char2','player2',frame2);

        const start=this.add.text(width/2,height-140,'START',{
            fontFamily:'UnifrakturCook, serif',
            fontSize:'56px',
            fill:'#e8d9b0'
        }).setOrigin(0.5).setInteractive({useHandCursor:true});

        start.on('pointerdown',()=>{
            if(!selectedCharacter) return;
            this.hoverSound.play();
            this.scene.start('GameScene');
        });
    }

    update(){
        this.bgFar.tilePositionX+=0.2;
        this.bgMid.tilePositionX+=0.4;
        this.bgNear.tilePositionX+=0.6;
    }
}

// ======================= PLAYER =========================
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y){
        super(scene,x,y,'idle');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBodySize(90,120).setOffset(26,18);

        this.maxSpeed = 260;
        this.accel = 900;
        this.jumpVelocity = 520;

        this.jumpCount = 0;
        this.maxJumps = 3;

        this.setDragX(1600);

        this.keys = scene.input.keyboard.addKeys({
            left:'A', right:'D', up:'W',
            left2:'LEFT', right2:'RIGHT', up2:'UP'
        });

        this.touchLeft=false;
        this.touchRight=false;
        this.touchJump=false;
    }

    preUpdate(time, delta){
        super.preUpdate(time, delta);

        const left = this.keys.left.isDown || this.keys.left2.isDown || this.touchLeft;
        const right = this.keys.right.isDown || this.keys.right2.isDown || this.touchRight;

        if(left){
            this.setAccelerationX(-this.accel);
            this.setFlipX(true);
        } else if(right){
            this.setAccelerationX(this.accel);
            this.setFlipX(false);
        } else {
            this.setAccelerationX(0);
        }

        if (this.body.velocity.x > this.maxSpeed) this.setVelocityX(this.maxSpeed);
        if (this.body.velocity.x < -this.maxSpeed) this.setVelocityX(-this.maxSpeed);

        if((Phaser.Input.Keyboard.JustDown(this.keys.up)||
            Phaser.Input.Keyboard.JustDown(this.keys.up2)||
            this.touchJump) && this.jumpCount < this.maxJumps){
            this.setVelocityY(-this.jumpVelocity);
            this.scene.jumpSound.play();
            this.jumpCount++;
            this.touchJump = false;
        }

        if(this.body.blocked.down) this.jumpCount = 0;

        const moving = Math.abs(this.body.velocity.x) > 5;
        this.anims.play(moving ? 'walk' : 'idle', true);
    }
}

// ======================= GAME SCENE =====================
class GameScene extends Phaser.Scene {
    constructor(){
        super('GameScene');
        this.worldWidth = 6000;
        this.worldHeight = 832;
        this.heartsCollected = 0;
    }

    preload(){
        this.load.image('bg','assets/backgrounds/bg.png');
        this.load.image('ground','assets/platforms/ground.png');

        for(let i=1;i<=4;i++)
            this.load.image(`pf${i}`,`assets/platforms/platform_${i}.png`);

        this.load.image('heart','assets/items/heart_v4.png');

        this.load.audio('jump','assets/sounds/jump.mp3');
        this.load.audio('collect','assets/sounds/collect.mp3');
        this.load.audio('hover','assets/sounds/hover.mp3');

        this.load.image('p1_idle','assets/player1/idle.png');
        this.load.spritesheet('p1_walk','assets/player1/walk.png',{frameWidth:142,frameHeight:142});

        this.load.image('p2_idle','assets/player2/idle.png');
        this.load.spritesheet('p2_walk','assets/player2/walk.png',{frameWidth:142,frameHeight:142});
    }

    create(){
        const idleKey = selectedCharacter === 'player2' ? 'p2_idle' : 'p1_idle';
        const walkKey = selectedCharacter === 'player2' ? 'p2_walk' : 'p1_walk';

        this.anims.remove('idle');
        this.anims.remove('walk');

        this.anims.create({ key:'idle', frames:[{key:idleKey}], repeat:-1 });
        this.anims.create({ key:'walk', frames:this.anims.generateFrameNumbers(walkKey), frameRate:10, repeat:-1 });

        this.jumpSound   = this.sound.add('jump');
        this.collectSound= this.sound.add('collect');
        this.hoverSound  = this.sound.add('hover',{volume:0.6});

        this.physics.world.setBounds(0,0,this.worldWidth,this.worldHeight);

        this.bg = this.add.tileSprite(0,0,1248,832,'bg').setOrigin(0).setScrollFactor(0);

        this.ground = this.physics.add.staticGroup();
        const gW = this.textures.get('ground').getSourceImage().width;
        for(let i=0;i<this.worldWidth/gW;i++){
            this.ground.create(i*gW+gW/2,this.worldHeight,'ground')
                .setOrigin(0.5,1).refreshBody();
        }

        this.staticPlatforms = this.physics.add.staticGroup();
        this.movingPlatforms = this.physics.add.group({ allowGravity:false, immovable:true });

        this.spawnPlatforms();

        this.player = new Player(this,200,300);
        this.physics.add.collider(this.player,this.ground);
        this.physics.add.collider(this.player,this.staticPlatforms);
        this.physics.add.collider(this.player,this.movingPlatforms);

        this.hearts = this.physics.add.staticGroup();
        this.spawnHeartsSafe(25);

        this.physics.add.overlap(this.player,this.hearts,(p,h)=>{
            h.destroy();
            this.collectSound.play();
            this.heartsCollected++;
            this.heartText.setText(`❤️ ${this.heartsCollected} / 25`);
        });

        this.heartText = this.add.text(20,60,'❤️ 0 / 25',{fontSize:'32px',fill:'#e8d9b0'}).setScrollFactor(0);

        this.menuButton = this.add.text(20,20,'MENU',{
            fontFamily:'UnifrakturCook, serif',
            fontSize:'40px',
            fill:'#e8d9b0'
        }).setScrollFactor(0).setInteractive({useHandCursor:true});

        this.menuButton.on('pointerdown',()=>{
            this.hoverSound.play();
            this.scene.start('MenuScene');
        });

        this.cameras.main.startFollow(this.player,true,0.12,0.12);
        this.cameras.main.setBounds(0,0,this.worldWidth,this.worldHeight);
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
            } else {
                this.staticPlatforms.create(x,y,key).refreshBody();
            }
            x+=Phaser.Math.Between(260,320);
        }
    }

    spawnHeartsSafe(count){
        const hearts=[];
        const platforms=[...this.staticPlatforms.getChildren(),...this.movingPlatforms.getChildren()];
        let attempts=0;

        while(hearts.length<count && attempts<5000){
            attempts++;
            const x=Phaser.Math.Between(200,this.worldWidth-200);
            const y=Phaser.Math.Between(150,500);
            const rect=new Phaser.Geom.Rectangle(x-25,y-25,50,50);

            let bad=false;
            for(const h of hearts)
                if(Phaser.Geom.Intersects.RectangleToRectangle(rect,h)) bad=true;
            for(const p of platforms)
                if(Phaser.Geom.Intersects.RectangleToRectangle(rect,p.getBounds())) bad=true;

            if(!bad){
                this.hearts.create(x,y,'heart').setDisplaySize(50,50).refreshBody();
                hearts.push(rect);
            }
        }
    }

    update(){
        this.bg.tilePositionX = this.cameras.main.scrollX;

        this.movingPlatforms.getChildren().forEach(p=>{
            if(p.y > p.startY + p.range) p.body.setVelocityY(-p.speed);
            if(p.y < p.startY - p.range) p.body.setVelocityY(p.speed);
        });
    }
}

// ======================= CONFIG ========================
new Phaser.Game({
    type:Phaser.AUTO,
    width:1248,
    height:832,
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
    physics:{default:'arcade',arcade:{gravity:{y:900},debug:false}},
    scene:[MenuScene,CharacterSelectScene,GameScene]
});
