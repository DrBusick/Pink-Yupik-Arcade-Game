import config from './config.js';
import { initTelegram } from './systems/telegram.js';

initTelegram();

new Phaser.Game(config);