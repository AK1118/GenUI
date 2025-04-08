import { BuildContext, Element } from "../basic/elements";
import { RenderObjectWidget, SingleChildRenderObjectElement, SingleChildRenderObjectWidgetArguments } from "../basic/framework";
import { PointerEvent, SignalPointerEvent } from "../gesture/events";
import { HitTestEntry } from "../gesture/hit_test";
import { SingleChildRenderView } from "../render-object/basic";
import { RenderView } from "../render-object/render-object";

class MouseRegion extends RenderObjectWidget {
  constructor(option: Partial<SingleChildRenderObjectWidgetArguments>) {
    super(option?.child, option?.key)
  }

  createRenderObject(context?: BuildContext): RenderView {
    return new MouseRegionRenderView();
  }
  createElement(): Element {
    // 抛出错误，提示方法未实现
    return new SingleChildRenderObjectElement(this);
  }
}
class MouseRegionRenderView extends SingleChildRenderView {
  handleEvent(event: PointerEvent, entry: HitTestEntry): void {
    if(event instanceof SignalPointerEvent){
      console.log("MouseRegionRenderView",event)
    }
    super.handleEvent(event, entry);
  }
}