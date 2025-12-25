console.log("Pink Yupik Arcade — RUN");

let selectedCharacter = null;
let heartsCollected = 0;
const TOTAL_HEARTS = 20;

window.addEventListener("DOMContentLoaded", () => {

// MENU
class MenuScene extends Phaser.Scene {
  constructor(){super("Menu");}
  preload(){
    this.load.image("bg_far","assets/backgrounds/bg_far.png");
    this.load.image("bg_mid","assets/backgrounds/bg_mid.png");
    this.load.image("bg_near","assets/backgrounds/bg_near.png");
    this.load.audio("snd_hover","assets/sounds/hover.mp3");
  }
  create(){
    const {width,height}=this.scale;
    this.bgFar=this.add.tileSprite(0,0,width,height,"bg_far").setOrigin(0);
    this.bgMid=this.add.tileSprite(0,0,width,height,"bg_mid").setOrigin(0);
    this.bgNear=this.add.tileSprite(0,0,width,height,"bg_near").setOrigin(0);
    this.add.text(width/2,height*0.2,"PINK YUPIK ARCADE",{fontSize:"64px",color:"#fff"}).setOrigin(0.5);

    this.sndHover=this.sound.add("snd_hover");
    const btn=this.add.text(width/2,height*0.55,"PLAY",{fontSize:"40px",color:"#00ff99",backgroundColor:"#000a",padding:{x:30,y:15}})
      .setOrigin(0.5).setInteractive();
    btn.on("pointerover",()=>this.sndHover.play());
    btn.on("pointerdown",()=>this.scene.start("Select"));
  }
  update(){
    this.bgFar.tilePositionX+=0.1;
    this.bgMid.tilePositionX+=0.25;
    this.bgNear.tilePositionX+=0.4;
  }
}

// SELECT
class SelectScene extends Phaser.Scene {
  constructor(){super("Select");}
  preload(){
    this.load.image("bg_select","assets/backgrounds/bg.png");
    this.load.image("p1","assets/player1/idle.png");
    this.load.image("p2","assets/player2/idle.png");
    this.load.audio("snd_hover","assets/sounds/hover.mp3");
  }
  create(){
    const {width,height}=this.scale;
    this.add.image(0,0,"bg_select").setOrigin(0);
    this.add.text(width/2,height*0.2,"SELECT CHARACTER",{fontSize:"42px",color:"#fff"}).setOrigin(0.5);
    this.sndHover=this.sound.add("snd_hover");

    const p1=this.add.image(width/2-150,height/2,"p1").setScale(1.2).setInteractive();
    const p2=this.add.image(width/2+150,height/2,"p2").setScale(1.2).setInteractive();
    p1.on("pointerover",()=>this.sndHover.play());
    p2.on("pointerover",()=>this.sndHover.play());
    p1.on("pointerdown",()=>{selectedCharacter="player1";this.scene.start("Game");});
    p2.on("pointerdown",()=>{selectedCharacter="player2";this.scene.start("Game");});
  }
}

// PLAYER
class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene,x,y,idle,walk){
    super(scene,x,y,idle);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.idle=idle; this.walk=walk;
    this.setCollideWorldBounds(true);
    this.setDragX(1600);
    this.jumpCount=0;
    this.maxJumps=3;
    this.touch={left:false,right:false,jump:false};
  }
  update(){
    const c=this.scene.input.keyboard.createCursorKeys();
    const left=c.left.isDown||this.touch.left;
    const right=c.right.isDown||this.touch.right;
    const jump=Phaser.Input.Keyboard.JustDown(c.up)||this.touch.jump;

    if(left){this.setAccelerationX(-800);this.setFlipX(true);}
    else if(right){this.setAccelerationX(800);this.setFlipX(false);}
    else this.setAccelerationX(0);

    if(this.body.blocked.down) this.jumpCount=0;
    if(jump && this.jumpCount<this.maxJumps){
      this.setVelocityY(-520);
      this.jumpCount++;
      this.scene.sndJump.play();
    }

    const moving=Math.abs(this.body.velocity.x)>20;
    this.anims.play(moving?this.walk:this.idle,true);
    if(moving && this.body.blocked.down){
      if(!this.scene.sndWalk.isPlaying) this.scene.sndWalk.play();
    } else {
      if(this.scene.sndWalk.isPlaying) this.scene.sndWalk.stop();
    }
    this.touch.jump=false;
  }
}

// GAME
class GameScene extends Phaser.Scene {
  constructor(){super("Game");}
  preload(){
    this.load.image("bg","assets/backgrounds/bg.png");
    this.load.image("ground","assets/platforms/ground.png");
    for(let i=1;i<=4;i++) this.load.image(`pf${i}`,`assets/platforms/platform_${i}.png`);
    this.load.image("heart","assets/items/heart_v4.png");

    this.load.image("p1_idle","assets/player1/idle.png");
    this.load.spritesheet("p1_walk","assets/player1/walk.png",{frameWidth:142,frameHeight:142});
    this.load.image("p2_idle","assets/player2/idle.png");
    this.load.spritesheet("p2_walk","assets/player2/walk.png",{frameWidth:142,frameHeight:142});

    this.load.audio("snd_collect","assets/sounds/collect.mp3");
    this.load.audio("snd_jump","assets/sounds/jump.mp3");
    this.load.audio("snd_walk","assets/sounds/walk.mp3");
  }
  create(){
    heartsCollected=0;
    this.sndCollect=this.sound.add("snd_collect");
    this.sndJump=this.sound.add("snd_jump");
    this.sndWalk=this.sound.add("snd_walk",{loop:true,volume:0.4});

    this.add.image(0,0,"bg").setOrigin(0);
    this.physics.world.setBounds(0,0,4000,800);

    this.ground=this.physics.add.staticGroup();
    for(let i=0;i<16;i++) this.ground.create(i*250,780,"ground").setOrigin(0,1).refreshBody();

    this.staticPlatforms=this.physics.add.staticGroup();
    this.movingPlatforms=this.physics.add.group({allowGravity:false,immovable:true});
    this.spawnPlatforms();

    const idle=selectedCharacter==="player2"?"p2_idle":"p1_idle";
    const walk=selectedCharacter==="player2"?"p2_walk":"p1_walk";
    if(!this.anims.exists(walk)){
      this.anims.create({key:idle,frames:[{key:idle}],repeat:-1});
      this.anims.create({key:walk,frames:this.anims.generateFrameNumbers(walk),frameRate:10,repeat:-1});
    }

    this.player=new Player(this,200,600,idle,walk);
    this.physics.add.collider(this.player,this.ground);
    this.physics.add.collider(this.player,this.staticPlatforms);
    this.physics.add.collider(this.player,this.movingPlatforms);

    this.hearts=this.physics.add.staticGroup();
    this.spawnHearts();

    this.physics.add.overlap(this.player,this.hearts,(p,h)=>{
      h.destroy();
      heartsCollected++;
      this.sndCollect.play();
      this.ui.setText(`❤️ ${heartsCollected} / ${TOTAL_HEARTS}`);
      if(heartsCollected===TOTAL_HEARTS) this.showWinText();
    });

    this.ui=this.add.text(20,20,`❤️ 0 / ${TOTAL_HEARTS}`,{fontSize:"28px",color:"#fff"}).setScrollFactor(0);

    this.cameras.main.startFollow(this.player,true,0.1,0.1);
    this.cameras.main.setBounds(0,0,4000,800);
  }

  spawnPlatforms(){
    const keys=["pf1","pf2","pf3","pf4"];
    let x=400;
    for(let i=0;i<15;i++){
      const y=Phaser.Math.Between(260,520);
      const key=Phaser.Utils.Array.GetRandom(keys);
      if(i%4===0){
        const p=this.movingPlatforms.create(x,y,key);
        p.startY=y; p.range=80; p.speed=40; p.body.setVelocityY(40);
      } else this.staticPlatforms.create(x,y,key).refreshBody();
      x+=Phaser.Math.Between(250,350);
    }
  }

  spawnHearts(){
    let attempts=0;
    while(this.hearts.getLength()<TOTAL_HEARTS && attempts<500){
      const x=Phaser.Math.Between(300,3700);
      const y=Phaser.Math.Between(150,520);
      const h=this.hearts.create(x,y,"heart");
      if(this.physics.overlap(h,this.staticPlatforms)||this.physics.overlap(h,this.movingPlatforms)) h.destroy();
      attempts++;
    }
  }

  showWinText(){
    const {width,height}=this.scale;
    this.add.text(width/2,height/2,"All 20 hearts collected!",{
      fontSize:"48px",color:"#ff69b4",backgroundColor:"#000a",padding:{x:20,y:10}
    }).setOrigin(0.5).setScrollFactor(0);
  }

  update(){
    this.player.update();
    this.movingPlatforms.getChildren().forEach(p=>{
      if(p.y>p.startY+p.range) p.body.setVelocityY(-p.speed);
      if(p.y<p.startY-p.range) p.body.setVelocityY(p.speed);
    });
  }
}

// CONFIG
new Phaser.Game({
  parent:"game-container",
  type:Phaser.AUTO,
  width:1280,
  height:720,
  backgroundColor:"#000",
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
  physics:{default:"arcade",arcade:{gravity:{y:900}}},
  scene:[MenuScene,SelectScene,GameScene]
});

});
