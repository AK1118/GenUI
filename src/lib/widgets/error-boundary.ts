import { BuildContext } from "../basic/elements";
import { SingleChildRenderObjectWidget } from "../basic/framework";
import { RenderView } from "../render-object/render-object";

export class GenUIErrorBoundary extends SingleChildRenderObjectWidget {
  createRenderObject(): RenderView {
    throw new Error("Method not implemented.");
  }
  updateRenderObject(context: BuildContext, renderView: RenderView): void {
    throw new Error("Method not implemented.");
  }
}
