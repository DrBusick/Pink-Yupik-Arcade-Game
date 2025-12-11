// Minimal Phaser 3 platformer with rectangles and score posting to backend
const WIDTH = Math.min(window.innerWidth, 900);
const HEIGHT = Math.min(window.innerHeight, 700);

const config = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 1000 }, debug: false }
  },
  scene: {
    preload,
    create,
    update
  }
};

const game = new Phaser.Game(config);

let player, cursors, platforms, score = 0, scoreText, enemies, isGameOver=false, jumpSound=null;

function preload() {
  // no external assets in this minimal example
}

function create() {
  const scene = this;
  // background
  this.add.rectangle(0,0, WIDTH*2, HEIGHT, 0x87CEEB).setOrigin(0);

  // platforms group (static)
  platforms = this.physics.add.staticGroup();
  // ground
  platforms.create(WIDTH/2, HEIGHT - 16).setDisplaySize(WIDTH*2, 32).refreshBody();
  // floating
  platforms.create(150, HEIGHT - 120).setDisplaySize(200,20).refreshBody();
  platforms.create(420, HEIGHT - 220).setDisplaySize(180,20).refreshBody();
  platforms.create(720, HEIGHT - 320).setDisplaySize(160,20).refreshBody();

  // draw platforms
  platforms.getChildren().forEach(p => {
    const g = this.add.graphics();
    g.fillStyle(0x8B4513, 1);
    g.fillRect(p.x - p.displayWidth/2, p.y - p.displayHeight/2, p.displayWidth, p.displayHeight);
  });

  // player
  player = this.physics.add.sprite(100, HEIGHT - 150);
  player.displayWidth = 36; player.displayHeight = 48;
  player.body.setSize(player.displayWidth, player.displayHeight);
  player.setCollideWorldBounds(true);

  // draw player with a graphics object we update every frame
  player.gfx = this.add.graphics();
  player.gfx.fillStyle(0xff0000,1);
  player.gfx.fillRect(player.x - player.displayWidth/2, player.y - player.displayHeight/2, player.displayWidth, player.displayHeight);

  this.physics.add.collider(player, platforms);

  // enemies
  enemies = this.physics.add.group();
  spawnEnemy(this, 500, HEIGHT - 250);
  spawnEnemy(this, 900, HEIGHT - 150);

  this.physics.add.collider(enemies, platforms);
  this.physics.add.collider(player, enemies, hitEnemy, null, this);

  // input
  cursors = this.input.keyboard.createCursorKeys();

  // score
  scoreText = this.add.text(12,12, 'Score: 0', { font: '20px Arial', fill: '#000' });

  // camera / world bounds
  this.cameras.main.setBounds(0,0,2000,HEIGHT);
  this.cameras.main.startFollow(player, true, 0.1, 0.1);
  this.physics.world.setBounds(0,0,2000,HEIGHT);
}

function spawnEnemy(scene, x, y) {
  const e = scene.physics.add.sprite(x, y);
  e.displayWidth = 32; e.displayHeight = 32;
  e.body.setSize(e.displayWidth, e.displayHeight);
  e.setVelocityX(Phaser.Math.Between(-80,80) || 50);
  e.setBounce(1,0);
  e.setCollideWorldBounds(true);
  e.gfx = scene.add.graphics();
  e.gfx.fillStyle(0x000000,1);
  e.gfx.fillRect(e.x - e.displayWidth/2, e.y - e.displayHeight/2, e.displayWidth, e.displayHeight);
  enemies.add(e);
}

function tryJump() {
  if (player.body.touching.down) {
    player.setVelocityY(-450);
  }
}

function hitEnemy(playerObj, enemyObj) {
  if (playerObj.body.velocity.y > 0) {
    // stomped
    enemyObj.destroy();
    score += 100;
    scoreText.setText('Score: ' + Math.floor(score));
  } else {
    // died
    gameOver(this);
  }
}

function gameOver(scene) {
  if (isGameOver) return;
  isGameOver = true;
  const finalScore = Math.floor(score);
  // show overlay
  scene.add.rectangle(scene.cameras.main.scrollX + WIDTH/2 - 0, HEIGHT/2 - 0, 320, 140, 0xffffff).setOrigin(0.5);
  scene.add.text(scene.cameras.main.scrollX + WIDTH/2 - 110, HEIGHT/2 - 20, `Game Over\nScore: ${finalScore}`, { font: '22px Arial', fill: '#000' });

  // send score to backend
  sendScoreToServer(finalScore);
}

function sendScoreToServer(finalScore) {
  // send user if available
  const user = window.TG_USER || null;
  fetch('/api/score', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ score: finalScore, user })
  }).catch(e => console.error('Failed to send score', e));
}

function update() {
  if (!player || isGameOver) return;

  const speed = 200;
  if (cursors.left.isDown) {
    player.setVelocityX(-speed);
  } else if (cursors.right.isDown) {
    player.setVelocityX(speed);
  } else {
    player.setVelocityX(0);
  }
  if ((cursors.up.isDown || cursors.space.isDown) && player.body.touching.down) {
    player.setVelocityY(-450);
  }

  // update gfx positions
  player.gfx.clear();
  player.gfx.fillStyle(0xff0000,1);
  player.gfx.fillRect(player.x - player.displayWidth/2, player.y - player.displayHeight/2, player.displayWidth, player.displayHeight);

  enemies.getChildren().forEach(en => {
    if (en.gfx) {
      en.gfx.clear();
      en.gfx.fillStyle(0x000000,1);
      en.gfx.fillRect(en.x - en.displayWidth/2, en.y - en.displayHeight/2, en.displayWidth, en.displayHeight);
    }
  });

  // score increases over time
  score += 0.05;
  scoreText.setText('Score: ' + Math.floor(score));

  // simple win condition if player reaches far X
  if (player.x > 1800) {
    // win
    isGameOver = true;
    const finalScore = Math.floor(score) + 500;
    this.add.text(this.cameras.main.scrollX + WIDTH/2 - 120, HEIGHT/2 - 20, `You Win!\nScore: ${finalScore}`, { font: '28px Arial', fill: '#000' });
    sendScoreToServer(finalScore);
  }
}
