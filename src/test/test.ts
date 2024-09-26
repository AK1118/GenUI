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
import ScreenUtils from "./screen-utils";
import { screenUtil } from "./index";
import Color from "@/lib/painting/color";
/**
 * 1.Expanded 内的Flex布局文字时会消失文字组件
 */
const scale=1;
const sp=(value:number)=>screenUtil.setSp(value*scale);
const sw=(value:number)=>screenUtil.setWidth(value*scale);
const sh=(value:number)=>screenUtil.setHeight(value*scale);

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
      width:sw(252.5),
      // height:sw(341.25),
      color: new Color(0xfff8f8f8),
      decoration: new BoxDecoration({
        shadows: [
          new BoxShadow({
            shadowColor: new Color(0xffcccccc),
            shadowBlur: sp(3.5),
            shadowOffsetX: sp(3),
            shadowOffsetY:sp(3),
          }),
        ],
      }),
      child: new Padding({
        padding: {
          left: sp(5),
          right: sp(5),
          top: sp(5),
          bottom: sp(5),
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
            fontSize: sp(8),
          }),
        }),
        new Container({
          width: sw(60),
          height: sw(60),
          child:new ProductImageBox("https://th.bing.com/th/id/OIP.YWJcKsI2IJFLXbVgS9GnAwHaHZ?w=186&h=186&c=7&r=0&o=5&pid=1.7")
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
                color: new Color(0xff000000),
                fontFamily: "Material",
                fontSize: sp(10),
              }),
            }),
            new Container({
              width: sw(60),
              child: new Padding({
                padding: {
                  // top: 5,
                  // bottom: 5,
                },
                child: new TextRich({
                  textSpan: new TextSpan({
                    text: "全球第",
                    textStyle: new TextStyle({
                      color: new Color(0xff000000),
                      fontFamily: "Material",
                      fontSize: sp(9),
                    }),
                    children: [
                      new TextSpan({
                        text: " 813",
                        textStyle: new TextStyle({
                          color: new Color(0xff000000),
                          fontFamily: "Material",
                          fontSize: sp(9),
                        }),
                      }),
                      new TextSpan({
                        text: "位掌火武器大使",
                        textStyle: new TextStyle({
                          color: new Color(0xff000000),
                          fontFamily: "Material",
                          fontSize: sp(9),
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
      width: sw(300),
      height: sw(120),
      padding:{
        top:sw(40)
      },
      // alignment: Alignment.topCenter,
      // color:new Color(0xff000000),
      child: new ProductImageBox(
        "data:image/jpeg;base64,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"
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
                    color: new Color(0xff000000),
                    fontFamily: "Material",
                    fontSize: sp(26),
                    fontWeight: FontWeight.bold,
                  }),
                }),
                new Text("极品收藏", {
                  style: new TextStyle({
                    color: new Color(0xff000000),
                    fontFamily: "Material",
                    fontSize: sp(30),
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
                    left: sp(5),
                    right: sp(5),
                  },
                  child: new Text("MY INCOMPARABLE", {
                    style: new TextStyle({
                      color: new Color(0xffcccccc),
                      fontSize: sp(9),
                    }),
                  }),
                  color: new Color(0xff000000),
                }),
                new Container({
                  padding: {
                    left: sp(5),
                    right: sp(5),
                  },
                  child: new Text("COLLECTION", {
                    style: new TextStyle({
                      color: new Color(0xffcccccc),
                      fontSize: sp(9),
                    }),
                  }),
                  color: new Color(0xff000000),
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
                color: new Color(0xff000000),
                fontSize: sp(8),
              }),
            }),
            new Text("WAREHOUSE", {
              style: new TextStyle({
                color: new Color(0xff000000),
                fontSize: sp(8),
              }),
            }),
            new Text("ULTIMATE COLLECTION", {
              style: new TextStyle({
                color: new Color(0xff000000),
                fontSize: sp(8),
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
              borderRadius: sp(90) ,
              child: new Container({
                width: sw(20),
                height: sw(20),
                child: new ProductImageBox(
                  "https://th.bing.com/th?id=OIP.4lyU4yBL5TcTv_Ld3Bxz1QHaDf&w=80&h=80&c=1&vt=10&bgcl=5fef25&r=0&o=6&pid=5.1"
                ),
              }),
            }),
            new Text("。",{
              style: new TextStyle({
                fontSize: sp(8),
              }),
            }),
            new Text("登录掌上穿越火线，与我Get同款装备", {
              style: new TextStyle({
                fontSize: sp(8),
              }),
            }),
          ],
        }),
        new Row({
          children: [
            new ClipRRect({
              borderRadius: sp(5),
              child: new Container({
                decoration:new BoxDecoration({
                  border:Border.all({
                    color:new Color(0xffcccccc)
                  }),
                 }),
                width: sw(36),
                height: sw(36),
                child: new ProductImageBox(
                  "https://th.bing.com/th?id=OIP.4lyU4yBL5TcTv_Ld3Bxz1QHaDf&w=80&h=80&c=1&vt=10&bgcl=5fef25&r=0&o=6&pid=5.1"
                ),
              }),
            }),
            new Padding({
              padding:{
                left:sw(5),
              },
              child:new Column({
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  new Text("掌上穿越火线", {
                    style: new TextStyle({
                      color: new Color(0xff000000),
                      fontFamily: "Material",
                      fontSize: sp(10),
                      fontWeight: FontWeight.bold,
                      fontStyle: FontStyle.italic,
                    }),
                  }),
                  new Text("掌握一手资料", {
                    style: new TextStyle({
                      color: new Color(0xff000000),
                      fontSize: sp(8),
                    }),
                  }),
                  new Text("分享炫酷成就>>>", {
                    style: new TextStyle({
                      color: new Color(0xff000000),
                      fontSize: sp(8),
                    }),
                  }),
                ],
              }),
            })
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
        right: sp(3),
      },
      child: Transform.skew({
        skewX: -0.6,
        child: new Container({
          width: sw(3),
          height: sw(6),
          color: new Color(0xffcccccc),
        }),
      }),
    });
  }
  build(context: BuildContext): Widget {
    const rects = Array.from({ length: 15 }, this.buildTransformedRect);
    return new ClipRect({
      child: new Container({
        padding: {
          top: sp(3),
          bottom: sp(3),
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
      alignment: Alignment.center,
      imageSource: this.imageSource,
    });
  }
}
