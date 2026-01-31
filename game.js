<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Test Pink Yupik</title>
<style>
    html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #000;
        overflow: hidden;
        font-family: 'UnifrakturCook', serif;
    }
</style>
<script src="https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js"></script>
</head>
<body>

<script>
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }
    preload() {
        // Тимчасово замінюємо фон кольором, щоб не залежати від assets
    }
    create() {
        const { width, height } = this.scale;

        // Простий фон
        this.add.rectangle(0, 0, width, height, 0x663399).setOrigin(0);

        // Текст
        this.add.text(width/2, height/2, 'Pink Yupik Arcade', {
            fontFamily: 'UnifrakturCook',
            fontSize: '64px',
            color: '#e8d9b0'
        }).setOrigin(0.5);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1248,
    height: 832,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [MenuScene],
    physics: { default: 'arcade', arcade: { gravity: { y: 900 }, debug: false } }
};

new Phaser.Game(config);
</script>

</body>
</html>
