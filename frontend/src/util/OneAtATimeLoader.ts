import * as PIXI from 'pixi.js';
import { CocoCategories } from './coco-utils';
import { gui } from './gui';
import { ObjectFetcher, ObjectFragment } from './objectFetcher';
import { setTickerInterval } from './pixijs-utils';

export class OneAtATimeLoader {
  loader = new PIXI.Loader();
  objectFetcher: ObjectFetcher;
  refreshRate: number;
  cb: (t: PIXI.Texture, object?: ObjectFragment) => void;
  debug: boolean = false;
  app: PIXI.Application;
  label: string = '';

  constructor({
    app,
    refreshRate,
    cb,
  }: {
    app: PIXI.Application;
    refreshRate: number;
    cb: (t: PIXI.Texture, object?: ObjectFragment) => void;
  }) {
    this.app = app;
    this.refreshRate = refreshRate;
    this.cb = cb;

    this.label = new URLSearchParams(window.location.search).get('label') || '';
    this.objectFetcher = new ObjectFetcher({ label: this.label });

    gui.add(this, 'debug');
    gui
      .add(this, 'label')
      .options(['', ...CocoCategories])
      .onChange((newLabel) => {
        this.objectFetcher = new ObjectFetcher({ label: newLabel });
      });
  }

  initialImageLoadHelper(loader: PIXI.Loader, url: string) {
    const texture = loader.resources[url].texture;
    this.cb(texture, this.objectFetcher.getObjectFromUrl(url));
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
      setTickerInterval(
        this.app,
        () => {
          this.displayOneObject();
        },
        this.refreshRate
      );
    });
  }
}
