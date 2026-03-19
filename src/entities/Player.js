export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene,x,y,key){
        super(scene,x,y,key);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true).setBodySize(90,120).setOffset(26,18);

        this.speed=180; this.accel=900; this.jumpVelocity=520;
        this.jumpCount=0; this.maxJumps=3;
        this.body.setDragX(1200).setMaxVelocity(this.speed,1000);

        this.keys=scene.input.keyboard.addKeys({
            left:'A', right:'D', up:'W',
            left2:'LEFT', right2:'RIGHT', up2:'UP'
        });

        this.moveLeft=false; this.moveRight=false; this.jump=false;
        this.touchLeft=false; this.touchRight=false; this.touchJump=false;

        this.scene=scene;
        this.invulnerable=false;
        this.stepTimer=0;
    }

    takeHit(fromX){
        if(this.invulnerable) return;

        this.invulnerable=true;
        const dir=this.x<fromX?-1:1;

        this.setVelocityX(dir*250);
        this.setVelocityY(-250);

        this.scene.sound.play('hit');

        this.scene.tweens.add({
            targets:this,
            alpha:0,
            duration:100,
            yoyo:true,
            repeat:10,
            onComplete:()=>{
                this.alpha=1;
                this.invulnerable=false;
            }
        });
    }

    preUpdate(t,d){
        super.preUpdate(t,d);

        const l = this.keys.left.isDown || this.keys.left2.isDown || this.moveLeft || this.touchLeft;
        const r = this.keys.right.isDown || this.keys.right2.isDown || this.moveRight || this.touchRight;
        const j = (Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.up2) || this.jump || this.touchJump);

        if(l) this.setAccelerationX(-this.accel);
        else if(r) this.setAccelerationX(this.accel);
        else this.setAccelerationX(0);

        if(j && this.jumpCount<this.maxJumps){
            this.setVelocityY(-this.jumpVelocity);
            this.jumpCount++;
            this.scene.sound.play('jump');
        }

        if(this.body.blocked.down) this.jumpCount=0;

        if(l) this.setFlipX(true);
        else if(r) this.setFlipX(false);

        if(Math.abs(this.body.velocity.x) > 5){
            this.anims.play('walk', true);

            if(this.body.blocked.down && t > this.stepTimer){
                this.scene.sound.play('step',{volume:0.5});
                this.stepTimer = t + 350;
            }
        } else {
            this.anims.play('idle', true);
        }
    }
}