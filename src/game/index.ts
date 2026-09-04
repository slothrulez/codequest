import Phaser from 'phaser';
import type { RepoData } from '../analyzer/repo-analyzer';
import { WorldGenerator } from './world-generator';
import { Player } from './player';
import { NPCManager } from './npc-manager';
import { DialogueManager } from './dialogue-manager';

declare global {
  interface Window {
    repoData: RepoData;
    workspaceRoot: string;
    vscode: any;
  }
}

class CodeQuestScene extends Phaser.Scene {
  private player!: Player;
  private npcManager!: NPCManager;
  private dialogueManager!: DialogueManager;
  private worldGenerator!: WorldGenerator;
  private tilemap!: Phaser.Tilemaps.Tilemap;
  private isDialogueOpen = false;

  constructor() {
    super('CodeQuestScene');
  }

  preload() {
  }

  create() {
    const repoData = window.repoData;

    this.worldGenerator = new WorldGenerator(this, repoData);
    const worldData = this.worldGenerator.generate();

    this.tilemap = this.make.tilemap({
      width: worldData.width,
      height: worldData.height,
      tileWidth: 32,
      tileHeight: 32
    });

    this.setupTilemap(worldData);

    this.player = new Player(this, worldData.playerStart.x, worldData.playerStart.y);
    this.npcManager = new NPCManager(this, worldData.npcs);
    this.dialogueManager = new DialogueManager(this);

    this.setupInput();

    this.cameras.main.setBounds(0, 0, worldData.width * 32, worldData.height * 32);
    this.cameras.main.startFollow(this.player.sprite);
    this.physics.world.setBounds(0, 0, worldData.width * 32, worldData.height * 32);

    this.physics.add.overlap(this.player.sprite, this.npcManager.getNPCs(), () => {
      this.handleNPCInteraction();
    });
  }

  private setupTilemap(worldData: WorldData) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#7cb342';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#558b2f';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillRect(16, 16, 16, 16);

    const key = 'tiles';
    this.textures.addCanvas(key, canvas);
    const tileset = this.tilemap.addTilesetImage(key);

    if (!tileset) {
      throw new Error('Failed to add tileset image');
    }

    const layer = this.tilemap.createLayer(0, tileset, 0, 0);
    if (layer) {
      layer.setCollisionByProperty({ collides: true });
      this.physics.world.enable(layer);
    }

    for (let y = 0; y < worldData.height; y++) {
      for (let x = 0; x < worldData.width; x++) {
        this.tilemap.putTileAt(0, x, y, true, 0);
      }
    }
  }

  private setupInput() {
    const keys = this.input.keyboard?.addKeys({
      w: 'W',
      a: 'A',
      s: 'S',
      d: 'D',
      up: 'UP',
      down: 'DOWN',
      left: 'LEFT',
      right: 'RIGHT',
      e: 'E'
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    this.events.on('update', () => {
      if (!keys) return;
      
      const moveX = (keys.d.isDown || keys.right.isDown ? 1 : 0) - (keys.a.isDown || keys.left.isDown ? 1 : 0);
      const moveY = (keys.s.isDown || keys.down.isDown ? 1 : 0) - (keys.w.isDown || keys.up.isDown ? 1 : 0);

      this.player.move(moveX, moveY);

      if (Phaser.Input.Keyboard.JustDown(keys.e)) {
        this.handleNPCInteraction();
      }
    });
  }

  private handleNPCInteraction() {
    if (this.isDialogueOpen) return;

    const nearby = this.physics.overlap(this.player.sprite, this.npcManager.getNPCs());
    if (nearby) {
      const npc = this.npcManager.getNearby(this.player.sprite);
      if (npc) {
        this.isDialogueOpen = true;
        this.dialogueManager.show(npc, () => {
          this.isDialogueOpen = false;
        });
      }
    }
  }

  update() {
    this.player.update();
  }
}

interface WorldData {
  width: number;
  height: number;
  playerStart: { x: number; y: number };
  npcs: NPCData[];
}

interface NPCData {
  x: number;
  y: number;
  name: string;
  type: 'folder' | 'file' | 'elder' | 'shrine';
  data?: any;
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 960,
  height: 640,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: CodeQuestScene,
  render: {
    pixelArt: true,
    antialias: false
  }
};

new Phaser.Game(config);