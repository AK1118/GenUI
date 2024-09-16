import { BuildContext } from "../basic/elements";
import {
  SingleChildRenderObjectWidgetArguments,
  State,
  StatefulWidget,
  StatelessWidget,
  Widget,
} from "../basic/framework";
import { Curve, Curves } from "../core/animation";
import { AxisDirection } from "../core/base-types";
import { ChangeNotifier } from "../core/change-notifier";
import { Duration } from "../core/duration";
import { ScrollPhysics } from "../core/scroll-physics";
import {
  ScrollPosition,
  ScrollPositionWithSingleContext,
} from "../render-object/viewport";
import { GestureDetector, RawGestureDetector } from "./basic";

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
        "ScrollController can only be used with one ScrollPosition at a time." +
          this.positions.length
      );
    }
    return this.positions[0];
  }
  animateTo(
    offset: number,
    duration: Duration = Duration.zero,
    curve: Curve = Curves.ease
  ): Promise<void> {
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
    console.log("添加");
  }
  public detach(position: ScrollPosition) {
    if (!this.positions.includes(position)) return;
    position.removeListener(this.notifyListeners.bind(this));
    this.positions.splice(this.positions.indexOf(position), 1);
    console.log("删除");
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

interface ScrollBarArguments {
  scrollController: ScrollController;
}

class RawScrollBar extends StatefulWidget {
  public scrollController: ScrollController;
  public child: Widget;
  constructor(args: Partial<ScrollBarArguments & SingleChildRenderObjectWidgetArguments>) {
    super();
    this.scrollController = args?.scrollController;
    this.child=args?.child;
  }
  createState(): State {
    return new RawScrollBarState();
  }
}

class RawScrollBarState extends State<RawScrollBar> {
  public initState(): void {}
  build(context: BuildContext): Widget {
    return new RawGestureDetector({
      child:this.widget.child,
    });
  }
}

export class ScrollBar extends StatelessWidget {
  private scrollController: ScrollController;
  private child: Widget;
  constructor(
    args: Partial<ScrollBarArguments & SingleChildRenderObjectWidgetArguments>
  ) {
    super(args.key);
    this.scrollController = args?.scrollController;
    this.child = args?.child;
  }
  build(context: BuildContext): Widget {
    return new RawScrollBar({
      scrollController: this.scrollController,
      child: this.child,
    });
  }
}
