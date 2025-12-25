console.log("🎮 GAME UI FIXED");

// ===== TELEGRAM SAFE =====
if (window.Telegram && window.Telegram.WebApp) {
  Telegram.WebApp.ready();
  Telegram.WebApp.expand();
}

// ===== MENU =====
class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  preload() {
    this.load.image('bg', 'assets/backgrounds/bg.png');
  }

  create() {
    const { width, height } = this.scale;

    this.add.image(width / 2, height / 2, 'bg').setDisplaySize(width, height);

    this.add.text(width / 2, height / 3,
      'PINK YUPIK ARCADE',
      { fontSize: '48px', color: '#ffffff', fontStyle: 'bold' }
    ).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 80,
      'PLAY',
      { fontSize: '36px', color: '#ffcc66', backgroundColor: '#00000088', padding: { x: 20, y: 10 } }
    ).setOrigin(0.5).setInteractive().on('pointerdown', () => {
      this.scene.start('Game');
    });
  }
}

// ===== PLAYER =====
class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, null);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setSize(40, 60);
    this.setCollideWorldBounds(true);
    this.setDragX(1200);

    this.touch = { left: false, right: false, jump: false };
  }

  update() {
    const cursors = this.scene.input.keyboard.createCursorKeys();
    const left = cursors.left.isDown || this.touch.left;
    const right = cursors.right.isDown || this.touch.right;
    const jump = Phaser.Input.Keyboard.JustDown(cursors.up) || this.touch.jump;

    if (left) this.setAccelerationX(-800);
    else if (right) this.setAccelerationX(800);
    else this.setAccelerationX(0);

    if (jump && this.body.blocked.down) this.setVelocityY(-500);

    this.touch.jump = false;
  }
}

// ===== GAME =====
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x224466).setOrigin(0);

    this.physics.world.setBounds(0, 0, 2000, height);

    this.ground = this.physics.add.staticGroup();
    for (let i = 0; i < 10; i++) {
      this.ground.create(i * 200, height - 20).setSize(200, 40).setOrigin(0, 0.5).refreshBody();
    }

    this.player = new Player(this, 100, height - 100);
    this.physics.add.collider(this.player, this.ground);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 2000, height);

    // UI: кнопка меню
    this.add.text(20, 20, 'MENU', {
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 6 }
    }).setScrollFactor(0).setInteractive().on('pointerdown', () => {
      this.scene.start('Menu');
    });

    this.createTouchControls();
  }

  createTouchControls() {
    const h = this.scale.height;

    const style = { fontSize: '36px', color: '#fff', backgroundColor: '#00000088', padding: { x: 12, y: 8 } };

    const left = this.add.text(40, h - 80, '◀', style).setScrollFactor(0).setInteractive();
    const right = this.add.text(120, h - 80, '▶', style).setScrollFactor(0).setInteractive();
    const jump = this.add.text(this.scale.width - 80, h - 80, '⤒', style).setScrollFactor(0).setInteractive();

    left.on('pointerdown', () => this.player.touch.left = true);
    left.on('pointerup', () => this.player.touch.left = false);
    left.on('pointerout', () => this.player.touch.left = false);

    right.on('pointerdown', () => this.player.touch.right = true);
    right.on('pointerup', () => this.player.touch.right = false);
    right.on('pointerout', () => this.player.touch.right = false);

    jump.on('pointerdown', () => this.player.touch.jump = true);
  }

  update() {
    this.player.update();
  }
}

// ===== CONFIG =====
new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { y: 900 } } },
  scene: [MenuScene, GameScene]
});
