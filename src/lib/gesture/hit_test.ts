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

/**
 * @HitTestResult 内维护一个Map<HitTestTarget, HitTestEntry>，该Map用于存储命中测试的结果，且每个target不允许被命中多次
 */
export class HitTestResult {
  private _path:Map<HitTestTarget,HitTestEntry> = new Map();
  get path(): HitTestEntry[] {
    return [...this._path.values()];
  }
  add(entry: HitTestEntry) {
    const target=entry.target;
    if(!this._path.has(target)){
      this._path.set(target,entry);
    }
  }
}
