import { BuildContext, Element } from "../basic/elements";
import { RenderObjectElement, RenderObjectWidget, SingleChildRenderObjectWidgetArguments, Widget } from "../basic/framework";
import { SingleChildRenderView } from "../render-object/basic";
import { RenderView } from "../render-object/render-object";
import { BoxConstraints } from "../rendering/constraints";



class LayoutBuilderRenderView extends SingleChildRenderView {
    private _callback: (constraints: BoxConstraints) => Element;
    updateLayoutBuilder(callback: (constraints: BoxConstraints) => Element) {
        if (this._callback === callback) return;
        this._callback = callback;
        this.markNeedsLayout();
    }
    private _previousConstraints: BoxConstraints;
    private _needsReBuild: boolean = true;
    public markNeedsReBuild() { this._needsReBuild = true; this.markNeedsLayout(); }
    private performCallBuilder(constrains: BoxConstraints) {
        if (!this._needsReBuild || constrains === this._previousConstraints) return;
        this._callback(constrains);
        this._previousConstraints = constrains;
        this._needsReBuild = false;
    }
    performLayout(): void {
        const constraints = this.constraints;
        this.performCallBuilder(constraints);
        if (this.child) {
            this.child.layout(constraints);
        }
        super.performLayout();
    }
}


type LayoutWidgetBuilder = (context: BuildContext, constrain: BoxConstraints) => Widget;
abstract class ConstrainedLayoutBuilder extends RenderObjectWidget {
    public builder: LayoutWidgetBuilder;
    constructor({ builder, key }: { builder: LayoutWidgetBuilder } & Partial<Omit<SingleChildRenderObjectWidgetArguments, "child">>) {
        super(null, key);
        this.builder = builder;
    }

    createRenderObject(context?: BuildContext): RenderView {
        return new LayoutBuilderRenderView();
    }
    createElement(): Element {
        return new LayoutBuilderElement(this);
    }
}

class LayoutBuilderElement extends RenderObjectElement {
    get layoutRenderView(): LayoutBuilderRenderView {
        return this.renderView as LayoutBuilderRenderView;
    }
    insertRenderObjectChild(child: RenderView, slot?: Object): void {
        this.renderView.child = child;
    }
    public mount(parent?: Element, newSlot?: Object): void {
        super.mount(parent, newSlot);
        this.layoutRenderView.updateLayoutBuilder(this.layout.bind(this));
    }
    update(newWidget: Widget): void {
        super.update(newWidget);
        this.layoutRenderView.updateLayoutBuilder(this.layout.bind(this));
        this.layoutRenderView.markNeedsReBuild();
    }
    protected performRebuild(): void {
        this.layoutRenderView.markNeedsReBuild();
        super.performRebuild();
    }
    public unmount(): void {
        this.layoutRenderView.updateLayoutBuilder(null);
        super.unmount();
    }
    private layout(constrains: BoxConstraints) {
        const built: Widget = (this.widget as ConstrainedLayoutBuilder).builder(this, constrains);
        this.child = this.updateChild(this.child, built);
    }
}


/**
 * # LayoutBuilder
 *   - LayoutBuilder 允许您在布局过程中构建子部件。 它接受一个回调，该回调接收当前的约束并返回一个 Widget。 这对于根据父级大小动态调整其大小的 Widgets 很有用。
 */
export class LayoutBuilder extends ConstrainedLayoutBuilder {
    constructor({ builder, key }: { builder: LayoutWidgetBuilder } & Partial<Omit<SingleChildRenderObjectWidgetArguments, "child">>) {
        super({ builder, key });
    }
}