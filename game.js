const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const LEVEL_LENGTH = GAME_WIDTH * 7;

let selectedPlayer = 'player1';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 1200 }, debug: false }
  },
  scene: [MenuScene, CharacterScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);

class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  preload() {
    this.load.image('bg_far', 'assets/backgrounds/bg_far.png');
    this.load.image('bg_mid', 'assets/backgrounds/bg_mid.png');
    this.load.image('bg_near', 'assets/backgrounds/bg_near.png');
  }

  create() {
    this.createParallax();

    const title = this.add.text(640, 200, 'Pink Yupik Arcade', {
      fontFamily: 'UnifrakturCook',
      fontSize: '64px',
      color: '#d0f0ff'
    }).setOrigin(0.5);

    title.setInteractive().on('pointerover', () => title.setTint(0xffcccc)).on('pointerout', () => title.clearTint());

    const start = this.add.text(640, 350, 'Start', {
      fontFamily: 'UnifrakturCook',
      fontSize: '48px',
      color: '#ffffff'
    }).setOrigin(0.5).setInteractive();

    start.on('pointerdown', () => this.scene.start('Character'));
  }

  createParallax() {
    this.bgFar = this.add.tileSprite(640, 360, 1280, 720, 'bg_far');
    this.bgMid = this.add.tileSprite(640, 360, 1280, 720, 'bg_mid');
    this.bgNear = this.add.tileSprite(640, 360, 1280, 720, 'bg_near');
  }
}

class CharacterScene extends Phaser.Scene {
  constructor() { super('Character'); }

  preload() {
    this.load.image('bg_far', 'assets/backgrounds/bg_far.png');
    this.load.image('bg_mid', 'assets/backgrounds/bg_mid.png');
    this.load.image('bg_near', 'assets/backgrounds/bg_near.png');

    this.load.spritesheet('p1_idle', 'assets/player1/idle.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('p2_idle', 'assets/player2/idle.png', { frameWidth: 64, frameHeight: 64 });
  }

  create() {
    this.createParallax();

    this.add.text(640, 100, 'Select Character', {
      fontFamily: 'UnifrakturCook',
      fontSize: '48px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const p1 = this.add.sprite(400, 360, 'p1_idle', 0).setScale(2).setInteractive();
    const p2 = this.add.sprite(880, 360, 'p2_idle', 0).setScale(2).setInteractive();

    p1.on('pointerdown', () => { selectedPlayer = 'player1'; this.scene.start('Game'); });
    p2.on('pointerdown', () => { selectedPlayer = 'player2'; this.scene.start('Game'); });
  }

  createParallax() {
    this.add.tileSprite(640, 360, 1280, 720, 'bg_far');
    this.add.tileSprite(640, 360, 1280, 720, 'bg_mid');
    this.add.tileSprite(640, 360, 1280, 720, 'bg_near');
  }
}

class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  preload() {
    ['bg_far','bg_mid','bg_near'].forEach(k => this.load.image(k, `assets/backgrounds/${k}.png`));
    this.load.image('ground', 'assets/platforms/ground.png');
    this.load.image('platform', 'assets/platforms/platform_1.png');
    this.load.image('heart', 'assets/items/heart_v4.png');

    this.load.spritesheet('player_idle', `assets/${selectedPlayer}/idle.png`, { frameWidth:64, frameHeight:64 });
    this.load.spritesheet('player_walk', `assets/${selectedPlayer}/walk.png`, { frameWidth:64, frameHeight:64 });

    this.load.audio('collect', 'assets/sounds/collect.mp3');
    this.load.audio('jump', 'assets/sounds/jump.mp3');
    this.load.audio('walk', 'assets/sounds/walk.mp3');
  }

  create() {
    this.createParallax();

    this.platforms = this.physics.add.staticGroup();
    for (let i=0;i<25;i++) {
      const x = Phaser.Math.Between(200, LEVEL_LENGTH-200);
      const y = Phaser.Math.Between(250, 600);
      this.platforms.create(x,y,'platform');
    }

    this.player = this.physics.add.sprite(100,500,'player_idle').setScale(1.5);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player,this.platforms);

    this.anims.create({
      key:'walk',
      frames:this.anims.generateFrameNumbers('player_walk'),
      frameRate:10,
      repeat:-1
    });

    this.hearts = this.physics.add.group();
    for(let i=0;i<20;i++){
      const x = 300 + i*300;
      const y = Phaser.Math.Between(150,400);
      this.hearts.create(x,y,'heart').setScale(0.7);
    }

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

    this.collected = 0;
    this.counter = this.add.text(20,20,'0/20',{fontFamily:'UnifrakturCook',fontSize:'32px'}).setScrollFactor(0);

    this.menuBtn = this.add.text(20,60,'Menu',{fontFamily:'UnifrakturCook',fontSize:'28px'}).setInteractive().setScrollFactor(0);
    this.menuBtn.on('pointerdown',()=>this.scene.start('Menu'));

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  createParallax(){
    this.bgFar=this.add.tileSprite(0,360,LEVEL_LENGTH,720,'bg_far').setOrigin(0);
    this.bgMid=this.add.tileSprite(0,360,LEVEL_LENGTH,720,'bg_mid').setOrigin(0);
    this.bgNear=this.add.tileSprite(0,360,LEVEL_LENGTH,720,'bg_near').setOrigin(0);
  }

  update(){
    const speed=200;
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

    if(this.cursors.up.isDown && this.player.body.touching.down){
      this.player.setVelocityY(-500);
      this.sound.play('jump');
    }

    this.cameras.main.scrollX = Phaser.Math.Clamp(this.player.x-640,0,LEVEL_LENGTH-1280);
  }
}
