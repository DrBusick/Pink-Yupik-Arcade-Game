import MenuScene from './scenes/MenuScene.js';
import SelectScene from './scenes/SelectScene.js';
import GameScene from './scenes/GameScene.js';
import WinScene from './scenes/WinScene.js';
import LoseScene from './scenes/LoseScene.js';

export default {
    type: Phaser.AUTO,
    width:1248,
    height:832,

    scale:{
        mode:Phaser.Scale.FIT,
        autoCenter:Phaser.Scale.CENTER_BOTH
    },

    physics:{
        default:'arcade',
        arcade:{
            gravity:{y:900},
            debug:false
        }
    },

    scene:[
        MenuScene,
        SelectScene,
        GameScene,
        WinScene,
        LoseScene
    ]
};