export default class EndScene extends Phaser.Scene {
    constructor(key,text){
        super(key);
        this.label=text;
    }

    preload(){
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');

        this.load.audio('menu_hover','assets/sounds/hover.mp3');
        this.load.audio('menu_click','assets/sounds/collect.mp3');
    }

    create(data){
        const {width,height}=this.scale;

        document.fonts.ready.then(()=>{
            const style={
                fontFamily:'UnifrakturCook',
                fontSize:'56px',
                fill:'#e8d9b0'
            };

            this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
            this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
            this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

            this.add.text(width/2,height/3,this.label,{
                fontFamily:'UnifrakturCook',
                fontSize:'96px',
                fill:'#e8d9b0'
            }).setOrigin(0.5);

            this.playBtn = this.add.text(width/2,height/2,'PLAY',style)
                .setOrigin(0.5)
                .setInteractive()
                .on('pointerover',()=>this.sound.play('menu_hover'))
                .on('pointerdown',()=>{
                    this.sound.play('menu_click');
                    this.scene.start('GameScene',{player:data.player});
                });

            this.exitBtn = this.add.text(width/2,height/2+100,'EXIT',style)
                .setOrigin(0.5)
                .setInteractive()
                .on('pointerover',()=>this.sound.play('menu_hover'))
                .on('pointerdown',()=>{
                    this.sound.play('menu_click');
                    this.scene.start('MenuScene');
                });

            this.tweens.add({
                targets:[this.playBtn,this.exitBtn],
                scale:1.1,
                duration:600,
                yoyo:true,
                repeat:-1,
                ease:'Sine.easeInOut'
            });
        });
    }
}