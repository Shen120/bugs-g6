import React, {Component} from 'react';
import G6React from "./components/G6";
import {Graph, IG6GraphEvent} from "@antv/g6";
import {DataType, IEdgeModel, IGraphData} from "./components/G6/types";
import g6Cfg from "./components/G6/config";
import {GraphContext} from "./components/G6/ctx/graph";
import {cloneDeep} from "lodash";
import {defaultGraphData} from "./components/G6/lib/model";
import {ItemEdge, ItemNode} from "./components/G6/lib/itemModel";
import {getNonOverlapOffset} from "./components/G6/utils";

const getType = () => {
  const arr = [DataType.arr, DataType.json, DataType.int, DataType.char, DataType.blob, DataType.float];
  // 生成一个随机索引
  const randomIndex = Math.floor(Math.random() * arr.length);

// 获取随机值
  const randomValue = arr[randomIndex];
  return randomValue
}

interface AppState {
  data: IGraphData
}

let count = 1;

class App extends Component<any, AppState> {

  graph?: Graph = undefined;

  constructor(props: any) {
    super(props);
    this.state = {
      data: cloneDeep(defaultGraphData),
    }
  }

  /**
   * 更新节点
   * @param idList 节点ID列表
   * @param cfg 节点配置
   */
  updateNode = (idList: (string | undefined)[], cfg: Partial<ItemNode>) => {
    idList = idList.filter(Boolean);
    const nodes = [...this.state.data.nodes];
    for (const id of idList) {
      const idx = nodes.findIndex(c => c.id === id);
      if (idx > -1) {
        Object.assign(nodes[idx], {...cfg});
        this.graph?.updateItem?.(id!, cfg)
      }
    }
    this.setState({
      data: {
        ...this.state.data,
        nodes
      }
    })
  }

  componentDidMount() {
    const graphData: IGraphData = {
      nodes: [],
      edges: [],
      combos: [
        {id: "groud1", label: 'xxx输入模型'},
        {id: "groud2", label: 'xxx输出模型'},
      ],
    }

    for (let i = 0; i < 10; i++) {
      graphData.nodes.push({
        id: `in-${i + 1}`,
        label: `字段${i + 1}`,
        x: 50,
        y: 100 + i * 44,
        dataType: getType(),
        type: g6Cfg.nodeShape,
        children: [],
        comboId: "groud1"
      } as any)
    }

    for (let i = 0; i < 13; i++) {
      graphData.nodes.push({
        id: `out-${i + 1}`,
        label: `字段${i + 1}`,
        x: 700,
        y: 100 + i * 44,
        dataType: getType(),
        type: g6Cfg.nodeShape,
        children: [],
        comboId: "groud2"
      } as any)
    }

    for (let i = 0; i < 5; i++) {
      // @ts-ignore
      graphData.nodes[5].children.push({
        id: `5-${i + 1}`,
        label: `字段5-${i + 1}`,
        dataType: getType(),
        type: g6Cfg.nodeShape,
      })
    }

    for (let i = 0; i < 8; i++) {
      // @ts-ignore
      graphData.nodes[7].children.push({
        id: `7-${i + 1}`,
        label: `字段7-${i + 1}`,
        dataType: getType(),
        type: g6Cfg.nodeShape,
      })
    }

    this.setState({
      data: graphData,
    }, () => {
      this.graph?.read(this.state.data);
      // this.graph?.render();
    })
  }

  onNodeExpand = (e: IG6GraphEvent, isExpand: boolean) => {
    console.log("isExpand", isExpand)
    if (e.item) {
      const node = e.item.getModel()!;
      const newData = {...this.state.data};
      const comboId = `child-${node.id}`;

      if (isExpand) {
        const com = {
          id: comboId,
          label: `${node.label} - 子表`,
          type: "rect"
        }
        this.graph?.addItem("combo", com);

        const offset = getNonOverlapOffset(this.graph!, this.graph?.findById(node.comboId as string)!);

        // @ts-ignore
        const list: any[] = node?.children ?? [];
        const childNodes = [];
        for (let i = 0; i < list.length; i++) {
          const child = {
            ...list[i],
            x: offset.x + 40,
            y: offset.y + i * 44 + 80,
            comboId,
            type: "rect"
          }
          childNodes.push(child);
        }

        this.graph?.addItems(childNodes.map(c => ({
          type: "node",
          model: {...c}
        })))

        newData.nodes = newData.nodes.concat(childNodes);
        newData.combos.push(com);

        const edge = new ItemEdge();
        Object.assign(edge, {
          source: node.id,
          target: comboId,
          sourceAnchor: 0,
          targetAnchor: 0,
          type: g6Cfg.childEdge,
        });
        newData.edges.push(edge as IEdgeModel);
        setTimeout(() => {
          this.graph?.addItem("edge", edge);
        }, 100)
      } else {

        // 收起时删除以渲染的combo和节点
        const filterNodes = newData.nodes?.filter(c => c.comboId === comboId).map(c => c.id);
        for (const id of filterNodes) {
          const idx = newData.nodes?.findIndex(c => c.id === id);
          if (idx > -1) {
            newData.nodes?.splice(idx, 1);
            this.graph?.removeItem(id)
          }
        }
        // 删除combo
        const combosIdx = newData.combos?.findIndex(c => c.id === comboId);
        if (combosIdx > -1) {
          newData.combos?.splice(combosIdx, 1);
          this.graph?.removeItem(comboId)
        }
      }

      // 更新展开状态
      const idx = newData.nodes!.findIndex(c => c.id === node.id);
      if (idx > -1) {
        newData.nodes[idx].expanded = isExpand;
      }

      this.graph?.updateItem(e.item, {expanded: isExpand})
      this.setState({
        // data: newData,
      }, () => {
        this.graph?.getNodes().forEach(item => {
          item.toFront();
        })
        this.graph?.getCombos().forEach(item => {
          // item.toFront();
        })
        this.graph?.getEdges().forEach(item => {
          // item.toBack();
        })
      })
    }
  }

  render() {
    return (
      <GraphContext.Provider
        value={{
          graph: this.graph,
          updateNode: this.updateNode,
        }}
      >
        <div style={{width: "100%", height: "100%"}}>
          <G6React
            containerWidth={document.body.clientWidth}
            containerHeight={document.body.clientHeight}
            getGraph={r => this.graph = r}
            onNodeExpand={this.onNodeExpand}
          />
        </div>
      </GraphContext.Provider>
    );
  }
}

export default App;
