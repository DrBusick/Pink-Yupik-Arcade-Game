export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "idle");
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.setCollideWorldBounds(true);
        this.setGravityY(900); // Гравітація

        // Керування
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keyAttack = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Стан
        this.jumpCount = 0;
        this.maxJumps = 2;
        this.isAttacking = false;

        this.createAnimations();
    }

    createAnimations() {

        // Ходьба вправо
        this.scene.anims.create({
            key: "walk_right",
            frames: this.scene.anims.generateFrameNumbers("walk", { start: 0, end: 8 }),
            frameRate: 12,
            repeat: -1
        });

        // Ходьба вліво (кадри ті самі)
        this.scene.anims.create({
            key: "walk_left",
            frames: this.scene.anims.generateFrameNumbers("walk", { start: 0, end: 8 }),
            frameRate: 12,
            repeat: -1
        });

        // Стоїть
        this.scene.anims.create({
            key: "idle",
            frames: [{ key: "idle" }],
            frameRate: 1
        });

        // Атака (тимчасово one-frame, можна розширити)
        this.scene.anims.create({
            key: "attack",
            frames: [{ key: "idle" }], 
            frameRate: 1
        });
    }

    update() {

        if (this.isAttacking) return;  // поки атакує — не рухається

        const speed = 160;

        // Рух вліво
        if (this.cursors.left.isDown) {
            this.setVelocityX(-speed);
            this.flipX = true;
            this.anims.play("walk_left", true);
        }

        // Рух вправо
        else if (this.cursors.right.isDown) {
            this.setVelocityX(speed);
            this.flipX = false;
            this.anims.play("walk_right", true);
        }

        // Стоїть
        else {
            this.setVelocityX(0);
            this.anims.play("idle", true);
        }

        // Стрибок + подвійний стрибок
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {

            if (this.body.touching.down) {
                // перший стрибок
                this.jumpCount = 1;
                this.setVelocityY(-420);
            }
            else if (this.jumpCount < this.maxJumps) {
                // другий стрибок
                this.jumpCount++;
                this.setVelocityY(-420);
            }
        }

        // якщо стоїть на землі — обнулити лічильник стрибків
        if (this.body.touching.down) {
            this.jumpCount = 0;
        }

        // Атака
        if (Phaser.Input.Keyboard.JustDown(this.keyAttack)) {
            this.startAttack();
        }
    }

    startAttack() {
        this.isAttacking = true;
        this.setVelocityX(0);
        this.anims.play("attack");

        // Далі можна викликати хіт-бокс
        this.scene.time.delayedCall(250, () => {
            this.isAttacking = false;
        });
    }
}