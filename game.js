const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const LEVEL_LENGTH = GAME_WIDTH * 7;

let selectedPlayer = 'player1';

/* ================= MENU ================= */

class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  preload() {
    ['bg_far','bg_mid','bg_near'].forEach(k => this.load.image(k, `assets/backgrounds/${k}.png`));
  }

  create() {
    this.createParallax();

    const title = this.add.text(640, 200, 'Pink Yupik Arcade', {
      fontFamily: 'UnifrakturCook',
      fontSize: '64px',
      color: '#cfe9ff'
    }).setOrigin(0.5);

    const start = this.add.text(640, 350, 'Start', {
      fontFamily: 'UnifrakturCook',
      fontSize: '48px',
      color: '#cfe9ff'
    }).setOrigin(0.5).setInteractive();

    start.on('pointerdown', () => this.scene.start('Character'));
  }

  createParallax() {
    this.add.tileSprite(640, 360, 1280, 720, 'bg_far');
    this.add.tileSprite(640, 360, 1280, 720, 'bg_mid');
    this.add.tileSprite(640, 360, 1280, 720, 'bg_near');
  }
}

/* ================= CHARACTER ================= */

class CharacterScene extends Phaser.Scene {
  constructor() { super('Character'); }

  preload() {
    ['bg_far','bg_mid','bg_near'].forEach(k => this.load.image(k, `assets/backgrounds/${k}.png`));
    this.load.image('platform', 'assets/platforms/platform_1.png');
    this.load.spritesheet('p1_idle', 'assets/player1/idle.png', { frameWidth:64, frameHeight:64 });
    this.load.spritesheet('p2_idle', 'assets/player2/idle.png', { frameWidth:64, frameHeight:64 });
  }

  create() {
    this.createParallax();

    this.add.text(640, 80, 'Select Character', {
      fontFamily: 'UnifrakturCook',
      fontSize: '48px',
      color: '#cfe9ff'
    }).setOrigin(0.5);

    const y = 520;
    this.add.image(400, y, 'platform').setScale(2);
    this.add.image(880, y, 'platform').setScale(2);

    const p1 = this.add.sprite(400, y - 90, 'p1_idle').setScale(2).setInteractive();
    const p2 = this.add.sprite(880, y - 90, 'p2_idle').setScale(2).setInteractive();

    p1.on('pointerdown', () => { selectedPlayer='player1'; this.scene.start('Game'); });
    p2.on('pointerdown', () => { selectedPlayer='player2'; this.scene.start('Game'); });
  }

  createParallax() {
    this.add.tileSprite(640, 360, 1280, 720, 'bg_far');
    this.add.tileSprite(640, 360, 1280, 720, 'bg_mid');
    this.add.tileSprite(640, 360, 1280, 720, 'bg_near');
  }
}

/* ================= GAME ================= */

class GameScene extends Phaser.Scene {
  constructor(){ super('Game'); }

  preload(){
    ['bg_far','bg_mid','bg_near'].forEach(k => this.load.image(k, `assets/backgrounds/${k}.png`));
    this.load.image('platform','assets/platforms/platform_1.png');
    this.load.image('heart','assets/items/heart_v4.png');

    this.load.spritesheet('player_idle', `assets/${selectedPlayer}/idle.png`, { frameWidth:64, frameHeight:64 });
    this.load.spritesheet('player_walk', `assets/${selectedPlayer}/walk.png`, { frameWidth:64, frameHeight:64 });

    ['collect','jump'].forEach(s => this.load.audio(s, `assets/sounds/${s}.mp3`));
  }

  create(){
    this.createParallax();

    this.platforms = this.physics.add.staticGroup();
    for(let i=0;i<25;i++){
      this.platforms.create(200+i*250, Phaser.Math.Between(350,600),'platform');
    }

    this.player = this.physics.add.sprite(100,500,'player_idle').setScale(1.5);
    this.physics.add.collider(this.player,this.platforms);

    this.anims.create({ key:'walk', frames:this.anims.generateFrameNumbers('player_walk'), frameRate:10, repeat:-1 });

    this.hearts = this.physics.add.group();
    for(let i=0;i<20;i++){
      this.hearts.create(300+i*300, Phaser.Math.Between(150,300),'heart').setScale(0.7);
    }

    this.collected = 0;
    this.counter = this.add.text(20,20,'0/20',{fontFamily:'UnifrakturCook',fontSize:'32px',color:'#cfe9ff'}).setScrollFactor(0);

    this.physics.add.overlap(this.player,this.hearts,(p,h)=>{
      h.destroy();
      this.sound.play('collect');
      this.collected++;
      this.counter.setText(`${this.collected}/20`);
      if(this.collected===20){
        this.add.text(this.cameras.main.scrollX+640,200,'All 20 hearts collected!',{
          fontFamily:'UnifrakturCook',fontSize:'48px',color:'#cfe9ff'
        }).setOrigin(0.5);
      }
    });

    this.menuBtn = this.add.text(20,60,'Menu',{fontFamily:'UnifrakturCook',fontSize:'28px',color:'#cfe9ff'}).setInteractive().setScrollFactor(0);
    this.menuBtn.on('pointerdown',()=>this.scene.start('Menu'));

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  createParallax(){
    this.add.tileSprite(0,360,LEVEL_LENGTH,720,'bg_far').setOrigin(0);
    this.add.tileSprite(0,360,LEVEL_LENGTH,720,'bg_mid').setOrigin(0);
    this.add.tileSprite(0,360,LEVEL_LENGTH,720,'bg_near').setOrigin(0);
  }

  update(){
    const speed = 220;

    if(this.cursors.left.isDown){
      this.player.setVelocityX(-speed); this.player.anims.play('walk',true);
    } else if(this.cursors.right.isDown){
      this.player.setVelocityX(speed); this.player.anims.play('walk',true);
    } else {
      this.player.setVelocityX(0); this.player.anims.stop();
    }

    if(this.cursors.up.isDown && this.player.body.blocked.down){
      this.player.setVelocityY(-520); this.sound.play('jump');
    }

    this.cameras.main.scrollX = Phaser.Math.Clamp(this.player.x-640,0,LEVEL_LENGTH-1280);
  }
}

/* ================= INIT ================= */

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 1200 }, debug: false }
  },
  scene: [MenuScene, CharacterScene, GameScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
};

new Phaser.Game(config);
