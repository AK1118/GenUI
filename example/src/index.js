import runApp, {
  Align,
  Alignment,
  ColoredBox,
  Flex,
  Padding,
  Painter,
  SizeBox,
  SizedBox,
  StatelessWidget,
  Wrap,
} from "gen-ui";

const canvas = document.querySelector("#canvas");
const g = canvas.getContext("2d");
const painter = new Painter(g);

class App extends StatelessWidget {
  build() {
    return new SizedBox({
      width: canvas.width,
      height: canvas.height,
      child: new Padding({
        padding: {
          top: 10,
          left: 10,
        },
        child: new Wrap({
          spacing: 10,
          children: [
            new ColoredBox({
              color: "#6e7681",
              child: new SizeBox({
                width: 30,
                height: 30,
                child: new Align({
                    alignment:Alignment.center,
                  child: new ColoredBox({
                    color: "orange",
                    child: new SizedBox(10, 10),
                  }),
                }),
              }),
            }),
            new ColoredBox({
              color: "#6e7681",
              child: new SizeBox({
                width: 30,
                height: 30,
              }),
            }),
            new ColoredBox({
              color: "#6e7681",
              child: new SizeBox({
                width: 30,
                height: 30,
              }),
            }),
          ],
        }),
      }),
    });
  }
}

const app = new App();

runApp(app);
