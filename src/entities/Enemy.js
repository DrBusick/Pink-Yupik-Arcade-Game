export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y,type){
        super(scene,x,y,`${type}_idle`);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.type=type;
        this.speed=120;
        this.isDead=false;

        this.setCollideWorldBounds(true).setBodySize(90,120).setOffset(26,18);
        this.direction=1;
    }

    die(){
        if(this.isDead) return;

        this.isDead=true;
        this.scene.sound.play('enemy_die');
        this.disableBody(true,true);

        const h = this.scene.physics.add.image(this.x,this.y-20,'heart_small')
            .setScale(0.4).setBounce(0.6)
            .setVelocity(Phaser.Math.Between(-80,80),-260)
            .setCollideWorldBounds(true);

        this.scene.physics.add.collider(h,this.scene.ground);
        this.scene.physics.add.collider(h,this.scene.platforms);
        this.scene.physics.add.collider(h,this.scene.movingPlatforms);

        this.scene.physics.add.overlap(this.scene.player,h,()=>{
            h.destroy();
            this.scene.hp = Math.min(this.scene.hp+1,this.scene.maxHP);
            this.scene.hpIcons[this.scene.hp-1].setAlpha(1);
            this.scene.sound.play('heart_pick');
        });
    }
}