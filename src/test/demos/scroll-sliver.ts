import { BuildContext } from "@/lib/basic/elements";
import { State, StatefulWidget, StatelessWidget, Widget } from "@/lib/basic/framework";
import { AnimationController, Curves } from "@/lib/core/animation";
import { AxisDirection, CrossAxisAlignment, FontWeight, MainAxisAlignment, StackFit, TextOverflow } from "@/lib/core/base-types";
import { Duration } from "@/lib/core/duration";
import { BouncingScrollPhysics } from "@/lib/core/scroll-physics";
import Alignment from "@/lib/painting/alignment";
import { Border, BorderSide } from "@/lib/painting/borders";
import { Color, Colors } from "@/lib/painting/color";
import { BoxDecoration } from "@/lib/painting/decoration";
import { BorderRadius } from "@/lib/painting/radius";
import BoxShadow from "@/lib/painting/shadow";
import { TextStyle } from "@/lib/painting/text-painter";
import { Align, Expanded, GestureDetector, Padding, Positioned, SizedBox, Stack, Text, Transform } from "@/lib/widgets/basic";
import { ScrollBar, ScrollController } from "@/lib/widgets/scroll";
import { SliverChildBuilderDelegate, SliverList } from "@/lib/widgets/sliver";
import { Column, Container, Row, SingleChildScrollView } from "@/lib/widgets/widgets";
import MyPost from "../test";


/**
 * # 滚动虚拟列表例子
 *  - 
 */
export default class ScrollSliverListExample extends StatelessWidget {
    private _controller: ScrollController = new ScrollController();
    private get autoKeepAlive(): boolean {
        return false;
    };

    private get itemCount(): number {
        return 1000;
    }
    build(context: BuildContext): Widget {
        return new Column({
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
                new Container({
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 20,
                        right: 20,
                    },
                    child: new Row({
                        children: [
                            new Text(`虚拟列表滚动滚动${this.itemCount}条`)
                        ]
                    }),
                    decoration: new BoxDecoration({
                        shadows: [
                            new BoxShadow({
                                shadowColor: Colors.black.withAlpha(54),
                                shadowOffsetY: 10,
                                shadowBlur: 10,
                            })
                        ]
                    })
                }),
                new Expanded({
                    flex: 2,
                    child: new Stack({
                        // fit: StackFit.expand,
                        alignment: Alignment.bottomRight,
                        children: [
                            new SizedBox({
                                width: Infinity,
                                height: Infinity,
                                child: new ScrollBar({
                                    controller: this._controller,
                                    child: new SingleChildScrollView({
                                        axisDirection: AxisDirection.down,
                                        controller: this._controller,
                                        // physics: new BouncingScrollPhysics(),
                                        child: new SliverList({
                                            autoKeepAlive: this.autoKeepAlive,
                                            childDelegate: new SliverChildBuilderDelegate({
                                                childCount: this.itemCount,
                                                builder: (context, index) => {
                                                    // if(index % 2 === 0) return new MyPost();
                                                    return new AnimatedColorBox(index)
                                                },
                                            }),

                                        }),
                                    })
                                })
                            }),
                            new Positioned({
                                bottom: 10,
                                right: 10,
                                child: new GestureDetector({
                                    onTap: () => {
                                        this._controller.animateTo(0, new Duration({ milliseconds: 300 }));
                                    },
                                    child: new Container({
                                        width: 40,
                                        height: 40,
                                        decoration: new BoxDecoration({
                                            backgroundColor: Colors.white,
                                            borderRadius: BorderRadius.all(100),
                                            shadows: [
                                                new BoxShadow({
                                                    shadowColor: Colors.black.withAlpha(54),
                                                    shadowOffsetY: 5,
                                                    shadowBlur: 10,
                                                })
                                            ]
                                        }),

                                        alignment: Alignment.center,
                                        child: new Text("↑"),
                                    })
                                })
                            }),
                        ]
                    })
                }),
                new Container({
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 20,
                        right: 20,
                    },
                    child: new Row({
                        children: [
                            new GestureDetector({
                                onTap: () => {
                                    this._controller.animateTo(this._controller.offset + 1000, new Duration({ milliseconds: 300 }));
                                },
                                child: new Text("加载更多"),
                            })

                        ]
                    }),
                    decoration: new BoxDecoration({
                        shadows: [
                            new BoxShadow({
                                shadowColor: Colors.black.withAlpha(54),
                                shadowOffsetY: -5,
                                shadowBlur: 10,
                            })
                        ]
                    })
                }),
            ]
        });
    }
}


class AnimatedColorBox extends StatefulWidget {
    constructor(public index: number) {
        super();
    }
    createState(): State {
        return new AnimatedColorBoxState();
    }
}
class AnimatedColorBoxState extends State<AnimatedColorBox> {
    private count: number = 0;
    private text: string = "";
    private controller: AnimationController;
    private randomColor: Color;
    private selected: boolean = false;
    public initState(): void {
        super.initState();
        this.controller = new AnimationController({
            duration: new Duration({ milliseconds: 300 }),
            curve: Curves.ease,
        });
        this.randomColor = this.getRandomColor();
        this.controller.addListener(() => {
            this.setState(() => {
                if (this.controller.isCompleted) {
                    // this.controller.reverse();
                }
            });
        });
        this.controller.forward();
        this.count = this.widget.index;
    }
    private getRandomColor(): Color {
        return Color.fromRGBA(
            Math.random() * 256,
            Math.random() * 256,
            Math.random() * 256,
            100
        );
    }
    build(context: BuildContext): Widget {
        return new GestureDetector({
            onTap: () => {
                this.setState(() => {
                    // this.randomColor = this.getRandomColor();
                    this.count += 10;
                });
            },
            child: Transform.translate({
                x: 300 - 300 * this.controller.value,
                child: Transform.scale({
                    scale: 1,// this.controller.value,
                    alignment: Alignment.center,
                    child: new Container({
                        decoration: new BoxDecoration({
                            backgroundColor: Colors.white,
                            border: Border.only({
                                bottom: new BorderSide({
                                    color: Colors.gray.withAlpha(54),
                                    width: 1,
                                })
                            })
                        }),

                        // width:100,
                        // height: 80,
                        // color:Colors.white,
                        child: new Align({
                            child: new GestureDetector({
                                onTap: () => {
                                    this.setState(()=>{
                                        this.randomColor=this.getRandomColor()
                                    });
                                },
                                child: this.buildUser()
                            }),
                        }),

                    }),
                })
            }),
        });
    }

    buildUser(): Widget {
        return new Padding({
            padding: {
                top: 10,
                right: 10,
                left: 10,
                bottom: 10,
            },
            child: new Row({
                children: [
                    new Container({
                        width: 40,
                        height: 40,
                        decoration: new BoxDecoration({
                            backgroundColor: this.randomColor,
                            borderRadius: BorderRadius.all(10)
                        }),
                        alignment: Alignment.center,
                        child: new Text(`${this.widget.index}`, {
                            style: new TextStyle({
                                overflow: TextOverflow.ellipsis,
                                color: Colors.white,
                                maxLines: 1,
                                fontSize: 16,
                            })
                        })
                    }),
                    new SizedBox({
                        width: 10,
                    }),
                    new Expanded({
                        child: new Column({
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                                new Text(`联系人` + this.widget.index, {
                                    style: new TextStyle({
                                        color: Colors.black,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                    })
                                }),
                                new SizedBox({
                                    width: 300,
                                    child: new Text(`${this.randomColor.rgba.toString()}`, {
                                        style: new TextStyle({
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            color: Colors.gray,
                                            fontSize: 13,
                                        })
                                    })
                                })
                            ]
                        })
                    })
                ]
            })
        })
    }
}
