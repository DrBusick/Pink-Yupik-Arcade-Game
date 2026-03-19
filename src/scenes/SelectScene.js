export default class SelectScene extends Phaser.Scene {
    constructor(){ super('SelectScene'); }

    preload(){
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');
        this.load.image('platform','assets/platforms/platform_1.png');
        this.load.image('player1_idle','assets/player1/idle.png');
        this.load.image('player2_idle','assets/player2/idle.png');

        this.load.audio('menu_hover','assets/sounds/hover.mp3');
        this.load.audio('menu_click','assets/sounds/collect.mp3');
    }

    create(){
        const {width,height} = this.scale;

        this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        document.fonts.ready.then(()=>{
            const titleStyle = { fontFamily:'UnifrakturCook', fontSize:'64px', fill:'#e8d9b0' };
            this.add.text(width/2,120,'Select Character', titleStyle).setOrigin(0.5);

            const y = height/2 + 120;

            this.add.image(width/2-220,y,'platform');
            this.add.image(width/2+220,y,'platform');

            const p1=this.add.image(width/2-220,y-110,'player1_idle')
                .setInteractive()
                .on('pointerover',()=>this.sound.play('menu_hover'))
                .on('pointerdown',()=>{
                    this.sound.play('menu_click');
                    this.scene.start('GameScene',{player:'player1'});
                });

            const p2=this.add.image(width/2+220,y-110,'player2_idle')
                .setInteractive()
                .on('pointerover',()=>this.sound.play('menu_hover'))
                .on('pointerdown',()=>{
                    this.sound.play('menu_click');
                    this.scene.start('GameScene',{player:'player2'});
                });

            this.tweens.add({
                targets:[p1,p2],
                scale:1.1,
                duration:600,
                yoyo:true,
                repeat:-1,
                ease:'Sine.easeInOut'
            });
        });
    }
}