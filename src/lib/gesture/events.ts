import { Offset } from "../basic/rect";
import { GenPlatformConfig } from "../core/platform";
import { Matrix4 } from "../math/matrix";
import Vector from "../math/vector";
import { NativeEventsBinding } from "../native/events";

//两次点击|点击移动的合法距离
export const G_postAcceptSlopTolerance: number = 18;

export enum PointerChange {
  cancel,
  add,
  remove,
  hover,
  down,
  move,
  up,
  panZoomStart,
  panZoomUpdate,
  panZoomEnd,
}
export class GenPointerData {
  public change: PointerChange;
  public event: GenEvent;
  public delta: Offset;
  public position: Vector;
  public pointer: number;
  constructor(
    change: PointerChange,
    event: GenEvent,
    delta: Offset,
    position: Vector,
    pointer: number
  ) {
    this.change = change;
    this.event = event;
    this.delta = delta;
    this.position = position;
    this.pointer = pointer;
  }
}
/**
 * 事件类型
 */
export type GenEvent = MouseEvent | TouchEvent | Touch | WheelEvent;
export type PointerChangeCallback = (data: GenPointerData) => PointerEvent;
export class PointerEventHandler {
  private isPointerDown = false;
  //是否平移缩放
  private isPanZoom = false;
  private onPointerChange: PointerChangeCallback;
  private prePointerData: GenPointerData = null;
  private initialPosition: Vector = null;

  /**
   *
   * @onPointerChange 是 @GestureBinding.handlePointerData 的回调
   */
  constructor(onPointerChange: PointerChangeCallback) {
    this.initializeEventListeners();
    this.onPointerChange = onPointerChange;
  }

  private reset(): void {
    this.initialPosition = null;
  }

  private initializeEventListeners() {
    if (NativeEventsBinding.instance) {
      const instance = NativeEventsBinding.instance;
      instance.addEventListener("touchstart", this.handleTouchStart.bind(this));
      instance.addEventListener("touchmove", this.handleTouchMove.bind(this));
      instance.addEventListener("touchend", this.handleTouchEnd.bind(this));
      instance.addEventListener(
        "touchcancel",
        this.handleTouchCancel.bind(this)
      );
      instance.addEventListener("mousedown", this.handlePointerDown.bind(this));
      instance.addEventListener("mouseup", this.handlePointerUp.bind(this));
      instance.addEventListener("mousemove", this.handlePointerMove.bind(this));
      instance.addEventListener(
        "mouseout",
        this.handlePointerCancel.bind(this)
      );
      instance.addEventListener("wheel", this.handleWheel.bind(this));
    }else{
      console.warn("NativeEventsBinding.instance is null");
    }
    //browser event listener
    // if (window) {
    //   if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    //     // Touch events for mobile devices
    //     window.addEventListener("touchstart", this.handleTouchStart.bind(this));
    //     window.addEventListener("touchmove", this.handleTouchMove.bind(this));
    //     window.addEventListener("touchend", this.handleTouchEnd.bind(this));
    //     window.addEventListener(
    //       "touchcancel",
    //       this.handleTouchCancel.bind(this)
    //     );
    //   } else {
    //     window.addEventListener("mousedown", this.handlePointerDown.bind(this));
    //     window.addEventListener("mouseup", this.handlePointerUp.bind(this));
    //     window.addEventListener("mousemove", this.handlePointerMove.bind(this));
    //     window.addEventListener(
    //       "mouseout",
    //       this.handlePointerCancel.bind(this)
    //     );
    //     window.addEventListener("wheel", this.handleWheel.bind(this));
    //   }
    // }
  }

  private handlePointerDown(event: MouseEvent) {
    this.isPointerDown = true;
    this.isPanZoom = event.shiftKey || event.ctrlKey; // Example condition for pan/zoom
    this.handlePointerEvent(PointerChange.down, event);
  }

  private handlePointerUp(event: MouseEvent) {
    this.isPointerDown = false;
    this.handlePointerEvent(PointerChange.up, event);

    if (this.isPanZoom) {
      this.handlePointerEvent(PointerChange.panZoomEnd, event);
      this.isPanZoom = false;
    }
  }

  private handlePointerMove(event: MouseEvent) {
    if (this.isPointerDown) {
      this.handlePointerEvent(PointerChange.move, event);
      if (this.isPanZoom) {
        this.handlePointerEvent(PointerChange.panZoomUpdate, event);
      }
    } else {
      this.handlePointerEvent(PointerChange.hover, event);
    }
  }

  private handlePointerCancel(event: MouseEvent) {
    this.isPointerDown = false;
    this.handlePointerEvent(PointerChange.cancel, event);
  }

  private handleWheel(event: WheelEvent) {
    if (this.isPointerDown) {
      this.handlePointerEvent(PointerChange.panZoomUpdate, event);
    } else {
      this.handlePointerEvent(PointerChange.hover, event);
    }
  }

  private handleTouchStart(event: TouchEvent) {
    this.isPointerDown = true;
    this.isPanZoom = event.touches.length > 1; // Pan/zoom if more than one finger
    Array.from(event.changedTouches).forEach((touch) => {
      this.handlePointerEvent(PointerChange.down, touch);
    });
  }

  private handleTouchMove(event: TouchEvent) {
    Array.from(event.changedTouches).forEach((touch, index) => {
      if (this.isPointerDown) {
        this.handlePointerEvent(PointerChange.move, touch);
        if (this.isPanZoom) {
          this.handlePointerEvent(PointerChange.panZoomUpdate, touch);
        }
      } else {
        this.handlePointerEvent(PointerChange.hover, touch);
      }
    });
  }

  private handleTouchEnd(event: TouchEvent) {
    this.isPointerDown = false;
    Array.from(event.changedTouches).forEach((touch) => {
      this.handlePointerEvent(PointerChange.up, touch);
      if (this.isPanZoom) {
        this.handlePointerEvent(PointerChange.panZoomEnd, touch);
        this.isPanZoom = false;
      }
    });
  }

  private handleTouchCancel(event: TouchEvent) {
    this.isPointerDown = false;
    Array.from(event.changedTouches).forEach((touch) => {
      this.handlePointerEvent(PointerChange.cancel, touch);
    });
  }

  private handlePointerEvent(change: PointerChange, event: MouseEvent | Touch) {
    const position = this.getEventPosition(event);
    const delta = this.prePointerData
      ? Vector.sub(position, this.prePointerData.position)
      : Vector.zero;
    const pointer: number = event instanceof Touch ? event?.identifier : 0;
    const pointerData = new GenPointerData(
      change,
      event,
      new Offset(delta.x, delta.y),
      position,
      pointer
    );
    const pointerEvent = this.onPointerChange(pointerData);

    this.prePointerData = pointerData;
    /**
     * 在手指接触到屏幕一刻记录初始触摸点位置
     */
    if (pointerEvent) {
      if (this.initialPosition) {
        this.addCancelPointer(change, event, pointerEvent, position);
      }
      if (pointerEvent instanceof DownPointerEvent) {
        this.initialPosition = position;
      }
    }
  }

  /**
   * 根据指针事件判断是否取消手势，取消手势后重置初始位置
   * 取消手势判定一般为在手指触摸屏幕后移动超过18像素距离
   * 该方法在被判定为取消手势后，会回调 @handlePointerEvent 函数，
   */
  private addCancelPointer(
    change: PointerChange,
    event: MouseEvent | Touch,
    pointerEvent: PointerEvent,
    position: Vector
  ): void {
    if (change === PointerChange.up) {
      this.reset();
    } else if (
      change === PointerChange.move &&
      !this.isPanZoom &&
      this.initialPosition != null
    ) {
      const distance = position.dist(this.initialPosition);
      if (distance > G_postAcceptSlopTolerance) {
        this.handlePointerEvent(PointerChange.cancel, event);
        // 超过18像素认为为移动
        this.reset();
      }
    }
  }

  private getEventPosition(event: MouseEvent | Touch): Vector {
    return new Vector(
      event?.clientX ?? event?.pageX,
      event?.clientY ?? event?.pageY
    );
  }
}

interface PointerArguments {
  change: PointerChange;
  event: MouseEvent | Touch;
  delta: Offset;
  position: Vector;
  pointer: number;
}

export abstract class PointerEvent {
  public position: Vector;
  public delta: Offset;
  public pointer: number = 0;
  constructor(option: Partial<PointerArguments>) {
    const { change, event, delta, position, pointer } = option;
    this.position = position;
    this.delta = delta;
    this.pointer = pointer;
  }
}

export class DownPointerEvent extends PointerEvent {}
export class UpPointerEvent extends PointerEvent {}
export class MovePointerEvent extends PointerEvent {}
export class HoverPointerEvent extends PointerEvent {}
export class CancelPointerEvent extends PointerEvent {}
export class PanZoomStartPointerEvent extends PointerEvent {}
export class PanZoomUpdatePointerEvent extends PointerEvent {}
export class PanZoomEndPointerEvent extends PointerEvent {}

export abstract class PointerEventConverter {
  static expand(data: GenPointerData): PointerEvent {
    const dpr = GenPlatformConfig.instance.devicePixelRatio;
    const position = new Vector(data.position.x * dpr, data.position.y * dpr); //data.position;//
    const delta = new Offset(
      data.delta.offsetX * dpr,
      data.delta.offsetY * dpr
    );
    switch (data.change) {
      case PointerChange.cancel:
        return new CancelPointerEvent({
          position,
          delta,
          pointer: data.pointer,
        });
      case PointerChange.add:
        break;
      case PointerChange.remove:
        break;
      case PointerChange.hover:
        return new HoverPointerEvent({
          position,
          delta,
          pointer: data.pointer,
        });
      case PointerChange.down:
        return new DownPointerEvent({
          position,
          delta,
          pointer: data.pointer,
        });
      case PointerChange.move:
        return new MovePointerEvent({
          position,
          delta,
          pointer: data.pointer,
        });
      case PointerChange.up:
        return new UpPointerEvent({
          position,
          delta,
          pointer: data.pointer,
        });
      case PointerChange.panZoomStart:
        return new PanZoomStartPointerEvent({
          position,
          delta,
          pointer: data.pointer,
        });

      case PointerChange.panZoomUpdate:
        return new PanZoomUpdatePointerEvent({
          position,
          delta,
          pointer: data.pointer,
        });
      case PointerChange.panZoomEnd:
        return new PanZoomEndPointerEvent({
          position,
          delta,
          pointer: data.pointer,
        });
    }
    return null;
  }
}

export type PointerRoute = (event: PointerEvent) => void;

/**
 *
 */
export class PointerRouter {
  private routeMap: Map<number, Map<PointerRoute, Matrix4>> = new Map();
  addRoute(
    pointer: number,
    route: PointerRoute,
    matrix4: Matrix4 = Matrix4.zero.identity()
  ) {
    let routes: Map<PointerRoute, Matrix4> = this.routeMap.get(pointer);
    if (!routes) {
      routes = new Map();
    }
    if (routes.has(route)) return;
    routes.set(route, matrix4);
    this.routeMap.set(pointer, routes);
  }
  removeRoute(pointer: number, route: PointerRoute) {
    const routes = this.routeMap.get(pointer);
    if (routes) {
      routes.delete(route);
    }
  }
  route(event: PointerEvent) {
    this.dispatch(event);
  }
  private dispatch(event: PointerEvent) {
    const routes = this.routeMap.get(event.pointer);
    if (routes) {
      for (let [route, matrix4] of routes) {
        route(event);
      }
    }
  }
}
