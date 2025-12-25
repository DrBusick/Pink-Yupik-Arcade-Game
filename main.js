const WIDTH = 1280;
const HEIGHT = 720;

const TEXT_STYLE = {
  fontFamily: 'UnifrakturCook',
  fontSize: '36px',
  color: '#ffffff',
  stroke: '#00ffcc',
  strokeThickness: 3
};

class Menu extends Phaser.Scene {
  constructor(){ super("Menu"); }
  preload(){
    this.load.image("menuBg","assets/backgrounds/bg_far.png");
    this.load.audio("hover","assets/sounds/hover.mp3");
  }
  create(){
    this.add.image(0,0,"menuBg").setOrigin(0).setDisplaySize(WIDTH,HEIGHT);
    this.add.text(WIDTH/2,100,"PINK YUPIK ARCADE",{...TEXT_STYLE,fontSize:"64px"}).setOrigin(0.5);

    const play = this.add.text(WIDTH/2,HEIGHT/2,"PLAY",TEXT_STYLE).setOrigin(0.5).setInteractive();
    play.on("pointerdown",()=>this.scene.start("Select"));
    play.on("pointerover",()=>play.setTint(0x00ffcc));
    play.on("pointerout",()=>play.clearTint());
  }
}

class Select extends Phaser.Scene {
  constructor(){ super("Select"); }
  preload(){
    this.load.image("p1","assets/player/player1/walk.png");
    this.load.image("p2","assets/player/player2/walk.png");
  }
  create(){
    this.add.text(WIDTH/2,80,"Select Character",TEXT_STYLE).setOrigin(0.5);
    const p1=this.add.image(WIDTH/2-200,HEIGHT/2,"p1").setInteractive();
    const p2=this.add.image(WIDTH/2+200,HEIGHT/2,"p2").setInteractive();

    [p1,p2].forEach(p=>{
      p.on("pointerover",()=>p.setTint(0x00ffcc));
      p.on("pointerout",()=>p.clearTint());
    });

    p1.on("pointerdown",()=>this.scene.start("Game",{player:"p1"}));
    p2.on("pointerdown",()=>this.scene.start("Game",{player:"p2"}));
  }
}

class Game extends Phaser.Scene {
  constructor(){ super("Game"); }
  preload(){
    this.load.image("bg","assets/backgrounds/bg_mid.png");
    this.load.image("ground","assets/platforms/ground.png");
    this.load.image("platform","assets/platforms/platform_1.png");
    this.load.image("heart","assets/items/heart_v4.png");
    this.load.audio("collect","assets/sounds/collect.mp3");
    this.load.audio("jump","assets/sounds/jump.mp3");
  }

  create(data){
    this.bg=this.add.tileSprite(0,0,4000,HEIGHT,"bg").setOrigin(0).setScrollFactor(0.2);

    this.platforms=this.physics.add.staticGroup();
    this.platforms.create(640,700,"ground").setScale(2).refreshBody();
    for(let i=1;i<=6;i++){
      this.platforms.create(300+i*400,500-(i%2)*100,"platform");
    }

    this.player=this.physics.add.sprite(100,500,data.player);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player,this.platforms);

    this.cursors=this.input.keyboard.createCursorKeys();

    this.hearts=this.physics.add.group();
    for(let i=0;i<20;i++){
      let x=300+i*180;
      let y=300-(i%2)*120;
      let h=this.hearts.create(x,y,"heart");
      h.body.allowGravity=false;
    }

    this.physics.add.overlap(this.player,this.hearts,(p,h)=>{
      h.destroy();
      this.sound.play("collect");
      this.collected++;
      this.counter.setText(this.collected+"/20");
      if(this.collected===20){
        this.add.text(WIDTH/2,HEIGHT/2,"All 20 hearts collected!",TEXT_STYLE).setOrigin(0.5);
      }
    });

    this.collected=0;
    this.counter=this.add.text(20,20,"0/20",TEXT_STYLE).setScrollFactor(0);

    const menuBtn=this.add.text(20,60,"MENU",{...TEXT_STYLE,fontSize:"28px"}).setScrollFactor(0).setInteractive();
    menuBtn.on("pointerdown",()=>this.scene.start("Menu"));
    menuBtn.on("pointerover",()=>menuBtn.setTint(0x00ffcc));
    menuBtn.on("pointerout",()=>menuBtn.clearTint());

    this.jumpCount=0;
  }

  update(){
    this.bg.tilePositionX=this.cameras.main.scrollX*0.3;

    if(this.cursors.left.isDown){
      this.player.setVelocityX(-200);
    } else if(this.cursors.right.isDown){
      this.player.setVelocityX(200);
    } else {
      this.player.setVelocityX(0);
    }

    if(this.cursors.up.isDown && this.jumpCount<3){
      this.player.setVelocityY(-400);
      this.sound.play("jump");
      this.jumpCount++;
    }
    if(this.player.body.touching.down){
      this.jumpCount=0;
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
  physics:{default:"arcade",arcade:{gravity:{y:800}}},
  scene:[Menu,Select,Game]
});
