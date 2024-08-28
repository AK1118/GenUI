// 三角函数
export const radiansPerDegree = Math.PI / 180;

export const sin = (angle: number): number => Math.sin(angle);

export const cos = (angle: number): number => Math.cos(angle);

export const tan = (angle: number): number => Math.tan(angle);

export const asin = (value: number): number => Math.asin(value);

export const acos = (value: number): number => Math.acos(value);

export const atan = (value: number): number => Math.atan(value);

export const atan2 = (y: number, x: number): number => Math.atan2(y, x);

// 幂函数和对数函数
export const pow = (base: number, exponent: number): number =>
  Math.pow(base, exponent);

export const sqrt = (value: number): number => Math.sqrt(value);

export const cbrt = (value: number): number => Math.cbrt(value);

export const exp = (value: number): number => Math.exp(value);

export const log = (value: number): number => Math.log(value);

export const log2 = (value: number): number => Math.log2(value);

export const log10 = (value: number): number => Math.log10(value);

// 四舍五入函数
export const round = (value: number): number => Math.round(value);

export const ceil = (value: number): number => Math.ceil(value);

export const floor = (value: number): number => Math.floor(value);

// 最大值和最小值
export const max = (...values: number[]): number => Math.max(...values);

export const min = (...values: number[]): number => Math.min(...values);

// 随机数
export const random = (): number => Math.random();

// 绝对值
export const abs = (value: number): number => Math.abs(value);

// 其他函数
export const sign = (value: number): number => Math.sign(value);

export const trunc = (value: number): number => Math.trunc(value);

// 计算小数部分
export const fract = (value: number): number => value - Math.floor(value);

// 二维矩阵旋转
export const rotate2D = (
  x: number,
  y: number,
  angle: number
): [number, number] => {
  /**
   *  cos(angle) - sin(angle) |
   *  sin(angle) + cos(angle) |
   */
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const newX = x * cosA - y * sinA;
  const newY = x * sinA + y * cosA;
  return [newX, newY];
};

export const clamp = (x: number, min: number, max: number) => {
  if (x < min) return min;
  if (x > max) return max;
  if(isNaN(x)) return max;
  return x;
};
