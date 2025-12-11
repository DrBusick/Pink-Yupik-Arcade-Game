const tg = window.Telegram.WebApp;
tg.expand();

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    physics: {
        default: "arcade",
        arcade: { gravity: { y: 800 }, debug: false }
    },
    scene: {
        preload,
        create,
        update
    }
};

let player;
let cursors;

function preload() {
    this.load.image("ground", "assets/ground.png");
    this.load.image("sky", "assets/sky.png");
    this.load.spritesheet("mario", "assets/mario.png", {
        frameWidth: 32,
        frameHeight: 32
    });
}

function create() {
    this.add.image(400, 225, "sky");

    const platforms = this.physics.add.staticGroup();
    platforms.create(400, 430, "ground").setScale(2).refreshBody();

    player = this.physics.add.sprite(100, 300, "mario");
    player.setBounce(0.1);
    player.setCollideWorldBounds(true);

    this.physics.add.collider(player, platforms);

    cursors = this.input.keyboard.createCursorKeys();

    // Анімації
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('mario', { start: 0, end: 2 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('mario', { start: 3, end: 5 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'idle',
        frames: [{ key: 'mario', frame: 1 }],
        frameRate: 10
    });
}

function update() {
    if (cursors.left.isDown) {
        player.setVelocityX(-180);
        player.anims.play("left", true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(180);
        player.anims.play("right", true);
    } else {
        player.setVelocityX(0);
        player.anims.play("idle");
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-450);
    }
}

const game = new Phaser.Game(config);
