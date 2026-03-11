import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        let g = this.make.graphics();

        // Player
        g.fillStyle(0x00ffff); g.fillRoundedRect(4, 16, 24, 32, 4); g.fillStyle(0xffcccc); g.fillCircle(16, 12, 12);
        g.fillStyle(0x000000); g.fillRect(10, 16, 12, 4); // Gafas
        g.generateTexture('player_frame1', 32, 48);

        g.clear(); g.fillStyle(0x00ffff); g.fillRoundedRect(4, 18, 24, 30, 4); g.fillStyle(0xffcccc); g.fillCircle(16, 14, 12); g.fillStyle(0x000000); g.fillRect(10, 18, 12, 4); g.generateTexture('player_frame2', 32, 48);
        g.clear(); g.fillStyle(0x00ffff); g.fillRoundedRect(4, 14, 24, 34, 4); g.fillStyle(0xffcccc); g.fillCircle(16, 10, 12); g.fillStyle(0x000000); g.fillRect(10, 14, 12, 4); g.generateTexture('player_frame3', 32, 48);

        this.anims.create({ key: 'player_idle', frames: [{ key: 'player_frame1' }], frameRate: 1 });
        this.anims.create({ key: 'player_walk', frames: [{ key: 'player_frame2' }, { key: 'player_frame1' }, { key: 'player_frame3' }], frameRate: 8, repeat: -1 });

        // Globos
        const bcolors: Record<string, number> = { 'big': 0xff0000, 'medium': 0xff8800, 'small': 0xffff00, 'tiny': 0x00ff00 };
        const bsizes: Record<string, number> = { 'big': 48, 'medium': 32, 'small': 20, 'tiny': 10 };

        for (let type in bcolors) {
            g.clear(); let r = bsizes[type];
            g.fillStyle(bcolors[type], 1); g.lineStyle(2, 0xffffff, 0.8);
            g.fillCircle(r, r, r); g.strokeCircle(r, r, r);
            g.fillStyle(0xffffff, 0.5); g.fillCircle(r - r * 0.3, r - r * 0.3, r * 0.3); // Brillo
            g.generateTexture('balloon_' + type, r * 2, r * 2);
        }

        // Arpón
        g.clear(); g.fillStyle(0x00ffff, 1); g.lineStyle(1, 0xffffff);
        g.beginPath(); g.moveTo(4, 0); g.lineTo(8, 8); g.lineTo(0, 8); g.closePath();
        g.fillPath(); g.strokePath(); g.generateTexture('harpoon_tip', 8, 8);
        g.clear(); g.fillStyle(0x00aaaa, 0.8); g.fillRect(0, 0, 4, 8); g.generateTexture('harpoon_cable', 4, 8);

        // Bloques/Suelo dibujados a mano con líneas
        g.clear(); g.fillStyle(0x664422, 1); g.fillRect(0, 0, 40, 40);
        g.lineStyle(2, 0x442200, 1); g.strokeRect(0, 0, 40, 40);
        g.beginPath(); g.moveTo(5, 10); g.lineTo(35, 12); g.moveTo(10, 25); g.lineTo(30, 22); g.strokePath();
        g.generateTexture('platform', 40, 40);

        // Corazón
        g.clear(); g.fillStyle(0xff0000, 1); g.fillCircle(10, 10, 8); g.fillCircle(22, 10, 8);
        g.beginPath(); g.moveTo(2, 10); g.lineTo(30, 10); g.lineTo(16, 28); g.closePath(); g.fillPath();
        g.generateTexture('heart', 32, 32);

        this.scene.start('MenuScene');
    }
}
