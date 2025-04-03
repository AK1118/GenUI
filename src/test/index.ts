import { TextInputStreamDemo } from "./demos/text-input-stream";
import "./demos/template"
// TextInputStreamDemo();


function readonly(target: User, key: string,): void {
    console.log("注解生效", target, key);
}




class User {
    @readonly
    name: string = "测试";
}


class B {
    @readonly
    name: string = "测试2";
}
// new User().name="测试2";


const fetchImage = async () => {
    const res = await fetch("https://dummyimage.com/200x300/000/fff");
    const blob = await res.arrayBuffer();
    const buffer = new Uint8Array(blob);
    const blob2 = new Blob([buffer], { type: "image/png" });
    const url = URL.createObjectURL(blob2);
    const img = document.createElement("img");
    img.src = url;
    document.body.appendChild(img);
    return url;

}

fetchImage();


