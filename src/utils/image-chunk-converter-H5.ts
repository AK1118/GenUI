import ImageChunkConverter from "../abstract/image-chunk-converter";
import { ImageChunk } from "../types/index";
const pako=require("pako");
/**
 * 切片解析器--H5
 * */
class ImageChunkConverterH5 extends ImageChunkConverter{
    chunkToBase64(chunk: ImageChunk): ImageChunk  {
        const base64 =pako.deflate(chunk.imageData.data);
         chunk.base64 = base64;
         chunk.imageData = null;
         return chunk;
     }
    base64ToChunk(chunk: ImageChunk): ImageChunk  {
        
        const a: ImageChunk = chunk;
    //    console.log(a.base64);
        const arr = pako.inflate(a.base64);
        // console.log(arr)
        const imageData = new ImageData(a.width, a.height, {
            colorSpace: "srgb"
        });
        imageData.data.set(arr);
        a.imageData = imageData;
        a.base64 = null;
        return a;
    }
}

export default ImageChunkConverterH5;