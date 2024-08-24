import {
  PaintingContext,
} from "../render-object/basic";
import { BoxConstraints } from "@/lib/rendering/constraints";
import { BuildOwner } from "./elements";
import Painter from "../painting/painter";
import Vector from "../math/vector";
import { BindingBase, RootRenderObjectElement, Widget } from "@/lib/basic/framework";
import { RootWidget } from "@/lib/widgets/basic";
import {
  DownPointerEvent,
  GenPointerData,
  PointerEvent,
  PointerEventConverter,
  PointerEventHandler,
  UpPointerEvent,
} from "../gesture/events";
import { Queue } from "../utils/utils";
import {
  HitTestEntry,
  HitTestResult,
  HitTestTarget,
} from "../gesture/hit_test";
import { GestureBinding } from "../gesture/binding";
import { AbstractNode, RenderView } from "../render-object/render-object";

interface FrameCallbackEntity {
  callback: (tamp: number) => void;
}

class SchedulerBinding extends BindingBase {
  private frameCallbacks: Map<number, FrameCallbackEntity> = new Map();
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
  public handleBeginFrame() {
    const callbacks = this.frameCallbacks;
    this.frameCallbacks.clear();
    callbacks.forEach((_) => {
      _.callback?.(+new Date());
    });
  }
}

export class PipelineOwner {
  private rootNode: AbstractNode;
  private needRepaintList: Array<RenderView> = new Array<RenderView>();
  private needReLayoutList: Array<RenderView> = new Array<RenderView>();
  private frameUpdater: FrameUpdater = new FrameUpdater();
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
        // console.log("-----执行渲染-----",_)
        _?.paintWidthContext(
          new PaintingContext(new Painter()),
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
    // console.log("标记渲染",node)
    this.needRepaintList.push(node);
  }
  pushNeedingLayout(node: RenderView) {
    // console.log("构建",node)
    this.needReLayoutList.push(node);
  }
  private timer: any = null;
  requestVisualUpdate() {
    if (this.timer) {
      // 如果已经有一个定时器在等待，直接返回，避免重复调用
      return;
    }
    const update = () => {
      Binding.getInstance().schedulerBinding.ensureVisualUpdate();
      this.timer = null; // 重置定时器
    };
    this.handleCleanCanvas();
    // 使用 requestAnimationFrame 进行帧调度
    this.timer = requestAnimationFrame(update);
  }
  private handleCleanCanvas(){
    new Painter().clearRect(0, 0, 1000, 1000);
    this.frameUpdater.update();
  }

  // 用于清理定时器的方法，在不需要更新时调用
  clearVisualUpdate() {
    if (this.timer) {
      cancelAnimationFrame(this.timer);
      this.timer = null;
    }
  }
}

class FrameUpdater {
  private lastFrameTime: number;
  private frameCount: number;
  private fps: number;
  private painter: Painter = new Painter();
  constructor() {
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fps = 0;
  }
  private render(frame: number) {
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
      this.painter.canvas.width - rectWidth,
      0,
      rectWidth,
      rectHeight
    );
    // 绘制背景矩形
    this.painter.fillStyle = "#429aba";
    this.painter.fillRect(
      this.painter.canvas.width - rectWidth,
      0,
      rectWidth,
      rectHeight
    );

    // 绘制文本
    this.painter.fillStyle = "white";
    this.painter.fillText(
      fpsText,
      this.painter.canvas.width - rectWidth + padding,
      15
    );
    this.painter.fillText(
      elementText,
      this.painter.canvas.width - rectWidth + padding,
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
  public debug:boolean=false;
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
