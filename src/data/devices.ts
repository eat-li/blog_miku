// 设备数据配置文件

export interface Device {
  name: string;
  image: string;
  specs: string;
  description: string;
  link: string;
}

// 设备类别类型，支持品牌和自定义类别
export type DeviceCategory = Record<string, Device[]> & {
  自定义?: Device[];
};

export const devicesData: DeviceCategory = {
  vivoX200Pro: [
    {
      name: "vivo X200Pro",
      image: "/images/device/vivox200pro.webp",
      specs: "Gray / 16G + 1TB",
      description: "全等深微四曲设计，浑然天成。",
      link: "https://www.vivo.com.cn/vivo/x200pro/",
    },
  ],
  //   Router: [
  //     {
  //       name: "GL-MT3000",
  //       image: "/images/device/mt3000.webp",
  //       specs: "1000Mbps / 2.5G",
  //       description:
  //         "Portable WiFi 6 router suitable for business trips and home use.",
  //       link: "https://www.gl-inet.cn/products/gl-mt3000/",
  //     },
  //   ],
};
