import { BuildContext } from "@/lib/basic/elements";
import {
  State,
  StatefulWidget,
  StatelessWidget,
  Widget,
} from "@/lib/basic/framework";
import {
  Axis,
  CrossAxisAlignment,
  MainAxisAlignment,
} from "@/lib/core/base-types";
import Alignment from "@/lib/painting/alignment";
import { Border } from "@/lib/painting/borders";
import { BoxFit } from "@/lib/painting/box-fit";
import { BoxDecoration } from "@/lib/painting/decoration";
import { ImageSource } from "@/lib/painting/image";
import BorderRadius from "@/lib/painting/radius";
import BoxShadow from "@/lib/painting/shadow";
import { FontStyle, FontWeight, TextSpan, TextStyle } from "@/lib/text-painter";
import {
  Align,
  ClipRect,
  ClipRRect,
  Expanded,
  Flex,
  Image as ImageWidget,
  Padding,
  Text,
  TextRich,
  Transform,
} from "@/lib/widgets/basic";
import { Column, Container, Row } from "@/lib/widgets/widgets";
/**
 * 1.Expanded 内的Flex布局文字时会消失文字组件
 */
export default class MyPost extends StatelessWidget {
  // build(context: BuildContext): Widget {
  //   return new Container({
  //     width: 300,
  //     height: 300,
  //     child: new Flex({
  //       direction: Axis.vertical,
  //       children: [
  //         new Text("1"),
  //         new Text("2"),
  //         new Expanded({
  //           // flex:1,
  //           child:new Flex({
  //             direction: Axis.horizontal,
  //             children:[
  //               new Text("3"),
  //               new Text("4"),
  //               new Expanded({
  //                 // flex:1,
  //                 child:new Container({
  //                   child:new Flex({
  //                     direction: Axis.vertical,
  //                     children:[
  //                       // new Text("5"),
  //                       // new Text("6"),
  //                       this.buildContent(),
  //                     ]
  //                   })
  //                 })
  //               }),
  //             ]
  //           })
  //         }),
  //         new Text("7")
  //       ],
  //     }),
  //   });
  // }
  build(context: BuildContext): Widget {
    return new Container({
      width: 252.5,
      height: 341.25,
      color: "#f8f8f8",
      decoration: new BoxDecoration({
        shadows: [
          new BoxShadow({
            shadowColor: "#ccc",
            shadowBlur: 3.5,
            shadowOffsetX: 3,
            shadowOffsetY: 3,
          }),
        ],
      }),
      child: new Padding({
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 10,
        },
        child: this.buildContent(),
      }),
    });
  }

  private buildContent(): Widget {
    return new Column({
      children: [
        this.buildTitle(),
        new TransformedLine(),
        this.buildInfo(),
        this.buildUserInfoAndQrBar(),
      ],
    });
  }
  private buildUserInfoAndQrBar() {
    return new Row({
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        new Expanded({
          flex: 1,
          child: this.buildUserInfo(),
        }),
        new Expanded({
          flex: 1,
          child: this.buildQrCode(),
        }),
      ],
    });
  }
  private buildQrCode() {
    return new Column({
      mainAxisAlignment: MainAxisAlignment.end,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        new Text("一键扫码Get同款", {
          style: new TextStyle({
            fontSize: 8,
          }),
        }),
        new Container({
          width: 60,
          height: 60,
          child:new ProductImageBox("https://th.bing.com/th/id/OIP.yB2hOrk5yOCc3Mrv5p7XUwAAAA?w=183&h=182&c=7&r=0&o=5&pid=1.7")
        }),
      ],
    });
  }

  private buildInfo(): Widget {
    return new Row({
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        new Column({
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            new Text("MK47-鼓龙", {
              style: new TextStyle({
                color: "#000",
                fontFamily: "Material",
                fontSize: 10,
              }),
            }),
            new Container({
              width: 60,
              child: new Padding({
                padding: {
                  // top: 5,
                  // bottom: 5,
                },
                child: new TextRich({
                  textSpan: new TextSpan({
                    text: "全球第",
                    textStyle: new TextStyle({
                      color: "#000",
                      fontFamily: "Material",
                      fontSize: 10,
                    }),
                    children: [
                      new TextSpan({
                        text: "813",
                        textStyle: new TextStyle({
                          color: "orange",
                          fontFamily: "Material",
                          fontSize: 10,
                        }),
                      }),
                      new TextSpan({
                        text: "位掌火武器大使",
                        textStyle: new TextStyle({
                          color: "#000",
                          fontFamily: "Material",
                          fontSize: 10,
                        }),
                      }),
                    ],
                  }),
                }),
              }),
            }),
          ],
        }),
        new Expanded({
          flex: 1,
          child: this.buildProductImage(),
        }),
      ],
    });
  }

  private buildProductImage(): Container {
    return new Container({
      width: 300,
      height: 100,
      // alignment: Alignment.topCenter,
      decoration: new BoxDecoration({
        border: Border.all({
          color: "orange",
          width: 1,
        }),
      }),
      child: new ProductImageBox(
        "https://th.bing.com/th/id/OIP.LDhAJr3afBDu-1sx5UZIoAHaDT?w=339&h=156&c=7&r=0&o=5&pid=1.7"
      ),
    });
  }

  private buildTitle(): Widget {
    return new Column({
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        new Row({
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            new Column({
              mainAxisAlignment: MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                new Text("我的", {
                  style: new TextStyle({
                    color: "#000",
                    fontFamily: "Material",
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                  }),
                }),
                new Text("极品收藏", {
                  style: new TextStyle({
                    color: "#000",
                    fontFamily: "Material",
                    fontSize: 30,
                    fontWeight: FontWeight.bold,
                  }),
                }),
              ],
            }),
            new Column({
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                new Container({
                  padding: {
                    left: 5,
                    right: 5,
                  },
                  child: new Text("MY INCOMPARABLE", {
                    style: new TextStyle({
                      color: "#ccc",
                      fontSize: 9,
                    }),
                  }),
                  color: "#000",
                }),
                new Container({
                  padding: {
                    left: 5,
                    right: 5,
                  },
                  child: new Text("COLLECTION", {
                    style: new TextStyle({
                      color: "#ccc",
                      fontSize: 9,
                    }),
                  }),
                  color: "#000",
                }),
              ],
            }),
          ],
        }),
        new Column({
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            new Text("WEAPON", {
              style: new TextStyle({
                color: "#000",
                fontSize: 8,
              }),
            }),
            new Text("WAREHOUSE", {
              style: new TextStyle({
                color: "#000",
                fontSize: 8,
              }),
            }),
            new Text("ULTIMATE COLLECTION", {
              style: new TextStyle({
                color: "#000",
                fontSize: 8,
              }),
            }),
          ],
        }),
      ],
    });
  }

  private buildUserInfo(): Widget {
    return new Column({
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        new Column({
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            new ClipRRect({
              borderRadius: 90 ,
              child: new Container({
                width: 20,
                height: 20,
                child: new ProductImageBox(
                  "https://th.bing.com/th?id=OIP.4lyU4yBL5TcTv_Ld3Bxz1QHaDf&w=80&h=80&c=1&vt=10&bgcl=5fef25&r=0&o=6&pid=5.1"
                ),
              }),
            }),
            new Text("。"),
            new Text("登录掌上穿越火线，与我Get同款装备", {
              style: new TextStyle({
                fontSize: 8,
              }),
            }),
          ],
        }),
        new Row({
          children: [
            new ClipRRect({
              borderRadius: 5,
              child: new Container({
                width: 30,
                height: 30,
                child: new ProductImageBox(
                  "https://th.bing.com/th?id=OIP.4lyU4yBL5TcTv_Ld3Bxz1QHaDf&w=80&h=80&c=1&vt=10&bgcl=5fef25&r=0&o=6&pid=5.1"
                ),
              }),
            }),
            new Column({
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                new Text("掌上穿越火线", {
                  style: new TextStyle({
                    color: "#000",
                    fontFamily: "Material",
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    fontStyle: FontStyle.italic,
                  }),
                }),
                new Text("掌握一手资料", {
                  style: new TextStyle({
                    color: "#000",
                    fontSize: 8,
                  }),
                }),
                new Text("分享炫酷成就>>>", {
                  style: new TextStyle({
                    color: "#000",
                    fontSize: 8,
                  }),
                }),
              ],
            }),
          ],
        }),
      ],
    });
  }
}

class TransformedLine extends StatelessWidget {
  private buildTransformedRect(): Widget {
    return new Padding({
      padding: {
        right: 3,
      },
      child: Transform.skew({
        skewX: -0.6,
        child: new Container({
          width: 3,
          height: 6,
          color: "#ccc",
        }),
      }),
    });
  }
  build(context: BuildContext): Widget {
    const rects = Array.from({ length: 15 }, this.buildTransformedRect);
    return new ClipRect({
      child: new Container({
        padding: {
          top: 3,
          bottom: 3,
        },
        child: new Flex({
          children: rects,
        }),
      }),
    });
  }
}

class ProductImageBox extends StatefulWidget {
  public src: string = "";
  constructor(src: string) {
    super();
    this.src = src;
  }
  createState(): State {
    return new ProductImageBoxState();
  }
}

class ProductImageBoxState extends State<ProductImageBox> {
  private imageSource: ImageSource = null;
  public initState(): void {
    super.initState();
    const image = new Image();
    image.onload = () => {
      this.setState(() => {
        this.imageSource = new ImageSource({
          image,
          width: image.width,
          height: image.height,
        });
      });
    };
    image.src = this.widget.src;
  }
  build(context: BuildContext): Widget {
    if (!this.imageSource) return null;
    return new ImageWidget({
      fit: BoxFit.fitWidth,
      // alignment: Alignment.centerLeft,
      imageSource: this.imageSource,
    });
  }
}
