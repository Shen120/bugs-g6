import G6 from "./register/default";
import React, {forwardRef, memo, PropsWithChildren, useEffect, useImperativeHandle, useRef, useState} from "react";
import {Icon} from "../../lib/";
import style from "./index.module.less";
import {ContextMenuVisibleConfig, G6ReactProps, G6ReactRef, GraphParams, MenuItem} from "./types";
import {useCreation, useWhyDidYouUpdate} from "ahooks";
import {IG6GraphEvent, Item, ITEM_TYPE, ModeType} from "@antv/g6";
import {GraphData} from "@antv/g6-core/lib/types";
import {cloneDeep} from "lodash";
import ContextMenu from "./components/contextMenu";
import {Point} from "@antv/g-base";
import {guid, roundNum} from "./utils";
import {isNil, pathOr} from "ramda";
import SnapLine from "./plugin/snapLine";
import hotkeys from 'hotkeys-js';
import {ClickParam} from "antd/es/menu";
import g6Cfg from "./config/index";

const defMenuCfg = {
  show: false,
  x: -9999,
  y: -9999,
}
const SELECTEDKEY = g6Cfg.selectedKey, TRIGGERKEYFIELD = g6Cfg.triggerKeyField;

const G6Index = <GData extends GraphData>(props: PropsWithChildren<G6ReactProps<GData>>, ref: React.ForwardedRef<G6ReactRef>) => {
  const {
    containerWidth,
    containerHeight,
    multipleState,
    showTooltip, tooltipConfig, getGraph,
    onClick, onDblClick, onKeyup, onKeydown, onCanvasMouseenter, onCanvasMouseleave, onCanvasClick, onEdgeMouseenter,
    onEdgeMouseleave, onNodeSelectChange, onBeforeCreateEdge, onAfterCreateEdge, onAfterRemoveItem, onAfterUpdateItem,
    onBeforeRemoveItem, onEdgeMouseDown,
    onAfterAddItem,
    onAddEdgeShouldEnd,
    onShowHideAnchorsShouldEnd,
    onEdgeClick,
    onNodeClick,
    formatEdgeText,
    onAddEdgeShouldShowAnchor,
    onContextMenuClick,
    beforeShowContextMenu,
    onHoldDownKeyStateChange,
    onMultipleStateChange,
    onEdgeDragend,
    onNodeExpand,
  } = props;

  // 为minimap生成一个id
  const mapID = useCreation(() => guid(), []);
  const G6Ref = useRef<HTMLDivElement | null>(null);
  const miniMapRef = useRef<HTMLDivElement | null>(null);
  const ctxMenuRef = useRef<HTMLUListElement | undefined>(undefined);
  const graph = useRef<GraphParams | null>(null);
  const sourceAnchorIdx = useRef(undefined), targetAnchorIdx = useRef(undefined);

  const contextMenuEvt = useRef<IG6GraphEvent | null>();
  // 快捷键按下才为true
  const onlyShowCreate = useRef(false);
  // 快捷键按下的方位
  const shortcutPos = useRef<string>("");
  // 是否处于多选状态
  const isMultiple = useRef(false);
  const holdDownKey = useRef(false);

  const [_isMultiple, setIsMultiple] = useState(false);
  const [_holdDownKey, setHoldDown] = useState(false);
  const contextMenuCfgRef = useRef(cloneDeep(defMenuCfg));
  const [contextMenuCfg, setContextMenuCfg] = useState(cloneDeep(defMenuCfg));
  const currentItem = useRef<Item | null>(null);
  const [copyItem, setCopyItem] = useState<Item | null>(null);
  const [currentType, setCurrentType] = useState<ITEM_TYPE | string>("");
  const [mapAnim, setMapAnim] = useState({
    showArrow: true,
    showMap: false,
  });
  const mapAnimRef = useRef(cloneDeep(mapAnim));

  const propCfg = beforeShowContextMenu?.(
    currentType === "node" && currentItem.current?._cfg ? currentItem.current as Item : undefined,
    copyItem ? copyItem : undefined
  );

  const contextMenuVisibleCfg: Required<ContextMenuVisibleConfig> = {
    edit: {
      copy: pathOr(true, ["edit", "copy"], propCfg),
      paste: pathOr(true, ["edit", "paste"], propCfg),
      delete: pathOr(true, ["edit", "delete"], propCfg),
    },
    create: !isNil(propCfg?.create) ? propCfg!.create : true,
  }

  const updateCfg = (cfg: Partial<typeof defMenuCfg>) => {

    contextMenuCfgRef.current = {
      ...contextMenuCfgRef.current,
      ...cfg,
    }
    setContextMenuCfg(prev => ({
      ...prev,
      ...cfg,
    }))
  }

  const updateMapAnim = (cfg: Partial<typeof mapAnim>) => {
    setMapAnim(prev => ({...prev, ...cfg}));
    mapAnimRef.current = {
      ...mapAnimRef.current,
      ...cfg,
    }
  }

  const updateMultiple = (state: boolean) => {
    isMultiple.current = state;
    setIsMultiple(state);
  }

  const updateHoldDown = (state: boolean) => {
    holdDownKey.current = state;
    setHoldDown(state);
  }

  const closeMenu = (noTimeOut: boolean = true) => {
    if (!contextMenuCfgRef.current.show) {
      return
    }
    if (noTimeOut) {
      updateCfg(cloneDeep(defMenuCfg));
      return;
    }
    setTimeout(() => {
      updateCfg(cloneDeep(defMenuCfg))
    }, 0)
  }

  /**
   * 添加组合键监听
   * 两部监听：先监听Shift + 方向键，弹出菜单后，
   * 再监听数字键创建节点
   */
  const listerKeyCombination = () => {
    // 监听TRIGGERKEY是否一直按住
    hotkeys("*", {keyup: true}, (event, handler) => {
      // @ts-ignore
      if (holdDownKey.current !== event[TRIGGERKEYFIELD]) {
        // @ts-ignore
        updateHoldDown(event[TRIGGERKEYFIELD])
      }
    })
  }

  // 移除组合键监听
  const removeKeyCombination = () => {
    hotkeys.unbind("*");
  }

  // 清除状态，供ref调用
  const clearState = () => {
    if (!graph.current) {
      return
    }
    const nodes = graph.current.findAllByState("node", SELECTEDKEY);
    const edges = graph.current.findAllByState("edge", "selected");
    nodes.forEach(node => {
      graph.current!.setItemState(node, SELECTEDKEY, false);
    });
    edges.forEach(edge => {
      graph.current!.setItemState(edge, "selected", false);
    });
  }

  useEffect(() => {
    listerKeyCombination();
    document.body.addEventListener("mouseup", () => closeMenu(false))
    return () => {
      removeKeyCombination();
      document.body.removeEventListener("mouseup", () => closeMenu(false));
    }
  }, []);

  useEffect(() => {
    updateMultiple(multipleState ?? false)
  }, [multipleState])

  useEffect(() => {
    onMultipleStateChange?.(_isMultiple);
  }, [_isMultiple])

  useEffect(() => {
    onHoldDownKeyStateChange?.(_holdDownKey);
  }, [_holdDownKey])

  // 利用timeout去阻止在双击时触发单击事件
  const clickTime = useRef(new Map());
  const leftClickTimer = useRef<any>(null);
  const leftClickTime = useRef(0);
  useEffect(() => {
    console.log(1111, G6Ref.current)
    if (!G6Ref.current) return;
    if (graph.current) {
      getGraph?.(graph.current as GraphParams)
      return
    }
    graph.current = new G6.Graph({
      container: G6Ref.current as HTMLDivElement,
      // 画布宽高
      width: containerWidth - 10,
      height: containerHeight - 10,
      groupByTypes: false,
      plugins: [
        showTooltip && new G6.Tooltip({
          offsetX: 10,
          offsetY: 10,
          fixToNode: [1, 0.5],
          // 允许出现 tooltip 的 item 类型
          itemTypes: ['node', 'edge'],
          // 自定义 tooltip 内容: getContent
          ...tooltipConfig,
        }),
        // new SnapLine({
        //   line: {
        //     stroke: '#ffac37',
        //     lineWidth: 3,
        //   },
        //   itemAlignType: true,
        // }),
      ].filter(Boolean),
      modes: {
        default: [
          'drag-canvas',
          'zoom-canvas',
          'drag-combo',
          {
            type: "cus-click-select",
            trigger: "shift",
            shouldUpdate: () => holdDownKey.current || !isMultiple.current,
          },
          {
            type: "brush-select",
            brushStyle: {
              stroke: "rgba(0,164,255,0.89)",
              fillOpacity: 0.1,
              fill: "#00a3ff"
            },
          },
          formatEdgeText && {
            type: "edge-tooltip",
            formatText: formatEdgeText,
          },
          {
            type: 'show-hide-anchors',
            // @ts-ignore
            shouldEnd: (e: IG6GraphEvent & { sourceId?: string }, self: any) => onShowHideAnchorsShouldEnd?.(e, self) ?? true,
          },
          // {
          //   type: 'drag-node',
          //   onlyChangeComboSize: true,
          //   shouldBegin: () => false
          // },
          // 配置 shouldBegin 和 shouldEnd，以确保创建边在锚点圆上开始和结束
          {
            type: 'add-edge',
            trigger: 'drag', // 将触发器设置为拖动，使创建边功能由拖动触发
            edgeConfig: {
              type: "CONDITION_LINK"
            },
            shouldShowAnchor: (e: IG6GraphEvent, self: any) => onAddEdgeShouldShowAnchor?.(e, self) ?? true,
            shouldBegin: (e: IG6GraphEvent) => {
              const name = e.target && e.target.get('name');
              // 避免从节点上的其他形状开始
              if (name !== 'anchor-point' && name !== "tip-anchor-point") return false;
              sourceAnchorIdx.current = e.target.get('anchorPointIdx');
              e.target.set('links', e.target.get('links') + 1); // 缓存与该锚点圆相连的边的数量
              return true;
            },
            // @ts-ignore
            shouldEnd: (e: IG6GraphEvent, self: any) => {
              const val = onAddEdgeShouldEnd?.(e, self);
              // 只有在返回false时才会阻止结束，否则继续执行
              if (val === false) {
                return false
              }
              const name = e.target && e.target.get('name');
              // 避免在节点上的其他形状上结束
              if (name !== 'anchor-point' && name !== "tip-anchor-point") return false;
              if (e.target) {
                targetAnchorIdx.current = e.target.get('anchorPointIdx');
                e.target.set('links', e.target.get('links') + 1);  // 缓存与该锚点圆相连的边的数量
                return true;
              }
              targetAnchorIdx.current = undefined;
              return true;
            },
          }
        ].filter(Boolean) as ModeType[],
      },
      defaultCombo: {
        // type: g6Cfg.comboShape,
        type: 'rect',
        padding: [45, 10, 10, 10],
        // fixSize: true,
        labelCfg: {
          style: {
            fill: "#fff",
            fontSize: 16,
          },
        },
      },
      defaultEdge: {
        type: "polyline",
        labelCfg: {
          style: {
            fill: "#000"
          },
        },
        style: {
          endArrow: true,
          stroke: "rgb(24, 144, 255)",
        },
      },
      edgeStateStyles: {
        selected: {
          stroke: '#FFCB70',
          lineWidth: 3,
          "text-shape": {
            fill: "#c77f00"
          },
        },
        hover: {
          shadowColor: "rgb(24, 144, 255, .5)",
          shadowBlur: 10
        },
      },
    });
    /**
     * 事件绑定
     * @see https://g6.antv.antgroup.com/api/event#%E4%BA%A4%E4%BA%92%E4%BA%8B%E4%BB%B6
     */
    graph.current?.on('dblclick', (e) => {
      console.log("执行dblclick")
      clickTime.current.forEach(timer => {
        clearTimeout(timer);
      })
      onDblClick?.(e);
    });
    graph.current?.on('node:click', (e) => {
      console.log("%c开始点击node:click", "color: #ff0000")

      clickTime.current.has("nodeClick") && clearTimeout(clickTime.current.get("nodeClick"));
      // 按住shift时不执行
      if (holdDownKey.current) {
        return
      }
      clickTime.current.set("nodeClick", setTimeout(() => {
        console.log("%c第一次执行了node:click", "color: blue");
        currentItem.current = e.item as Item;

        const isClickExpand = e.target.get("name") === "node-expand-icon";
        const isOpen = e.item?.getModel?.()?.expanded ?? false;

        if (isClickExpand) {
          onNodeExpand?.(e, !isOpen)
        } else {
          onNodeClick?.(e);
        }
      }, 300));
    });
    graph.current?.on('edge:click', (e) => {
      console.log(222222)
      onEdgeClick?.(e);
    });
    graph.current?.on("wheel", e => {
      closeMenu();
    })
    graph.current?.on("mousedown", (e: IG6GraphEvent) => {
      // @ts-ignore
      const {originalEvent: {button}} = e;

      let disabled = false;
      if (button === 0) {
        leftClickTime.current = new Date().getTime();
        // 左键点击
        leftClickTimer.current = setTimeout(function () {
          // 在一定时间后检查右键是否也被按下
          document.addEventListener('mousedown', function checkRightButton(event) {
            if (event.button === 2) {
              // 右键也被按下了，阻止关闭方法的执行
              event.preventDefault();
              disabled = true;
              // 移除监听器
              document.removeEventListener('mouseup', checkRightButton);
            }
          });
        }, 200);
      }
      if (disabled) {
        return
      }
      // 在其它操作时隐藏右键菜单
      closeMenu();
    })
    graph.current?.on("mouseup", e => {
      leftClickTimer.current && clearTimeout(leftClickTimer.current);
    })
    graph.current?.on('click', (e) => {
      clickTime.current.has("click") && clearTimeout(clickTime.current.get("click"));
      console.log("%c--开始点击click", "color: #ff000")
      clickTime.current.set("click", setTimeout(() => {
        console.log("%c--第一次执行了click", "color: blue");
        currentItem.current = e.item as Item;
        const curTime = new Date().getTime();
        if (leftClickTime.current - curTime >= 200) {
          updateCfg({show: false});
        }
        onClick?.(e);
      }, 300));
    });
    graph.current?.on('contextmenu', (evt) => {
      contextMenuEvt.current = evt;
      evt.stopPropagation();
      evt.preventDefault();
      const {item} = evt
      if (item) {
        onlyShowCreate.current = false;
        shortcutPos.current = "";
        currentItem.current = item as Item;
        const type: ITEM_TYPE | string = item?.getType() ?? "";
        setCurrentType(type);
        const model = item.getModel()
        let x = model.x, y = model.y;
        if (type === "edge") {
          x = evt.x;
          y = evt.y;
        }
        // @ts-ignore
        const point = graph.current?.getCanvasByPoint?.(x, y) as Point;
        if (point) {
          updateCfg({
            show: true,
            x: point.x,
            y: point.y,
          });
        }
      } else {
        // @ts-ignore
        const point = graph.current?.getCanvasByPoint?.(evt.x, evt.y) as Point;
        onlyShowCreate.current = false;
        shortcutPos.current = "";
        setCurrentType("");
        currentItem.current = null;
        if (point) {
          updateCfg({
            show: true,
            x: point.x,
            y: point.y,
          });
        }
      }
    });
    graph.current?.on('keyup', (e) => {
      onKeyup?.(e);
    });
    graph.current?.on('keydown', (e) => {
      onKeydown?.(e);
    });
    graph.current?.on('canvas:mouseenter', (e) => {
      onCanvasMouseenter?.(e);
    });
    graph.current?.on('canvas:mouseleave', (e) => {
      onCanvasMouseleave?.(e);
    });
    graph.current?.on('canvas:click', (e) => {
      setCurrentType("");
      currentItem.current = null;
      onlyShowCreate.current = false;
      shortcutPos.current = "";
      onCanvasClick?.(e);
    });
    graph.current?.on('edge:mouseenter', (e) => {
      if (e.item) {
        graph.current?.setItemState(e.item, 'hover', true);
      }
      onEdgeMouseenter?.(e);
    });
    graph.current?.on('edge:mousedown', (e) => {
      const edge: any = e.item;
      graph.current?.setItemState(edge, 'selected', !edge.hasState('selected'));
      onEdgeMouseDown?.(e);
    });
    graph.current?.on('edge:mouseleave', (e) => {
      if (e.item) {
        graph.current?.setItemState(e.item, 'hover', false);
      }
      onEdgeMouseleave?.(e);
    });
    graph.current?.on('nodeselectchange', (e: any) => {
      const {selectedItems: {combos, edges, nodes}} = e;
      const selectCombos = combos.length > 0, selectEdges = edges.length > 0, selectNodes = nodes.length > 0;

      // 不存在target或者selectedItems的元素大于0就是多选
      const multiple = (selectCombos || selectEdges || selectNodes);
      let state = false;
      // if (!holdDownKey.current && multiple) {
      //   state = true;
      // }
      if (holdDownKey.current && multiple) {
        state = true;
      }
      if (!holdDownKey.current && !multiple) {
        state = false;
      }
      hasClickCopy.current = !state;
      updateMultiple(state);
      onNodeSelectChange?.(e);
    });
    graph.current?.on('beforecreateedge', (e) => {
      onBeforeCreateEdge?.(e);
    });
    graph.current?.on('afteradditem', (e) => {
      if (e.item && e.item.getType() === 'edge') {
        const edge = e.item?.getModel?.();
        // e.item?.toBack?.();
        if (isNil(edge?.sourceAnchor)) {
          graph.current?.updateItem(e.item, {
            sourceAnchor: sourceAnchorIdx.current,
          });
        }
      }
      onAfterAddItem?.(e);
    });
    graph.current?.on('aftercreateedge', (e) => {
      const edge = e.item?.getModel?.();
      if (isNil(edge?.sourceAnchor) && isNil(edge?.targetAnchor)) {
        const newCfg: any = {
          sourceAnchor: sourceAnchorIdx.current,
          targetAnchor: targetAnchorIdx.current,
          type: "polyline"
        }
        // 更新新添加边缘的源切边和目标切边
        graph.current?.updateItem(e.edge as any, newCfg)
        // e.item?.toBack?.();
      }
      onAfterCreateEdge?.(e);
    });
    graph.current?.on('afterremoveitem', (e: any) => {
      if (e.item && e.item.source && e.item.target) {
        const sourceNode = graph.current?.findById(e.item.source);
        const targetNode = graph.current?.findById(e.item.target);
        const {sourceAnchor, targetAnchor} = e.item;
        if (sourceNode && !isNaN(sourceAnchor)) {
          const sourceAnchorShape = sourceNode.getContainer().find((ele: any) => ((ele.get('name') === 'anchor-point' || ele.get('name') === 'tip-anchor-point') && ele.get('anchorPointIdx') === sourceAnchor));
          if (sourceAnchorShape) {
            sourceAnchorShape.set('links', sourceAnchorShape.get('links') - 1);
          }
        }
        if (targetNode && !isNaN(targetAnchor)) {
          const targetAnchorShape = targetNode.getContainer().find((ele: any) => ((ele.get('name') === 'anchor-point' || ele.get('name') === 'tip-anchor-point') && ele.get('anchorPointIdx') === targetAnchor));
          if (targetAnchorShape) {
            targetAnchorShape.set('links', targetAnchorShape.get('links') - 1);
          }
        }
      }
      onAfterRemoveItem?.(e);
    });
    graph.current?.on('afterupdateitem', (e) => {
      const edges = e?.item?.get?.("edges") ?? [];
      // 节点更新后刷一下与该节点相连的边，以保证边渲染的位置正确
      edges.forEach((item: any) => {
        graph.current?.updateItem(item, {})
      })
      onAfterUpdateItem?.(e);
    });
    graph.current?.on('beforeremoveitem', (e) => {
      onBeforeRemoveItem?.(e);
    });
    graph.current?.on('edge:dragend', (e: any) => {
      onEdgeDragend?.(e)
    });
    // 读取数据
    // graph.current?.read(data as any);
    // 渲染图
    // graph.current?.render();

    graph.current.clearState = clearState;

    window.graph = graph.current;
    window.graph.getNodesInfo = () => graph.current?.getNodes().map(item => ({
      id: item.getModel().id,
      label: item.getModel().label,
      x: item.getModel().x,
      y: item.getModel().y
    }));

    return () => {
      // graph.current?.destroy?.();
      // graph.current = null;
      // window.graph = undefined;
    }
  }, [G6Ref.current])

  useEffect(() => {
    if (!graph.current) {
      return
    }
    getGraph?.(graph.current as GraphParams)
  }, [graph.current]);

  const hasClickCopy = useRef(false);
  const onMenuClick = (data: ClickParam) => {
    const {key} = data;
    const cloneItem = cloneDeep(currentItem.current);
    switch (key) {
      case "copy":
        hasClickCopy.current = true;
        if (!isMultiple.current) {
          setCopyItem(cloneItem);
          currentItem.current = null;
        } else {
          currentItem.current = null;
          setCopyItem(null);
          onContextMenuClick?.(data, undefined, contextMenuEvt.current);
        }
        break;
      case "paste":
        if (!hasClickCopy.current) {
          return;
        }
        if (copyItem && !isMultiple.current) {
          const copyData: any = cloneDeep(copyItem.getModel());
          copyData.id = guid()
          // @ts-ignore
          copyData.x = roundNum(contextMenuEvt.current?.x + 15, 2);
          // @ts-ignore
          copyData.y = roundNum(contextMenuEvt.current?.y + 15, 2);

          onContextMenuClick?.(data, copyData, contextMenuEvt.current);
          return
        }
        if (isMultiple.current) {
          onContextMenuClick?.(data, undefined, contextMenuEvt.current);
        }
        break;
      case "delete":
        onContextMenuClick?.(data, cloneItem as Item);
        break;
      default:
        onContextMenuClick?.(data, cloneItem as Item);
        break;
    }
    updateCfg(cloneDeep(defMenuCfg));
  }

  useImperativeHandle(ref, () => {
    /*
    因为是异步执行，且根据源码，会有清理副作用的函数， 会出现在ref回调为空的现象, 所以尽量避免使用ref获取graph，用getGraph回调
    @see https://www.cnblogs.com/geek1116/p/16834267.html
     */
    return {
      graph: {
        ...graph.current,
        clearState,
      },
    } as G6ReactRef
  }, [graph.current]);

  const getAllowState = () => {
    const cfg = {
      edit: {
        copy: false,
        paste: !hasClickCopy.current,
        delete: false,
      },
    };
    if (isMultiple.current) {
      return cfg
    }
    if (!currentItem.current) {
      cfg.edit.copy = true;
      cfg.edit.delete = true;
    }
    if (!hasClickCopy.current || !copyItem) {
      cfg.edit.paste = true;
    }
    return cfg
  }

  useWhyDidYouUpdate("G6React", props)

  return (
    <div className={style.g6_react_container}>
      <div
        id="G6ReactMain"
        className={style.g6_canvas_container}
        ref={G6Ref}
        autoFocus={true}
      >
        {
          contextMenuCfg.show && (
            <ContextMenu
              x={contextMenuCfg.x}
              y={contextMenuCfg.y}
              offset={10}
              getRef={(r: any) => ctxMenuRef.current = r?.menu?.list}
              onClick={onMenuClick}
              items={[
                !onlyShowCreate.current && {
                  type: "group",
                  label: "操作",
                  children: [
                    currentType !== "edge" && {
                      key: "copy",
                      label: "复制",
                      title: "复制",
                      disabled: getAllowState().edit.copy || !contextMenuVisibleCfg.edit.copy,
                      icon: <Icon type="copy"/>,
                    },
                    currentType !== "edge" && {
                      key: "paste",
                      label: "粘贴",
                      title: "粘贴",
                      disabled: getAllowState().edit.paste || !contextMenuVisibleCfg.edit.paste,
                      icon: <Icon type="diff"/>,
                    },
                    {
                      key: "delete",
                      label: "删除",
                      title: "删除",
                      disabled: getAllowState().edit.delete || !contextMenuVisibleCfg.edit.delete,
                      icon: <Icon type="delete"/>,
                    },
                  ].filter(Boolean) as MenuItem[]
                },
              ].filter(Boolean) as MenuItem[]}
            />
          )
        }
      </div>
    </div>
  )
};

const G6React = forwardRef<G6ReactRef, G6ReactProps<any>>(G6Index);
export default memo(G6React);
