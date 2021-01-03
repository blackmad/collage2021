import * as PIXI from 'pixi.js';
import { ObjectFetcher } from './objectFetcher';

export class OneAtATimeLoader {
  loader = new PIXI.Loader();
  objectFetcher: ObjectFetcher;
  refreshRate: number;
  cb: (t: PIXI.Texture) => void;

  constructor({
    refreshRate,
    cb,
    label,
  }: {
    refreshRate: number;
    cb: (t: PIXI.Texture) => void;
    label?: string;
  }) {
    this.refreshRate = refreshRate;
    this.cb = cb;
    this.objectFetcher = new ObjectFetcher({ label });
  }

  initialImageLoadHelper(loader: PIXI.Loader, url: string) {
    const texture = loader.resources[url].texture;
    const container = this.cb(texture);
  }

  async displayOneObject() {
    const url = await this.objectFetcher.getObject();
    console.log('loading: ', url);

    if (this.loader.resources[url]) {
      this.initialImageLoadHelper(this.loader, url);
    } else {
      this.loader.add(url);
      this.loader.load();
    }
  }

  start() {
    const initialImageLoad = (loader: PIXI.Loader, resource: any) => {
      this.initialImageLoadHelper(loader, resource.name);
    };

    this.loader.onLoad.add(initialImageLoad);

    this.objectFetcher.addToQueue().then(() => {
      this.displayOneObject();
      setInterval(() => {
        this.displayOneObject();
      }, this.refreshRate);
    });
  }
}
