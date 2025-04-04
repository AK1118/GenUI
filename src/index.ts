import { Binding } from "./lib/basic/binding";
import { Widget } from "./lib/basic/framework";

export * from "./lib/render-object/index";
export * from "./lib/widgets/index";
export * from "./lib/painting/index";
export * from "./lib/rendering/index";
export * from "./lib/basic/index";
export * from "./lib/native/index";
export * from "./lib/core/index";

const runApp = (rootWidget: Widget) => {
  const binding = Binding.getInstance();
  binding.elementBinding.attachRootWidget(rootWidget);
};
export default runApp;