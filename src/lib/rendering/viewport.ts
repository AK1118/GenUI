import { Offset } from "../basic/rect";
import { ChangeNotifier } from "../core/change-notifier";
import { AxisDirection, ScrollDirection } from "../render-object/slivers";

export abstract class ViewPortOffset extends ChangeNotifier {
  public scrollDirection: ScrollDirection = ScrollDirection.idle;
  public axisDirection: AxisDirection = AxisDirection.down;
  private _pixels: number = 0;
  get pixels(): number {
    return this._pixels;
  }
  set pixels(value: number) {
    this._pixels = value;
    this.notifyListeners();
  }
  private _offset: Offset = Offset.zero;
  get offset(): Offset {
    return this._offset;
  }
  abstract get userScrollDirection(): ScrollDirection;
  set offset(value: Offset) {
    this._offset = value;
    this.notifyListeners();
  }
  abstract applyViewportDimension(viewportDimension: number): boolean;
  abstract applyContentDimension(
    minDimension: number,
    maxDimension: number
  ): boolean;
}

export class ScrollPosition extends ViewPortOffset {
  get userScrollDirection(): ScrollDirection {
    return ScrollDirection.forward;
  }
  applyViewportDimension(viewportDimension: number): boolean {
    return true;
  }
  applyContentDimension(minDimension: number, maxDimension: number): boolean {
    return true;
  }
  // ...
}
