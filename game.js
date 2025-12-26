const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const LEVEL_LENGTH = GAME_WIDTH * 7;
let selectedPlayer = 'player1';

/* ===== СЦЕНИ ===== */

class MenuScene extends Phaser.Scene {
  constructor(){ super('Menu'); }

  preload(){
    this.load.image('bg_far','assets/backgrounds/bg_far.png');
    this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
    this.load.image('bg_near','assets/backgrounds/bg_near.png');
  }

  create(){
    this.createParallax();

    this.add.text(640,200,'Pink Yupik Arcade',{
      fontFamily:'UnifrakturCook',
      fontSize:'64px',
      color:'#e0f0ff'
    }).setOrigin(0.5);

    const start = this.add.text(640,350,'Start',{
      fontFamily:'UnifrakturCook',
      fontSize:'48px',
      color:'#ffffff'
    }).setOrigin(0.5).setInteractive();

    start.on('pointerdown',()=>this.scene.start('Character'));
  }

  createParallax(){
    this.add.tileSprite(640,360,1280,720,'bg_far');
    this.add.tileSprite(640,360,1280,720,'bg_mid');
    this.add.tileSprite(640,360,1280,720,'bg_near');
  }
}

class CharacterScene extends Phaser.Scene {
  constructor(){ super('Character'); }

  preload(){
    ['bg_far','bg_mid','bg_near'].forEach(k=>this.load.image(k,`assets/backgrounds/${k}.png`));
    this.load.image('platform','assets/platforms/platform_1.png');
    this.load.spritesheet('p1','assets/player1/idle.png',{frameWidth:64,frameHeight:64});
    this.load.spritesheet('p2','assets/player2/idle.png',{frameWidth:64,frameHeight:64});
  }

  create(){
    this.createParallax();

    this.add.text(640,80,'Select Character',{
      fontFamily:'UnifrakturCook',
      fontSize:'48px',
      color:'#e0f0ff'
    }).setOrigin(0.5);

    const y=480;
    this.add.image(400,y,'platform').setScale(2);
    this.add.image(880,y,'platform').setScale(2);

    const p1=this.add.sprite(400,y-90,'p1').setScale(2).setInteractive();
    const p2=this.add.sprite(880,y-90,'p2').setScale(2).setInteractive();

    p1.on('pointerdown',()=>{selectedPlayer='player1';this.scene.start('Game');});
    p2.on('pointerdown',()=>{selectedPlayer='player2';this.scene.start('Game');});
  }

  createParallax(){
    this.add.tileSprite(640,360,1280,720,'bg_far');
    this.add.tileSprite(640,360,1280,720,'bg_mid');
    this.add.tileSprite(640,360,1280,720,'bg_near');
  }
}

class GameScene extends Phaser.Scene {
  constructor(){ super('Game'); }

  preload(){
    ['bg_far','bg_mid','bg_near'].forEach(k=>this.load.image(k,`assets/backgrounds/${k}.png`));
    this.load.image('platform','assets/platforms/platform_1.png');
    this.load.image('heart','assets/items/heart_v4.png');

    this.load.spritesheet('idle',`assets/${selectedPlayer}/idle.png`,{frameWidth:64,frameHeight:64});
    this.load.spritesheet('walk',`assets/${selectedPlayer}/walk.png`,{frameWidth:64,frameHeight:64});
  }

  create(){
    this.createParallax();

    this.platforms=this.physics.add.group({allowGravity:false,immovable:true});

    for(let i=0;i<25;i++){
      let p=this.platforms.create(
        Phaser.Math.Between(200,LEVEL_LENGTH-200),
        Phaser.Math.Between(250,600),
        'platform'
      );
      if(i<8){
        this.tweens.add({targets:p,x:p.x+Phaser.Math.Between(-200,200),yoyo:true,repeat:-1,duration:3000});
      }
    }

    this.player=this.physics.add.sprite(100,500,'idle').setScale(1.5).setCollideWorldBounds(true);
    this.physics.add.collider(this.player,this.platforms);

    this.anims.create({
      key:'walk',
      frames:this.anims.generateFrameNumbers('walk'),
      frameRate:10,
      repeat:-1
    });

    this.cameras.main.setBounds(0,0,LEVEL_LENGTH,720);

    this.cursors=this.input.keyboard.createCursorKeys();
  }

  createParallax(){
    this.bgFar=this.add.tileSprite(0,360,LEVEL_LENGTH,720,'bg_far').setOrigin(0);
    this.bgMid=this.add.tileSprite(0,360,LEVEL_LENGTH,720,'bg_mid').setOrigin(0);
    this.bgNear=this.add.tileSprite(0,360,LEVEL_LENGTH,720,'bg_near').setOrigin(0);
  }

  update(){
    const speed=220;
    if(this.cursors.left.isDown){
      this.player.setVelocityX(-speed);
      this.player.anims.play('walk',true);
    }else if(this.cursors.right.isDown){
      this.player.setVelocityX(speed);
      this.player.anims.play('walk',true);
    }else{
      this.player.setVelocityX(0);
      this.player.anims.stop();
    }

    if(this.cursors.up.isDown && this.player.body.blocked.down){
      this.player.setVelocityY(-500);
    }

    this.cameras.main.scrollX=this.player.x-640;
    this.bgFar.tilePositionX=this.cameras.main.scrollX*0.2;
    this.bgMid.tilePositionX=this.cameras.main.scrollX*0.4;
    this.bgNear.tilePositionX=this.cameras.main.scrollX*0.7;
  }
}

/* ===== КОНФІГ ===== */

const config={
  type:Phaser.AUTO,
  width:GAME_WIDTH,
  height:GAME_HEIGHT,
  physics:{default:'arcade',arcade:{gravity:{y:1200},debug:false}},
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
  scene:[MenuScene,CharacterScene,GameScene]
};

new Phaser.Game(config);
