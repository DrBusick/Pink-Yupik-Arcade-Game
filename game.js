let selectedPlayer = 'player';

// ======================= MENU SCENE ========================
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

        const title = this.add.text(width/2,height/4,'Pink Yupik Arcade',{
            fontFamily:'UnifrakturCook',
            fontSize:'144px',
            fill:'#e8d9b0'
        }).setOrigin(0.5).setShadow(0,0,'#fff2c1',20,true,true);

        this.tweens.add({
            targets:title,
            yoyo:true,
            repeat:-1,
            duration:2000,
            ease:'Sine.easeInOut'
        });

        const btnStyle={fontFamily:'UnifrakturCook',fontSize:'56px',fill:'#e8d9b0'};

        const play=this.add.text(width/2,height/2-60,'PLAY',btnStyle)
            .setOrigin(0.5).setInteractive();

        play.on('pointerdown',()=>this.scene.start('SelectScene'));
    }

    update() {
        this.bgFar.tilePositionX+=0.2;
        this.bgMid.tilePositionX+=0.5;
        this.bgNear.tilePositionX+=1;
    }
}

// ======================= SELECT SCENE ========================
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

        const p1=this.add.image(width/2-200,height/2,'p1_idle')
            .setInteractive().setScale(1.2);
        const p2=this.add.image(width/2+200,height/2,'p2_idle')
            .setInteractive().setScale(1.2);

        p1.on('pointerdown',()=>this.scene.start('GameScene',{player:'player1'}));
        p2.on('pointerdown',()=>this.scene.start('GameScene',{player:'player2'}));
    }
}

// ======================= PLAYER ========================
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y){
        super(scene,x,y,'idle');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.body.setSize(90,120).setOffset(26,18);

        this.speed=260;
        this.jumpVelocity=520;
        this.jumpCount=0;
        this.maxJumps=2;

        this.invulnerable=false;

        this.keys=scene.input.keyboard.addKeys({
            left:'A',right:'D',up:'W',
            left2:'LEFT',right2:'RIGHT',up2:'UP'
        });
    }

    preUpdate(t,d){
        super.preUpdate(t,d);

        const left=this.keys.left.isDown||this.keys.left2.isDown;
        const right=this.keys.right.isDown||this.keys.right2.isDown;

        if(left) this.setVelocityX(-this.speed);
        else if(right) this.setVelocityX(this.speed);
        else this.setVelocityX(0);

        if((Phaser.Input.Keyboard.JustDown(this.keys.up)
            ||Phaser.Input.Keyboard.JustDown(this.keys.up2))
            && this.jumpCount<this.maxJumps){
            this.setVelocityY(-this.jumpVelocity);
            this.jumpCount++;
        }

        if(this.body.blocked.down) this.jumpCount=0;
    }
}

// ======================= ENEMY ========================
class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y,texture){
        super(scene,x,y,texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.speed=90;
        this.alive=true;

        this.body.setSize(90,120).setOffset(26,18);
    }

    update(player){
        if(!this.alive||!player) return;
        if(!this.body.blocked.down) return;

        const dist=Phaser.Math.Distance.Between(this.x,this.y,player.x,player.y);
        if(dist>500){ this.setVelocityX(0); return; }

        if(player.x<this.x-10){
            this.setVelocityX(-this.speed);
            this.setFlipX(true);
        } else if(player.x>this.x+10){
            this.setVelocityX(this.speed);
            this.setFlipX(false);
        } else this.setVelocityX(0);
    }

    die(){
        this.alive=false;
        this.disableBody(true,true);
    }
}

// ======================= GAME SCENE ========================
class GameScene extends Phaser.Scene {
    constructor(){
        super('GameScene');
        this.worldWidth=6000;
        this.lives=3;
    }

    init(data){
        this.selectedPlayer=data.player;
    }

    preload(){
        const p=this.selectedPlayer;
        const e=p==='player1'?'player2':'player1';

        this.load.image(`${p}_idle`,`assets/${p}/idle.png`);
        this.load.spritesheet(`${p}_walk`,`assets/${p}/walk.png`,
            {frameWidth:142,frameHeight:142});
        this.load.image('enemy_idle',`assets/${e}/idle.png`);

        this.load.image('ground','assets/platforms/ground.png');
        this.load.image('heart','assets/items/heart_v4.png');
    }

    create(){
        const p=this.selectedPlayer;

        this.anims.create({key:'idle',frames:[{key:`${p}_idle`}],repeat:-1});
        this.anims.create({
            key:'walk',
            frames:this.anims.generateFrameNumbers(`${p}_walk`),
            frameRate:10,repeat:-1
        });

        this.physics.world.setBounds(0,0,this.worldWidth,900);

        this.ground=this.physics.add.staticGroup();
        for(let i=0;i<60;i++)
            this.ground.create(i*100,900,'ground').setOrigin(0,1).refreshBody();

        this.player=new Player(this,200,400);
        this.physics.add.collider(this.player,this.ground);

        // ❤️ ЖИТТЯ
        this.lifeIcons=[];
        for(let i=0;i<3;i++)
            this.lifeIcons.push(
                this.add.image(20+i*40,40,'heart')
                    .setScrollFactor(0).setScale(0.6)
            );

        // 👾 ВОРОГИ
        this.enemies=this.physics.add.group();
        for(let i=0;i<8;i++){
            const e=new Enemy(this,
                Phaser.Math.Between(600,this.worldWidth-300),
                400,'enemy_idle');
            this.enemies.add(e);
        }

        this.physics.add.collider(this.enemies,this.ground);

        // 💥 КОНТАКТ
        this.physics.add.collider(this.player,this.enemies,(p,e)=>{
            if(!e.alive) return;

            const pBottom=p.body.y+p.body.height;
            const eTop=e.body.y+10;

            if(pBottom<eTop && p.body.velocity.y>0){
                e.die();
                p.setVelocityY(-360);

                if(Phaser.Math.Between(0,100)<60){
                    this.physics.add.image(e.x,e.y,'heart')
                        .setScale(0.5);
                }
            } else {
                this.damagePlayer(e.x);
            }
        });

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0,0,this.worldWidth,900);
    }

    damagePlayer(fromX){
        if(this.player.invulnerable||this.lives<=0) return;

        this.lives--;
        this.lifeIcons[this.lives].setAlpha(0.3);

        const dir=this.player.x<fromX?-1:1;
        this.player.setVelocityX(300*dir);
        this.player.setVelocityY(-300);

        this.player.invulnerable=true;
        this.player.body.checkCollision.none=true;

        this.tweens.add({
            targets:this.player,
            alpha:0.2,
            duration:80,
            yoyo:true,
            repeat:10
        });

        this.time.delayedCall(1000,()=>{
            this.player.invulnerable=false;
            this.player.setAlpha(1);
            this.player.body.checkCollision.none=false;
        });

        if(this.lives<=0){
            this.player.disableBody(true,true);
            this.scene.restart();
        }
    }

    update(){
        this.enemies.getChildren().forEach(e=>e.update(this.player));
    }
}

// ======================= CONFIG ========================
new Phaser.Game({
    type:Phaser.AUTO,
    width:1248,
    height:832,
    physics:{default:'arcade',arcade:{gravity:{y:900}}},
    scene:[MenuScene,SelectScene,GameScene]
});
