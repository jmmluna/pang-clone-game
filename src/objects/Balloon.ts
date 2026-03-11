import Phaser from 'phaser';
import { playSound } from '../utils/audio';

export type BalloonSize = 'big' | 'medium' | 'small' | 'tiny';

interface BalloonConfig {
    r: number;
    vy: number;
    grav: number;
    vx: number;
    pts: number;
    next: BalloonSize | null;
}

interface PlayableScene extends Phaser.Scene {
    balloons: Phaser.GameObjects.Group;
    addScore: (pts: number) => void;
}

export class Balloon extends Phaser.GameObjects.Container {
    private config: BalloonConfig;
    private sizeType: BalloonSize;
    private shadow: Phaser.GameObjects.Ellipse;
    private sprite: Phaser.GameObjects.Sprite;
    
    private customGravity: number;
    private baseVy: number;
    
    private breathTween: Phaser.Tweens.Tween;
    private squashTween: Phaser.Tweens.Tween | null = null;
    
    declare body: Phaser.Physics.Arcade.Body;
    declare scene: PlayableScene;

    constructor(scene: Phaser.Scene, x: number, y: number, sizeType: BalloonSize, dirX: number) {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        const sizes: Record<BalloonSize, BalloonConfig> = {
            'big': { r: 48, vy: -600, grav: 400, vx: 120, pts: 1000, next: 'medium' },
            'medium': { r: 32, vy: -500, grav: 350, vx: 150, pts: 500, next: 'small' },
            'small': { r: 20, vy: -380, grav: 300, vx: 180, pts: 200, next: 'tiny' },
            'tiny': { r: 10, vy: -280, grav: 250, vx: 200, pts: 100, next: null }
        };

        this.config = sizes[sizeType];
        this.sizeType = sizeType;

        // Sombra
        this.shadow = scene.add.ellipse(0, 0, this.config.r * 1.5, this.config.r * 0.4, 0x000000, 0.3);

        this.sprite = scene.add.sprite(0, 0, 'balloon_' + sizeType);
        this.sprite.setOrigin(0.5);
        this.add(this.sprite);

        this.body.setCircle(this.config.r);
        this.body.setOffset(-this.config.r, -this.config.r);

        this.body.setBounce(1, 0); 
        this.body.setCollideWorldBounds(true);

        this.body.setVelocity(dirX * this.config.vx, 0); 
        this.customGravity = this.config.grav;
        this.baseVy = this.config.vy;

        this.breathTween = scene.tweens.add({
            targets: this.sprite, scaleX: 1.05, scaleY: 1.05, duration: 500, yoyo: true, repeat: -1
        });
    }

    update(_time: number, delta: number) {
        let validDelta = Math.min(delta, 32);
        
        this.body.velocity.y += this.customGravity * (validDelta / 1000);
        
        if (this.body.blocked.down || this.body.touching.down) {
            this.body.velocity.y = this.baseVy;
            this.applySquash();
        } else if (this.body.blocked.up || this.body.touching.up) {
            this.body.velocity.y = Math.abs(this.baseVy);
        }

        this.shadow.setPosition(this.x, 610);
    }

    applySquash() {
        if (this.squashTween && this.squashTween.isPlaying()) return;
        
        if (this.breathTween) this.breathTween.pause();

        this.squashTween = this.scene.tweens.add({
            targets: this.sprite, 
            scaleX: 1.3, scaleY: 0.7, 
            duration: 100, yoyo: true, ease: 'Quad.easeOut',
            onComplete: () => {
                this.sprite.setScale(1);
                if (this.breathTween) this.breathTween.resume();
            }
        });
    }

    pop() {
        playSound(this.sizeType === 'big' || this.sizeType === 'medium' ? 'pop_big' : 'pop_small');

        for (let i = 0; i < 10; i++) {
            let p = this.scene.add.sprite(this.x, this.y, 'balloon_' + this.sizeType);
            p.setScale(0.2);
            this.scene.physics.add.existing(p);
            (p.body as Phaser.Physics.Arcade.Body).setVelocity(Phaser.Math.Between(-200, 200), Phaser.Math.Between(-200, 200));
            this.scene.tweens.add({
                targets: p, scaleX: 0, scaleY: 0, alpha: 0, duration: 400, onComplete: () => p.destroy()
            });
        }

        let txt = this.scene.add.text(this.x, this.y, '+' + this.config.pts, {
            fontFamily: 'monospace', fontSize: '16px', color: '#fff', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);
        this.scene.tweens.add({
            targets: txt, y: this.y - 50, alpha: 0, duration: 1000, onComplete: () => txt.destroy()
        });

        if (this.scene.addScore) this.scene.addScore(this.config.pts);

        if (this.sizeType === 'big') {
            this.scene.cameras.main.shake(150, 0.01);
        }

        if (this.config.next) {
            let b1 = new Balloon(this.scene, this.x - 10, this.y, this.config.next, -1);
            let b2 = new Balloon(this.scene, this.x + 10, this.y, this.config.next, 1);
            b1.body.velocity.y = -200; b2.body.velocity.y = -200;
            if (this.scene.balloons) {
                this.scene.balloons.add(b1);
                this.scene.balloons.add(b2);
            }
        }

        this.shadow.destroy();
        this.destroy();
    }

    override destroy() {
        if (this.shadow) this.shadow.destroy();
        super.destroy();
    }
}
