import type { PioConfig } from "../types/config";

// Pio 看板娘配置
export const pioConfig: PioConfig = {
  enable: true, // 启用看板娘
  models: ["/pio/models/NOIR/noir.model3.json"], // 默认模型路径
  position: "left", // 模型位置
  width: 280, // 默认宽度
  height: 250, // 默认高度
  mode: "draggable", // 默认为可拖拽模式
  hiddenOnMobile: true, // 默认在移动设备上隐藏
  hideAboutMenu: false, // 隐藏内置 About 菜单按钮
  dialog: {
    welcome: "欢迎来到我的博客!", // 欢迎词
    touch: [
      "你在做什么呀?",
      "别碰我啦!",
      "变——态!",
      "不许这样欺负我…",
      "再摸头就长不高啦",
      "你是想挨喵喵拳吗",
    ], // 触摸提示
    home: "Click here to go back to homepage!", // 首页提示
    skin: ["Want to see my new outfit?", "The new outfit looks great~"], // 换装提示
    close: "QWQ See you next time~", // 关闭提示
  },
};
