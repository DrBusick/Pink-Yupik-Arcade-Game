export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type) {
        super(scene, x, y, `${type}_idle`);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.type = type;
        this.speed = 120;
        this.chaseSpeed = 180;

        this.isDead = false;

        this.setCollideWorldBounds(true)
            .setBodySize(90, 120)
            .setOffset(26, 18);

        // патрулювання
        this.direction = 1;
        this.patrolDistance = 200;
        this.startX = x;

        // зона бачення
        this.visionRange = 300;
    }

    update(player) {
        if (this.isDead) return;

        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // 👁 ПЕРЕСЛІДУВАННЯ
        if (dist < this.visionRange) {
            if (player.x < this.x) {
                this.setVelocityX(-this.chaseSpeed);
                this.setFlipX(true);
            } else {
                this.setVelocityX(this.chaseSpeed);
                this.setFlipX(false);
            }
        } 
        // 🚶 ПАТРУЛЮВАННЯ
        else {
            this.setVelocityX(this.speed * this.direction);

            // зміна напрямку
            if (this.x > this.startX + this.patrolDistance) {
                this.direction = -1;
                this.setFlipX(true);
            } else if (this.x < this.startX - this.patrolDistance) {
                this.direction = 1;
                this.setFlipX(false);
            }
        }
    }

    // 💥 викликається при колізії з гравцем
    handlePlayerCollision(player) {
        if (this.isDead) return;

        // 🦶 якщо гравець падає зверху
        if (player.body.velocity.y > 0 && player.y < this.y - 20) {
            player.setVelocityY(-400); // відскок
            this.die();
        } else {
            // 💔 гравець отримує урон
            player.takeDamage();
        }
    }

    die() {
        if (this.isDead) return;

        this.isDead = true;

        this.scene.sound.play('enemy_die');

        this.disableBody(true, true);

        // ❤️ DROP СЕРЦЯ
        const h = this.scene.physics.add.image(this.x, this.y - 20, 'heart_small')
            .setScale(0.4)
            .setBounce(0.6)
            .setVelocity(Phaser.Math.Between(-80, 80), -260)
            .setCollideWorldBounds(true);

        this.scene.physics.add.collider(h, this.scene.ground);
        this.scene.physics.add.collider(h, this.scene.platforms);
        this.scene.physics.add.collider(h, this.scene.movingPlatforms);

        this.scene.physics.add.overlap(this.scene.player, h, () => {
            h.destroy();
            this.scene.hp = Math.min(this.scene.hp + 1, this.scene.maxHP);
            this.scene.hpIcons[this.scene.hp - 1].setAlpha(1);
            this.scene.sound.play('heart_pick');
        });
    }
}
