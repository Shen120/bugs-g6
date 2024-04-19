import {G6Event, IG6GraphEvent} from "@antv/g6-core";
import {isNil, mergeDeepRight} from "ramda";
import {Item} from "@antv/g6";
import {cloneDeep} from "lodash";

enum Pos {
  h = "horizontal",
  v = "vertical",
  n = "none",
}

type Path = [string, number, number][];
type Segments = {
  start: {x: number, y: number},
  end: {x: number, y: number},
};

export default {

  dragItem: null as (Item | null),
  isDragging: false as boolean,
  pathData: [] as Path,
  segments: [] as Segments[],
  draggingSegmentIndex: null as (number | null),
  offset: null as ({x: number, y: number, realX: number, realY: number} | null),
  pathOffset: {
    vertical: new Set(),
    horizontal: new Set(),
  } as {
    vertical: Set<number>,
    horizontal: Set<number>,
  },
  moveLine: undefined as any,
  origin: {x: 0, y: 0, canvasX: 0, canvasY: 0},
  originOffset: undefined as any,
  dragPos: Pos.n as Pos,
  segmentOffset: {} as any,
  threshold: 10,

  getDefaultCfg(): object {
    return {};
  },

  getEvents(): { [key in G6Event]?: string } {
    return {
      'edge:mousedown': 'onDragStart',
      'edge:mousemove': 'onDrag',
      'edge:mouseup': 'onDragEnd',
    };
  },

  onDragStart(e: IG6GraphEvent) {
    console.log(33333)
    const {item, canvasX, canvasY} = e;
    const {graph} = this as any;
    if (!item) {
      return
    }
    const type = item.getType();
    if (type !== "edge") {
      return;
    }
    this.dragItem = e.item;
    this.origin = {
      x: e.x,
      y: e.y,
      canvasX, canvasY
    };
    // const edge = item.getModel();
    //
    // const linePath: Path = item.getKeyShape().attr().path;
    // this.pathData = linePath;
    // this.originOffset = edge?.pathOffset ?? undefined;
    // // @ts-ignore
    // this.segmentOffset = edge?.pathOffset?.segmentOffset ?? {};
    // this.segments = this.pathDataToSegments(linePath);
    // const point = graph.getPointByCanvas(canvasX, canvasY)
    // const segmentIndex = this.checkClickOnSegment(point.x, point.y);
    // if (segmentIndex !== -1) {
    //   if (segmentIndex === 0 || segmentIndex === this.segments.length - 1) {
    //     return
    //   }
    //   this.draggingSegmentIndex = segmentIndex;
    //   this.isDragging = true;
    // }

  },

  // 把path转换为线段
  pathDataToSegments(pathData: Path): Segments[] {
    return pathData.slice(1).map((point, index) => ({
      start: { x: pathData[index][1], y: pathData[index][2] },
      end: { x: point[1], y: point[2] }
    }));
  },

  segmentsToPath(segments: Segments[]): Path {
    if (segments.length === 0) return [];
    const pathArray: Path = [
      ['M', segments[0].start.x, segments[0].start.y]
    ];
    segments.forEach(segment => {
      pathArray.push(['L', segment.end.x, segment.end.y]);
    });
    return pathArray;
  },

  // 检查点击是否在某个线段上
  checkClickOnSegment(x: number, y: number) {
    const threshold = 10; // 点击灵敏度
    return this.segments.findIndex(segment => {
      const dx = segment.end.x - segment.start.x;
      const dy = segment.end.y - segment.start.y;
      if (dx === 0) { // 垂直线段
        return Math.abs(x - segment.start.x) <= threshold && y >= Math.min(segment.start.y, segment.end.y) && y <= Math.max(segment.start.y, segment.end.y);
      } else if (dy === 0) { // 水平线段
        return Math.abs(y - segment.start.y) <= threshold && x >= Math.min(segment.start.x, segment.end.x) && x <= Math.max(segment.start.x, segment.end.x);
      }
      return false;
    });
  },

  // 更新线段位置
  updateSegment(e: any, index: number, dx: number, dy: number) {
    const pathData = this.pathData, segments = cloneDeep(this.segments);
    if (index < 0 || index >= segments.length) return;
    const {graph} = this as any;
    const segment = segments[index];
    let pos: Pos = Pos.n;
    if (segment.start.x === segment.end.x) { // 垂直线段
      // segment.start.x += dx;
      // segment.end.x += dx;
      this.segmentOffset[index] = mergeDeepRight(this.segmentOffset[index], {
        x: {
          start: segment.start.x += dx,
          end: segment.end.x += dx,
        }
      })
      pos = Pos.v;
      this.pathOffset.horizontal.add(index);
      if (index > 0) { // 伸缩前一个水平线段
        // segments[index - 1].end.x += dx;
        this.pathOffset.horizontal.add(index - 1);
        this.segmentOffset[index - 1] = mergeDeepRight(this.segmentOffset[index - 1], {
          x: {
            end: segments[index - 1].end.x += dx,
          }
        })
      }
      if (index < segments.length - 1) { // 伸缩后一个水平线段
        // segments[index + 1].start.x += dx;
        this.pathOffset.horizontal.add(index + 1);
        this.segmentOffset[index + 1] = mergeDeepRight(this.segmentOffset[index + 1], {
          x: {
            start: segments[index + 1].start.x += dx,
          }
        })
      }
    } else if (segment.start.y === segment.end.y) { // 水平线段
      pos = Pos.h;
      // segment.start.y += dy;
      // segment.end.y += dy;
      this.pathOffset.vertical.add(index);
      this.segmentOffset[index] = mergeDeepRight(this.segmentOffset[index], {
        y: {
          start: segment.start.y += dy,
          end: segment.end.y += dy,
        }
      })
      if (index > 0) { // 伸缩前一个垂直线段
        // segments[index - 1].end.y += dy;
        this.pathOffset.vertical.add(index - 1);
        this.segmentOffset[index - 1] = mergeDeepRight(this.segmentOffset[index - 1], {
          y: {
            end: segments[index - 1].end.y += dy,
          }
        })
      }
      if (index < segments.length - 1) { // 伸缩后一个垂直线段
        // segments[index + 1].start.y += dy;
        this.pathOffset.vertical.add(index + 1);
        this.segmentOffset[index + 1] = mergeDeepRight(this.segmentOffset[index + 1], {
          y: {
            start: segments[index + 1].start.y += dy,
          }
        })
      }
    }
    this.dragPos = pos;
    // 更新pathData
    // pathData[index + 1] = ['L', segment.end.x, segment.end.y];
    // if (index > 0) {
    //   pathData[index] = ['L', segment.start.x, segment.start.y];
    // }

    const parent = graph.get('group');
    if (this.moveLine) {
      this.moveLine.attr({
        path: [
          ['M', this.origin.x, this.origin.y],
          ['L', pos === Pos.v ? e.x : this.origin.x, pos === Pos.v ? this.origin.y : e.y]
        ],
      })
    } else {
      this.moveLine = parent.addShape('path', {
        attrs: {
          path: [
            ['M', this.origin.x, this.origin.y],
            ['L', pos === Pos.v ? e.x : this.origin.x, pos === Pos.v ? this.origin.y : e.y]
          ],
          endArrow: true,
          stroke: 'blue',
          lineWidth: 1
        }
      })
    }

    graph.paint();
  },

  onDrag(e: IG6GraphEvent) {
    const {item} = e;
    const {canvasX, canvasY, x, y} = this.origin;
    const {graph} = this as any;
    // 大于阈值才允许拖拽
    const more = Math.abs(e.x - x) >= this.threshold || Math.abs(e.y - y) >= this.threshold;
    if (!item || !more) {
      return;
    }
    const edge = item.getModel();

    const linePath: Path = item.getKeyShape().attr().path;
    this.pathData = linePath;
    this.originOffset = edge?.pathOffset ?? undefined;
    // @ts-ignore
    this.segmentOffset = edge?.pathOffset?.segmentOffset ?? {};
    this.segments = this.pathDataToSegments(linePath);
    const point = graph.getPointByCanvas(canvasX, canvasY)
    const segmentIndex = this.checkClickOnSegment(point.x, point.y);
    if (segmentIndex !== -1) {
      if (segmentIndex === 0 || segmentIndex === this.segments.length - 1) {
        return
      }
      this.draggingSegmentIndex = segmentIndex;
      this.isDragging = true;
    }

    if (this.isDragging && !isNil(this.draggingSegmentIndex)) {
      const {graph} = this as any;
      const mousePoint = graph.getPointByCanvas(e.canvasX, e.canvasY);

      const originPoint = graph.getPointByCanvas(this.origin.x, this.origin.y);
      this.offset = {
        realX: mousePoint.x - originPoint.x,
        realY: mousePoint.y - originPoint.y,
        x: e.x - this.origin.x,
        y: e.y - this.origin.y,
      };
      this.updateSegment(e, this.draggingSegmentIndex!, this.offset.x, this.offset.y);
    }
  },

  onDragEnd(e: IG6GraphEvent) {
    if (!this.isDragging || isNil(this.draggingSegmentIndex)) {
      this.destroy();
      return
    }
    const {graph} = this as any;

    let result: any = {
      currentIdx: this.draggingSegmentIndex,
      segmentLen: this.segments.length,
      dragPos: this.dragPos,
      segmentOffset: this.segmentOffset,
      hasDrag: !isNil(this.draggingSegmentIndex) && (this.pathOffset.horizontal.size > 0 || this.pathOffset.vertical.size > 0) && Object.keys(this.segmentOffset).length > 0,
    };

    console.log("拖拽End：", result)
    graph.updateItem(this.dragItem, {
      pathOffset: cloneDeep(result),
    });
    graph.emit('edge:dragend', {item: this.dragItem?.getModel?.()});
    this.destroy();
  },

  destroy() {
    this.moveLine?.remove?.();
    this.isDragging = false;
    this.draggingSegmentIndex = null;
    this.segments = [];
    this.pathData = [];
    this.offset = null;
    this.pathOffset = {
      vertical: new Set(),
      horizontal: new Set(),
    };
    this.moveLine = undefined;
    this.origin = {x: 0, y: 0, canvasX: 0, canvasY: 0};
    this.originOffset = undefined;
    this.dragPos = Pos.n;
    this.segmentOffset = {};
    this.dragItem = null;
  }
}
