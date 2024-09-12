export class Queue<T> {
  public list: Array<T> = new Array<T>();
  public push(value: T) {
    this.list.push(value);
  }
  public addFirst(value: T) {
    this.list.push(value);
  }
  public addLast(value: T) {
    this.list.unshift(value);
  }
  public removeFirst(): T {
    return this.list.shift();
  }
  public removeLast(): T {
    return this.list.pop();
  }
  public get size(): number {
    return this.list.length;
  }
  public get isEmpty(): boolean {
    return this.size === 0;
  }
  public clear() {
    this.list = [];
  }
}

export const getRandomColor = (): string => {
  // 生成一个随机的颜色值
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const getRandomStrKey=()=>{
  return  Math.random().toString(16).substring(3);
}


export const clone=<T>(object:T):T=>{
  return structuredClone(object);
}