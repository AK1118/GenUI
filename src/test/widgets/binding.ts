import { BuildOwner, Element, RootElement, RootElementView } from "../index";
import { AbstractNode, RenderView } from "./basic";

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

class PipelineOwner {
  private rootNode: AbstractNode;
  attachNode(rootNode: AbstractNode) {
    this.rootNode = rootNode;
  }
  flushPaint() {}
  flushLayout() {}
}

class RendererBinding extends BindingBase {
  private pipelineOwner: PipelineOwner;
  public static instance: RendererBinding;
  protected initInstance(): void {
    RendererBinding.instance = this;
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
    const root = new RootElementView(rootElement);
    root.attachToRenderTree(this.buildOwner);
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
