import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Balloon, BalloonSize } from '../objects/Balloon';
import { playSound } from '../utils/audio';
import { UIScene } from './UIScene';

interface LevelConfig {
    name: string;
    bg: number;
    time: number;
    plats: { x: number, y: number, w: number }[];
    balloons: { t: BalloonSize, x: number, y: number, dx: number }[];
}

export class GameScene extends Phaser.Scene {
    private levels!: LevelConfig[];
    private currentLevel: number = 0;
    private score: number = 0;
    private lives: number = 3;

    private ui!: UIScene;
    private bg!: Phaser.GameObjects.Rectangle;
    private stars!: Phaser.GameObjects.Group;

    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    public harpoons!: Phaser.GameObjects.Group;
    public balloons!: Phaser.GameObjects.Group;

    private player!: Player;
    private keys: any;

    private mLeft: boolean = false;
    private mRight: boolean = false;
    private btnLeft!: Phaser.GameObjects.Rectangle;
    private btnRight!: Phaser.GameObjects.Rectangle;
    private btnFire!: Phaser.GameObjects.Rectangle;

    private levelTime: number = 0;
    private timeLeft: number = 0;
    private timerEvent?: Phaser.Time.TimerEvent;

    private isLevelTransition: boolean = false;
    private paused: boolean = false;

    constructor() { super('GameScene'); }

    init() {
        this.levels = [
            {
                name: "NIVEL 1: La Cueva", bg: 0x000022, time: 60, plats: [],
                balloons: [{ t: 'big', x: 100, y: 100, dx: 1 }] //{t:'big', x:380, y:100, dx:-1}
            },
            {
                name: "NIVEL 2: La Montaña", bg: 0x222222, time: 60,
                plats: [{ x: 240, y: 400, w: 160 }],
                balloons: [{ t: 'big', x: 100, y: 100, dx: 1 }] //{t:'big', x:380, y:100, dx:-1}
            },
            {
                name: "NIVEL 3: El Bosque", bg: 0x224400, time: 60, plats: [],
                balloons: [{ t: 'big', x: 100, y: 100, dx: 1 }, { t: 'big', x: 380, y: 100, dx: -1 }]
            },
            {
                name: "NIVEL 4: Las Ruinas", bg: 0x442200, time: 75,
                plats: [{ x: 100, y: 400, w: 120 }, { x: 380, y: 400, w: 120 }],
                balloons: [{ t: 'big', x: 240, y: 50, dx: 1 }, { t: 'medium', x: 100, y: 250, dx: 1 }, { t: 'medium', x: 380, y: 250, dx: -1 }]
            },
            {
                name: "NIVEL 5: La Fortaleza", bg: 0x222222, time: 90,
                plats: [{ x: 240, y: 250, w: 160 }, { x: 80, y: 400, w: 160 }, { x: 400, y: 400, w: 160 }],
                balloons: [{ t: 'big', x: 100, y: 100, dx: 1 }, { t: 'big', x: 240, y: 80, dx: -1 }, { t: 'big', x: 380, y: 100, dx: 1 }]
            }
        ];
        this.currentLevel = 0;
        this.score = 0;
        this.lives = 3;
    }

    create() {
        this.scene.launch('UIScene');
        this.ui = this.scene.get('UIScene') as UIScene;

        this.bg = this.add.rectangle(240, 320, 480, 640).setOrigin(0.5);

        this.stars = this.add.group();
        for (let i = 0; i < 50; i++) {
            this.stars.add(this.add.rectangle(Phaser.Math.Between(0, 480), Phaser.Math.Between(0, 640), 2, 2, 0xffffff, Phaser.Math.FloatBetween(0.2, 0.8)));
        }

        this.platforms = this.physics.add.staticGroup();
        this.harpoons = this.add.group({ runChildUpdate: true });
        this.balloons = this.add.group({ runChildUpdate: true });

        this.platforms.create(240, 630, 'platform').setScale(12, 1).refreshBody();

        this.player = new Player(this, 240, 610);

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.balloons, this.platforms);

        this.physics.add.overlap(this.harpoons, this.balloons, (harpoon, balloon) => {
            harpoon.destroy();
            (balloon as Balloon).pop();
            this.checkLevelComplete();
        });

        this.physics.add.overlap(this.player, this.balloons, () => {
            this.player.die();
        });

        if (this.input.keyboard) {
            this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,SPACE,UP,A,D,P,ESC');
        }
        this.setupMobileControls();

        this.ui.events.once('create', () => {
            this.loadLevel(0);
        });

        if (this.ui.scene.settings.status === Phaser.Scenes.RUNNING) {
            this.loadLevel(0);
        }
    }

    setupMobileControls() {
        let mW = this.cameras.main.width; let mH = this.cameras.main.height;
        this.btnLeft = this.add.rectangle(60, mH - 60, 100, 100, 0xffffff, 0.2).setInteractive();
        this.btnLeft.on('pointerdown', () => this.mLeft = true);
        this.btnLeft.on('pointerup', () => this.mLeft = false);
        this.btnLeft.on('pointerout', () => this.mLeft = false);

        this.btnRight = this.add.rectangle(180, mH - 60, 100, 100, 0xffffff, 0.2).setInteractive();
        this.btnRight.on('pointerdown', () => this.mRight = true);
        this.btnRight.on('pointerup', () => this.mRight = false);
        this.btnRight.on('pointerout', () => this.mRight = false);

        this.btnFire = this.add.rectangle(mW - 80, mH - 60, 120, 100, 0xff0000, 0.2).setInteractive();
        this.btnFire.on('pointerdown', () => this.player.shoot());

        this.add.text(60, mH - 60, '<', { fontSize: '40px', color: '#fff' }).setOrigin(0.5);
        this.add.text(180, mH - 60, '>', { fontSize: '40px', color: '#fff' }).setOrigin(0.5);
        this.add.text(mW - 80, mH - 60, 'F', { fontSize: '40px', color: '#fff' }).setOrigin(0.5);
    }

    loadLevel(index: number) {
        if (index >= this.levels.length) {
            this.scene.start('GameOverScene', { score: this.score, win: true });
            return;
        }

        let l = this.levels[index];
        this.bg.setFillStyle(l.bg);
        this.stars.setVisible(index === 0);

        let oldPlats = this.platforms.getChildren().filter(p => (p as Phaser.GameObjects.Sprite).y < 600);
        oldPlats.forEach(p => p.destroy());
        this.harpoons.clear(true, true);
        this.balloons.clear(true, true);

        l.plats.forEach(p => {
            this.platforms.create(p.x, p.y, 'platform').setScale(p.w / 40, 0.5).refreshBody();
        });

        l.balloons.forEach(b => {
            this.balloons.add(new Balloon(this, b.x, b.y, b.t, b.dx));
        });

        this.player.respawn(240, 610);
        this.levelTime = l.time; this.timeLeft = l.time;

        this.ui.updateStats(this.score, this.lives, index + 1);
        this.ui.showBanner(l.name);

        this.isLevelTransition = true;
        this.time.delayedCall(2000, () => this.isLevelTransition = false);

        if (this.timerEvent) this.timerEvent.remove();
        this.timerEvent = this.time.addEvent({
            delay: 1000, loop: true,
            callback: () => {
                if (this.isLevelTransition || this.player.isDead || this.paused) return;
                this.timeLeft--; this.ui.updateTime(this.timeLeft, this.levelTime);
                if (this.timeLeft <= 0) this.player.die();
            }
        });
    }

    addScore(pts: number) {
        this.score += pts;
        this.ui.updateStats(this.score, this.lives, this.currentLevel + 1);
    }

    checkLevelComplete() {
        if (this.balloons.countActive(true) === 0) {
            this.isLevelTransition = true;
            playSound('levelup');
            let bonus = this.timeLeft * 10;
            this.addScore(bonus);
            this.ui.showBanner(`TIME BONUS: ${bonus}\nLEVEL CLEARED!`);
            this.time.delayedCall(3000, () => {
                this.currentLevel++; this.loadLevel(this.currentLevel);
            });
        }
    }

    playerDied() {
        this.lives--;
        this.ui.updateStats(this.score, this.lives, this.currentLevel + 1);
        if (this.lives <= 0) {
            this.scene.start('GameOverScene', { score: this.score, win: false });
        } else {
            this.ui.showBanner("GET READY");
            this.isLevelTransition = true;
            this.time.delayedCall(2000, () => {
                this.player.respawn(240, 610);
                this.timeLeft = this.levels[this.currentLevel].time;
                this.isLevelTransition = false;
            });
        }
    }

    update() {
        if (!this.keys) return;

        if (Phaser.Input.Keyboard.JustDown(this.keys.P) || Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
            this.paused = !this.paused;
            if (this.paused) this.ui.showPause(); else this.ui.hidePause();
        }

        if (this.paused || this.isLevelTransition) return;

        let dir = 0;
        if (this.keys.LEFT.isDown || this.keys.A.isDown || this.mLeft) dir = -1;
        if (this.keys.RIGHT.isDown || this.keys.D.isDown || this.mRight) dir = 1;

        this.player.move(dir);
        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.UP)) {
            this.player.shoot();
        }
    }
}
