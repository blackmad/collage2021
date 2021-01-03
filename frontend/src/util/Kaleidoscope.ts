import * as PIXI from 'pixi.js';
import { gui } from './gui';

export class Kaleidoscope {
  HALF_PI: number;
  TWO_PI: number;
  pixiApp: any;
  offsetRotation: number;
  offsetScale: number;
  offsetX: number;
  offsetY: number;
  radius: number;
  slices: number;
  zoom: number;
  posX: number;
  posY: number;
  step: number;
  arcs: any[];
  spriteTiles: any[];
  containers: any[];
  image: any;
  count: number;
  interactiveMode: boolean;
  mouseX: number;
  mouseY: number;
  texture: PIXI.Texture;
  params = {
    maskOn: true,
    oneSlice: false,
  };
  mainContainer: PIXI.Container;
  constructor({
    app,
    texture,
  }: {
    app: PIXI.Application;
    texture: PIXI.Texture;
  }) {
    this.HALF_PI = Math.PI / 2;
    this.TWO_PI = Math.PI * 2;
    this.pixiApp = app;
    this.offsetRotation = 0.0;
    this.offsetScale = 1.0;
    this.offsetX = 0.0;
    this.offsetY = 0.0;
    this.radius = window.innerWidth / 2;
    this.zoom = 1.0;
    this.posX = window.innerWidth / 2;
    this.posY = window.innerHeight / 2;
    this.arcs = [];
    this.spriteTiles = [];
    this.containers = [];
    this.texture = texture;
    this.count = 0;
    this.interactiveMode = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.slices = 8;

    this.mainContainer = new PIXI.Container();

    const redraw = () => {
      this.mainContainer.destroy();
      this.mainContainer = new PIXI.Container();
      this.draw();
    };

    gui.add(this, 'slices', 2, 20, 2).onChange(redraw);
    gui.add(this.params, 'maskOn').onChange(redraw);
    gui.add(this.params, 'oneSlice').onChange(redraw);
  }

  draw() {
    const { mainContainer } = this;

    this.step = this.TWO_PI / this.slices;

    mainContainer.interactive = true;
    (mainContainer as any).mousemove = (e: {
      data: { global: { x: any; y: any } };
    }) => {
      const { x, y } = e.data.global;
      this.mouseX = x;
      this.mouseY = y;
    };
    const slicesToDraw = this.params.oneSlice ? 1 : this.slices;
    for (let i = 0; i < slicesToDraw; i++) {
      const arc = new PIXI.Graphics();
      // was 3000 for both
      const spriteTileArc = new PIXI.TilingSprite(this.texture, 1500, 1600);
      const currentStep = this.step * i + 1;
      arc.beginFill(0);
      arc.moveTo(this.posX, this.posY);
      arc.arc(
        this.posX,
        this.posY,
        this.radius * 1.3,
        -0.5 * this.step,
        0.5 * this.step
      );
      arc.endFill();
      arc.lineStyle(5, 0xff0000);

      if (this.params.maskOn) {
        spriteTileArc.mask = arc;
      }

      const container = new PIXI.Container();
      container.addChild(arc);
      container.addChild(spriteTileArc);
      container.pivot.x = this.posX;
      container.pivot.y = this.posY;
      container.rotation = -currentStep;
      container.scale.x = i % 2 ? 1 : -1;
      this.spriteTiles.push(spriteTileArc);
      this.arcs.push(arc);
      this.containers.push(container);
      mainContainer.addChild(container);
    }
    mainContainer.x = this.posX;
    mainContainer.y = this.posY;
    this.pixiApp.stage.addChild(mainContainer);

    this.pixiApp.ticker.add(() => {
      this.count += this.interactiveMode ? 0.5 : 0.005;
      for (let i = 0; i < this.spriteTiles.length; i++) {
        if (this.interactiveMode) {
          // this.spriteTiles[i].tilePosition.x = this.mouseX + Math.sin(this.count);
          this.spriteTiles[i].tilePosition.x = this.mouseX + this.count;
          // this.spriteTiles[i].tilePosition.y = this.mouseY + Math.cos(this.count);
          this.spriteTiles[i].tilePosition.y = this.mouseY + this.count;
        } else {
          //   this.spriteTiles[i].tilePosition.x += Math.sin(this.count);
          //   this.spriteTiles[i].tilePosition.y += Math.cos(this.count);
        }
      }
    });
  }

  toggleInteractiveMode() {
    console.log('toggleinteractive', this.interactiveMode);
    this.interactiveMode = !this.interactiveMode;
  }
}
