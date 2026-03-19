import { tg } from '../systems/telegram.js';

export default class MenuScene extends Phaser.Scene {
    constructor(){ super('MenuScene'); }

    preload(){
        this.load.image('bg_far','assets/backgrounds/bg_far.png');
        this.load.image('bg_mid','assets/backgrounds/bg_mid.png');
        this.load.image('bg_near','assets/backgrounds/bg_near.png');

        this.load.audio('menu_hover','assets/sounds/hover.mp3');
        this.load.audio('menu_click','assets/sounds/collect.mp3');
    }

    create(){
        const {width,height} = this.scale;

        this.bgFar  = this.add.tileSprite(0,0,width,height,'bg_far').setOrigin(0);
        this.bgMid  = this.add.tileSprite(0,0,width,height,'bg_mid').setOrigin(0);
        this.bgNear = this.add.tileSprite(0,0,width,height,'bg_near').setOrigin(0);

        document.fonts.ready.then(()=>{
            const titleStyle = { fontFamily:'UnifrakturCook', fontSize:'120px', fill:'#e8d9b0' };
            const optionStyle = { fontFamily:'UnifrakturCook', fontSize:'56px', fill:'#e8d9b0' };

            this.add.text(width/2,height/3,'Pink Yupik Arcade', titleStyle).setOrigin(0.5);

            this.playBtn = this.add.text(width/2,height/2,'PLAY',optionStyle)
                .setOrigin(0.5)
                .setInteractive()
                .on('pointerover',()=>this.sound.play('menu_hover'))
                .on('pointerdown',()=>{
                    this.sound.play('menu_click');
                    this.scene.start('SelectScene');
                });

            this.exitBtn = this.add.text(width/2,height/2+100,'EXIT',optionStyle)
                .setOrigin(0.5)
                .setInteractive()
                .on('pointerover',()=>this.sound.play('menu_hover'))
                .on('pointerdown',()=>{
                    this.sound.play('menu_click');
                    tg?.close();
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

    update(){
        this.bgFar.tilePositionX += 0.2;
        this.bgMid.tilePositionX += 0.5;
        this.bgNear.tilePositionX += 1;
    }
}