import Phaser from 'phaser';
import { Harpoon } from './Harpoon';
import { playSound } from '../utils/audio';

// Interfaz mínima para la escena principal para evitar dependencias circulares complejas
interface PlayableScene extends Phaser.Scene {
    harpoons: Phaser.GameObjects.Group;
    playerDied: () => void;
}

export class Player extends Phaser.GameObjects.Container {
    public isDead: boolean = false;
    private invincible: boolean = false;
    private speed: number = 200;
    private sprite: Phaser.GameObjects.Sprite;

    declare body: Phaser.Physics.Arcade.Body;
    declare scene: PlayableScene;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setSize(32, 48);
        this.body.setOffset(-16, -48);
        this.body.setCollideWorldBounds(true);

        this.sprite = scene.add.sprite(0, -24, 'player');
        this.add(this.sprite);

        this.sprite.anims.play('player_idle');
    }

    move(dir: number) {
        if (this.isDead) return;
        this.body.setVelocityX(dir * this.speed);

        // Partículas de polvo
        if (dir !== 0 && Phaser.Math.Between(0, 100) > 80 && this.body.blocked.down) {
            let p = this.scene.add.sprite(this.x, this.y, 'player_frame1');
            p.setTint(0xaaaaaa); p.setScale(0.2); p.setAlpha(0.5);
            this.scene.tweens.add({
                targets: p, y: p.y - 10, alpha: 0, duration: 200, scale: 0, onComplete: () => p.destroy()
            });
        }

        if (dir < 0) {
            this.sprite.setFlipX(true);
            this.sprite.anims.play('player_walk', true);
        } else if (dir > 0) {
            this.sprite.setFlipX(false);
            this.sprite.anims.play('player_walk', true);
        } else {
            this.sprite.anims.play('player_idle', true);
        }
    }

    shoot() {
        if (this.isDead) return;
        if (this.scene.harpoons && this.scene.harpoons.countActive(true) < 20) {
            let h = new Harpoon(this.scene, this.x, this.y - 48);
            this.scene.harpoons.add(h);
            playSound('shoot');
        }
    }

    die(): boolean {
        if (this.isDead || this.invincible) return false;
        this.isDead = true;
        this.body.setVelocity(0, 0);
        this.sprite.setTint(0xff0000);
        playSound('death');
        this.scene.tweens.add({
            targets: this.sprite,
            scaleY: 0.1, y: 0, duration: 500,
            onComplete: () => {
                if (this.scene.playerDied) this.scene.playerDied();
            }
        });
        return true;
    }

    respawn(x: number, y: number) {
        this.setPosition(x, y);
        this.sprite.setScale(1);
        this.sprite.y = -24;
        this.sprite.clearTint();
        this.isDead = false;
        this.setInvincible(2000);
    }

    setInvincible(duration: number) {
        this.invincible = true;
        // Flash blanco inicial
        let flash = this.scene.add.rectangle(this.x, this.y, 100, 100, 0xffffff, 1).setOrigin(0.5);
        this.scene.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });

        this.scene.tweens.add({
            targets: this.sprite, alpha: 0.2, yoyo: true, repeat: -1, duration: 100
        });
        this.scene.time.delayedCall(duration, () => {
            this.invincible = false;
            this.scene.tweens.killTweensOf(this.sprite);
            this.sprite.alpha = 1;
        });
    }
}
