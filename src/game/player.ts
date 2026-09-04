import Phaser from 'phaser';

export class Player {
  sprite!: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private speed = 150;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.createSprite(x, y);
  }

  private createSprite(x: number, y: number) {
    const graphics = this.scene.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0x4a90e2, 1);
    graphics.fillRect(0, 8, 16, 8);
    graphics.fillStyle(0xf5a623, 1);
    graphics.fillRect(4, 4, 8, 4);
    graphics.fillStyle(0x2c3e50, 1);
    graphics.fillRect(6, 5, 2, 1);
    graphics.fillRect(10, 5, 2, 1);

    graphics.generateTexture('player-texture', 16, 16);
    graphics.destroy();

    this.sprite = this.scene.physics.add.sprite(x, y, 'player-texture');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0);
    this.sprite.setBodySize(14, 14);
  }

  move(dirX: number, dirY: number) {
    if (dirX === 0 && dirY === 0) {
      this.sprite.setVelocity(0, 0);
      return;
    }

    let x = dirX * this.speed;
    let y = dirY * this.speed;

    if (dirX !== 0 && dirY !== 0) {
      x *= 0.707;
      y *= 0.707;
    }

    this.sprite.setVelocity(x, y);
  }

  update() {
    // Animation updates go here
  }

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }
}