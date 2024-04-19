import {Menu} from "antd";
import React, {useEffect, useRef, useState} from "react";
import style from "./index.module.less";
import {getPopupContainer, isDivOutOfBounds} from "../../utils";

export default function ContextMenu(props) {

  const {x, y, offset = 0, getRef, items, ...resetProps} = props;

  const menuRef = useRef(null);

  const [pos, setPos] = useState({x, y});

  useEffect(() => {
    if (menuRef.current) {
      // @ts-ignore
      const list = menuRef.current?.menu?.list;
      if (!list) {
        return
      }
      const height = list.offsetHeight;
      const width = list.offsetWidth;
      // 判断是否超出边界
      const {over, top, left, bottom, right} = isDivOutOfBounds(list);
      if (over) {
        switch (true) {
          case top:
            setPos(prev => ({...prev, y: offset}));
            break;
          case bottom:
            setPos(prev => ({...prev, y: window.innerHeight - height - offset - 10}));
            break;
          case left:
            setPos(prev => ({...prev, x: offset}));
            break;
          case right:
            setPos(prev => ({...prev, x: window.innerWidth - width - offset - 10}));
            break;
        }
      }
    }

  }, []);

  useEffect(() => {
    if (menuRef.current) {
      getRef?.(menuRef.current)
    }
  }, [menuRef.current]);

  return (
    <Menu
      {...resetProps}
      ref={menuRef}
      className={style.contextMenu}
      getPopupContainer={getPopupContainer}
      style={{
        left: pos.x + offset,
        top: pos.y + offset,
      }}
    >
      {
        items.map((item, idx) => {
          const isGroup = item?.type === "group";
          if (isGroup) {
            return (
              <Menu.ItemGroup key={`group-${idx}`} title={item.label}>
                {
                  (item?.children ?? []).map((child) => (
                    <Menu.Item key={child.key} disabled={child.disabled} title={child.title}>
                      {item.icon}&nbsp;{child.label}
                    </Menu.Item>
                  ))
                }
              </Menu.ItemGroup>
            )
          }
          return (
            <Menu.Item key={item.key} disabled={item.disabled} title={item.title}>
              {item.icon}&nbsp;{item.label}
            </Menu.Item>
          )
        })
      }
    </Menu>
  )
}
