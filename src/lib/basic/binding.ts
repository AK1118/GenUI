import { PaintingContext } from "../render-object/basic";
import { BuildOwner } from "./elements";
import Painter from "../painting/painter";
import Vector from "../math/vector";
import {
  BindingBase,
  RootRenderObjectElement,
  Widget,
} from "@/lib/basic/framework";
import { RootWidget } from "@/lib/widgets/basic";
import {
  HitTestResult,
} from "../gesture/hit_test";
import { GestureBinding } from "../gesture/binding";
import { AbstractNode, RenderView } from "../render-object/render-object";
import {GenPlatformConfig} from "../core/platform";

type FrameCallback = (timestamp: number) => void;
type AnimationFrame = (callback: FrameCallback) => void;
class FrameCallbackEntity {
  callback: FrameCallback;
  constructor(callback: FrameCallback) {
    this.callback = callback;
  }
}

export class SchedulerFrameManager {
  private static instance: SchedulerFrameManager; // 单例实例
  private frameCallbacks: Map<number, FrameCallback>; // 存储回调函数的映射
  private isRequestingFrame: boolean; // 是否正在请求帧
  private nextCallbackId: number; // 回调函数的唯一标识符
  private frameUpdater: FrameUpdater = new FrameUpdater();
  private requestAnimationFrame: AnimationFrame;
  private constructor() {
    this.frameCallbacks = new Map<number, FrameCallback>();
    this.isRequestingFrame = false;
    this.nextCallbackId = 0;
    this.initAnimationFrame();
  }
  private initAnimationFrame() {
    // this.requestAnimationFrame=(callback:FrameCallback)=>{
    //   setTimeout(()=>{
    //     callback(+new Date())
    //   },1000/60);
    // }
    if (
      typeof window !== "undefined" &&
      typeof window?.requestAnimationFrame === "function"
    ) {
      this.requestAnimationFrame = (callback: FrameCallback) => {
        requestAnimationFrame(callback);
      };
    } else {
      this.requestAnimationFrame = (callback: FrameCallback) => {
        setTimeout(() => {
          callback(+new Date());
        }, 1000 / 120);
      };
    }
  }
  // 获取单例实例
  public static getInstance(): SchedulerFrameManager {
    if (!SchedulerFrameManager.instance) {
      SchedulerFrameManager.instance = new SchedulerFrameManager();
    }
    return SchedulerFrameManager.instance;
  }

  // 注册一个新的回调函数，返回其唯一标识符
  public addFrameCallback(callback: FrameCallback): number {
    this.nextCallbackId += 1;
    this.frameCallbacks.set(this.nextCallbackId, callback);
    this.requestFrameIfNeeded(); // 如果需要，请求新的动画帧
    return this.nextCallbackId;
  }

  // 移除一个指定的回调函数
  public removeFrameCallback(callbackId: number): void {
    this.frameCallbacks.delete(callbackId);
  }

  // 如果没有正在请求的帧，发起一个新的帧请求
  private requestFrameIfNeeded(): void {
    if (!this.isRequestingFrame) {
      this.isRequestingFrame = true;
      this.requestAnimationFrame(this.handleFrame.bind(this));
    }
  }

  // 每帧调用的函数
  private handleFrame(timestamp: number): void {
    // 执行所有的回调函数
    this.frameCallbacks.forEach((callback) => {
      if (typeof callback === "function") {
        callback(timestamp); // 执行每个回调，传递时间戳
      }
    });
    //更新fps
    this.frameUpdater.update();
    // 清空所有的回调函数
    this.frameCallbacks.clear();
    // 标记当前没有请求帧
    this.isRequestingFrame = false;

    // 检查是否需要继续请求帧
    if (this.frameCallbacks.size > 0) {
      this.requestFrameIfNeeded();
    }
  }
}

class SchedulerBinding extends BindingBase {
  private frameCallbacks: Map<number, FrameCallbackEntity> = new Map();
  private nextFrameCallbackId: number = 0;

  public static instance: SchedulerBinding;
  protected initInstance() {
    super.initInstance();
    SchedulerBinding.instance = this;
  }
  public ensureVisualUpdate() {
    this.scheduleFrame();
  }
  private scheduleFrame() {
    this.handleDrawFrame();
  }
  handleDrawFrame() {
    ElementBinding.instance.drawFrame();
  }
  public scheduleFrameCallback(callback: FrameCallback): number {
    this.nextFrameCallbackId += 1;
    const frameCallback = new FrameCallbackEntity(callback);
    this.frameCallbacks.set(this.nextFrameCallbackId, frameCallback);
    SchedulerFrameManager.getInstance().addFrameCallback(
      this.handleBeginCallbackFrame.bind(this)
    );
    return this.nextFrameCallbackId;
  }
  public handleBeginCallbackFrame(timeStamp: number) {
    const callbacks = new Map(this.frameCallbacks);
    this.frameCallbacks = new Map();
    callbacks.forEach((entity) => {
      const callback = entity.callback;
      callback?.(timeStamp);
    });
    callbacks.clear();
  }
  // private timer: any = null;
  public requestVisualUpdate() {
    SchedulerFrameManager.getInstance().addFrameCallback(
      this.ensureVisualUpdate.bind(this)
    );
    this.handleCleanCanvas();
  }
  private handleCleanCanvas() {
    const paint =GenPlatformConfig.instance.painter;
    const width = GenPlatformConfig.instance.screenWidth,
      height = GenPlatformConfig.instance.screenHeight;
    paint.clearRect(0, 0,width,height);
  }
}

export class PipelineOwner {
  private rootNode: AbstractNode;
  private needRepaintList: Array<RenderView> = new Array<RenderView>();
  private needReLayoutList: Array<RenderView> = new Array<RenderView>();
  get renderView(): RenderView {
    return this.rootNode as RenderView;
  }
  attachNode(rootNode: AbstractNode) {
    this.rootNode = rootNode;
  }
  flushPaint() {
    const nodes = this.needRepaintList;
    this.needRepaintList = [];
    nodes.sort((a, b) => {
      return a.depth - b.depth;
    });
    nodes.forEach((_, ndx) => {
      const layer = _.layerHandler?.layer;
      if (_.needsRePaint) {
        _?.paintWidthContext(
          new PaintingContext(GenPlatformConfig.instance.painter),
          layer?.offset || Vector.zero
        );
      }
    });
  }
  flushLayout() {
    const nodes = this.needReLayoutList;
    if (nodes.length === 0) return;
    this.needReLayoutList = [];
    nodes.sort((a, b) => {
      return a.depth - b.depth;
    });
    nodes.forEach((_) => {
      if (_.needsReLayout) {
        _?.layoutWithoutResize();
      }
    });
  }
  pushNeedingPaint(node: RenderView) {
    this.needRepaintList.push(node);
  }
  pushNeedingLayout(node: RenderView) {
    this.needReLayoutList.push(node);
  }
  requestVisualUpdate() {
    SchedulerBinding.instance.requestVisualUpdate();
  }
}

class FrameUpdater {
  private lastFrameTime: number;
  private frameCount: number;
  private fps: number;
  private painter: Painter= GenPlatformConfig.instance.painter;
  constructor() {
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fps = 0;
  }
  private render(frame: number) {
    const screenWidth =  GenPlatformConfig.instance.screenWidth;
    
    this.painter.save();
    this.painter.globalAlpha = 0.5;
    // 设置字体样式
    this.painter.font = "12px Arial";

    // 获取文本的宽度和高度
    const fpsText = `${frame}fps`;
    const elementText = `ele:${ElementBinding.elementCount}`;

    const fpsTextMetrics = this.painter.measureText(fpsText);
    const elementTextMetrics = this.painter.measureText(elementText);

    // 确定最大的文本宽度
    const textWidth = Math.max(fpsTextMetrics.width, elementTextMetrics.width);

    // 设置矩形的宽度和高度
    const padding = 10;
    const rectWidth = textWidth + 2 * padding;
    const rectHeight = 40;
    this.painter.clearRect(
      screenWidth - rectWidth,
      0,
      rectWidth,
      rectHeight
    );
    // 绘制背景矩形
    this.painter.fillStyle = "#429aba";
    this.painter.fillRect(
      screenWidth - rectWidth,
      0,
      rectWidth,
      rectHeight
    );

    // 绘制文本
    this.painter.fillStyle = "white";
    this.painter.fillText(
      fpsText,
      screenWidth - rectWidth + padding,
      15
    );
    this.painter.fillText(
      elementText,
      screenWidth - rectWidth + padding,
      30
    );

    this.painter.restore();
  }

  public update(): number {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.frameCount++;

    if (delta >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
    this.render(this.fps);
    return this.fps;
  }
}

export class RendererBinding extends GestureBinding {
  private _pipelineOwner: PipelineOwner;
  public static instance: RendererBinding;
  public debug: boolean = GenPlatformConfig.instance.isDebug;
  get renderView(): RenderView {
    return this._pipelineOwner.renderView;
  }
  constructor() {
    super();
    super.initInstance();
  }
  protected initInstance(): void {
    RendererBinding.instance = this;
    this._pipelineOwner = new PipelineOwner();
  }
  get pipelineOwner(): PipelineOwner {
    return this._pipelineOwner;
  }
  drawFrame() {
    this.pipelineOwner.flushLayout();
    this.pipelineOwner.flushPaint();
  }
  protected hitTest(result: HitTestResult, position: Vector): void {
    this.renderView.hitTest(result, position);
    super.hitTest(result, position);
  }
}

class ElementBinding extends BindingBase {
  public static instance: ElementBinding;
  public buildOwner: BuildOwner;
  private rootElement: RootRenderObjectElement;
  private static _elementCount: number = 0;
  static get elementCount(): number {
    return this._elementCount;
  }
  static incrementElementCount() {
    this._elementCount++;
  }
  static decrementElementCount() {
    this._elementCount--;
  }
  static subElementCount(count: number) {
    this._elementCount -= count;
  }
  protected initInstance(): void {
    super.initInstance();
    ElementBinding.instance = this;
  }
  drawFrame() {
    this.buildOwner.buildScope(this.rootElement);
    RendererBinding.instance.drawFrame();
    this.buildOwner.inactiveElements.clear();
  }
  attachRootWidget(rootWidget: Widget) {
    const wrappedWidget = new RootWidget(rootWidget);
    this.rootElement = wrappedWidget.createElement() as RootRenderObjectElement;
    this.buildOwner = new BuildOwner();
    this.rootElement.attachToRenderTree(this.buildOwner);
    if (RendererBinding.instance.debug) {
      console.log("The GenUI app is running on", new Date());
    }
  }
}

class Binding extends BindingBase {
  private static _instance: Binding;
  public schedulerBinding: SchedulerBinding = new SchedulerBinding();
  public elementBinding: ElementBinding = new ElementBinding();
  public rendererBinding: RendererBinding = new RendererBinding();
  public static getInstance(): Binding {
    if (!Binding._instance) {
      Binding._instance = new Binding();
    }
    return Binding._instance;
  }
  get instance(): Binding {
    return Binding._instance;
  }
}

export { Binding, SchedulerBinding, ElementBinding };
