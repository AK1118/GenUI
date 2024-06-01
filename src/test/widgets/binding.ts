import RenderBox from "@/core/lib/rendering/renderbox";
import { BuildOwner, Element, RootElement, RootElementView } from "../index";
import { AbstractNode, PaintingContext, RenderView } from "./basic";
import Painter from "@/core/lib/painter";

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
  public scheduleFrame() {}
  protected initInstance() {
    super.initInstance();
    SchedulerBinding.instance = this;
  }
  handleDrawFrame() {}
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
    const nodes = this.needReLayoutList;
    this.needReLayoutList = [];
    nodes.forEach((_) => {
      _?.render(new PaintingContext(new Painter()));
    });
  }
  flushLayout() {
    const nodes = this.needReLayoutList;
    this.needReLayoutList = [];
    nodes.forEach((_) => {
      _?.performLayout();
    });
  }
  pushNeedingPaint(node: RenderView) {
    this.needRepaintList.push(node);
  }
  pushNeedingLayout(node: RenderView) {
    this.needReLayoutList.push(node);
  }
}

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
