import g6, {Graph, Item} from "@antv/g6"
import {isNil, includes} from "ramda";
import * as math from "mathjs";
import {PointOffset, Position, RectPoint, ShapeType} from "../types";
const calculationItemsBBox = g6.Util.calculationItemsBBox;

const SAT = require('sat');

const V = SAT.Vector;
const C = SAT.Circle;
const P = SAT.Polygon;
const B = SAT.Box;

export {
  calculationItemsBBox
};

/**
 * 生成GUID
 * @returns {string}
 */
export function guid(): string {
  const S4 = () => {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4())
}

export const hasInclude = includes;

/**
 * 获取指定小数位数的值
 * @param num {number} 数值
 * @param [round = 2] {number} 小数位数
 * @returns {NoLiteralType<math.MathNumericType | math.MathCollection>|*}
 */
export function roundNum(num: number, round: number = 2) {
  if (isNil(num)) {
    return num
  }
  return math.round(num, round)
}

/**
 * 检测div是否超出边界
 * @param div
 * @returns {{over: boolean, top: boolean, left: boolean, bottom: boolean, right: boolean}}
 */
export function isDivOutOfBounds(div: HTMLElement) {
  if (!div) {
    return {over: false, top: false, left: false, bottom: false, right: false};
  }
  const rect = div.getBoundingClientRect();
  const top = rect.top < 0, left = rect.left < 0,
      bottom = rect.bottom > (window.innerHeight || document.documentElement.clientHeight),
    right = rect.right > (window.innerWidth || document.documentElement.clientWidth);

  const over = (top || left || bottom || right);
  return {over, top, left, bottom, right}
}

/**
 * Antd很多提示、输入组件都是默认渲染在body上的，此方法可以让其渲染在父节点上
 * @example
 *    getPopupContainer={getPopupContainer}
 * @param node
 * @return {*}
 */
export function getPopupContainer(node: any) {
  return node ? node.parentElement : document.body
}

/**
 * 2D图形碰撞检测
 * @param a {object} item，图形含宽高，坐标及类型
 * @param b {object} item，图形含宽高，坐标及类型
 * @returns {boolean} 是否碰撞
 */
export function isOverlap(a: RectPoint, b: RectPoint): boolean {
  // 两椭圆是否碰撞
  if (a.shapeType === "circle" && b.shapeType === "circle") {
    const circle1 = new C(new V(a.x, a.y), 65);
    const circle2 = new C(new V(b.x, b.y), 65);
    return SAT.testCircleCircle(circle1, circle2);
  }
  // 圆形与矩形碰撞检测
  if (a.shapeType === "circle" && b.shapeType === "rect") {
    const circle = new C(new V(a.x, a.y), 65);
    const box = new B(new V(b.x, b.y), b.width, b.height).toPolygon();
    return SAT.testCirclePolygon(circle, box);
  }
  // 矩形与圆形碰撞检测
  if (a.shapeType === "rect" && b.shapeType === "circle") {
    const circle = new C(new V(b.x, b.y), 65);
    const box = new B(new V(a.x, a.y), a.width, a.height).toPolygon();
    return SAT.testPolygonCircle(box, circle);
  }
  // 矩形与矩形碰撞检测
  if (a.shapeType === "rect" && b.shapeType === "rect") {
    const box1 = new B(new V(a.x, a.y), a.width, a.height).toPolygon();
    const box2 = new B(new V(b.x, b.y), b.width, b.height).toPolygon();
    return SAT.testPolygonPolygon(box1, box2);
  }
  return false
}

/**
 * 根据现有节点位置计算偏移后的坐标
 * @param posList {*[]} 现有节点的所有坐标列表
 * @param width {number} 现有节点的宽
 * @param height {number} 现有节点的高
 * @param x {number} 现有节点的坐标
 * @param y {number} 现有节点的坐标
 * @param position {string} 计算的方位
 * @param shapeType {'circle' | 'rect'} 节点的形状,圆形或者矩形
 * @param [type] {string} 源节点的type
 * @returns {{x, y}} 新的坐标
 */
export function getInsertNodeOffset(posList: any[], width: number, height: number, x: number, y: number, position: Position, shapeType: ShapeType): PointOffset {
  let newX = x;
  let newY = y;

  const newInfo = { x: newX, y: newY, width: width, height: height, shapeType};
  let attempts = 0;
  const maxAttempts = 500; // 设置一个尝试次数上限，避免无限循环

  function detectCollision(newItem: RectPoint, items: any[]) {
    for (let i = 0; i < items.length; i++) {
      const existingItem = items[i];
      if (isOverlap(newItem, existingItem)) {
        return true; // 碰撞
      }
    }
    return false; // 未碰撞
  }

  // 检查新位置是否与 posList 数组中的任何坐标重叠
  while (detectCollision(newInfo, posList)) {
    attempts++;
    if (attempts > maxAttempts) {
      console.error('Exceeded maximum attempts.');
      return {x: newInfo.x, y: newInfo.y};
    }
    switch (position) {
      case 'up':
        newInfo.y -= roundNum(height / 2);
        break;
      case 'down':
        newInfo.y += roundNum(height / 2);
        break;
      case 'left':
        newInfo.x -= roundNum(height / 2);
        break;
      case 'right':
        newInfo.x += roundNum(height / 2);
        break;
    }
  }

  return { x: newInfo.x, y: newInfo.y };
}

/**
 * 获取不重合的节点位置
 * @param graph {Graph}
 * @param item {Item}
 * @return {PointOffset} 计算后的位置
 */
export function getNonOverlapOffset(graph: Graph, item: Item): PointOffset {
  const nodes = graph.getNodes();
  const itemInfo = item.getBBox();
  const offset = getInsertNodeOffset(
    nodes.map(c => {
      const {x, y, width, height} = c.getBBox();
      return {
        x, y, width, height, shapeType: "rect",
      }
    }),
    itemInfo.width,
    itemInfo.height,
    itemInfo.x,
    itemInfo.y,
    "down",
    "rect"
  )
  console.log("最终偏移值：",offset)
  return offset
}