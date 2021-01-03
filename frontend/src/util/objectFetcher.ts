import * as _ from 'lodash';

interface Object {
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

export class ObjectFetcher {
  newestSeen: number = 0;
  oldestSeen: number = Number.MAX_VALUE;
  objects: Object[] = [];
  label: string;
  inFlightRequest: Promise<void> | undefined;

  constructor({ label }: { label?: string }) {
    this.label = label;
  }

  async getObject() {
    if (this.objects.length === 0) {
      await this.addToQueue();
      console.log('done waiting');
    } else if (this.objects.length < 5) {
      this.addToQueue();
    }

    const object = this.objects.pop();
    const url = `https://firebasestorage.googleapis.com/v0/b/collage2021-e8687.appspot.com/o/${encodeURIComponent(
      object.path
    )}?alt=media`;
    return url;
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
      resolve();
      this.inFlightRequest = undefined;
    });

    console.log('just set IFR to', this.inFlightRequest);

    return this.inFlightRequest;
  }
}
