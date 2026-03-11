import Phaser from 'phaser';
import { playSound } from '../utils/audio';

export class MenuScene extends Phaser.Scene {
    private started: boolean = false;

    constructor() { super('MenuScene'); }
    
    create() {
        this.add.text(240, 200, 'PANG CLONE', { fontFamily: 'monospace', fontSize: '48px', color: '#0ff', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(240, 400, 'Haz clic o pulsa ENTER/ESPACIO para jugar', { fontFamily: 'monospace', fontSize: '16px', color: '#fff' }).setOrigin(0.5);
        
        const start = () => {
            if(!this.started) {
                this.started = true;
                playSound('levelup');
                this.scene.start('GameScene');
            }
        };
        
        this.input.on('pointerdown', start);
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-ENTER', start);
            this.input.keyboard.on('keydown-SPACE', start);
        }
        
        this.started = false;
        
        if(!localStorage.getItem('pang_highscore')) localStorage.setItem('pang_highscore', '0');
    }
}
