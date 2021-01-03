import * as _ from 'lodash';

interface ObjectFragment {
  path: string;
  score: number;
  added_at: {
    _seconds: number;
  };
  taken_at: {
    _seconds: number;
  };
  label: string;
  url: string;
}

const INIT_NEWEST = 0;
const INIT_OLDEST = Number.MAX_VALUE;

export class ObjectFetcher {
  newestSeen: number = INIT_NEWEST;
  oldestSeen: number = INIT_OLDEST;
  objects: ObjectFragment[] = [];
  label: string;
  inFlightRequest: Promise<void> | undefined;

  constructor({ label }: { label?: string }) {
    this.label = label;
  }

  static getImageUrl(object: ObjectFragment): string {
    const url = `https://firebasestorage.googleapis.com/v0/b/collage2021-e8687.appspot.com/o/${encodeURIComponent(
      object.path
    )}?alt=media`;
    return url;
  }

  async getObject(): Promise<ObjectFragment> {
    if (this.objects.length === 0) {
      await this.addToQueue();
      console.log('done waiting');
    } else if (this.objects.length < 5) {
      this.addToQueue();
    }

    return this.objects.pop();
  }

  async addToQueue() {
    console.log('IFR', this.inFlightRequest);
    if (this.inFlightRequest) {
      return this.inFlightRequest;
    }
    const baseUrl =
      'https://us-central1-collage2021-e8687.cloudfunctions.net/objects';
    const params: Record<string, string> = {};
    if (this.newestSeen) {
      params.newestSeen = this.newestSeen?.toString();
    }
    if (this.oldestSeen) {
      params.oldestSeen = this.oldestSeen?.toString();
    }
    if (this.label) {
      params.label = this.label?.toString();
    }

    params.limit = '10';

    const fullUrl = baseUrl + '?' + new URLSearchParams(params).toString();
    console.log('fetching objects', params, fullUrl);

    this.inFlightRequest = new Promise(async (resolve, reject) => {
      const response = await fetch(fullUrl);
      const json = await response.json();

      this.objects = [...this.objects, ...json.objects];
      console.log(this.objects);

      if (this.objects.length === 0) {
        // empty response, let's loop back to start
        this.newestSeen = INIT_NEWEST;
        this.oldestSeen = INIT_OLDEST;
      } else {
        this.newestSeen = Math.max(
          this.newestSeen,
          _.max(this.objects.map((o) => o.taken_at._seconds))
        );
        console.log(_.max(this.objects.map((o) => o.taken_at._seconds)));
        console.log(this.newestSeen);

        this.oldestSeen = Math.min(
          this.oldestSeen,
          _.min(this.objects.map((o) => o.taken_at._seconds))
        );
      }
      resolve();
      this.inFlightRequest = undefined;
    });

    console.log('just set IFR to', this.inFlightRequest);

    return this.inFlightRequest;
  }
}
