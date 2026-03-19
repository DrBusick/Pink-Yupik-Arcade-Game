import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';

export default class GameScene extends Phaser.Scene {
    constructor(){
        super('GameScene');
        this.worldWidth=6000;
        this.worldHeight=832;
        this.maxHP=5;
        this.hp=5;
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

        this.load.image('btn_left','assets/ui/btn_left.png');
        this.load.image('btn_right','assets/ui/btn_right.png');
        this.load.image('btn_jump','assets/ui/btn_jump.png');

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
            this.ground.create(i*gW+gW/2,this.worldHeight,'ground')
                .setOrigin(0.5,1)
                .refreshBody();

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

            for(let i=0;i<this.maxHP;i++){
                this.hpIcons.push(
                    this.add.image(20+i*40,100,'heart_small')
                        .setScrollFactor(0)
                        .setScale(0.3)
                );
            }

            this.heartText=this.add.text(20,60,`?? 0 / ${this.totalHearts}`,{
                fontSize:'32px',
                fill:'#e8d9b0',
                fontFamily:'UnifrakturCook'
            }).setScrollFactor(0);
        });

        this.hearts = this.physics.add.staticGroup();
        this.spawnHearts(this.totalHearts);

        this.physics.add.overlap(this.player,this.hearts,(p,h)=>{
            h.destroy();
            this.heartsCollected++;
            this.sound.play('heart_pick');
            this.heartText.setText(`?? ${this.heartsCollected} / ${this.totalHearts}`);

            if(this.heartsCollected>=this.totalHearts)
                this.showWinText();
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

            const platBelow=plats.find(pl=>
                Math.abs(pl.x - e.x) < pl.displayWidth/2+10 &&
                Math.abs(pl.y - e.y) < 10
            );

            if(dist < 450){
                const dir = p.x<e.x?-1:1;

                e.setFlipX(dir<0);

                if(e.body.blocked.down || platBelow)
                    e.setVelocityX(dir*e.speed);

                if(platBelow && (!platBelow || p.y < platBelow.y - 10)){
                    if(e.body.blocked.down)
                        e.setVelocityY(-this.player.jumpVelocity*0.7);
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

        if(this.hp<=0)
            this.scene.start('LoseScene',{player:this.selectedPlayer});
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
                }) || this.hearts.getChildren().some(h=>
                    Math.abs(h.x-x)<40 && Math.abs(h.y-y)<40
                );

            } while(overlap);

            const heart=this.hearts.create(x,y,'heart_collect')
                .setScale(0.45)
                .refreshBody();

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

    showWinText(){
        const {width,height}=this.scale;

        const txt=this.add.text(
            this.cameras.main.scrollX+width/2,
            height/2,
            'YOU WIN ??',
            {
                fontFamily:'UnifrakturCook',
                fontSize:'128px',
                fill:'#ffea00'
            }
        ).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

        this.tweens.add({
            targets:txt,
            alpha:1,
            duration:1000,
            ease:'Sine.easeInOut'
        });

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