import { PointerEvent } from "./events";

export class HitTestEntry<T extends HitTestTarget=HitTestTarget>{
  target: T;
  constructor(target: T) {
    this.target = target;
  }
}

export interface HitTestTarget {
  handleEvent(event: PointerEvent, entry: HitTestEntry): void;
}

export class HitTestResult {
  private _path: HitTestEntry[] = [];
  get path(): HitTestEntry[] {
    return this._path;
  }
  add(entry: HitTestEntry) {
    this.path.push(entry);
  }
}
