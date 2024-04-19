// 生成 0 到 max 之间的随机整数（不包括 max）
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// 生成 min 到 max 之间的随机整数（包括 min 但不包括 max）
function getRandomIntInRange(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function getMouseDirection(maxX, maxY, minX, minY, canvasX, canvasY) {
  // 计算鼠标点击位置相对于矩形中心的偏移量
  const offsetX = canvasX - (minX + maxX) / 2;
  const offsetY = canvasY - (minY + maxY) / 2;

  // 计算方位
  let direction = '';

  if (offsetX < 0 && offsetY < 0) {
    direction = 'lt'; // 左上
  } else if (offsetX > 0 && offsetY < 0) {
    direction = 'rt'; // 右上
  } else if (offsetX < 0 && offsetY > 0) {
    direction = 'lb'; // 左下
  } else if (offsetX > 0 && offsetY > 0) {
    direction = 'rb'; // 右下
  } else if (offsetX < 0 && offsetY === 0) {
    direction = 'l'; // 左
  } else if (offsetX > 0 && offsetY === 0) {
    direction = 'r'; // 右
  } else if (offsetX === 0 && offsetY < 0) {
    direction = 't'; // 上
  } else if (offsetX === 0 && offsetY > 0) {
    direction = 'b'; // 下
  }

  return direction;
}

export default function getXY(item) {
  const start = {
      x: item.startPoint.x,
      y: item.startPoint.y,
    },
    end = {
      x: item.endPoint.x,
      y: item.endPoint.y,
    };
  const model = item;
  let sIndex = model?.startPoint?.anchorIndex, eIndex = model?.endPoint?.anchorIndex;
  if (item.source === 'START' && sIndex !== 0) {
    sIndex += 1
  }
  if (item.target === "START" && eIndex !== 0) {
    eIndex += 1;
  }

  const sourceBox = window.graph?.findById?.(item.source)?.getBBox?.(),
    targetBox = window.graph?.findById?.(item.target)?.getBBox?.();

  // 目标节点在源节点的方位
  const pos = targetBox ? getMouseDirection(
    sourceBox.maxX,
    sourceBox.maxY,
    sourceBox.minX,
    sourceBox.minY,
    targetBox.centerX,
    targetBox.centerY,
  ) : "";

  const isTop = pos.indexOf("t") > -1;
  const isLeft = pos.indexOf("l") > -1;

  const startWidth = sourceBox.width;
  const endWidth = targetBox?.width ?? sourceBox.width;

  const [width, height] = [end.x - start.x, end.y - start.y];

  const xDis = end.x - start.x;
  const yDis = end.y - start.y;
  let p1 = {}, p2 = {}, p3 = {}, c1 = {}, p4 = {}, c2 = {},
    p5 = {}, c3 = {}, c4 = {}, p6 = {}, p7 = {}, p8 = {};
  let comb = `${sIndex}/${eIndex}`;
  let offset = 10;
  const minOffset = 10;

  if (model.offsetX) {
    offset = model.offsetX;
  }
  if (model.offsetY) {
    offset = model.offsetY
  }
  switch (comb) {
    case "1/1":
      return [
        ['M', start.x, start.y],
        ['L', start.x, isTop ? end.y - minOffset - targetBox.height / 2 : start.y - offset],
        ['L', end.x, isTop ? end.y - minOffset - targetBox.height / 2 : start.y - offset],
        ['L', end.x, end.y]
      ]
    case "1/3":
      if (isTop) {
        return [
          ['M', start.x, start.y],
          ["L", start.x, end.y - height / 2],
          ["L", end.x, end.y - height / 2],
          ['L', end.x, end.y],
        ]
      }
      return [
        ['M', start.x, start.y],
        ["L", start.x, start.y - offset],
        ['L', end.x + targetBox.width / 2 + minOffset, start.y - offset],
        ['L', end.x + targetBox.width / 2 + minOffset, end.y + targetBox.height],
        ['L', end.x, end.y + targetBox.height],
        ['L', end.x, end.y],
      ]
    case "3/1":
      if (!isTop) {
        return [
          ['M', start.x, start.y],
          ["L", start.x, end.y - height / 2],
          ["L", end.x, end.y - height / 2],
          ['L', end.x, end.y],
        ]
      }
      return [
        ['M', start.x, start.y],
        ["L", start.x, start.y + offset],
        ['L', end.x + targetBox.width / 2 + minOffset, start.y + offset],
        ['L', end.x + targetBox.width / 2 + minOffset, end.y - targetBox.height],
        ['L', end.x, end.y - targetBox.height],
        ['L', end.x, end.y],
      ]
    case "3/3":
      if (!isTop) {
        return [
          ['M', start.x, start.y],
          ["L", start.x, end.y + targetBox.height],
          ["L", end.x, end.y + targetBox.height],
          ['L', end.x, end.y],
        ]
      }
      return [
        ['M', start.x, start.y],
        ["L", start.x, start.y + offset],
        ["L", end.x, start.y + offset],
        ['L', end.x, end.y],
      ]
    case '2/2':
    case '0/0':
      if (Math.abs(endWidth / 2 - startWidth / 2 - xDis) > offset) {
        // 有问题
        offset = Math.abs(endWidth / 2 - startWidth / 2 - xDis) + offset;
      }
      if (comb === '0/0') {
        offset = -offset;
      }
      return [
        ['M', start.x, start.y],
        ['L', start.x + offset, start.y],
        ['L', start.x + offset, end.y],
        ['L', end.x, end.y]
      ]
    case '2/0':
    case '0/2':
      if ((comb === "2/0" && end.x < start.x) || (comb === "0/2" && end.x > start.x)) {
        if (comb === "2/0") {
          offset = 20;
        }
        if (comb === "0/2") {
          offset = -20;
        }
        return [
          ['M', start.x, start.y],
          ['L', start.x + offset, start.y],
          ['L', start.x + offset, start.y + yDis / 2],
          ['L', end.x - offset, start.y + yDis / 2],
          ['L', end.x - offset, end.y],
          ['L', end.x, end.y],
        ]

      } else {
        return [
          ['M', start.x, start.y],
          ['L', start.x + xDis / 2, start.y],
          ['L', start.x + xDis / 2, end.y],
          ['L', end.x, end.y]
        ]
      }
    case '2/1':
      if (isTop) {
        return [
          ['M', start.x, start.y],
          ["L", start.x + targetBox.width, start.y],
          ["L", start.x + targetBox.width, end.y - minOffset],
          ["L", end.x, end.y - minOffset],
          ['L', end.x, end.y],
        ]
      }
      if (!isTop && isLeft) {
        return [
          ['M', start.x, start.y],
          ["L", start.x + minOffset, start.y],
          ["L", start.x + minOffset, height / 2],
          ["L", end.x, height / 2],
          ['L', end.x, end.y],
        ]
      }
      return [
        ['M', start.x, start.y],
        ['L', end.x, start.y],
        ['L', end.x, end.y],
      ]
    case '0/1':
      if (isTop) {
        return [
          ['M', start.x, start.y],
          ["L", start.x - offset, start.y],
          ["L", start.x - offset, end.y - minOffset],
          ["L", end.x, end.y - minOffset],
          ['L', end.x, end.y],
        ]
      }
      if (isLeft) {
        return [
          ['M', start.x, start.y],
          ['L', end.x, start.y],
          ['L', end.x, end.y],
        ]
      }
      return [
        ['M', start.x, start.y],
        ['L', start.x - offset, start.y],
        ['L', start.x - offset, start.y + yDis / 2],
        ['L', end.x, start.y + yDis / 2],
        ['L', end.x, end.y],
      ]
    case '1/0':
      if (pos === "lt") {
        return [
          ['M', start.x, start.y],
          ['L', start.x, end.y - minOffset - height / 2],
          ['L', end.x - offset, end.y - minOffset - height / 2],
          ["L", end.x - offset, end.y],
          ['L', end.x, end.y],
        ]
      }
      if (pos === "lb") {
        return [
          ['M', start.x, start.y],
          ['L', start.x, end.y - minOffset - height / 2],
          ['L', end.x - offset, end.y],
          ['L', end.x, end.y],
        ]
      }
      if (isTop) {
        return [
          ['M', start.x, start.y],
          ['L', start.x, end.y],
          ['L', end.x, end.y],
        ]
      }
      return [
        ['M', start.x, start.y],
        ['L', start.x, start.y - minOffset],
        ['L', start.x + width / 2 + minOffset, start.y - minOffset],
        ['L', start.x + width / 2 + minOffset, end.y],
        ['L', end.x, end.y],
      ]
    case '1/2':
      if (isTop && isLeft) {
        return [
          ['M', start.x, start.y],
          ['L', start.x, end.y],
          ['L', end.x, end.y],
        ]
      }
      return [
        ['M', start.x, start.y],
        ["L", start.x, start.y - minOffset],
        ['L', start.x + targetBox.maxX, start.y - minOffset],
        ['L', start.x + targetBox.maxX, end.y],
        ['L', end.x, end.y],
      ]
    case '3/0':
      if (isTop) {
        return [
          ['M', start.x, start.y],
          ['L', start.x, start.y + offset],
          ["L", end.x - offset, start.y + offset],
          ["L", end.x - offset, end.y],
          ['L', end.x, end.y],
        ]
      }
      if (!isTop && isLeft) {
        return [
          ['M', start.x, start.y],
          ['L', start.x, end.y - height / 2 ],
          ["L", end.x - offset, end.y - height / 2],
          ["L", end.x - offset, end.y],
          ['L', end.x, end.y],
        ]
      }
      return [
        ['M', start.x, start.y],
        ['L', start.x, end.y],
        ['L', end.x, end.y],
      ]
    case '0/3':
    case '3/2':
    case '2/3':
      if ((comb === "0/3" && end.x > start.x) || (comb === "3/0" && end.x < start.x) || (comb === "3/2" && end.x > start.x) || (comb === "2/3" && end.x < start.x)) {

        offset = 20;
        if (comb === "3/0" || comb === "0/3") {
          offset = -20;
        }
        if ((comb === "3/0" && end.x < start.x) || (comb === "3/2" && end.x > start.x)) {
          if (comb === "3/0" && isLeft && isTop) {
            p1.x = start.x;
            p1.y = start.y + offset;
            p3.x = end.x - offset;
            p3.y = end.y;
            p5.x = end.x - offset;
            p5.y = end.y;
          } else {
            p1.x = start.x;
            p1.y = start.y + yDis / 2
            c1.x = start.x;
            c1.y = start.y + yDis / 2;
            p2.x = c1.x;
            p2.y = c1.y;

            p3.x = end.x + offset;
            p3.y = c1.y;
            c2.x = end.x + offset;
            c2.y = c1.y;
            p4.x = c2.x;
            p4.y = c2.y;

            p5.x = c2.x;
            p5.y = end.y
            c3.x = c2.x;
            c3.y = end.y;
            p6.x = c3.x;
            p6.y = end.y;
          }

        } else {
          p1.x = start.x + offset;
          p1.y = start.y;

          c1.x = start.x + offset;
          c1.y = start.y;
          p2.x = c1.x;
          p2.y = c1.y;

          p3.x = c1.x;
          p3.y = start.y + yDis / 2;
          c2.x = c1.x;
          c2.y = start.y + yDis / 2;
          p4.x = c2.x;
          p4.y = c2.y;

          p5.x = end.x;
          p5.y = c2.y
          c3.x = end.x;
          c3.y = c2.y;
          p6.x = end.x;
          p6.y = c2.y;
        }
        return [
          ['M', start.x, start.y],
          ['L', p1.x, p1.y],
          ['L', p3.x, p3.y],
          ['L', p5.x, p5.y],
          ['L', end.x, end.y],
        ]
      } else {
        if (comb === "3/0" || comb === "3/2") {
          p1.x = start.x;
          p1.y = end.y;
          c1.x = start.x;
          c1.y = end.y;
          p2.x = c1.x;
          p2.y = end.y;
        }
        if (comb === "0/3" || comb === "2/3") {
          p1.x = end.x;
          p1.y = start.y;
          c1.x = end.x;
          c1.y = start.y;
          p2.x = c1.x;
          p2.y = c1.y;
        }
        return [
          ['M', start.x, start.y],
          ['L', p1.x, p1.y],
          ['L', end.x, end.y],
        ]
      }
    default:
      p1.x = start.x
      p1.y = start.y + yDis / 2;
      c1.x = start.x
      c1.y = start.y + yDis / 2;
      p2.x = xDis < 0 ? start.x : start.x;
      p2.y = start.y + yDis / 2;
      p3.x = xDis < 0 ? start.x + xDis : start.x + xDis;
      p3.y = c1.y;
      c2.x = start.x + xDis;
      c2.y = c1.y;
      p4.x = start.x + xDis;
      p4.y = c1.y;

      p5.x = end.x;
      p5.y = end.y;
      return [['M', start.x, start.y], ['L', p1.x, p1.y],
        ['L', p3.x, p3.y],
        ['L', p5.x, p5.y]
      ]
  }
}
