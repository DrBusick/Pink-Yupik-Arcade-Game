const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const LEVEL_LENGTH = GAME_WIDTH * 7;

let selectedPlayer = 'player1';

/* ---------- MENU ---------- */
class MenuScene extends Phaser.Scene {
  constructor(){ super('Menu'); }

  preload(){
    this.load.image('bg_far','assets/backgrounds/bg_far.png');
    this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
    this.load.image('bg_near','assets/backgrounds/bg_near.png');
  }

  create(){
    this.createParallax();

    const title = this.add.text(640,180,'Pink Yupik Arcade',{
      fontFamily:'UnifrakturCook',
      fontSize:'64px',
      color:'#d0f0ff'
    }).setOrigin(0.5).setInteractive();

    title.on('pointerover',()=>title.setTint(0xffaaaa));
    title.on('pointerout',()=>title.clearTint());

    const start = this.add.text(640,340,'Start',{
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

/* ---------- CHARACTER ---------- */
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
      color:'#d0f0ff'
    }).setOrigin(0.5);

    const y=480;
    this.add.image(400,y,'platform').setScale(2);
    this.add.image(880,y,'platform').setScale(2);

    const p1=this.add.sprite(400,y-90,'p1',0).setScale(2).setInteractive();
    const p2=this.add.sprite(880,y-90,'p2',0).setScale(2).setInteractive();

    p1.on('pointerdown',()=>{selectedPlayer='player1';this.scene.start('Game');});
    p2.on('pointerdown',()=>{selectedPlayer='player2';this.scene.start('Game');});
  }

  createParallax(){
    this.add.tileSprite(640,360,1280,720,'bg_far');
    this.add.tileSprite(640,360,1280,720,'bg_mid');
    this.add.tileSprite(640,360,1280,720,'bg_near');
  }
}

/* ---------- GAME ---------- */
class GameScene extends Phaser.Scene {
  constructor(){ super('Game'); }

  preload(){
    ['bg_far','bg_mid','bg_near'].forEach(k=>this.load.image(k,`assets/backgrounds/${k}.png`));
    this.load.image('ground','assets/platforms/ground.png');
    this.load.image('platform','assets/platforms/platform_1.png');
    this.load.image('heart','assets/items/heart_v4.png');
    this.load.spritesheet('idle',`assets/${selectedPlayer}/idle.png`,{frameWidth:64,frameHeight:64});
    this.load.spritesheet('walk',`assets/${selectedPlayer}/walk.png`,{frameWidth:64,frameHeight:64});
    ['collect','jump','walk'].forEach(s=>this.load.audio(s,`assets/sounds/${s}.mp3`));
  }

  create(){
    this.createParallax();

    this.platforms=this.physics.add.staticGroup();
    for(let i=0;i<25;i++){
      this.platforms.create(200+i*250,Phaser.Math.Between(300,600),'platform');
    }

    this.player=this.physics.add.sprite(100,500,'idle').setScale(1.5);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player,this.platforms);

    this.anims.create({key:'walk',frames:this.anims.generateFrameNumbers('walk'),frameRate:10,repeat:-1});

    this.hearts=this.physics.add.group();
    for(let i=0;i<20;i++) this.hearts.create(400+i*250,200,'heart').setScale(0.7);

    this.collected=0;
    this.counter=this.add.text(20,20,'0/20',{fontFamily:'UnifrakturCook',fontSize:'32px'}).setScrollFactor(0);

    this.physics.add.overlap(this.player,this.hearts,(p,h)=>{
      h.destroy();
      this.sound.play('collect');
      this.collected++;
      this.counter.setText(`${this.collected}/20`);
      if(this.collected===20){
        this.add.text(this.cameras.main.scrollX+640,200,'All 20 hearts collected!',{
          fontFamily:'UnifrakturCook',
          fontSize:'48px',
          color:'#ffffff'
        }).setOrigin(0.5);
      }
    });

    this.menuBtn=this.add.text(20,60,'Menu',{fontFamily:'UnifrakturCook',fontSize:'28px'}).setInteractive().setScrollFactor(0);
    this.menuBtn.on('pointerdown',()=>this.scene.start('Menu'));

    this.cursors=this.input.keyboard.createCursorKeys();
  }

  createParallax(){
    this.bgFar=this.add.tileSprite(0,360,LEVEL_LENGTH,720,'bg_far').setOrigin(0);
    this.bgMid=this.add.tileSprite(0,360,LEVEL_LENGTH,720,'bg_mid').setOrigin(0);
    this.bgNear=this.add.tileSprite(0,360,LEVEL_LENGTH,720,'bg_near').setOrigin(0);
  }

  update(){
    const speed=200;
    if(this.cursors.left.isDown){this.player.setVelocityX(-speed);this.player.play('walk',true);}
    else if(this.cursors.right.isDown){this.player.setVelocityX(speed);this.player.play('walk',true);}
    else{this.player.setVelocityX(0);this.player.stop();}

    if(this.cursors.up.isDown && this.player.body.blocked.down){
      this.player.setVelocityY(-500);
      this.sound.play('jump');
    }

    this.cameras.main.scrollX=Phaser.Math.Clamp(this.player.x-640,0,LEVEL_LENGTH-1280);
  }
}

/* ---------- BOOT ---------- */
const config={
  type:Phaser.AUTO,
  width:GAME_WIDTH,
  height:GAME_HEIGHT,
  physics:{default:'arcade',arcade:{gravity:{y:1200}}},
  scene:[MenuScene,CharacterScene,GameScene],
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH}
};

window.onload=()=>{new Phaser.Game(config);};
