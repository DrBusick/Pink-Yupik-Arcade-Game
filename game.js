let selectedPlayer = 'player';

/* ======================= MENU SCENE ======================= */
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    preload() {
        this.load.image('bg_far', 'assets/backgrounds/bg_far.png');
        this.load.image('bg_mid', 'assets/backgrounds/bg_mid.png');
        this.load.image('bg_near', 'assets/backgrounds/bg_near.png');
    }

    create() {
        const { width, height } = this.scale;

        this.bgFar  = this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.bgMid  = this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.bgNear = this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        const title = this.add.text(width/2, height/3, 'Pink Yupik Arcade',{
            fontFamily:'UnifrakturCook',fontSize:'120px',fill:'#e8d9b0'
        }).setOrigin(0.5);

        const play = this.add.text(width/2, height/2 + 40, 'PLAY',{
            fontFamily:'UnifrakturCook',fontSize:'64px',fill:'#e8d9b0'
        }).setOrigin(0.5).setInteractive();

        play.on('pointerdown',()=>this.scene.start('SelectScene'));
    }

    update(){
        this.bgFar.tilePositionX += 0.2;
        this.bgMid.tilePositionX += 0.4;
        this.bgNear.tilePositionX += 0.8;
    }
}

/* ======================= SELECT SCENE ======================= */
class SelectScene extends Phaser.Scene {
    constructor(){ super('SelectScene'); }

    preload(){
        this.load.image('p1_idle','assets/player1/idle.png');
        this.load.image('p2_idle','assets/player2/idle.png');
    }

    create(){
        const {width,height}=this.scale;

        this.add.text(width/2,120,'Select Character',{
            fontFamily:'UnifrakturCook',fontSize:'64px',fill:'#e8d9b0'
        }).setOrigin(0.5);

        this.add.image(width/2-200,height/2,'p1_idle')
            .setScale(1.2)
            .setInteractive()
            .on('pointerdown',()=>this.scene.start('GameScene',{player:'player1'}));

        this.add.image(width/2+200,height/2,'p2_idle')
            .setScale(1.2)
            .setInteractive()
            .on('pointerdown',()=>this.scene.start('GameScene',{player:'player2'}));
    }
}

/* ======================= PLAYER ======================= */
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y,key){
        super(scene,x,y,key);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBodySize(90,120).setOffset(26,18);

        this.speed = 180;
        this.accel = 900;
        this.jumpVelocity = 520;
        this.jumpCount = 0;
        this.maxJumps = 3;
        this.isInvulnerable = false;

        this.keys = scene.input.keyboard.addKeys({
            left:'A', right:'D', up:'W',
            left2:'LEFT', right2:'RIGHT', up2:'UP'
        });
    }

    preUpdate(t,d){
        super.preUpdate(t,d);

        const l = this.keys.left.isDown || this.keys.left2.isDown;
        const r = this.keys.right.isDown || this.keys.right2.isDown;

        if(l) this.setAccelerationX(-this.accel);
        else if(r) this.setAccelerationX(this.accel);
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

        this.setFlipX(l);
        this.anims.play(l||r ? 'walk':'idle', true);
    }
}

/* ======================= ENEMY ======================= */
class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y,type){
        super(scene,x,y,`${type}_idle`);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed = 100;
        this.chaseRange = 400;
        this.startX = x;
        this.direction = 1;
        this.isDead = false;
    }

    preUpdate(){
        if(this.isDead) return;
        const player = this.scene.player;
        if(!player) return;

        const dist = Phaser.Math.Distance.Between(this.x,this.y,player.x,player.y);

        if(dist < this.chaseRange){
            const dir = player.x < this.x ? -1 : 1;
            this.setVelocityX(dir * this.speed);
            this.setFlipX(dir < 0);
            this.anims.play('enemy_walk',true);
        } else {
            this.setVelocityX(this.direction * this.speed);
            if(Math.abs(this.x - this.startX) > 300) this.direction *= -1;
            this.anims.play('enemy_walk',true);
        }
    }

    die(){
        this.isDead = true;
        this.disableBody(true,true);
    }
}

/* ======================= GAME SCENE ======================= */
class GameScene extends Phaser.Scene {
    constructor(){
        super('GameScene');
        this.worldWidth = 6000;
        this.worldHeight = 832;
    }

    init(data){
        this.selectedPlayer = data.player;
        this.enemyType = this.selectedPlayer === 'player1' ? 'player2' : 'player1';
    }

    preload(){
        const p=this.selectedPlayer;
        const e=this.enemyType;

        this.load.image(`${p}_idle`,`assets/${p}/idle.png`);
        this.load.spritesheet(`${p}_walk`,`assets/${p}/walk.png`,{frameWidth:142,frameHeight:142});
        this.load.image(`${e}_idle`,`assets/${e}/idle.png`);
        this.load.spritesheet(`${e}_walk`,`assets/${e}/walk.png`,{frameWidth:142,frameHeight:142});

        this.load.image('bg','assets/backgrounds/bg.png');
        this.load.image('ground','assets/platforms/ground.png');
        for(let i=1;i<=4;i++)
            this.load.image(`pf${i}`,`assets/platforms/platform_${i}.png`);
    }

    create(){
        this.anims.create({key:'idle',frames:[{key:`${this.selectedPlayer}_idle`}],repeat:-1});
        this.anims.create({key:'walk',frames:this.anims.generateFrameNumbers(`${this.selectedPlayer}_walk`),frameRate:10,repeat:-1});
        this.anims.create({key:'enemy_walk',frames:this.anims.generateFrameNumbers(`${this.enemyType}_walk`),frameRate:8,repeat:-1});

        this.physics.world.setBounds(0,0,this.worldWidth,this.worldHeight);

        /* 🔥 ПАРАЛАКС ФОН */
        this.bg = this.add.tileSprite(0,0,1248,832,'bg')
            .setOrigin(0)
            .setScrollFactor(0.3);

        /* ПІДЛОГА */
        this.ground = this.physics.add.staticGroup();
        const gW = this.textures.get('ground').getSourceImage().width;
        for(let i=0;i<this.worldWidth/gW;i++)
            this.ground.create(i*gW+gW/2,this.worldHeight,'ground').setOrigin(0.5,1).refreshBody();

        /* ПЛАТФОРМИ ПО СЕКЦІЯХ */
        this.platforms = this.physics.add.staticGroup();
        let x = 400;

        const sections = [
            {count:6, minY:360, maxY:480},
            {count:8, minY:260, maxY:520},
            {count:6, minY:200, maxY:400},
            {count:6, minY:300, maxY:460},
        ];

        sections.forEach(sec=>{
            for(let i=0;i<sec.count;i++){
                const y = Phaser.Math.Between(sec.minY, sec.maxY);
                const key = `pf${Phaser.Math.Between(1,4)}`;
                this.platforms.create(x,y,key).refreshBody();
                x += Phaser.Math.Between(260,320);
            }
        });

        /* ГРАВЕЦЬ */
        this.player = new Player(this,200,300,`${this.selectedPlayer}_idle`);
        this.physics.add.collider(this.player,this.ground);
        this.physics.add.collider(this.player,this.platforms);

        /* 🔥 КАМЕРА */
        this.cameras.main.startFollow(this.player,true,0.08,0.08);
        this.cameras.main.setBounds(0,0,this.worldWidth,this.worldHeight);

        /* ВОРОГИ */
        this.enemies = this.physics.add.group();
        for(let i=0;i<5;i++)
            this.enemies.add(new Enemy(this,800+i*800,300,this.enemyType));

        this.physics.add.collider(this.enemies,this.ground);
        this.physics.add.collider(this.enemies,this.platforms);
        this.physics.add.collider(this.player,this.enemies,(p,e)=>{
            if(p.body.velocity.y > 0){
                e.die();
                p.setVelocityY(-350);
            }
        });
    }

    update(){
        this.bg.tilePositionX = this.cameras.main.scrollX * 0.3;
    }
}

/* ======================= CONFIG ======================= */
new Phaser.Game({
    type: Phaser.AUTO,
    width: 1248,
    height: 832,
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
    physics:{default:'arcade',arcade:{gravity:{y:900},debug:false}},
    scene:[MenuScene,SelectScene,GameScene]
});
