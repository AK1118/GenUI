import { BuildContext } from "../basic/elements";
import {
  SingleChildRenderObjectWidgetArguments,
  State,
  StatefulWidget,
  StatelessWidget,
  Widget,
} from "../basic/framework";
import { GlobalKey, Key, SimpleKey } from "../basic/key";
import Rect, { Size } from "../basic/rect";
import { AnimationController, Curve, Curves } from "../core/animation";
import { Axis, AxisDirection } from "../core/base-types";
import { ChangeNotifier } from "../core/change-notifier";
import { Duration } from "../core/duration";
import {GenPlatformConfig} from "../core/platform";
import { ScrollPhysics } from "../core/scroll-physics";
import { GestureDisposition } from "../gesture/arena-manager";
import { DownPointerEvent } from "../gesture/events";
import {
  GestureRecognizer,
  GestureRecognizerFactory,
} from "../gesture/recognizers/gesture-recognizer";
import LongPressGestureRecognizer from "../gesture/recognizers/long-press";
import PanDragGestureRecognizer from "../gesture/recognizers/pan-drag";
import { clamp } from "../math/math";
import Vector from "../math/vector";
import Painter from "../painting/painter";
import { axisDirectionToAxis } from "../render-object/slivers";
import {
  ScrollPosition,
  ScrollPositionWithSingleContext,
} from "../render-object/viewport";
import { CustomPainter } from "../rendering/custom";
import Timer from "../utils/timer";
import {
  ClipPath,
  ClipRect,
  CustomPaint,
  GestureDetector,
  RawGestureDetector,
} from "./basic";

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
  }
  public detach(position: ScrollPosition) {
    if (!this.positions.includes(position)) return;
    position.removeListener(this.notifyListeners.bind(this));
    this.positions.splice(this.positions.indexOf(position), 1);
  }
  public createScrollPosition(
    physics: ScrollPhysics,
    axisDirection: AxisDirection,
    initPixels?: number
  ) {
    return new ScrollPositionWithSingleContext({
      physics: physics,
      axisDirection: axisDirection,
      initPixels: initPixels,
    });
  }
  get offset(): number {
    return this.position.pixels;
  }
}

class ScrollbarPainter extends CustomPainter {
  private key:SimpleKey = new SimpleKey();
  private _scrollbarWidth: number = 6;
  private _maxContentExtent: number = 0;
  private _viewportDimension: number = 0;
  private _thumbMainAxisPosition: number = 0;
  private _thumbExtent: number = 0;
  private _thumbOpacity: number = 1;
  private _scrollAxis: Axis;
  private _thumbRect: Rect = Rect.zero;
  private _trackRect: Rect = Rect.zero;
  private _pixels: number = 0;
  set maxContentExtent(value: number) {
    if(this._maxContentExtent === value) return;
    this._maxContentExtent = value;
    this.setThumbExtent();
  }
  get maxContentExtent():number{
    return this._maxContentExtent;
  }
  set viewportDimension(value: number) {
    if(this._viewportDimension === value)return;
    this._viewportDimension = value;
    this.setThumbExtent();
  }
  set thumbOpacity(value: number) {
    this._thumbOpacity = value;
  }
  set scrollAxis(value: Axis) {
    this._scrollAxis = value;
  }
  get thumbRect(): Rect {
    return this._thumbRect;
  }
  get trackRect(): Rect {
    return this._trackRect;
  }
  set scrollbarWidth(value: number) {
    this._scrollbarWidth = value ?? this._scrollbarWidth;
  }
  get overflow(): boolean {
    return this._pixels > this._maxContentExtent;
  }
  get thumbMainAxisPosition():number{
    return this._thumbMainAxisPosition;
  }
  render(painter: Painter, size: Size): void {
    this.setThumbExtent();
    this.paintScrollBar(painter, size);
  }
  private setThumbExtent(): void {
    // 确保 _thumbExtent 动态计算基于最大内容高度和视口尺寸
    if (this._maxContentExtent > 0) {
      this._thumbExtent = Math.max(
        (this._viewportDimension / this._maxContentExtent) * this._viewportDimension, 20
      );
    } else {
      // 当内容高度为 0 时，隐藏滚动条
      this._thumbExtent = 0;
    }
  }
  private paintScrollBar(painter: Painter, size: Size) {
    let horizontal = 0,
      vertical = 0,
      width = 0,
      height = 0;
    //Thumb
    //滚动横向布局时
    if (this._scrollAxis === Axis.horizontal) {
      horizontal = this._thumbMainAxisPosition;
      vertical = size.height - this._scrollbarWidth;
      width = this._thumbExtent;
      height = this._scrollbarWidth;
    } else if (this._scrollAxis === Axis.vertical) {
      //滚动纵向布局时
      horizontal = size.width - this._scrollbarWidth;
      vertical = this._thumbMainAxisPosition;
      width = this._scrollbarWidth;
      height = Math.max(6, this._thumbExtent);
    }
    this._thumbRect.update({
      x: horizontal,
      y: vertical,
      width: width,
      height: height,
    });

    //Track
    //滚动横向布局时
    if (this._scrollAxis === Axis.horizontal) {
      horizontal = 0;
      vertical = size.height - this._scrollbarWidth;
      width = size.width;
      height = this._scrollbarWidth;
    } else if (this._scrollAxis === Axis.vertical) {
      //滚动纵向布局时
      horizontal = size.width - this._scrollbarWidth;
      vertical = 0;
      width = this._scrollbarWidth;
      height = size.height;
    }
    this._trackRect.update({
      x: horizontal,
      y: vertical,
      width: width,
      height: height,
    });

    this.paintTrack(painter, size);
    this.paintThumb(painter, size);
  }
  protected paintThumb(painter: Painter, size: Size): void {
    let { x, y, width, height } = this._thumbRect;
    painter.fillStyle = `rgba(127,127,127,${this._thumbOpacity})`;
    painter.roundRect(x, y, width, height, this._scrollbarWidth);
    painter.fill();
  }
  protected paintTrack(painter: Painter, size: Size): void {
    painter.fillStyle = `rgba(0,0,0,${0.12 * this._thumbOpacity})`;
    const { x, y, width, height } = this._trackRect;
    painter.fillRect(x, y, width, height);
  }
  update(position: ScrollPosition) {
    // 重新设置 pixels 和 axis
    this._pixels = position.pixels;
    this.scrollAxis = axisDirectionToAxis(position.axisDirection);
  
    // 确保每次内容变化时重新计算 thumb 和 track
    this.setThumbExtent();
  
    // 重新计算 thumb 的位置，基于内容滚动的比例
    this._thumbMainAxisPosition = 
        (this._pixels / this._maxContentExtent) *
        (this._viewportDimension - this._thumbExtent);
    
    // 通知需要重绘
    // notifyListeners();
  }
  hitTestThumb(position: Vector): boolean {
    const globalPosition = localToGlobal(
      new Vector(this._thumbRect.x, this._thumbRect.y)
    );
    /**
     * 当前的thumb坐标转换为全局坐标，此处不需要矩阵计算 @localToGlobal 由矩阵计算得出最终屏幕像素坐标，
     * 简单的差值计算即可
     */
    position.sub(globalPosition);
    return this._thumbRect.size.contains(position);
  }
  getTractScroll(delta: number): number {
    const pixels = clamp(
      ((this._thumbMainAxisPosition + delta) /
        (this._viewportDimension - this._thumbExtent)) *
        this._maxContentExtent,
      0,
      this._maxContentExtent
    );
    return pixels;
  }
}

interface ScrollBarArguments {
  controller: ScrollController;
  scrollbarPainter: ScrollbarPainter;
  scrollbarWidth: number;
}

class RawScrollBar extends StatefulWidget {
  public scrollController: ScrollController;
  public child: Widget;
  public scrollbarPainter: ScrollbarPainter;
  public scrollbarWidth: number;
  constructor(
    args: Partial<ScrollBarArguments & SingleChildRenderObjectWidgetArguments>
  ) {
    super(args?.key);
    this.scrollController = args?.controller;
    this.child = args?.child;
    this.scrollbarPainter ??= args?.scrollbarPainter;
    this.scrollbarWidth = args?.scrollbarWidth ?? 6;
  }
  createState(): State {
    return new RawScrollBarState();
  }
}

const customPaintKey = new GlobalKey();

class RawScrollBarState extends State<RawScrollBar> {
  /**
   * 是否有按住Thumb滑块
   */
  private _pressThumb: boolean = false;
  private _painter:ScrollbarPainter=new ScrollbarPainter();
  private get painter(): ScrollbarPainter {
    return this.widget.scrollbarPainter??this._painter;
  }
  get scrollController(): ScrollController {
    return this.widget.scrollController;
  }
  private faceOutTimer: Timer;
  private scrollPainterAnimateController: AnimationController;
  public initState(): void {
    super.initState();
    this.scrollPainterAnimateController = new AnimationController({
      duration: new Duration({ milliseconds: 300 }),
      curve: Curves.easeInSine,
    });
    this.faceOutTimer = new Timer(() => {
      if (!this._pressThumb) {
        this.scrollPainterAnimateController.reverse();
      }
    }, new Duration({ milliseconds: 500 }));
    const scrollController = this.scrollController;
    scrollController.addListener(() => {
      this.handleThumbEndTimer();
      if (this.scrollPainterAnimateController.isDismissed) {
        this.scrollPainterAnimateController.forward();
      }
      this.updateScrollbarPainter();
      this.painter.update(scrollController.position);
    });
    this.scrollPainterAnimateController.addListener(() => {
      this.updateScrollbarPainter();
      this.setState(() => {});
    });
  }
  /**
   * 手指按住滑块时，Thumb不会消失，直至手指抬起
   * 滑动滚动条时会自动显示滑块，但在 500ms 后自动隐藏（在手指没有按住滑块时才会自动启动）
   */
  private handleThumbEndTimer() {
    this.faceOutTimer?.cancel();
    this.faceOutTimer.reStart();
  }
  private handleThumbStart() {
    this._pressThumb = true;
    if (this.scrollPainterAnimateController.isForward) {
      this.scrollPainterAnimateController?.stop();
    }
  }
  private handleThumbUpdate(delta: number) {
    const newPosition = this.painter.getTractScroll(delta);
    this.scrollController.jumpTo(newPosition);
  }
  private handleThumbEnd() {
    this._pressThumb = false;
    this.handleThumbEndTimer();
  }

  get gestures() {
    const gestures: Map<
      any,
      GestureRecognizerFactory<GestureRecognizer>
    > = new Map();
    gestures.set(
      ThumbGestureRecognizer,
      new GestureRecognizerFactory(
        () => new ThumbGestureRecognizer(this.painter),
        (instance) => {
          instance.onLongPressStart = (event) => {
            this.handleThumbStart();
          };
          instance.onLongPressUpdate = (event) => {
            this.handleThumbUpdate(event.delta.y);
          };
          instance.onLongPressEnd = (event) => {
            this.handleThumbEnd();
          };
        }
      )
    );
    return gestures;
  }
  private updateScrollbarPainter() {
    const position = this.scrollController.position;
    const painter = this.painter;
    painter.maxContentExtent = position.maxScrollExtent;
    painter.viewportDimension = position.viewportDimension;
    painter.thumbOpacity = this.scrollPainterAnimateController.value;
    painter.scrollbarWidth = this.widget.scrollbarWidth;
  }

  build(context: BuildContext): Widget {
    return new RawGestureDetector({
      child: new ClipRect({
        child: new CustomPaint({
          key: customPaintKey,
          foregroundPainter: this.painter,
          child: this.widget.child,
        }),
      }),
      gestures: this.gestures,
    });
  }
}

class ThumbGestureRecognizer extends LongPressGestureRecognizer {
  private painter: ScrollbarPainter;
  constructor(painter: ScrollbarPainter) {
    super({ pressDuration: Duration.zero });
    this.painter = painter;
  }
  isAllowedPointer(event: DownPointerEvent): boolean {
    if (!this.painter.hitTestThumb(event.position)) {
      return;
    }
    return super.isAllowedPointer(event);
  }
}

export class ScrollBar extends StatelessWidget {
  private controller: ScrollController;
  private child: Widget;
  public scrollbarPainter: ScrollbarPainter;
  public scrollbarWidth: number;
  constructor(
    args: Partial<ScrollBarArguments & SingleChildRenderObjectWidgetArguments>
  ) {
    super(args.key);
    this.controller = args?.controller;
    this.child = args?.child;
    this.scrollbarPainter = args?.scrollbarPainter;
    this.scrollbarWidth = args?.scrollbarWidth;
  }
  build(context: BuildContext): Widget {
    return new RawScrollBar({
      controller: this.controller,
      child: this.child,
      scrollbarPainter: this.scrollbarPainter,
      scrollbarWidth: this.scrollbarWidth,
    });
  }
}

const localToGlobal = (position: Vector): Vector => {
  return customPaintKey.currentElement.findRenderView().localToGlobal(position);
};
