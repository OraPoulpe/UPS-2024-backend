export class Video {
  readonly id: number;
  readonly fileId: string;
  readonly url: string;

  constructor(model: { id: number; fileId: string; url: string }) {
    this.id = model.id;
    this.fileId = model.fileId;
    this.url = model.url;
  }
}
