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
    private joyStick!: Phaser.GameObjects.Arc;
    private btnFireInner!: Phaser.GameObjects.Arc;

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
        // Control panel background (y: 640 to 800)
        this.add.rectangle(240, 720, 480, 160, 0x1a1a1a);
        this.add.rectangle(240, 640, 480, 4, 0x444444).setOrigin(0.5, 0); // border

        // Joystick (Left side)
        const joyX = 120;
        const joyY = 720;
        this.add.circle(joyX, joyY, 50, 0x222222).setStrokeStyle(4, 0x111111);
        this.joyStick = this.add.circle(joyX, joyY, 25, 0x666666).setStrokeStyle(2, 0x888888);
        
        let joyZone = this.add.zone(120, 720, 240, 160).setInteractive();
        
        const updateJoy = (pointer: Phaser.Input.Pointer) => {
            let dx = pointer.x - joyX;
            let dy = pointer.y - joyY;
            let dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 30;
            
            if (dist > maxDist) {
                dx = (dx / dist) * maxDist;
                dy = (dy / dist) * maxDist;
            }
            
            this.joyStick.setPosition(joyX + dx, joyY + dy);
            
            const deadzone = 10;
            this.mLeft = dx < -deadzone;
            this.mRight = dx > deadzone;
        };

        const resetJoy = () => {
            this.joyStick.setPosition(joyX, joyY);
            this.mLeft = false;
            this.mRight = false;
        };

        joyZone.on('pointerdown', updateJoy);
        joyZone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (pointer.isDown) updateJoy(pointer);
        });
        joyZone.on('pointerup', resetJoy);
        joyZone.on('pointerout', resetJoy);

        // Fire Button (Right side)
        const fireX = 360;
        const fireY = 720;
        this.add.circle(fireX, fireY, 40, 0x660000).setStrokeStyle(4, 0x330000);
        this.btnFireInner = this.add.circle(fireX, fireY, 32, 0xff0000);
        
        // Add a highlight reflection to the button for a more arcade look
        this.add.circle(fireX - 10, fireY - 10, 8, 0xffffff, 0.3);

        let fireZone = this.add.zone(360, 720, 240, 160).setInteractive();
        
        fireZone.on('pointerdown', () => {
            this.btnFireInner.fillColor = 0xffaaaa;
            this.player.shoot();
        });

        const resetFire = () => {
             this.btnFireInner.fillColor = 0xff0000;
        };

        fireZone.on('pointerup', resetFire);
        fireZone.on('pointerout', resetFire);
        
        // Label
        this.add.text(fireX, fireY + 50, 'FIRE', { fontFamily: 'monospace', fontSize: '18px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
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
