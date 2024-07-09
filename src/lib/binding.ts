import { AbstractNode, PaintingContext, RenderView } from "./basic";
import { BoxConstraints } from "@/lib/rendering/constraints";
import { BuildOwner, Element, RootElementView } from "./elements";
import Painter from "./painting/painter";
import Vector from "./math/vector";

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
        _?.paintWidthContext(
          new PaintingContext(new Painter()),
          layer?.offset || Vector.zero
        );
      }
    });
  }
  flushLayout() {
    const nodes = this.needReLayoutList;
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
    Binding.getInstance().schedulerBinding.ensureVisualUpdate();
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
  private rootElement: Element;
  protected initInstance(): void {
    super.initInstance();
    ElementBinding.instance = this;
  }
  drawFrame() {
    this.buildOwner.buildScope(this.rootElement);
    RendererBinding.instance.drawFrame();
  }
  attachRootWidget(rootElement: Element) {
    this.rootElement = rootElement;
    this.buildOwner = new BuildOwner();
    const wrappedView = new RootElementView(rootElement);
    wrappedView.attachToRenderTree(this.buildOwner);
  }
  scheduleAttachRootWidget(root: Element) {
    this.attachRootWidget(root);
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
