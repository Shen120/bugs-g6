import {isFunction} from '@antv/util';

const DEFAULT_TRIGGER = 'click';
const ALLOW_EVENTS = ['click', 'drag'];
const DEFAULT_KEY = undefined;
const ALLOW_KEYS = ['shift', 'ctrl', 'control', 'alt', 'meta', undefined];

function guid() {
  const S4 = () => {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4())
}

export default {
	startNode: null,
  dragNode: null,
	getDefaultCfg() {
		return {
			trigger: DEFAULT_TRIGGER,
			key: DEFAULT_KEY,
			edgeConfig: {},
			getEdgeConfig: undefined,
		};
	},
	getEvents() {
		const self = this;
		// 检测输入是否合法
		if (!(ALLOW_EVENTS.indexOf(self.trigger.toLowerCase()) > -1)) {
			self.trigger = DEFAULT_TRIGGER;
			console.warn("Behavior create-edge 的 trigger 参数不合法，请输入 'click'，'drag'");
		}
		if (self.key && ALLOW_KEYS.indexOf(self.key.toLowerCase()) === -1) {
			self.trigger = DEFAULT_KEY;
			console.warn(
				"Behavior create-edge 的 key 参数不合法，请输入 'shift'，'ctrl'，'alt'，'control'，或 undefined",
			);
		}
		let events;
		if (self.trigger === 'drag') {
			events = {
				'node:dragstart': 'onClick',
				"node:dragenter": "onDragEnter",
				'combo:dragstart': 'onClick',
				drag: 'updateEndPoint',
				'node:drop': 'onClick',
				'combo:drop': 'onClick',
				dragend: 'onDragEnd',
				"node:mousedown": "onMouseDown",
        "node:dragleave": "onDragLeave",
        "mouseup": "onMouseUp"
			};
		} else if (self.trigger === 'click') {
			events = {
				'node:click': 'onClick', // The event is node:click, the responsing function is onClick
				mousemove: 'updateEndPoint', // The event is mousemove, the responsing function is onMousemove
				'edge:click': 'cancelCreating', // The event is edge:click, the responsing function is onEdgeClick
				'canvas:click': 'cancelCreating',
				'combo:click': 'onClick',
			};
		}
		if (self.key) {
			events.keydown = 'onKeyDown';
			events.keyup = 'onKeyUp';
		}
		return events;
	},
  onMouseUp(e) {
    this.dragNode = null;
    if (e.item) {
      // e.item.toBack();
    }
  },
	onMouseDown(e) {
		const node = e.target.get("parent");
		const nodeId = node.get("id");
		// 相同节点禁止连线
		this.startNode = nodeId;
	},
	onDragEnd(ev) {
		const self = this;
		if (self.key && !self.keydown) return;
		const {item} = ev;
    this.dragNode = null;
    if (item) {
      // item.toBack();
    }
		if (!item || item.getID() === self.source || item.getType() !== 'node') {
			self.cancelCreating({
				item: self.edge,
				x: ev.x,
				y: ev.y,
			});
		}
	},
	onDragEnter(ev) {
    const self = this;
		const node = ev.item;
    // 如果阻止显示锚点，则不显示
    if (this.startNode && !self.shouldShowAnchor(ev, self) || (this.dragNode)) {
      return;
    }
		if (node && node.get("type") === "node" && this.startNode !== node.get("id")) {
			this.graph.setItemState(node, 'showTipAnchors', true);
		}
	},
  onDragLeave(e) {
    const node = e.item;
    this.graph.setItemState(node, 'showTipAnchors', false);
  },
	// 如果边的起点没有指定，则根据起点创建新边；如果起点已经指定而终点未指定，则指定终点
	onClick(ev) {
    const shapeName = ev.shape?.get?.("name");
    // 当开始拖动节点时，如果不是锚点，则把节点置于顶层
    if (ev.type === "dragstart" && shapeName !== "anchor-point" && ev.item?.get?.("type") === "node") {
      this.dragNode = ev.item?.get?.("id");
      if (ev.item) {
        ev.item.toFront();
      }
    }
		const self = this;
		if (self.key && !self.keydown) return;
		const node = ev.item;
		const graph = self.graph;
		const model = node.getModel();
		const getEdgeConfig = self.getEdgeConfig;
		// 如果起点已经指定而终点未指定，则指定终点
		if (self.addingEdge && self.edge) {
			// 钩子函数阻止或者起点和终点相同，不创建边
			if (!self.shouldEnd(ev, self) || self.source === model.id) {
        self.graph.setItemState(node, 'showTipAnchors', false);
        return
      }

			let edgeConfig;
			if (getEdgeConfig && isFunction(getEdgeConfig)) {
				edgeConfig = getEdgeConfig({
					source: self.source,
					target: model.id,
				}, self);
			} else {
				edgeConfig = self.edgeConfig;
			}
			const updateCfg = {
				target: model.id,
				...edgeConfig,
			};
			if (self.source === model.id) {
				updateCfg.type = 'loop';
			}

			graph.emit('beforecreateedge', {});

			graph.updateItem(self.edge, updateCfg, false);

			if (graph.get('enabledStack')) {
				const addedModel = {
					...self.edge.getModel(),
					itemType: 'edge',
				};
				const after = {};
				after.edges = [addedModel];
				graph.pushStack('add', {
					before: {},
					after,
				});
			}
      // 将操作提前，避免出现错误; 暂时将该边的 capture 恢复为 true
      self?.edge?.getKeyShape?.()?.set('capture', true);

			graph.emit('aftercreateedge', {
				edge: self.edge,
			});

			self.edge = null;
			self.addingEdge = false;
			self.startNode = null;
			self.graph.setItemState(node, 'showTipAnchors', false);
		} else {
			// 如果边的起点没有指定，则根据起点创建新边
			if (!self.shouldBegin(ev, self)) return;
			// 获取自定义 edge 配置
			let edgeConfig;
			if (getEdgeConfig && isFunction(getEdgeConfig)) {
				edgeConfig = getEdgeConfig({
					source: model.id,
					target: model.id,
				}, self);
			} else {
				edgeConfig = self.edgeConfig;
			}

			self.edge = graph.addItem(
				'edge',
				{
          id: guid(),
					source: model.id,
					target: model.id,
					...edgeConfig,
				},
				false,
			);
			self.source = model.id;
			self.addingEdge = true;
			// 暂时将该边的 capture 设置为 false，这样可以拾取到后面的元素
			self.edge.getKeyShape().set('capture', false);
      self.graph.setItemState(node, 'showTipAnchors', false);
		}
	},
	// 边的起点已经确定，边的末端跟随鼠标移动
	updateEndPoint(ev) {
		const self = this;
		if (self.key && !self.keydown) return;
		if ((self.edge && self.edge.destroyed)) self.cancelCreating({item: self.edge});
		const point = {x: ev.x, y: ev.y};

		// 若此时 source 节点已经被移除，结束添加边
		if (!self.graph.findById(self.source)) {
			self.addingEdge = false;
			return;
		}
		if (self.addingEdge && self.edge) {
			// 更新边的终点为鼠标位置
			self.graph.updateItem(
				self.edge,
				{
					target: point,
				},
				false,
			);
		}
	},
	// 取消增加边，删除该边；或指定终点
	cancelCreating(ev) {
		const self = this;
		if (self.key && !self.keydown) return;
		const graph = self.graph;
		const currentEdge = ev.item;
		if (self.addingEdge && (self.edge === currentEdge || ev.target?.isCanvas?.())) {
			if (self.edge && !self.edge.destroyed) graph.removeItem(self.edge, false);
			self.edge = null;
			self.addingEdge = false;

		}
	},

	onKeyDown(e) {
		const self = this;
		const code = e.key;
		if (!code) {
			return;
		}
		if (code.toLowerCase() === self.key.toLowerCase()) {
			self.keydown = true;
		} else {
			self.keydown = false;
		}
	},
	onKeyUp() {
		const self = this;
		if (self.addingEdge && self.edge) {
			// 清除正在增加的边
			self.graph.removeItem(self.edge, false);
			self.addingEdge = false;
			self.edge = null;
		}
		this.keydown = false;
	},
};
