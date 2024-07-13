import {
  AbstractNode,
  PaintingContext,
  RenderView,
} from "../render-object/basic";
import { BoxConstraints } from "@/lib/rendering/constraints";
import { BuildOwner, Element, RootElementView } from "./elements";
import Painter from "../painting/painter";
import Vector from "../math/vector";
import { RootRenderObjectElement, Widget } from "@/lib/basic/framework";
import { RootWidget } from "@/lib/widgets/basic";

abstract class BindingBase {
  constructor() {
    this.initInstance();
  }
  protected initInstance() {}
}

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
    // 使用 requestAnimationFrame 进行帧调度
    this.timer = requestAnimationFrame(update);
  }

  // 用于清理定时器的方法，在不需要更新时调用
  clearVisualUpdate() {
    if (this.timer) {
      cancelAnimationFrame(this.timer);
      this.timer = null;
    }
  }
}
let debugCount = 0;
export class RendererBinding extends BindingBase {
  private _pipelineOwner: PipelineOwner;
  public static instance: RendererBinding;
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
}

class ElementBinding extends BindingBase {
  public static instance: ElementBinding;
  private buildOwner: BuildOwner;
  private rootElement: RootRenderObjectElement;
  protected initInstance(): void {
    super.initInstance();
    ElementBinding.instance = this;
  }
  drawFrame() {
    this.buildOwner.buildScope(this.rootElement);
    RendererBinding.instance.drawFrame();
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
