import Phaser from 'phaser';

interface GameOverData {
    score: number;
    win: boolean;
}

export class GameOverScene extends Phaser.Scene {
    private score: number = 0;
    private win: boolean = false;

    constructor() { super('GameOverScene'); }
    
    init(data: GameOverData) { 
        this.score = data.score; 
        this.win = data.win; 
    }
    
    create() {
        let hi = parseInt(localStorage.getItem('pang_highscore') || '0');
        let newHi = false;
        if(this.score > hi) { hi = this.score; localStorage.setItem('pang_highscore', hi.toString()); newHi = true; }
        
        this.add.text(240, 200, this.win ? 'YOU WIN!!' : 'GAME OVER', { fontFamily: 'monospace', fontSize: '48px', color: this.win ? '#0f0' : '#f00', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(240, 300, 'SCORE: ' + this.score, { fontFamily: 'monospace', fontSize: '32px', color: '#fff' }).setOrigin(0.5);
        if(newHi) this.add.text(240, 350, 'NEW HIGH SCORE!', { fontFamily: 'monospace', fontSize: '24px', color: '#ff0' }).setOrigin(0.5);
        this.add.text(240, 450, 'Haz clic para continuar', { fontFamily: 'monospace', fontSize: '16px', color: '#ccc' }).setOrigin(0.5);
        
        const go = () => this.scene.start('MenuScene');
        this.input.once('pointerdown', go);
        if (this.input.keyboard) {
            this.input.keyboard.once('keydown-SPACE', go);
            this.input.keyboard.once('keydown-ENTER', go);
        }
    }
}
