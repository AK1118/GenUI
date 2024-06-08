# 使用方法

- 从`index.esm.js`内导入`pdfObserver`和`videoObserver`两个对象，从名字可知每个对象对应的使用场景，以下这两个对象统称为`监视器`。
- `监视器`都派生自`Observer`抽象类，所以以下的方法举例都写自`Observer`。
- 监视器的声明周期分为*start*,*update*,*dispose*。

    - *start*需要在合适的位置调用，比如在pdf或者视频加载完成后，用户准备观看时调用。
    - *update*必须在start调用后调用，它是用来唤醒|更新计时器的。例如，用户看pdf半天不会动一下，计时器到时间后会判定用户离开了，就停止计时。这是需要用户滑动一下鼠标滚轮触发该方法。
    - *dispose*即销毁该轮监视，调用此方法后将会清空之前所有的数据，包括监听、记录数据等，销毁后必须重新调用*start*才能继续使用该监视器。

- 注意：视频`videoObserver`在使用*start*前必须调用`videoObserver.setVideoEle(videoDom)`。
- 注意：当离开了屏幕，再次进入屏幕后，必须触发一次`Observer.update`才会再次进行监视。

# 添加监听回调

- `监视器`可被添加监听回调，可被监听包括：

    `
        interface ListenerType {
            start;
            dispose;
            cancel;
            hiddenWindow;
            displayWindow;
            update;
        }   
    `
- 监听方法为`Observer.addListeners(type,callback)`。注意：在dispose方法调用后这些监听方法将会被

# 获取最后记录时长

- `监视器`们都派生自Observer抽象类，它们都有一个共同的`Observer.getRecordTime():number`方法，该方法返回毫秒级数字。

# 例子

## PDF例子

`
    document.querySelector<HTMLButtonElement>("#continue").onclick = () => {
        console.log("离开pdf页面");
        pdfObserver.dispose();
    };
    document.querySelector<HTMLButtonElement>("#startpdf").onclick = () => {
        console.log("pdf加载完毕");
        pdfObserver.start();
    };
    document.addEventListener("scroll", () => {
        console.log("pdf页面滚动");
        pdfObserver.update();
    });
`


## Video例子

`
    const video = document.querySelector<HTMLVideoElement>("#video");
    videoObserver.setVideoEle(video);
    videoObserver.start();//视频加载完毕监听调用即可
`