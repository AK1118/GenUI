import { PipelineOwner, RendererBinding } from "../basic/binding";
import { BuildContext } from "../basic/elements";
import { SingleChildRenderObjectWidget,Widget } from "../basic/framework";
import { ColoredRender, ConstrainedBoxRender, RenderView, RootRenderView } from "../render-object/basic";

export class ColoredBox extends SingleChildRenderObjectWidget {
    private color: string;
    constructor(color: string, child?: Widget) {
      super(child);
      this.color = color;
    }
    createRenderObject(): RenderView {
      return new ColoredRender(this.color);
    }
    updateRenderObject(context: BuildContext, renderView: RenderView) {
      (renderView as ColoredRender).color = this.color;
      console.log("更新颜色")
    }
  }
  
  export class SizeBox extends SingleChildRenderObjectWidget {
    private width: number;
    private height: number;
    constructor(width?: number, height?: number, child?: Widget) {
      super(child);
      this.width = width;
      this.height = height;
    }
    createRenderObject(): RenderView {
      return new ConstrainedBoxRender(this.width, this.height);
    }
    updateRenderObject(context: BuildContext, renderView: RenderView) {
        console.log("更新大小",this.width,this.height);
      (renderView as ConstrainedBoxRender).setSize(this.width, this.height);
    }
  }
  
  export class RootWidget extends SingleChildRenderObjectWidget {
    private owner: PipelineOwner = RendererBinding.instance.pipelineOwner;
    createRenderObject(): RenderView {
      const view = new RootRenderView();
      view.attach(this.owner);
      return view;
    }
    updateRenderObject(context: BuildContext, renderView: RenderView) {}
  }
  