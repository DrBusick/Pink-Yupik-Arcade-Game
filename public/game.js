// Mario-like platformer (non-commercial assets). Uses simple tileset and sprites in public/assets/
// Controls: arrow keys or A/D for left/right, W / up / space to jump
const TILE = 32;
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 700;

const config = {
  type: Phaser.AUTO,
  width: Math.min(window.innerWidth, 900),
  height: Math.min(window.innerHeight, 700),
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 1000 }, debug: false }
  },
  scene: { preload, create, update }
};

const game = new Phaser.Game(config);
let player, cursors, platformsLayer, map, score = 0, scoreText, coins, enemies, isGameOver=false;

function preload() {
  this.load.image('tiles', 'assets/tiles.png');
  this.load.spritesheet('player', 'assets/player.png', { frameWidth:36, frameHeight:48 });
  this.load.image('enemy', 'assets/enemy.png');
  this.load.image('coin', 'assets/coin.png');
  this.load.image('flag', 'assets/flag.png');
}

function create() {
  // create a simple tilemap from array
  const level = [
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg'
  ];
  const tileData = [];
  for (let row of level) {
    const arr = [];
    for (let ch of row) {
      if (ch === 'g') arr.push(0); else arr.push(-1);
    }
    tileData.push(arr);
  }
  map = this.make.tilemap({ data: tileData, tileWidth: TILE, tileHeight: TILE });
  const tileset = map.addTilesetImage('tiles', null, TILE, TILE);
  platformsLayer = map.createLayer(0, tileset, 0, 0);
  platformsLayer.setCollisionBetween(0,0);

  // player
  player = this.physics.add.sprite(100, 500, 'player');
  player.setSize(20,40);
  player.setCollideWorldBounds(true);

  this.anims.create({ key:'idle', frames: this.anims.generateFrameNumbers('player', { start:0, end:0 }), frameRate:5, repeat:-1 });
  this.anims.create({ key:'run', frames: this.anims.generateFrameNumbers('player', { start:1, end:4 }), frameRate:10, repeat:-1 });
  this.anims.create({ key:'jump', frames: this.anims.generateFrameNumbers('player', { start:5, end:5 }), frameRate:1 });

  this.physics.add.collider(player, platformsLayer);

  // coins group
  coins = this.physics.add.group();
  for (let i=0;i<20;i++) {
    const cx = 300 + i*80;
    const c = coins.create(cx, 400 - (i%5)*20, 'coin');
    c.body.setAllowGravity(false);
  }
  this.physics.add.overlap(player, coins, collectCoin, null, this);

  // enemies
  enemies = this.physics.add.group();
  spawnEnemy(this, 700, 550);
  spawnEnemy(this, 1100, 550);
  this.physics.add.collider(enemies, platformsLayer);
  this.physics.add.collider(player, enemies, hitEnemy, null, this);

  // HUD
  scoreText = this.add.text(12,12, 'Score: 0', { font: '20px Arial', fill:'#000' }).setScrollFactor(0);

  // camera
  this.cameras.main.setBounds(0,0,WORLD_WIDTH,WORLD_HEIGHT);
  this.cameras.main.startFollow(player, true, 0.1, 0.1);
  this.physics.world.setBounds(0,0,WORLD_WIDTH,WORLD_HEIGHT);

  // controls
  cursors = this.input.keyboard.addKeys({ left:Phaser.Input.Keyboard.KeyCodes.LEFT, right:Phaser.Input.Keyboard.KeyCodes.RIGHT, up:Phaser.Input.Keyboard.KeyCodes.UP, A:Phaser.Input.Keyboard.KeyCodes.A, D:Phaser.Input.Keyboard.KeyCodes.D, W:Phaser.Input.Keyboard.KeyCodes.W, SPACE:Phaser.Input.Keyboard.KeyCodes.SPACE });
}

function spawnEnemy(scene, x, y) {
  const e = scene.physics.add.sprite(x, y, 'enemy');
  e.setCollideWorldBounds(true);
  e.setVelocityX(-50);
  e.setBounce(1,0);
  enemies.add(e);
}

function collectCoin(playerObj, coin) {
  coin.destroy();
  score += 100;
  scoreText.setText('Score: ' + score);
}

function hitEnemy(playerObj, enemyObj) {
  if (playerObj.body.velocity.y > 0) {
    enemyObj.destroy();
    score += 200;
    scoreText.setText('Score: ' + score);
  } else {
    // die
    gameOver(this);
  }
}

function gameOver(scene) {
  if (isGameOver) return;
  isGameOver = true;
  const finalScore = score;
  scene.add.rectangle(scene.cameras.main.scrollX + config.width/2, config.height/2, 360, 160, 0xffffff).setOrigin(0.5);
  scene.add.text(scene.cameras.main.scrollX + config.width/2 - 120, config.height/2 - 20, 'Game Over\nScore: ' + finalScore, { font:'22px Arial', fill:'#000' }).setScrollFactor(0);
  // send to server
  fetch('/api/score', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ score: finalScore, user: window.APP_USER || null }) }).catch(()=>{});
}

function update() {
  if (!player || isGameOver) return;
  const speed = 160;
  const left = cursors.left.isDown || cursors.A.isDown;
  const right = cursors.right.isDown || cursors.D.isDown;
  const up = cursors.up.isDown || cursors.W.isDown || cursors.SPACE.isDown;

  if (left) {
    player.setVelocityX(-speed);
    player.anims.play('run', true);
    player.flipX = true;
  } else if (right) {
    player.setVelocityX(speed);
    player.anims.play('run', true);
    player.flipX = false;
  } else {
    player.setVelocityX(0);
    player.anims.play('idle', true);
  }
  if (up && player.body.blocked.down) {
    player.setVelocityY(-420);
    player.anims.play('jump', true);
  }
}
