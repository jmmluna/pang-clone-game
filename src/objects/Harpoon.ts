import Phaser from 'phaser';

export class Harpoon extends Phaser.GameObjects.Container {
    private tip: Phaser.GameObjects.Image;
    private cable: Phaser.GameObjects.Image;
    private startYPos: number;

    // Fix the type of body to be Arcade Physics Body explicitly
    declare body: Phaser.Physics.Arcade.Body;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setSize(8, 8);
        this.body.setOffset(-4, -4);

        this.tip = scene.add.image(0, 0, 'harpoon_tip');
        this.cable = scene.add.image(0, 4, 'harpoon_cable').setOrigin(0.5, 0);
        this.add([this.cable, this.tip]);

        this.startYPos = y;
        this.body.setVelocityY(-500);
    }

    update() {
        let currentLen = this.startYPos - this.y;
        if (currentLen < 0) currentLen = 0;
        this.cable.scaleY = currentLen / 8;
        
        // Actualizar la caja de colisión para que cubra todo el cable y la punta
        // La punta está en this.y (donde está el contenedor), y se extiende hacia abajo
        this.body.setSize(8, currentLen + 8);
        this.body.setOffset(-4, -4); 

        if (this.y < 0 || this.body.touching.up) {
            this.destroy();
        }
    }
}
