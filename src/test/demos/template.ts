import Painter from "@/lib/painting/painter";
import { Offset, Size } from "@/lib/basic/rect";
import {
  Align,
  ClipPath,
  ClipRRect,
  ColoredBox,
  CustomPaint,
  DecoratedBox,
  Expanded,
  Flex,
  GestureDetector,
  Image,
  Listener,
  Padding,
  Positioned,
  SizedBox,
  Stack,
  Text,
  Transform,
  ViewPort,
  WidgetToSliverAdapter,
  // ViewPort,
  Wrap,
} from "@/lib/widgets/basic";
import {
  MultiChildRenderObjectWidget,
  State,
  StatefulWidget,
  StatelessWidget,
  Widget,
} from "@/lib/basic/framework";
import Alignment from "@/lib/painting/alignment";
import { BoxConstraints } from "@/lib/rendering/constraints";
import Vector from "@/lib/math/vector";
import runApp, { BuildContext } from "@/index";
import {
  abs,
  cos,
  fract,
  radiansPerDegree,
  random,
  sin,
} from "@/lib/math/math";
import { GlobalKey } from "@/lib/basic/key";
import { getRandomColor, getRandomStrKey } from "@/lib/utils/utils";
import { Matrix4 } from "@/lib/math/matrix";
import { BoxDecoration } from "@/lib/painting/decoration";
import { BorderRadius } from "@/lib/painting/radius";
import { Border, BorderSide } from "@/lib/painting/borders";
import BoxShadow from "@/lib/painting/shadow";
import {
  Column,
  Container,
  Row,
  Scrollable,
  ScrollView,
  SingleChildScrollView,
} from "@/lib/widgets/widgets";
import { ImageSource } from "@/lib/painting/image";
import { BoxFit } from "@/lib/painting/box-fit";
import { ChangeNotifier, Listenable } from "@/lib/core/change-notifier";
import { ScrollPosition } from "@/lib/render-object/viewport";
import {
  BouncingScrollPhysics,
  SimpleScrollPhysics,
} from "@/lib/core/scroll-physics";
import { AnimationController, AnimationStatus } from "@/lib/core/animation";
import { Duration } from "@/lib/core/duration";
import {
  Axis,
  AxisDirection,
  CrossAxisAlignment,
  MainAxisAlignment,
  StackFit,
} from "@/lib/core/base-types";
import { ScrollBar, ScrollController } from "@/lib/widgets/scroll";
import { CustomClipper, CustomPainter } from "@/lib/rendering/custom";
import { Path2D } from "@/lib/rendering/path-2D";
import { GenPlatformConfig } from "@/lib/core/platform";
import { Colors, Color } from "@/lib/painting/color";
import {
  LinearGradient,
  RadialGradient,
  SweepGradient,
} from "@/lib/painting/gradient";
import {
  SliverChildBuilderDelegate,
  SliverChildDelegate,
  SliverList,
  SliverMultiBoxAdaptorElement,
  SliverMultiBoxAdaptorParentData,
  SliverMultiBoxAdaptorRenderView,
} from "@/lib/widgets/sliver";
import { NativeEventsBindingHandler } from "@/lib/native/events";
import EditText, { Editable, EditableText } from "@/lib/widgets/text";
import { NativeTextInputHandler, TextInput } from "@/lib/native/text-input";
//@ts-ignore
import eruda from "eruda";
import Stream from "@/lib/core/stream";
import ScreenUtils from "../screen-utils";
import MyPost from "../test";

const canvas: HTMLCanvasElement = document.querySelector("#canvas");
const img2: HTMLImageElement = document.querySelector("#bg");

const dev = window.devicePixelRatio;
const width = 300;
const height = 300;
console.log("DPR：", dev);
canvas.width = width * dev;
canvas.height = height * dev;
canvas.style.width = width + "px";
canvas.style.height = height + "px";

const g = canvas.getContext("2d", {
  // willReadFrequently: true,
});

GenPlatformConfig.InitInstance({
  screenWidth: width,
  screenHeight: height,
  devicePixelRatio: dev,
  debug: false,
  canvas: canvas,
  renderContext: g,
});

const eventCaller = new NativeEventsBindingHandler();
if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
  // Touch events for mobile devices
  window.addEventListener("touchstart", (e) => {
    eventCaller.applyEvent("touchstart", e);
  });
  window.addEventListener("touchmove", (e) => {
    eventCaller.applyEvent("touchmove", e);
  });
  window.addEventListener("touchend", (e) => {
    eventCaller.applyEvent("touchend", e);
  });
  window.addEventListener("touchcancel", (e) => {
    eventCaller.applyEvent("touchcancel", e);
  });
} else {
  window.addEventListener("mousedown", (e) => {
    eventCaller.applyEvent("mousedown", e);
  });
  window.addEventListener("mousemove", (e) => {
    eventCaller.applyEvent("mousemove", e);
  });
  window.addEventListener("mouseup", (e) => {
    eventCaller.applyEvent("mouseup", e);
  });
  window.addEventListener("mousedown", (e) => {
    eventCaller.applyEvent("mousedown", e);
  });
  window.addEventListener("wheel", (e) => {
    eventCaller.applyEvent("wheel", e);
  });
}

const nativeTextInputHandler = new NativeTextInputHandler();
const inputBar = document.querySelector("#inputbar") as HTMLInputElement;
inputBar.value = `อะ อัอา อิ อี อึ อื อุ อู เอะ เอ แอะ แอ เอาะ เอา เอิ เอีะ เอืะ เอื โอ ไอ ใอ อำอะ อัอา อิ อี อึ อื อุ อู เอะ เอ แอะ แอ เอาะ เอา เอิ เอีะ เอืะ เอื โอ ไอ ใอ อำ
More Docker. Easy Access. New Streamlined Plans. Learn more.
✕
docker
Hub
​
Search Docker Hub
ctrl+K

Explore
Official Images
mysql

mysql
Docker Official Image
•
1B+

•
10K+
MySQL is a widely used, open-source relational database management system (RDBMS).

docker pull mysql
Quick reference
Maintained by:
the Docker Community and the MySQL Team⁠

Where to get help:
the Docker Community Slack⁠, Server Fault⁠, Unix & Linux⁠, or Stack Overflow⁠

Supported tags and respective Dockerfile links
9.1.0, 9.1, 9, innovation, latest, 9.1.0-oraclelinux9, 9.1-oraclelinux9, 9-oraclelinux9, innovation-oraclelinux9, oraclelinux9, 9.1.0-oracle, 9.1-oracle, 9-oracle, innovation-oracle, oracle⁠

8.4.3, 8.4, 8, lts, 8.4.3-oraclelinux9, 8.4-oraclelinux9, 8-oraclelinux9, lts-oraclelinux9, 8.4.3-oracle, 8.4-oracle, 8-oracle, lts-oracle⁠

8.0.40, 8.0, 8.0.40-oraclelinux9, 8.0-oraclelinux9, 8.0.40-oracle, 8.0-oracle⁠

8.0.40-bookworm, 8.0-bookworm, 8.0.40-debian, 8.0-debian⁠

Quick reference (cont.)
Where to file issues:
https://github.com/docker-library/mysql/issues⁠

Supported architectures: (more info⁠)
amd64, arm64v8

Published image artifact details:
repo-info repo's repos/mysql/ directory⁠ (history⁠)
(image metadata, transfer size, etc)

Image updates:
official-images repo's library/mysql label⁠
official-images repo's library/mysql file⁠ (history⁠)

Source of this description:
docs repo's mysql/ directory⁠ (history⁠)

What is MySQL?
MySQL is the world's most popular open source database. With its proven performance, reliability and ease-of-use, MySQL has become the leading database choice for web-based applications, covering the entire range from personal projects and websites, via e-commerce and information services, all the way to high profile web properties including Facebook, Twitter, YouTube, Yahoo! and many more.

For more information and related downloads for MySQL Server and other MySQL products, please visit www.mysql.com⁠.

logo

How to use this image
Start a mysql server instance
Starting a MySQL instance is simple:

$ docker run --name some-mysql -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql:tag
... where some-mysql is the name you want to assign to your container, my-secret-pw is the password to be set for the MySQL root user and tag is the tag specifying the MySQL version you want. See the list above for relevant tags.

Connect to MySQL from the MySQL command line client
The following command starts another mysql container instance and runs the mysql command line client against your original mysql container, allowing you to execute SQL statements against your database instance:

$ docker run -it --network some-network --rm mysql mysql -hsome-mysql -uexample-user -p
... where some-mysql is the name of your original mysql container (connected to the some-network Docker network).

This image can also be used as a client for non-Docker or remote instances:

$ docker run -it --rm mysql mysql -hsome.mysql.host -usome-mysql-user -p
More information about the MySQL command line client can be found in the MySQL documentation⁠

... via docker-compose⁠ or docker stack deploy⁠
Example docker-compose.yml for mysql:

# Use root/example as user/password credentials
version: '3.1'

services:

  db:
    image: mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: example
    # (this is just an example, not intended to be a production configuration)
Try in PWD

Run docker stack deploy -c stack.yml mysql (or docker compose -f stack.yml up), wait for it to initialize completely, and visit http://swarm-ip:8080, http://localhost:8080, or http://host-ip:8080 (as appropriate).

Container shell access and viewing MySQL logs
The docker exec command allows you to run commands inside a Docker container. The following command line will give you a bash shell inside your mysql container:

$ docker exec -it some-mysql bash
The log is available through Docker's container log:

$ docker logs some-mysql
Using a custom MySQL configuration file
The default configuration for MySQL can be found in /etc/mysql/my.cnf, which may !includedir additional directories such as /etc/mysql/conf.d or /etc/mysql/mysql.conf.d. Please inspect the relevant files and directories within the mysql image itself for more details.

If /my/custom/config-file.cnf is the path and name of your custom configuration file, you can start your mysql container like this (note that only the directory path of the custom config file is used in this command):

$ docker run --name some-mysql -v /my/custom:/etc/mysql/conf.d -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql:tag
This will start a new container some-mysql where the MySQL instance uses the combined startup settings from /etc/mysql/my.cnf and /etc/mysql/conf.d/config-file.cnf, with settings from the latter taking precedence.

Configuration without a cnf file
Many configuration options can be passed as flags to mysqld. This will give you the flexibility to customize the container without needing a cnf file. For example, if you want to change the default encoding and collation for all tables to use UTF-8 (utf8mb4) just run the following:

$ docker run --name some-mysql -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql:tag --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
If you would like to see a complete list of available options, just run:

$ docker run -it --rm mysql:tag --verbose --help
Environment Variables
When you start the mysql image, you can adjust the configuration of the MySQL instance by passing one or more environment variables on the docker run command line. Do note that none of the variables below will have any effect if you start the container with a data directory that already contains a database: any pre-existing database will always be left untouched on container startup.

See also https://dev.mysql.com/doc/refman/5.7/en/environment-variables.html⁠ for documentation of environment variables which MySQL itself respects (especially variables like MYSQL_HOST, which is known to cause issues when used with this image).

MYSQL_ROOT_PASSWORD
This variable is mandatory and specifies the password that will be set for the MySQL root superuser account. In the above example, it was set to my-secret-pw.

MYSQL_DATABASE
This variable is optional and allows you to specify the name of a database to be created on image startup. If a user/password was supplied (see below) then that user will be granted superuser access (corresponding to GRANT ALL⁠) to this database.

MYSQL_USER, MYSQL_PASSWORD
These variables are optional, used in conjunction to create a new user and to set that user's password. This user will be granted superuser permissions (see above) for the database specified by the MYSQL_DATABASE variable. Both variables are required for a user to be created.

Do note that there is no need to use this mechanism to create the root superuser, that user gets created by default with the password specified by the MYSQL_ROOT_PASSWORD variable.

MYSQL_ALLOW_EMPTY_PASSWORD
This is an optional variable. Set to a non-empty value, like yes, to allow the container to be started with a blank password for the root user. NOTE: Setting this variable to yes is not recommended unless you really know what you are doing, since this will leave your MySQL instance completely unprotected, allowing anyone to gain complete superuser access.

MYSQL_RANDOM_ROOT_PASSWORD
This is an optional variable. Set to a non-empty value, like yes, to generate a random initial password for the root user (using pwgen). The generated root password will be printed to stdout (GENERATED ROOT PASSWORD: .....).

MYSQL_ONETIME_PASSWORD
Sets root (not the user specified in MYSQL_USER!) user as expired once init is complete, forcing a password change on first login. Any non-empty value will activate this setting. NOTE: This feature is supported on MySQL 5.6+ only. Using this option on MySQL 5.5 will throw an appropriate error during initialization.

MYSQL_INITDB_SKIP_TZINFO
By default, the entrypoint script automatically loads the timezone data needed for the CONVERT_TZ() function. If it is not needed, any non-empty value disables timezone loading.

Docker Secrets
As an alternative to passing sensitive information via environment variables, _FILE may be appended to the previously listed environment variables, causing the initialization script to load the values for those variables from files present in the container. In particular, this can be used to load passwords from Docker secrets stored in /run/secrets/<secret_name> files. For example:

$ docker run --name some-mysql -e MYSQL_ROOT_PASSWORD_FILE=/run/secrets/mysql-root -d mysql:tag
Currently, this is only supported for MYSQL_ROOT_PASSWORD, MYSQL_ROOT_HOST, MYSQL_DATABASE, MYSQL_USER, and MYSQL_PASSWORD.

Initializing a fresh instance
When a container is started for the first time, a new database with the specified name will be created and initialized with the provided configuration variables. Furthermore, it will execute files with extensions .sh, .sql and .sql.gz that are found in /docker-entrypoint-initdb.d. Files will be executed in alphabetical order. You can easily populate your mysql services by mounting a SQL dump into that directory⁠ and provide custom images⁠ with contributed data. SQL files will be imported by default to the database specified by the MYSQL_DATABASE variable.

Caveats
Where to Store Data
Important note: There are several ways to store data used by applications that run in Docker containers. We encourage users of the mysql images to familiarize themselves with the options available, including:

Let Docker manage the storage of your database data by writing the database files to disk on the host system using its own internal volume management⁠. This is the default and is easy and fairly transparent to the user. The downside is that the files may be hard to locate for tools and applications that run directly on the host system, i.e. outside containers.
Create a data directory on the host system (outside the container) and mount this to a directory visible from inside the container⁠. This places the database files in a known location on the host system, and makes it easy for tools and applications on the host system to access the files. The downside is that the user needs to make sure that the directory exists, and that e.g. directory permissions and other security mechanisms on the host system are set up correctly.
The Docker documentation is a good starting point for understanding the different storage options and variations, and there are multiple blogs and forum postings that discuss and give advice in this area. We will simply show the basic procedure here for the latter option above:

Create a data directory on a suitable volume on your host system, e.g. /my/own/datadir.

Start your mysql container like this:

$ docker run --name some-mysql -v /my/own/datadir:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql:tag
The -v /my/own/datadir:/var/lib/mysql part of the command mounts the /my/own/datadir directory from the underlying host system as /var/lib/mysql inside the container, where MySQL by default will write its data files.

No connections until MySQL init completes
If there is no database initialized when the container starts, then a default database will be created. While this is the expected behavior, this means that it will not accept incoming connections until such initialization completes. This may cause issues when using automation tools, such as Docker Compose, which start several containers simultaneously.

If the application you're trying to connect to MySQL does not handle MySQL downtime or waiting for MySQL to start gracefully, then putting a connect-retry loop before the service starts might be necessary. For an example of such an implementation in the official images, see WordPress⁠ or Bonita⁠.

Usage against an existing database
If you start your mysql container instance with a data directory that already contains a database (specifically, a mysql subdirectory), the $MYSQL_ROOT_PASSWORD variable should be omitted from the run command line; it will in any case be ignored, and the pre-existing database will not be changed in any way.

Running as an arbitrary user
If you know the permissions of your directory are already set appropriately (such as running against an existing database, as described above) or you have need of running mysqld with a specific UID/GID, it is possible to invoke this image with --user set to any value (other than root/0) in order to achieve the desired access/configuration:

$ mkdir data
$ ls -lnd data
drwxr-xr-x 2 1000 1000 4096 Aug 27 15:54 data
$ docker run -v "$PWD/data":/var/lib/mysql --user 1000:1000 --name some-mysql -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql:tag
Creating database dumps
Most of the normal tools will work, although their usage might be a little convoluted in some cases to ensure they have access to the mysqld server. A simple way to ensure this is to use docker exec and run the tool from the same container, similar to the following:

$ docker exec some-mysql sh -c 'exec mysqldump --all-databases -uroot -p"$MYSQL_ROOT_PASSWORD"' > /some/path/on/your/host/all-databases.sql
Restoring data from dump files
For restoring data. You can use docker exec command with -i flag, similar to the following:

$ docker exec -i some-mysql sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD"' < /some/path/on/your/host/all-databases.sql
License
View license information⁠ for the software contained in this image.

As with all Docker images, these likely also contain other software which may be under other licenses (such as Bash, etc from the base distribution, along with any direct or indirect dependencies of the primary software being contained).

Some additional license information which was able to be auto-detected might be found in the repo-info repository's mysql/ directory⁠.

As for any pre-built image usage, it is the image user's responsibility to ensure that any use of this image complies with any relevant licenses for all software contained within.

Recent tags
About Official Images
Docker Official Images are a curated set of Docker open source and drop-in solution repositories.

Why Official Images?
These images have clear documentation, promote best practices, and are designed for the most common use cases.

Why
Overview
What is a Container
Products
Product Overview
Product Offerings
Docker Desktop
Docker Hub
Features
Container Runtime
Developer Tools
Docker App
Kubernetes
Developers
Getting Started
Play with Docker
Community
Open Source
Documentation
Company
About Us
Resources
Blog
Customers
Partners
Newsroom
Events and Webinars
Careers
Contact Us
System Status⁠
© 2024 Docker, Inc. All rights reserved.
|
Terms of Service
|
Subscription Service Agreement
|
Privacy
|
Legal

Cookies Settings`;
nativeTextInputHandler.blurHandler(() => {
  inputBar.blur();
});
nativeTextInputHandler.focusHandler(() => {
  inputBar.focus();
});
nativeTextInputHandler.selectionHandler((newSelection) => {
  inputBar.selectionStart = newSelection.start;
  inputBar.selectionEnd = newSelection.end;
  console.log(inputBar.selectionStart, inputBar.selectionEnd);
});
inputBar.oninput = (e: InputEvent) => {
  nativeTextInputHandler.updateEditingValue(
    inputBar.value,
    inputBar.selectionStart,
    inputBar.selectionEnd
  );
};

inputBar.addEventListener("selectionchange", function (event) {
  nativeTextInputHandler.updateEditingValue(
    inputBar.value,
    inputBar.selectionStart,
    inputBar.selectionEnd
  );
});

export const screenUtil = new ScreenUtils({
  canvasWidth: canvas.width,
  canvasHeight: canvas.height,
  devicePixelRatio: dev,
});

class Scaffold extends StatefulWidget {
  createState(): State<Scaffold> {
    return new ScaffoldState();
  }
}

class MyListener extends ChangeNotifier {
  public counter: number = 0;
  trigger() {
    this.notifyListeners();
  }
  add() {
    this.counter += 1;
    this.notifyListeners();
  }
}

class MyCustomPainter extends CustomPainter {
  render(painter: Painter, size: Size): void {
    console.log("渲染", size);
    painter.fillStyle = "orange";
    painter.fillRect(0, 0, 10, 10);
  }
}
class MyForgoundCustomPainter extends CustomPainter {
  render(painter: Painter, size: Size): void {
    console.log("渲染", size);
    painter.fillStyle = "orange";
    // painter.clip();
    // painter.fillRect(0,0,10,10);
    painter.fillText("\ue89e\ue7cc", 10, 10);
  }
}

const controller = new ScrollController();
const controller2 = new ScrollController();

class Model extends ChangeNotifier {
  x: number = 0;
  y: number = 0;
  setXY(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.notifyListeners();
  }
}

class MyClipper extends CustomClipper {
  model: Model;
  constructor(model) {
    super(model);
    this.model = model;
    window.addEventListener("mousemove", (e) => {
      this.model.setXY(e.clientX, e.clientY);
    });
  }
  getClip(offset: Vector, size: Size): Path2D {
    const path2d = new Path2D();
    this.drawRoundedStar(
      path2d,
      this.model.x - offset.x,
      this.model.y - offset.y,
      10,
      100,
      50,
      10
    );
    // path2d.rect(0, 0, size.width, size.height);
    // path2d.arc(this.model.x-offset.x, this.model.y-offset.y, 50, 0, Math.PI * 2, true);
    return path2d;
  }
  drawRoundedStar(
    ctx: Path2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number,
    cornerRadius: number
  ): void {
    const angle = Math.PI / spikes;
    spikes += 1;
    let startX = cx + Math.cos(0) * outerRadius;
    let startY = cy + Math.sin(0) * outerRadius;
    ctx.moveTo(startX, startY);

    for (let i = 0; i < spikes * 2; i++) {
      const isOuter = i % 2 === 0;
      const radius = isOuter ? outerRadius : innerRadius;
      const nextX = cx + Math.cos(i * angle) * radius;
      const nextY = cy + Math.sin(i * angle) * radius;

      if (i === 0) {
        ctx.moveTo(nextX, nextY);
      } else {
        ctx.arcTo(startX, startY, nextX, nextY, cornerRadius);
      }

      startX = nextX;
      startY = nextY;
    }
  }
}


/**
 * updatePositions时创建一个
 *
 */
class ScaffoldState extends State<Scaffold> {
  private time: number = 1;
  private dy: number = 0;
  private preDeltaY: number = 0;
  private list: Array<number> = new Array(20).fill(0);
  public initState(): void {
    super.initState();
    console.log("创建A");
    // controller.addListener(() => {
    //   console.log("position", controller.offset);
    // });
    setTimeout(() => {
      // this.animateTo();
      // controller.animateTo(150*2000,new Duration({
      //   milliseconds:6000,
      // }))
      // this.setState(() => {
      //   this.time += 1;
      //   // this.list=new Array(30).fill(0);
      //   console.log("数据", this.list);
      // });
      // this.setState(()=>{
      //   this.list.push(...new Array(100).fill(0));
      // })
    }, 3000);
    controller.addListener(() => {
      if (controller.offset >= controller.position.maxScrollExtent - 200) {
        this.setState(() => {
          this.list.push(...new Array(10).fill(0));
        });
      }
    });
  }
  private animateTo() {
    controller
      .animateTo(
        Math.random() * controller.position.maxScrollExtent,
        new Duration({
          milliseconds: 3000,
        })
      )
      .then(() => {
        setTimeout(() => {
          this.animateTo();
        }, 3000);
      });
  }
  build(context: BuildContext): Widget {
    return new Container({
      width: canvas.width,
      height: canvas.height,
      padding: {
        top: 100,
        left: 0,
        right: 0,
        bottom: 100,
      },
      alignment: Alignment.center,
      decoration: new BoxDecoration({
        backgroundColor: new Color(0xffffffff),
      }),
      child: new Flex({
        direction: Axis.horizontal,
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          new Expanded({
            flex: 1,
            child: new Scrollable({
              controller: controller,
              axisDirection: AxisDirection.down,
              physics: new BouncingScrollPhysics(),
              viewportBuilder: (context, position) => {
                return new ViewPort({
                  offset: position,
                  axisDirection: position.axisDirection,
                  children: this.list.map((_, ndx) => {
                    return new WidgetToSliverAdapter({
                      child: new Container({
                        width: canvas.width,
                        // height: ,
                        color:
                          ndx % 2 === 0
                            ? new Color(0xffffffff)
                            : new Color(0xffedf2fa),
                        child: new Align({
                          alignment: Alignment.center,
                          child: new Button(ndx),
                        }),
                      }),
                    });
                  }),
                });
              },
            }),
          }),
        ],
      }),
    });
  }
}

class Button extends StatefulWidget {
  index: number;
  constructor(index: number) {
    super();
    this.index = index;
  }
  createState(): State {
    return new _ButtonState();
  }
}

class _ButtonState extends State<Button> {
  private time: number;
  public initState(): void {
    super.initState();
    this.time = this.widget.index;
  }
  build(context: BuildContext): Widget {
    return new Container({
      padding: {
        top: 10,
        bottom: 10,
        left: 20,
        right: 20,
      },
      // decoration: new BoxDecoration({
      //   backgroundColor: "#edf2fa",
      // }),
      child: new GestureDetector({
        onTap: () => {
          console.log("点击", this.time);
          this.setState(() => {
            this.time += 1;
          });
        },
        child: new Text(`${this.time}`),
      }),
    });
  }
}
/**
 * <i class="material-icons-round md-36">logout</i> &#x2014; material icon named "logout" (round).
 */
const test = "123";
const app =
  //  new Container({
  //   width: canvas.width,
  //   height: canvas.height,
  //   child: new Flex({
  //     children: Array.from(new Array(2).fill(0)).map((_, ndx) => new Button(ndx)),
  //   }),
  //});
  // new Scaffold();
  new MyPost();

class Test extends StatefulWidget {
  createState(): State {
    return new TestState();
  }
}
class TestState extends State<Test> {
  private count: number = 0;
  private text: string = "";
  private controller: AnimationController;
  private randomColor: Color;
  public initState(): void {
    super.initState();
    this.controller = new AnimationController({
      duration: new Duration({ milliseconds: 300 }),
    });
    this.randomColor = this.getRandomColor();
    this.controller.addListener(() => {
      this.setState(() => {
        if (this.controller.isCompleted) {
          // this.controller.reverse();
        }
      });
    });
    //setTimeout(() => {}, 100);
    this.controller.forward();
    canvas.onclick = () => {
      const inputDom: HTMLInputElement = document.getElementById(
        "inputbar"
      ) as HTMLInputElement;
      inputDom.focus();
      inputDom.oninput = (e) => {
        this.setState(() => {
          this.text = inputDom.value;
        });
      };
      // inputDom.addEventListener("input",(e)=>{
      //   console.log("输入",e)
      // })
    };

    window.onmousedown = () => {
      canvas.click();
    };
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
        // this.controller.forward();
        this.setState(() => {
          this.randomColor = this.getRandomColor();
          this.count += 10;
        });
      },
      child: Transform.scale({
        scale: this.controller.value,
        alignment: Alignment.center,
        child: new Container({
          decoration: new BoxDecoration({
            backgroundColor: Colors.white
              .withOpacity(0)
              .lerp(this.randomColor, this.controller.value),
          }),
          // width:100,
          height: this.controller.value * 40 + 40,
          // color:Colors.white,
          child: new Align({
            child: new Container({
              width: 30 + this.count,
              height: 30,
              child: new Text(`${this.count} ${this.text}`),
              color: this.getRandomColor(),
            }),
          }),
        }),
      }),
    });
  }
}

runApp(
  new Container({
    width: canvas.width,
    height: canvas.height,
    color: Colors.white,
    // child: new Align({
    //   alignment: Alignment.center,

    //   child: new GestureDetector({
    //     onTap: () => {
    //     },
    //     child: new Container({
    //       width: 30,
    //       height: 30,
    //       color: Colors.orange,
    //     }),
    //   }),
    // }),
    // child: new EditableText(),
    child:new SingleChildScrollView({
      // physics: new BouncingScrollPhysics(),
      child: new WidgetToSliverAdapter({
        child: new Padding({
          padding:{
            left:10,
            right:10,
          },
          child:new Column({children:[
            // new MyPost(),
            // new EditableText(),
            // new MyPost(),
            // new EditableText(),
            // new MyPost(),

          ]})
        })
      }),
    }),
  })
);
