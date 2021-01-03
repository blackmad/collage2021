import * as PIXI from 'pixi.js';
import { gui } from './gui';
import { ObjectFetcher } from './objectFetcher';

export class OneAtATimeLoader {
  loader = new PIXI.Loader();
  objectFetcher: ObjectFetcher;
  refreshRate: number;
  cb: (t: PIXI.Texture) => void;
  debug: boolean = false;

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
    gui.add(this, 'debug');
  }

  initialImageLoadHelper(loader: PIXI.Loader, url: string) {
    const texture = loader.resources[url].texture;
    this.cb(texture);
  }

  async displayOneObject() {
    const object = await this.objectFetcher.getObject();
    const url = ObjectFetcher.getImageUrl(object);

    if (this.debug) {
      var el = document.createElement('div');
      el.innerHTML = `<img src="${url}"/>${JSON.stringify(object)}`;
      document.body.appendChild(el);
    }

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
