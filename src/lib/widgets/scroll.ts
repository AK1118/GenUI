import { BuildContext } from "../basic/elements";
import {
  SingleChildRenderObjectWidgetArguments,
  State,
  StatefulWidget,
  StatelessWidget,
  Widget,
} from "../basic/framework";
import { GlobalKey } from "../basic/key";
import { Size } from "../basic/rect";
import { Curve, Curves } from "../core/animation";
import { AxisDirection } from "../core/base-types";
import { ChangeNotifier } from "../core/change-notifier";
import { Duration } from "../core/duration";
import GenPlatformConfig from "../core/platform";
import { ScrollPhysics } from "../core/scroll-physics";
import { GestureDisposition } from "../gesture/arena-manager";
import { DownPointerEvent } from "../gesture/events";
import {
  GestureRecognizer,
  GestureRecognizerFactory,
} from "../gesture/recognizers/gesture-recognizer";
import PanDragGestureRecognizer from "../gesture/recognizers/pan-drag";
import Vector from "../math/vector";
import Painter from "../painting/painter";
import {
  ScrollPosition,
  ScrollPositionWithSingleContext,
} from "../render-object/viewport";
import { CustomPainter } from "../rendering/custom";
import { CustomPaint, GestureDetector, RawGestureDetector } from "./basic";

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

class ScrollbarPainter extends CustomPainter {
  private scrollbarWidth: number = 6;
  private _maxContentExtent: number = 0;
  private _viewportDimension: number = 0;
  private tractPosition: number = 0;
  private scrollbarCrossPosition:number=0;
  public thumbExtent: number = 0;
  set maxContentExtent(value: number) {
    this._maxContentExtent = value;
  }
  set viewportDimension(value: number) {
    this._viewportDimension = value;
  }
  render(painter: Painter, size: Size): void {
    this.scrollbarCrossPosition= size.width - this.scrollbarWidth;
    this.setThumbExtent();
    this.paintScrollbar(painter, size);
    this.paintTrack(painter, size);
  }
  private setThumbExtent(): void {
    this.thumbExtent= Math.max(
      (this._viewportDimension / this._maxContentExtent) *
        this._viewportDimension *
        (GenPlatformConfig.instance.screenHeight / this._viewportDimension),
      20
    );
  }
  private paintTrack(painter: Painter, size: Size): void {
    const paintX = this.scrollbarCrossPosition;
    const paintY = this.tractPosition;
    painter.fillStyle = "rgba(0,0,0)";
    painter.fillRect(paintX, paintY, this.scrollbarWidth, this.thumbExtent);
  }
  private paintScrollbar(painter: Painter, size: Size): void {
    const paintX = this.scrollbarCrossPosition;
    const paintY = 0;
    painter.fillStyle = "rgba(0,0,0,.12)";
    painter.fillRect(paintX, paintY, this.scrollbarWidth, size.height);
  }
  update(position: ScrollPosition) {
    this.tractPosition =
      (position.pixels / position.maxScrollExtent) *
      (position.viewportDimension - this.thumbExtent);
  }
  hitTestThumb(position:Vector):boolean{
    const globalPosition=localToGlobal(new Vector(this.scrollbarCrossPosition,this.tractPosition));
    position.sub(globalPosition);
    const thumbSize=new Size(this.scrollbarWidth,this.thumbExtent);
   return thumbSize.contains(position);
  }
  getTractScroll(delta:number):number{
    const pixels = ((this.tractPosition+delta) / (this._viewportDimension - this.thumbExtent)) * this._maxContentExtent;
    return pixels;
  }
}

interface ScrollBarArguments {
  controller: ScrollController;
}

class RawScrollBar extends StatefulWidget {
  public scrollController: ScrollController;
  public child: Widget;
  constructor(
    args: Partial<ScrollBarArguments & SingleChildRenderObjectWidgetArguments>
  ) {
    super(args?.key);
    this.scrollController = args?.controller;
    this.child = args?.child;
  }
  createState(): State {
    return new RawScrollBarState();
  }
}

const customPaintKey=new GlobalKey();

class RawScrollBarState extends State<RawScrollBar> {
  private painter: ScrollbarPainter;
  get scrollController(): ScrollController {
    return this.widget.scrollController;
  }
  
  public initState(): void {
    super.initState();
    this.painter = new ScrollbarPainter();
    const scrollController = this.scrollController;
    scrollController.addListener(() => {
      this.updateScrollbarPainter();
      this.painter.update(scrollController.position);
    });
  }
  get gestures() {
    const gestures: Map<
      any,
      GestureRecognizerFactory<GestureRecognizer>
    > = new Map();
    gestures.set(
      TractGestureRecognizer,
      new GestureRecognizerFactory(
        () => new TractGestureRecognizer(this.painter),
        (instance) => {
          instance.onPanStart = (event) => {
           // console.log("开始拖动",localToGlobal());
          };
          instance.onPanUpdate = (event) => {
            const newPosition=this.painter.getTractScroll(event.delta.y);
            this.scrollController.jumpTo(newPosition);
           console.log("更新拖动", newPosition);
          };
          instance.onPanEnd = (event) => {
          //  console.log("结束拖动");
          };
        }
      )
    );
    return gestures;
  }
  private updateScrollbarPainter() {
    const scrollController = this.scrollController;
    const position = scrollController.position;
    const painter=this.painter;
    painter.maxContentExtent=position.maxScrollExtent;
    painter.viewportDimension=position.viewportDimension;
  }
  
  build(context: BuildContext): Widget {
    return new RawGestureDetector({
      child: new CustomPaint({
        key:customPaintKey,
        foregroundPainter: this.painter,
        child: this.widget.child,
      }),
      gestures: this.gestures,
    });
  }
}

class TractGestureRecognizer extends PanDragGestureRecognizer {
  private painter:ScrollbarPainter; 
  constructor(painter:ScrollbarPainter) {
    super();
    this.painter=painter;
  }
  isAllowedPointer(event: DownPointerEvent): boolean {
    if(!this.painter.hitTestThumb(event.position)){
      console.log("不过");
      return;
    }
    console.log("过");
    return super.isAllowedPointer(event);
  }
  acceptGesture(pointer: number): void {
    
  }
  rejectGesture(pointer: number): void {}
}

export class ScrollBar extends StatelessWidget {
  private controller: ScrollController;
  private child: Widget;
  constructor(
    args: Partial<ScrollBarArguments & SingleChildRenderObjectWidgetArguments>
  ) {
    super(args.key);
    this.controller = args?.controller;
    this.child = args?.child;
  }
  build(context: BuildContext): Widget {
    return new RawScrollBar({
      controller: this.controller,
      child: this.child,
    });
  }
}



const localToGlobal=(position:Vector):Vector=>{
  return customPaintKey.currentElement.findRenderView().localToGlobal(position);
}