import * as PIXI from 'pixi.js';
import { CocoCategories } from './coco-utils';
import { gui } from './gui';
import { ObjectFetcher, ObjectFragment } from './objectFetcher';
import { setTickerTimeout } from './pixijs-utils';

export class OneAtATimeLoader {
  loader = new PIXI.Loader();
  objectFetcher: ObjectFetcher;
  refreshRate: number;
  cb: (t: PIXI.Texture, object: ObjectFragment, , done: () => void) => void;
  debug: boolean = false;
  app: PIXI.Application;
  label: string = '';
  excludePeople: boolean = true;

  constructor({
    app,
    initialRefreshRate,
    cb,
  }: {
    app: PIXI.Application;
    initialRefreshRate: number;
    cb: (t: PIXI.Texture, object: ObjectFragment, done: () => void) => void;
  }) {
    this.app = app;
    this.refreshRate = initialRefreshRate;

    gui.add(this, 'refreshRate');

    this.cb = cb;

    this.label =
      new URLSearchParams(
        window.location.hash.substring(1) || window.location.search.substring(1)
      ).get('label') || '';

    const createObjectFetcher = () => {
      this.objectFetcher = new ObjectFetcher({
        label: this.label,
        exclude: this.excludePeople ? 'person' : undefined,
      });
    };

    createObjectFetcher();

    gui.add(this, 'debug');

    gui.add(this, 'excludePeople').onChange((value) => {
      this.excludePeople = value;
      createObjectFetcher();
    });

    gui.add(this, 'label', ['', ...CocoCategories]).onChange((newLabel) => {
      this.label = newLabel;
      createObjectFetcher();
    });
  }

  initialImageLoadHelper(loader: PIXI.Loader, url: string) {
    const texture = loader.resources[url].texture;
    if (!texture || !texture.baseTexture || !texture.frame) {
      console.error(
        'failed to load texture for ',
        url,
        !texture.baseTexture,
        !texture.frame
      );
      return;
    }
    this.cb(texture, this.objectFetcher.getObjectFromUrl(url), () => {
      loader.destroy();
    });
  }

  async displayOneObject() {
    const object = await this.objectFetcher.getObject();
    const url = ObjectFetcher.getImageUrl(object);

    if (this.debug) {
      var el = document.createElement('div');
      el.innerHTML = `<img src="${url}"/>${JSON.stringify(object)}`;
      document.body.appendChild(el);
    }

    console.log(`loading: ${url} - ${object.label}`);

    const loader = new PIXI.Loader();

    loader.add(url);
    loader.load();

    const initialImageLoad = (loader: PIXI.Loader, resource: any) => {
      this.initialImageLoadHelper(loader, resource.name);
    };

    loader.onLoad.add(initialImageLoad);
    loader.onError.add((e) => {
      console.log('loader error');
      console.log(e);
    }); // called once per errored file
  }

  start() {
    this.objectFetcher.addToQueue().then(() => {
      this.displayOneObject();

      const doRefresh = () => {
        setTickerTimeout(this.app, this.refreshRate, () => {
          this.displayOneObject();
          doRefresh();
        });
      };

      doRefresh();
    });
  }
}
