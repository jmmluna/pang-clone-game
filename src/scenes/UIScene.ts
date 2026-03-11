import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
    private scoreText!: Phaser.GameObjects.Text;
    private levelText!: Phaser.GameObjects.Text;
    private timeBar!: Phaser.GameObjects.Rectangle;
    private hearts: Phaser.GameObjects.Image[] = [];
    private banner!: Phaser.GameObjects.Text;
    private pauseBg!: Phaser.GameObjects.Rectangle;
    private pauseText!: Phaser.GameObjects.Text;

    constructor() { super('UIScene'); }

    create() {
        this.scoreText = this.add.text(10, 10, 'SCORE: 00000', { fontFamily: 'monospace', fontSize: '20px', color: '#fff' });
        let hi = localStorage.getItem('pang_highscore') || '0';
        this.add.text(470, 10, 'HI: ' + hi, { fontFamily: 'monospace', fontSize: '20px', color: '#ff0' }).setOrigin(1, 0);
        this.levelText = this.add.text(240, 10, 'LVL 1', { fontFamily: 'monospace', fontSize: '20px', color: '#0ff' }).setOrigin(0.5, 0);

        this.timeBar = this.add.rectangle(90, 40, 300, 10, 0x00ff00).setOrigin(0, 0.5);
        this.add.rectangle(240, 40, 300, 10).setStrokeStyle(2, 0xffffff); // timeBg

        this.hearts = [];
        for (let i = 0; i < 3; i++) this.hearts.push(this.add.image(20 + i * 35, 610, 'heart'));

        this.banner = this.add.text(240, 320, '', { fontFamily: 'monospace', fontSize: '32px', color: '#ff0', fontStyle: 'bold', align: 'center', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setAlpha(0);

        this.pauseBg = this.add.rectangle(240, 400, 480, 800, 0x000000, 0.5).setAlpha(0);
        this.pauseText = this.add.text(240, 400, 'PAUSE', { fontFamily: 'monospace', fontSize: '48px', color: '#fff' }).setOrigin(0.5).setAlpha(0);
    }

    updateStats(score: number, lives: number, level: number) {
        this.scoreText.setText('SCORE: ' + score.toString().padStart(5, '0'));
        this.levelText.setText('LVL ' + level);
        for (let i = 0; i < 3; i++) this.hearts[i].setVisible(i < lives);
    }

    updateTime(left: number, total: number) {
        let pct = Math.max(0, left / total);
        this.timeBar.width = 300 * pct;
        if (pct > 0.5) this.timeBar.fillColor = 0x00ff00;
        else if (pct > 0.2) this.timeBar.fillColor = 0xffff00;
        else this.timeBar.fillColor = 0xff0000;
    }

    showBanner(text: string) {
        this.banner.setText(text); this.banner.setAlpha(0); this.banner.setScale(0.5);
        this.tweens.add({ targets: this.banner, alpha: 1, scale: 1, ease: 'Back.easeOut', duration: 500, yoyo: true, hold: 1500 });
    }

    showPause() { this.pauseBg.setAlpha(1); this.pauseText.setAlpha(1); }
    hidePause() { this.pauseBg.setAlpha(0); this.pauseText.setAlpha(0); }
}
