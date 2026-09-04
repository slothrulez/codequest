import Phaser from 'phaser';
import type { NPCData } from './world-generator';

export class NPCManager {
  private scene: Phaser.Scene;
  private npcs: Map<Phaser.Physics.Arcade.Sprite, NPCData> = new Map();
  private npcGroup!: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, npcData: NPCData[]) {
    this.scene = scene;
    this.npcGroup = scene.physics.add.group();
    this.createNPCs(npcData);
  }

  private createNPCs(npcData: NPCData[]) {
    for (const data of npcData) {
      this.createNPC(data);
    }
  }

  private createNPC(data: NPCData) {
    const sprite = this.scene.physics.add.sprite(data.x, data.y, '');
    this.drawNPC(sprite, data);
    sprite.setCollideWorldBounds(true);
    sprite.setImmovable(true);
    this.npcGroup.add(sprite);
    this.npcs.set(sprite, data);
  }

  private drawNPC(sprite: Phaser.Physics.Arcade.Sprite, data: NPCData) {
    const graphics = this.scene.make.graphics({ x: 0, y: 0 });

    if (data.type === 'elder') {
      graphics.fillStyle(0x8b4513, 1);
      graphics.fillRect(4, 2, 8, 4);
      graphics.fillStyle(0x4a4a4a, 1);
      graphics.fillRect(2, 6, 12, 8);
      graphics.fillStyle(0xffd700, 1);
      graphics.fillCircle(8, 4, 2);
    } else if (data.type === 'shrine') {
      graphics.fillStyle(0x8b7355, 1);
      graphics.fillRect(3, 4, 10, 12);
      graphics.fillStyle(0xff6347, 1);
      graphics.fillTriangleShape(new Phaser.Geom.Triangle(3, 4, 13, 4, 8, 0));
    } else if (data.type === 'folder') {
      graphics.fillStyle(0xdaa520, 1);
      graphics.fillRect(2, 8, 12, 8);
      graphics.fillStyle(0xff6347, 1);
      graphics.fillTriangleShape(new Phaser.Geom.Triangle(2, 8, 14, 8, 8, 2));
    } else {
      graphics.fillStyle(0x4169e1, 1);
      graphics.fillRect(4, 6, 8, 10);
      graphics.fillStyle(0xffffff, 1);
      graphics.fillRect(6, 8, 4, 2);
    }

    graphics.generateTexture(`npc-${data.name}`, 16, 16);
    graphics.destroy();

    sprite.setTexture(`npc-${data.name}`);
  }

  getNPCs() {
    return this.npcGroup;
  }

  getNearby(sprite: Phaser.Physics.Arcade.Sprite): NPCData | undefined {
    for (const [npcSprite, data] of this.npcs) {
      const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, npcSprite.x, npcSprite.y);
      if (distance < 80) {
        return data;
      }
    }
    return undefined;
  }
}