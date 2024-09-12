import { Curve, Curves } from "../core/animation";
import { AxisDirection } from "../core/base-types";
import { ChangeNotifier } from "../core/change-notifier";
import { Duration } from "../core/duration";
import { ScrollPhysics } from "../core/scroll-physics";
import {
  ScrollPosition,
  ScrollPositionWithSingleContext,
} from "../render-object/viewport";

interface CreateScrollPositionArgs {
  initialScrollOffset: number;
  physics: ScrollPhysics;
  axisDirection: AxisDirection;
}

export class ScrollController extends ChangeNotifier {
  private initialScrollOffset: number = 0;
  private positions: Array<ScrollPosition> = new Array<ScrollPosition>();
  get position(): ScrollPosition {
    if (this.positions.length > 1 || this.positions.length == 0) {
      throw new Error(
        "ScrollController can only be used with one ScrollPosition at a time."+this.positions.length
      );
    }
    return this.positions[0];
  }
  animateTo(offset: number, duration: Duration=Duration.zero, curve: Curve=Curves.ease): Promise<void> {
    return new Promise(async (resolve) => {
      for (let position of this.positions) {
        await position.animateTo(offset, duration, curve);
      }
      resolve();
    });
  }
  jumpTo(offset: number) {
    this.positions.forEach((position) => position.jumpTo(offset));
  }
  public attach(position: ScrollPosition) {
    if (this.positions.includes(position)) return;
    this.positions.push(position);
    position.addListener(this.notifyListeners.bind(this));
    console.log("添加")
  }
  public detach(position: ScrollPosition) {
    if (!this.positions.includes(position)) return;
    position.removeListener(this.notifyListeners.bind(this));
    this.positions.splice(this.positions.indexOf(position), 1);
    console.log("删除")
  }
  public createScrollPosition(
    physics: ScrollPhysics,
    axisDirection: AxisDirection
  ) {
    return new ScrollPositionWithSingleContext({
      physics: physics,
      axisDirection: axisDirection,
    });
  }
  get offset(): number {
    return this.position.pixels;
  }
}
