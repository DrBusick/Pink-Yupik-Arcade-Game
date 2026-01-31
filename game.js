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

        const l=this.keys.left.isDown||this.keys.left2.isDown||this.moveLeft;
        const r=this.keys.right.isDown||this.keys.right2.isDown||this.moveRight;

        if(l) this.setAccelerationX(-this.accel);
        else if(r) this.setAccelerationX(this.accel);
        else this.setAccelerationX(0);

        if(((Phaser.Input.Keyboard.JustDown(this.keys.up)||Phaser.Input.Keyboard.JustDown(this.keys.up2))||this.jump)
           && this.jumpCount<this.maxJumps){
            this.setVelocityY(-this.jumpVelocity);
            this.jumpCount++;
            this.scene.sound.play('jump');
        }

        if(this.body.blocked.down) this.jumpCount=0;
        if(l) this.setFlipX(true);
        else if(r) this.setFlipX(false);

        if(Math.abs(this.body.velocity.x)>5){
            this.anims.play('walk',true);
            if(this.body.blocked.down && t>this.stepTimer){
                this.scene.sound.play('step',{volume:0.5});
                this.stepTimer=t+350;
            }
        } else {
            this.anims.play('idle',true);
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
            .setScale(0.4).setBounce(0.4)
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
    constructor(){ super('GameScene'); }

    preload(){
        // Backgrounds
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');

        // Player + Enemy
        this.load.spritesheet('player1','assets/player1.png',{ frameWidth:48, frameHeight:48 });
        this.load.spritesheet('player2','assets/player2.png',{ frameWidth:48, frameHeight:48 });
        this.load.spritesheet('enemy','assets/enemy.png',{ frameWidth:48, frameHeight:48 });

        // Tiles
        this.load.image('ground','assets/tiles/ground.png');
        this.load.image('platform','assets/tiles/platform.png');
        this.load.image('platform_move','assets/tiles/platform_move.png');

        // Hearts
        this.load.image('heart_big','assets/items/heart_big.png');
        this.load.image('heart_small','assets/items/heart_small.png');

        // UI
        this.load.image('heart_ui','assets/ui/heart_ui.png');

        // Sounds
        this.load.audio('jump','assets/sounds/jump.mp3');
        this.load.audio('step','assets/sounds/walk.mp3');
        this.load.audio('heart_pick','assets/sounds/collect.mp3');
        this.load.audio('hit','assets/sounds/hover.mp3');
        this.load.audio('enemy_die','assets/sounds/collect.mp3');
    }

    create(data){
        const { width, height } = this.scale;

        // Backgrounds
        this.bg_far = this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0).setScrollFactor(0);
        this.bg_mid = this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0).setScrollFactor(0.3);
        this.bg_near = this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0).setScrollFactor(0.6);

        // Physics world
        this.physics.world.setBounds(0,0,3000,height);

        // Platforms
        this.platforms = this.physics.add.staticGroup();

        // Ground (bottom)
        for(let x=0;x<3000;x+=128){
            this.platforms.create(x, height-32, 'ground').setOrigin(0,0).refreshBody();
        }

        // Static platforms bottom/middle/top
        const staticPositions = [
            {x:300,y:500},{x:500,y:400},{x:700,y:550},
            {x:900,y:350},{x:1100,y:450},{x:1300,y:300},
            {x:1500,y:520},{x:1700,y:420},{x:1900,y:330},
            {x:2100,y:500},{x:2300,y:400},{x:2500,y:350}
        ];

        staticPositions.forEach(p=>{
            this.platforms.create(p.x,p.y,'platform').setOrigin(0,0).refreshBody();
        });

        // Moving platforms (5 of 20, not near)
        this.movingPlatforms = this.physics.add.group({ allowGravity:false, immovable:true });

        const movingPositions = [
            {x:200,y:300,speed:40,range:120},
            {x:800,y:250,speed:60,range:150},
            {x:1400,y:280,speed:50,range:100},
            {x:2000,y:260,speed:70,range:140},
            {x:2600,y:240,speed:55,range:130}
        ];

        movingPositions.forEach(p=>{
            const plat = this.movingPlatforms.create(p.x,p.y,'platform_move');
            plat.startY = p.y;
            plat.speed = p.speed;
            plat.range = p.range;
            plat.body.allowGravity = false;
            plat.body.immovable = true;
        });

        // Player
        const playerKey = data.player || selectedPlayer;
        this.player = this.physics.add.sprite(100, height-100, playerKey);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(28,40).setOffset(10,8);

        // Camera
        this.cameras.main.setBounds(0,0,3000,height);
        this.cameras.main.startFollow(this.player,true,0.08,0.08);

        // Animations
        this.createAnimations(playerKey);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();

        // Colliders
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.movingPlatforms);

        // Enemies
        this.enemies = this.physics.add.group();

        const enemyPositions = [
            {x:400,y:200,dir:1},
            {x:900,y:200,dir:-1},
            {x:1500,y:200,dir:1},
            {x:2100,y:200,dir:-1},
            {x:2600,y:200,dir:1}
        ];

        enemyPositions.forEach(e=>{
            const enemy = this.enemies.create(e.x,e.y,'enemy');
            enemy.setCollideWorldBounds(true);
            enemy.body.setSize(28,40).setOffset(10,8);
            enemy.direction = e.dir;
            enemy.speed = 60;
            enemy.alive = true;
        });

        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.enemies, this.movingPlatforms);

        this.physics.add.collider(this.player, this.enemies, this.handlePlayerEnemy, null, this);

        // Big hearts (25)
        this.bigHearts = this.physics.add.group({ allowGravity:false, immovable:true });

        for(let i=0;i<25;i++){
            const x = Phaser.Math.Between(200,2800);
            const y = Phaser.Math.Between(150,450);
            this.bigHearts.create(x,y,'heart_big');
        }

        this.physics.add.overlap(this.player, this.bigHearts, this.collectBigHeart, null, this);

        // Small hearts (from enemies)
        this.smallHearts = this.physics.add.group({ allowGravity:true });

        this.physics.add.overlap(this.player, this.smallHearts, this.collectSmallHeart, null, this);

        // UI
        this.hp = 5;
        this.collectedHearts = 0;

        this.hpText = this.add.text(20,20,'HP: 5',{ fontFamily:'Arial', fontSize:'20px', fill:'#fff' }).setScrollFactor(0);
        this.heartText = this.add.text(20,50,'Hearts: 0/25',{ fontFamily:'Arial', fontSize:'20px', fill:'#fff' }).setScrollFactor(0);

        // Sounds
        this.jumpSound = this.sound.add('jump');
        this.stepSound = this.sound.add('step',{ loop:true, volume:0.4 });
        this.heartSound = this.sound.add('heart_pick');
        this.hitSound = this.sound.add('hit');
        this.enemyDieSound = this.sound.add('enemy_die');
    }

    createAnimations(playerKey){
        // Player
        this.anims.create({
            key: 'player_idle',
            frames: this.anims.generateFrameNumbers(playerKey,{ start:0, end:3 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'player_run',
            frames: this.anims.generateFrameNumbers(playerKey,{ start:4, end:9 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'player_jump',
            frames: [{ key: playerKey, frame:10 }],
            frameRate: 1
        });

        // Enemy
        this.anims.create({
            key: 'enemy_walk',
            frames: this.anims.generateFrameNumbers('enemy',{ start:0, end:5 }),
            frameRate: 8,
            repeat: -1
        });
    }

    handlePlayerEnemy(player, enemy){
        if(!enemy.alive) return;

        // Player above enemy
        if(player.body.velocity.y > 0 && player.y < enemy.y){
            enemy.alive = false;
            enemy.disableBody(true,true);
            this.enemyDieSound.play();

            // Bounce player
            player.setVelocityY(-300);

            // Drop small heart
            const heart = this.smallHearts.create(enemy.x, enemy.y-20, 'heart_small');
            heart.setBounce(0.4);
        } else {
            // Player hit
            this.hp--;
            this.hitSound.play();
            this.hpText.setText('HP: ' + this.hp);

            player.setTint(0xff0000);
            this.time.delayedCall(200,()=>player.clearTint());

            player.setVelocityY(-200);

            if(this.hp <= 0){
                this.scene.start('EndScene',{ win:false, player:selectedPlayer });
            }
        }
    }

    collectBigHeart(player, heart){
        heart.destroy();
        this.collectedHearts++;
        this.heartSound.play();
        this.heartText.setText('Hearts: ' + this.collectedHearts + '/25');

        if(this.collectedHearts >= 25){
            this.scene.start('EndScene',{ win:true, player:selectedPlayer });
        }
    }

    collectSmallHeart(player, heart){
        heart.destroy();
        this.hp = Math.min(5, this.hp + 1);
        this.hpText.setText('HP: ' + this.hp);
        this.heartSound.play();
    }

    update(time, delta){
        // Background parallax
        this.bg_far.tilePositionX = this.cameras.main.scrollX * 0.1;
        this.bg_mid.tilePositionX = this.cameras.main.scrollX * 0.3;
        this.bg_near.tilePositionX = this.cameras.main.scrollX * 0.6;

        // Player movement
        const onGround = this.player.body.blocked.down;

        if(this.cursors.left.isDown){
            this.player.setVelocityX(-160);
            this.player.setFlipX(true);
            if(onGround){
                this.player.anims.play('player_run', true);
                if(!this.stepSound.isPlaying) this.stepSound.play();
            }
        }
        else if(this.cursors.right.isDown){
            this.player.setVelocityX(160);
            this.player.setFlipX(false);
            if(onGround){
                this.player.anims.play('player_run', true);
                if(!this.stepSound.isPlaying) this.stepSound.play();
            }
        }
        else {
            this.player.setVelocityX(0);
            this.stepSound.stop();
            if(onGround){
                this.player.anims.play('player_idle', true);
            }
        }

        if(this.cursors.up.isDown && onGround){
            this.player.setVelocityY(-380);
            this.jumpSound.play();
        }

        if(!onGround){
            this.player.anims.play('player_jump', true);
        }

        // Moving platforms logic
        this.movingPlatforms.children.iterate(plat=>{
            plat.y += plat.speed * delta / 1000;
            if(plat.y > plat.startY + plat.range || plat.y < plat.startY - plat.range){
                plat.speed *= -1;
            }
            plat.body.updateFromGameObject();
        });

        // Enemy patrol logic
        this.enemies.children.iterate(enemy=>{
            if(!enemy.alive) return;

            enemy.setVelocityX(enemy.speed * enemy.direction);
            enemy.anims.play('enemy_walk', true);
            enemy.setFlipX(enemy.direction < 0);

            // Turn at world edges
            if(enemy.body.blocked.left || enemy.body.blocked.right){
                enemy.direction *= -1;
            }

            // Turn at platform edges
            const aheadX = enemy.x + enemy.direction * 20;
            const aheadY = enemy.y + 40;
            const tileBelow = this.platforms.getChildren().some(p=>{
                return Phaser.Geom.Intersects.RectangleToRectangle(
                    p.getBounds(),
                    new Phaser.Geom.Rectangle(aheadX, aheadY, 2, 2)
                );
            });

            if(!tileBelow){
                enemy.direction *= -1;
            }
        });
    }
}

/* =========================================================
   WIN / LOSE SCENES
========================================================= */
class EndScene extends Phaser.Scene {
    constructor(key,text){ super(key); this.label=text; }
    preload(){
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');

        this.load.audio('menu_hover','assets/sounds/hover.mp3');
        this.load.audio('menu_click','assets/sounds/collect.mp3');
    }
    create(data){
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
                    this.scene.start('GameScene',{player:data.player});
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
