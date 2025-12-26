const WIDTH = 1280;
const HEIGHT = 720;

const TEXT_STYLE = {
  fontFamily: 'UnifrakturCook',
  fontSize: '34px',
  color: '#d8e6e3',
  stroke: '#4ad1c8',
  strokeThickness: 2
};

let selectedPlayer = "player1";

// MENU
class Menu extends Phaser.Scene {
  constructor(){ super("Menu"); }
  preload(){
    this.load.image("bg_far","assets/backgrounds/bg_far.png");
    this.load.image("bg_mid","assets/backgrounds/bg_mid.png");
    this.load.image("bg_near","assets/backgrounds/bg_near.png");
  }
  create(){
    this.bgFar  = this.add.tileSprite(0,0,WIDTH,HEIGHT,"bg_far").setOrigin(0);
    this.bgMid  = this.add.tileSprite(0,0,WIDTH,HEIGHT,"bg_mid").setOrigin(0);
    this.bgNear = this.add.tileSprite(0,0,WIDTH,HEIGHT,"bg_near").setOrigin(0);

    this.add.text(WIDTH/2,120,"PINK YUPIK ARCADE",{...TEXT_STYLE,fontSize:"60px"}).setOrigin(0.5);

    const play = this.add.text(WIDTH/2,HEIGHT/2,"PLAY",TEXT_STYLE).setOrigin(0.5).setInteractive();
    play.on("pointerover",()=>play.setTint(0x88ffff));
    play.on("pointerout",()=>play.clearTint());
    play.on("pointerdown",()=>this.scene.start("Select"));
  }
}

// SELECT
class Select extends Phaser.Scene {
  constructor(){ super("Select"); }
  preload(){
    this.load.image("bg_far","assets/backgrounds/bg_far.png");
    this.load.image("bg_mid","assets/backgrounds/bg_mid.png");
    this.load.image("bg_near","assets/backgrounds/bg_near.png");

    this.load.spritesheet("player1","assets/player1/walk.png",{frameWidth:128,frameHeight:128});
    this.load.spritesheet("player2","assets/player2/walk.png",{frameWidth:128,frameHeight:128});
  }
  create(){
    this.bgFar  = this.add.tileSprite(0,0,WIDTH,HEIGHT,"bg_far").setOrigin(0);
    this.bgMid  = this.add.tileSprite(0,0,WIDTH,HEIGHT,"bg_mid").setOrigin(0);
    this.bgNear = this.add.tileSprite(0,0,WIDTH,HEIGHT,"bg_near").setOrigin(0);

    this.add.text(WIDTH/2,80,"Select Character",TEXT_STYLE).setOrigin(0.5);

    const p1=this.add.sprite(WIDTH/2-200,HEIGHT/2,"player1",0).setScale(1.2).setInteractive();
    const p2=this.add.sprite(WIDTH/2+200,HEIGHT/2,"player2",0).setScale(1.2).setInteractive();

    p1.on("pointerdown",()=>{selectedPlayer="player1";this.scene.start("Game");});
    p2.on("pointerdown",()=>{selectedPlayer="player2";this.scene.start("Game");});
  }
}

// GAME
class Game extends Phaser.Scene {
  constructor(){ super("Game"); }
  preload(){
    this.load.image("bg","assets/backgrounds/bg_mid.png");
    this.load.image("ground","assets/platforms/ground.png");
    this.load.image("platform","assets/platforms/platform_1.png");
    this.load.image("heart","assets/items/heart_v4.png");

    this.load.spritesheet("player1","assets/player1/walk.png",{frameWidth:128,frameHeight:128});
    this.load.spritesheet("player2","assets/player2/walk.png",{frameWidth:128,frameHeight:128});
  }

  create(){
    this.levelWidth = WIDTH * 7;

    this.bg = this.add.tileSprite(0,0,this.levelWidth,HEIGHT,"bg").setOrigin(0).setScrollFactor(0);

    this.physics.world.setBounds(0,0,this.levelWidth,HEIGHT);
    this.cameras.main.setBounds(0,0,this.levelWidth,HEIGHT);

    this.platforms=this.physics.add.staticGroup();
    this.movingPlatforms=this.physics.add.group({allowGravity:false, immovable:true});

    for(let i=0;i<25;i++){
      let x=300+i*250;
      let y=500-(i%5)*80;
      if(i<8){
        let p=this.movingPlatforms.create(x,y,"platform");
        p.baseX=x; p.speed=0.002+i*0.001;
      } else {
        this.platforms.create(x,y,"platform");
      }
    }

    this.player=this.physics.add.sprite(100,500,selectedPlayer,0);
    this.player.setCollideWorldBounds(true);

    this.anims.create({
      key:"walk",
      frames:this.anims.generateFrameNumbers(selectedPlayer,{start:0,end:5}),
      frameRate:8, repeat:-1
    });
    this.player.play("walk");

    this.physics.add.collider(this.player,this.platforms);
    this.physics.add.collider(this.player,this.movingPlatforms);

    this.cameras.main.startFollow(this.player,true,0.1,0.1);

    this.hearts=this.physics.add.group();
    for(let i=0;i<20;i++){
      let x=350+i*300;
      let y=300-(i%3)*120;
      let h=this.hearts.create(x,y,"heart");
      h.body.allowGravity=false;
    }

    this.collected=0;
    this.counter=this.add.text(20,20,"0/20",TEXT_STYLE).setScrollFactor(0);

    this.physics.add.overlap(this.player,this.hearts,(p,h)=>{
      h.destroy();
      this.collected++;
      this.counter.setText(this.collected+"/20");
      if(this.collected===20){
        this.add.text(WIDTH/2,HEIGHT/2,"All 20 hearts collected!",TEXT_STYLE).setScrollFactor(0).setOrigin(0.5);
      }
    });

    const menuBtn=this.add.text(20,60,"MENU",{...TEXT_STYLE,fontSize:"26px"}).setScrollFactor(0).setInteractive();
    menuBtn.on("pointerdown",()=>this.scene.start("Menu"));
  }

  update(){
    this.movingPlatforms.children.iterate(p=>{
      p.x = p.baseX + Math.sin(this.time.now * p.speed) * 60;
    });
  }
}

new Phaser.Game({
  type:Phaser.AUTO,
  width:WIDTH,
  height:HEIGHT,
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
  physics:{default:"arcade",arcade:{gravity:{y:800}}},
  scene:[Menu,Select,Game]
});
