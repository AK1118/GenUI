import { BuildContext } from "../basic/elements";
import { StatelessWidget, Widget } from "../basic/framework";
import { Key } from "../basic/key";
import Alignment from "../painting/alignment";
import { BoxDecoration } from "../painting/decoration";
import { AlignArguments, RectTLRB } from "../render-object/basic";
import { BoxConstraints } from "../rendering/constraints";
import {
  Align,
  ColoredBox,
  ConstrainedBox,
  DecoratedBox,
  Padding,
  SizedBox,
} from "./basic";

interface ContainerArguments {
  width: number;
  height: number;
  color: string;
  child: Widget;
  decoration: BoxDecoration;
  align: Alignment;
  constraints: BoxConstraints;
  key: Key;
  padding:  Partial<RectTLRB>;
}

export class Container extends StatelessWidget implements ContainerArguments {
  width: number;
  height: number;
  constraints: BoxConstraints;
  color: string;
  child: Widget;
  decoration: BoxDecoration;
  align: Alignment;
  key: Key;
  padding: Partial<RectTLRB<number>>;
  constructor(args: Partial<ContainerArguments>) {
    super();
    this.width = args?.width;
    this.height = args?.height;
    this.constraints = args?.constraints;
    this.color = args?.color;
    this.child = args?.child;
    this.decoration = args?.decoration;
    this.align = args?.align;
    this.key = args?.key;
    this.padding = args?.padding;
  }
   
  build(context: BuildContext): Widget {
    if (!this.constraints) {
      if (this.width || this.height) {
        this.constraints = BoxConstraints.tightFor(
          this.width ?? null,
          this.height ?? null
        );
      } else {
        this.constraints = BoxConstraints.zero.loosen();
      }
    }

    let result: Widget = new ConstrainedBox({
      additionalConstraints: this.constraints,
      child: this.child,
    });

    if(this.padding){
        result=new Padding({
            padding:this.padding,
            child:result
        })
    }

    if (this.color) {
      result = new ColoredBox({
        child: result,
        color: this.color,
      });
    }

    if (!this.color && this.decoration) {
      result = new DecoratedBox({
        decoration: this.decoration,
        child: result,
      });
    }

    if (this.align) {
      result = new Align({
        child: result,
        alignment: this.align,
      });
    }

    return result;
  }
}
