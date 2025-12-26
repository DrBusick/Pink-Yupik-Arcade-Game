let selectedPlayer = 'player1';

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
        }).setOrigin(0.5);

        title.setShadow(0, 0, '#fff2c1', 20, true, true);

        this.tweens.add({
            targets: title,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                const blur = Phaser.Math.Linear(18, 48, tween.progress);
                title.setShadow(0, 0, '#fff2c1', blur, true, true);
            }
        });

        const btnStyle = { fontFamily: 'UnifrakturCook', fontSize: '56px', fill: '#e8d9b0' };
        const glowOn  = (t, c='#fff2c1') => t.setShadow(0,0,c,18,true,true);
        const glowOff = (t) => t.setShadow(0,0,'#000',0);

        const play = this.add.text(width/2, height/2 - 60, 'PLAY', btnStyle)
            .setOrigin(0.5).setInteractive({ useHandCursor:true });

        play.on('pointerover', () => { this.hoverSound.play(); play.setScale(1.15); glowOn(play); });
        play.on('pointerout', () => { play.setScale(1); glowOff(play); });
        play.on('pointerdown', () => { this.hoverSound.play(); this.scene.start('SelectScene'); });

        const exit = this.add.text(width/2, height/2 + 100, 'EXIT', btnStyle)
            .setOrigin(0.5).setInteractive({ useHandCursor:true });

        exit.on('pointerover', () => { this.hoverSound.play(); exit.setScale(1.15); exit.setTint(0xff6b6b); glowOn(exit, '#ff6b6b'); });
        exit.on('pointerout', () => { exit.setScale(1); exit.clearTint(); glowOff(exit); });
        exit.on('pointerdown', () => { this.hoverSound.play(); window.close(); });
    }

    update() {
        this.bgFar.tilePositionX += 0.2;
        this.bgMid.tilePositionX += 0.5;
        this.bgNear.tilePositionX += 1;
    }
}
// ======================= SELECT =======================
class SelectScene extends Phaser.Scene {
    constructor(){ super('SelectScene'); }

      preload() {
        this.load.image('bg_far', 'assets/backgrounds/bg_far.png');
        this.load.image('bg_mid', 'assets/backgrounds/bg_mid.png');
        this.load.image('bg_near', 'assets/backgrounds/bg_near.png');
        this.load.audio('hover', 'assets/sounds/hover.mp3');

        this.load.image('p1_idle','assets/player1/idle.png');
        this.load.image('p2_idle','assets/player2/idle.png');
    }

    create(){
        const {width,height}=this.scale;

        this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        this.add.text(width/2,120,'Select Character',{
            fontFamily:'UnifrakturCook',fontSize:'64px',fill:'#e8d9b0'
        }).setOrigin(0.5);

        const p1=this.add.image(width/2-220,height/2,'p1_idle').setScale(1.2).setInteractive();
        const p2=this.add.image(width/2+220,height/2,'p2_idle').setScale(1.2).setInteractive();

       p1.on('pointerdown', () => {
    selectedPlayer = 'player1';
    this.scene.stop('GameScene');
    this.scene.start('GameScene');
});

p2.on('pointerdown', () => {
    selectedPlayer = 'player2';
    this.scene.stop('GameScene');
    this.scene.start('GameScene');
});


    }
}

// ======================= PLAYER ========================
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'idle');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // ─── Physics ─────────────────────────────
        this.setCollideWorldBounds(true);
        this.setBodySize(90, 120).setOffset(26, 18);

        this.speed = 260;
        this.accel = 1200;
        this.jumpVelocity = 520;

        this.body.setMaxVelocity(this.speed, 1000);
        this.body.setDragX(1000);

        // ─── State ───────────────────────────────
        this.facing = 'right';
        this.jumpCount = 0;
        this.maxJumps = 3;

        // ─── Input ───────────────────────────────
        this.keys = scene.input.keyboard.addKeys({
            left: 'A',
            right: 'D',
            up: 'W',
            left2: 'LEFT',
            right2: 'RIGHT',
            up2: 'UP'
        });

        this.touchLeft = false;
        this.touchRight = false;
        this.touchJump = false;

        // ─── Sound ───────────────────────────────
        this.walkSound = scene.sound.add('walk', {
            loop: true,
            volume: 0.5
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        const moveLeft  = this.keys.left.isDown  || this.keys.left2.isDown  || this.touchLeft;
        const moveRight = this.keys.right.isDown || this.keys.right2.isDown || this.touchRight;

        // ─── Horizontal movement ────────────────
        if (moveLeft) {
            this.setAccelerationX(-this.accel);
            this.facing = 'left';
        } else if (moveRight) {
            this.setAccelerationX(this.accel);
            this.facing = 'right';
        } else {
            this.setAccelerationX(0);
        }

        const isMoving = moveLeft || moveRight;

        // ─── Jump ────────────────────────────────
        const jumpPressed =
            Phaser.Input.Keyboard.JustDown(this.keys.up) ||
            Phaser.Input.Keyboard.JustDown(this.keys.up2) ||
            this.touchJump;

        if (jumpPressed && this.jumpCount < this.maxJumps) {
            this.setVelocityY(-this.jumpVelocity);
            this.jumpCount++;
            this.scene.jumpSound.play();
            this.touchJump = false;
        }

        // ─── Ground check ────────────────────────
        if (this.body.blocked.down) {
            this.jumpCount = 0;

            if (isMoving && !this.walkSound.isPlaying) {
                this.walkSound.play();
            } else if (!isMoving && this.walkSound.isPlaying) {
                this.walkSound.stop();
            }
        } else if (this.walkSound.isPlaying) {
            this.walkSound.stop();
        }

        // ─── Visuals ─────────────────────────────
        this.setFlipX(this.facing === 'left');
        this.anims.play(isMoving ? 'walk' : 'idle', true);
    }
}


// ======================= GAME SCENE ========================
class GameScene extends Phaser.Scene {
    constructor(){
        super('GameScene');
        this.worldWidth=6000;
        this.worldHeight=832;
        this.heartsCollected=0;
    }

    preload(){
        this.textures.remove('idle');
        this.textures.remove('walk');
        this.load.spritesheet('walk', `assets/${selectedPlayer}/walk.png`, { frameWidth: 142, frameHeight: 142 });
        this.load.image('idle', `assets/${selectedPlayer}/idle.png`);
this.load.image('btn_left',  'assets/ui/btn_left.png');
this.load.image('btn_right', 'assets/ui/btn_right.png');
this.load.image('btn_jump',  'assets/ui/btn_jump.png');
        this.load.image('bg','assets/backgrounds/bg.png');
        this.load.image('ground','assets/platforms/ground.png');
        for(let i=1;i<=4;i++)
            this.load.image(`pf${i}`,`assets/platforms/platform_${i}.png`);

        this.load.image('heart','assets/items/heart_v4.png');

        this.load.audio('jump','assets/sounds/jump.mp3');
        this.load.audio('walk','assets/sounds/walk.mp3');
        this.load.audio('collect','assets/sounds/collect.mp3');
this.load.audio('hover', 'assets/sounds/hover.mp3')
    }

    create(){
        this.anims.create({key:'idle',frames:[{key:'idle'}],repeat:-1});
        this.anims.create({key:'walk',frames:this.anims.generateFrameNumbers('walk'),frameRate:10,repeat:-1});

        this.jumpSound=this.sound.add('jump');
        this.collectSound=this.sound.add('collect');
this.hoverSound = this.sound.add('hover', { volume: 0.6 });

        this.physics.world.setBounds(0,0,this.worldWidth,this.worldHeight);

        this.bg=this.add.tileSprite(0,0,1248,832,'bg')
            .setOrigin(0).setScrollFactor(0);

        this.ground=this.physics.add.staticGroup();
        const gW=this.textures.get('ground').getSourceImage().width;
        for(let i=0;i<this.worldWidth/gW;i++)
            this.ground.create(i*gW+gW/2,this.worldHeight,'ground')
                .setOrigin(0.5,1).refreshBody();

        this.staticPlatforms=this.physics.add.staticGroup();
        this.movingPlatforms=this.physics.add.group({allowGravity:false,immovable:true});

        this.spawnPlatforms();

        this.player=new Player(this,200,300);
        this.physics.add.collider(this.player,this.ground);
        this.physics.add.collider(this.player,this.staticPlatforms);
        this.physics.add.collider(this.player,this.movingPlatforms);

        // HEARTS
        this.hearts=this.physics.add.staticGroup();
        this.spawnHeartsSafe(25);

        this.physics.add.overlap(this.player,this.hearts,(p,h)=>{
            h.destroy();
            this.collectSound.play();
            this.heartsCollected++;
            this.heartText.setText(`❤️ ${this.heartsCollected} / 25`);
            if(this.heartsCollected===25) this.winText.setAlpha(1);
        });

        this.heartText=this.add.text(20,60,'❤️ 0 / 25',{
            fontSize:'32px',fill:'#e8d9b0'
        }).setScrollFactor(0);

        this.winText=this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'ALL 25 HEARTS\nCOLLECTED!',
            {fontFamily:'UnifrakturCook',fontSize:'96px',fill:'#fff2c1',align:'center'}
        ).setOrigin(0.5).setScrollFactor(0).setAlpha(0)
         .setShadow(0,0,'#ff77aa',40,true,true);

        this.cameras.main.startFollow(this.player,true,0.12,0.12);
        this.cameras.main.setBounds(0,0,this.worldWidth,this.worldHeight);
    
const btnStyle = { fontFamily: 'UnifrakturCook', fontSize: '40px', fill: '#e8d9b0' };
        const glowOn  = (t, c='#fff2c1') => t.setShadow(0,0,c,12,true,true);
        const glowOff = (t) => t.setShadow(0,0,'#000',0);

        this.menuButton = this.add.text(20, 20, 'MENU', btnStyle)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor:true });

        this.menuButton.on('pointerover', () => {
            this.hoverSound.play();
            this.menuButton.setScale(1.1);
            glowOn(this.menuButton);
        });

        this.menuButton.on('pointerout', () => {
            this.menuButton.setScale(1);
            glowOff(this.menuButton);
        });

        this.menuButton.on('pointerdown', () => {
    this.hoverSound.play();

    this.scene.stop('GameScene');
    this.scene.start('MenuScene');
        });
this.input.addPointer(2);
this.createTouchControls();
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
        const platforms=[
            ...this.staticPlatforms.getChildren(),
            ...this.movingPlatforms.getChildren()
        ];

        while(hearts.length<count){
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


    update(){
        this.bg.tilePositionX=this.cameras.main.scrollX;

        this.movingPlatforms.getChildren().forEach(p=>{
            if(p.y > p.startY + p.range) p.body.setVelocityY(-p.speed);
            if(p.y < p.startY - p.range) p.body.setVelocityY(p.speed);
        });
    }
}

// ======================= CONFIG =======================
new Phaser.Game({
    type:Phaser.AUTO,
    width:1248,
    height:832,
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
    physics:{default:'arcade',arcade:{gravity:{y:900},debug:false}},
    scene:[MenuScene,SelectScene,GameScene]
});
