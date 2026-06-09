---
title: Flutter 新手入门完全指南
published: 2026-06-08
description: "从零开始学习 Flutter 开发，涵盖组件、布局、状态管理、网络请求和路由等核心知识。"
image: "./cover.webp"
tags: ["前端开发", "移动端开发", "Flutter", "Dart"]
category: Guides
draft: false
---

# Flutter 新手入门完全指南

Flutter 是 Google 推出的跨平台 UI 框架，使用 Dart 语言，一套代码可以同时运行在 Android、iOS、Web 和 HarmonyOS 上。本文从零开始，带你掌握 Flutter 开发的核心知识。

---

## 一、快速开始

### 创建项目

```bash
flutter create --platforms web 项目名称
```

### 运行项目

找到 `lib/main.dart` 中的 `main` 函数，点击 `run` 即可启动。

### 项目目录结构

| 目录/文件 | 说明 |
|---|---|
| `.dart_tool` | Dart 工具生成的文件缓存 |
| `build` | 构建输出目录 |
| `lib` | **项目主要源代码** |
| `test` | 测试代码 |
| `web` | Web 平台特定配置和资源 |
| `pubspec.yaml` | 项目依赖配置文件 |

---

## 二、Widget — Flutter 的一切

Flutter 中所有界面元素都是 **Widget**（组件）。应用从 `main.dart` 的 `main` 函数开始，`runApp` 函数接收一个根 Widget 来启动应用：

```dart
runApp(MyApp());
```

---

## 三、Material 组件库

Flutter 内置了 **Material Design** 组件库，提供统一的视觉风格，确保在 Android、iOS、Web 等平台上保持一致的外观。

---

## 四、核心容器组件

### MaterialApp — 应用根组件

整个应用被 `MaterialApp` 包裹，它是应用的入口 Widget。

```dart
void main(List<String> args) {
  runApp(
    MaterialApp(
      title: "我的 Flutter 应用",
      theme: ThemeData(scaffoldBackgroundColor: Colors.white),
      home: Scaffold(),
    ),
  );
}
```

**常用属性：**

- `title` — 应用标题（可选）
- `theme` — 应用主题
- `home` — 应用首页

### Scaffold — 页面骨架

`Scaffold` 提供了页面的基本结构，包括标题栏、主体内容、底部导航栏等。

```dart
Scaffold(
  appBar: AppBar(title: Text("标题栏")),
  body: Container(child: Center(child: Text("主体内容"))),
  bottomNavigationBar: SizedBox(
    height: 80,
    child: Center(child: Text("底部区域")),
  ),
  floatingActionButton: FloatingActionButton(
    onPressed: () {},
    child: Icon(Icons.add),
  ),
  drawer: Drawer(),
)
```

**常用属性：**

- `appBar` — 顶部标题栏
- `body` — 页面主体
- `bottomNavigationBar` — 底部导航栏
- `backgroundColor` — 背景颜色
- `floatingActionButton` — 浮动操作按钮
- `drawer` — 侧边抽屉

---

## 五、自定义组件

### StatelessWidget — 无状态组件

适用于不需要管理状态的静态 UI。内部状态不可变，只根据传入的属性渲染。

```dart
class MyWidget extends StatelessWidget {
  const MyWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "无状态组件示例",
      theme: ThemeData(scaffoldBackgroundColor: Colors.red),
      home: Scaffold(
        appBar: AppBar(title: Text("标题")),
        body: Center(child: Text("内容")),
      ),
    );
  }
}
```

### StatefulWidget — 有状态组件

适用于需要管理状态的交互式组件（计数器、开关、表单等）。

创建有状态组件需要 **两个类**：

1. **第一个类** — 继承 `StatefulWidget`，定义参数，创建 State 对象
2. **第二个类** — 继承 `State`，管理可变数据和业务逻辑，实现 `build` 方法

```dart
// 第一个类：对外接口
class Counter extends StatefulWidget {
  const Counter({super.key});

  @override
  State<Counter> createState() => _CounterState();
}

// 第二个类：内部实现（下划线开头表示私有）
class _CounterState extends State<Counter> {
  int count = 0;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextButton(
          onPressed: () {
            setState(() { count--; });
          },
          child: Text("减"),
        ),
        Text("$count"),
        TextButton(
          onPressed: () {
            setState(() { count++; });
          },
          child: Text("加"),
        ),
      ],
    );
  }
}
```

> **快捷创建：** 输入 `stlessW` 快速创建无状态组件，`statefulW` 快速创建有状态组件。

---

## 六、组件生命周期

Widget 的生命周期分为三个阶段：

- **创建阶段** — `createState()` → `initState()` → `build()`
- **更新阶段** — `didUpdateWidget()` → `setState()` → `build()`
- **销毁阶段** — `deactivate()` → `dispose()`

---

## 七、事件处理 — GestureDetector

`GestureDetector` 是功能最丰富的手势检测组件，支持点击、双击、长按等。

```dart
GestureDetector(
  onTap: () => print("单击"),
  onDoubleTap: () => print("双击"),
  onLongPress: () => print("长按"),
  child: Text("点击我"),
)
```

其他常用事件组件：

| 组件 | 说明 |
|---|---|
| `InkWell` | 带水波纹效果的点击 |
| `TextButton` | 文本按钮 |
| `IconButton` | 图标按钮 |
| `ElevatedButton` | 凸起按钮 |

---

## 八、状态更新 — setState

调用 `setState()` 会触发 `build()` 重新执行，从而更新 UI：

```dart
class _MyState extends State<MyWidget> {
  int count = 0;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        TextButton(
          onPressed: () {
            setState(() { count--; });
          },
          child: Text("减"),
        ),
        Text("$count"),
        TextButton(
          onPressed: () {
            setState(() { count++; });
          },
          child: Text("加"),
        ),
      ],
    );
  }
}
```

> **注意：** 修改变量后必须调用 `setState()` 才能触发 UI 更新。

---

## 九、常用基础组件

### Container — 多功能容器

`Container` 是最常用的组合容器，支持设置宽高、边距、装饰、变换等。

```dart
Container(
  margin: EdgeInsets.all(20),
  padding: EdgeInsets.all(10),
  width: 200,
  height: 200,
  alignment: Alignment.center,
  decoration: BoxDecoration(
    color: Colors.blue,
    borderRadius: BorderRadius.circular(10),
    border: Border.all(width: 3, color: Colors.yellow),
  ),
  transform: Matrix4.rotationZ(0.05),
  child: Text("Hello", style: TextStyle(color: Colors.white)),
)
```

**尺寸优先级：** 明确宽高 > constraints 约束 > 父组件约束 > 自适应

**注意：** `color` 和 `decoration` 不能同时使用。

### Center — 居中组件

```dart
Center(
  child: Container(
    width: 100,
    height: 100,
    child: Center(child: Text("居中")),
  ),
)
```

### Align — 对齐组件

精确控制子组件在父容器中的位置：

```dart
Align(
  alignment: Alignment.bottomRight,
  child: Icon(Icons.star, size: 50),
)
```

> `Center` 继承自 `Align`，等价于 `Align(alignment: Alignment.center)`。

### Padding — 内边距组件

```dart
Padding(
  padding: EdgeInsets.symmetric(vertical: 10, horizontal: 20),
  child: Container(color: Colors.blue),
)
```

**EdgeInsets 常用方式：**

- `EdgeInsets.all(20)` — 四边相同
- `EdgeInsets.only(left: 10, top: 20)` — 指定某一边
- `EdgeInsets.symmetric(vertical: 10, horizontal: 20)` — 纵向/横向

### Text — 文本组件

```dart
Text(
  "这是一段很长的文本内容...",
  maxLines: 2,
  overflow: TextOverflow.ellipsis,
  style: TextStyle(
    fontSize: 20,
    color: Colors.blue,
    fontWeight: FontWeight.bold,
    fontStyle: FontStyle.italic,
    decoration: TextDecoration.underline,
  ),
)
```

#### TextSpan — 富文本

在同一段文本中显示不同样式：

```dart
Text.rich(
  TextSpan(
    text: "Hello ",
    style: TextStyle(fontSize: 40),
    children: [
      TextSpan(text: "Flutter", style: TextStyle(color: Colors.red)),
      TextSpan(text: "!", style: TextStyle(color: Colors.blue)),
    ],
  ),
)
```

### Image — 图片组件

**项目资源图片：**

1. 在 `pubspec.yaml` 中声明资源路径：

```yaml
assets:
  - lib/images/
```

2. 使用 `Image.asset` 加载：

```dart
Image.asset(
  "lib/images/logo.png",
  width: 300,
  height: 300,
  fit: BoxFit.cover,
)
```

**网络图片：**

```dart
Image.network(
  "https://example.com/image.jpg",
  width: 300,
  height: 300,
  fit: BoxFit.cover,
)
```

**BoxFit 常用值：**

| 值 | 说明 |
|---|---|
| `BoxFit.cover` | 填充容器，可能裁剪 |
| `BoxFit.contain` | 完整显示，可能留白 |
| `BoxFit.fill` | 拉伸填满，可能变形 |
| `BoxFit.fitWidth` | 宽度填满，高度自适应 |

### TextField — 文本输入

```dart
final TextEditingController _controller = TextEditingController();

TextField(
  controller: _controller,
  obscureText: true, // 密码模式
  onChanged: (value) => print("输入: $value"),
  onSubmitted: (value) => print("提交: $value"),
  decoration: InputDecoration(
    hintText: "请输入内容",
    fillColor: Colors.grey[100],
    filled: true,
    contentPadding: EdgeInsets.only(left: 20),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(20),
      borderSide: BorderSide.none,
    ),
  ),
)
```

---

## 十、布局组件

### Column — 垂直布局

子组件从上到下排列。

```dart
Column(
  mainAxisAlignment: MainAxisAlignment.center,    // 主轴（垂直）对齐
  crossAxisAlignment: CrossAxisAlignment.center,  // 交叉轴（水平）对齐
  children: [
    Container(width: 50, height: 50, color: Colors.red),
    SizedBox(height: 10),
    Container(width: 50, height: 50, color: Colors.green),
    Container(width: 50, height: 50, color: Colors.blue),
  ],
)
```

**MainAxisAlignment 常用值：**

| 值 | 效果 |
|---|---|
| `start` | 顶部对齐 |
| `center` | 居中 |
| `end` | 底部对齐 |
| `spaceBetween` | 两端对齐，中间均匀分布 |
| `spaceAround` | 每个子组件两侧间距相等 |
| `spaceEvenly` | 所有间距完全相等 |

### Row — 水平布局

子组件从左到右排列，属性与 Column 相同。

```dart
Row(
  mainAxisAlignment: MainAxisAlignment.center,
  children: [
    Container(width: 50, height: 50, color: Colors.red),
    SizedBox(width: 10),
    Container(width: 50, height: 50, color: Colors.green),
  ],
)
```

### Flex — 弹性布局

`Row` 和 `Column` 都是 `Flex` 的特例。使用 `Expanded` 按比例分配空间：

```dart
Flex(
  direction: Axis.horizontal, // Axis.vertical 为垂直方向
  children: [
    Expanded(
      flex: 2,
      child: Container(color: Colors.red, height: 100),
    ),
    Expanded(
      flex: 1,
      child: Container(color: Colors.green, height: 100),
    ),
  ],
)
```

`Expanded` 让子组件占满剩余空间，经典三段式布局：

```dart
Column(
  children: [
    Container(height: 100, color: Colors.red),          // 固定高度
    Expanded(child: Container(color: Colors.grey)),      // 占满剩余空间
    Container(height: 100, color: Colors.blue),          // 固定高度
  ],
)
```

### Wrap — 流式布局

类似 `Row`，但子组件超出宽度时会自动换行，适合标签、按钮组等动态内容。

```dart
Wrap(
  spacing: 10,       // 水平间距
  runSpacing: 10,    // 垂直间距
  children: List.generate(10, (index) {
    return Chip(label: Text("标签 $index"));
  }),
)
```

### Stack + Position — 层叠布局

子组件按 Z 轴叠加，`Positioned` 用于精确定位（类似 CSS 的绝对定位）。

```dart
Stack(
  children: [
    Container(width: 200, height: 200, color: Colors.grey),
    Positioned(
      left: 10,
      top: 10,
      child: Container(width: 80, height: 80, color: Colors.red),
    ),
    Positioned(
      right: 10,
      bottom: 10,
      child: Container(width: 80, height: 80, color: Colors.blue),
    ),
  ],
)
```

**全屏覆盖效果**（适用于水印、遮罩层）：

```dart
Positioned(
  left: 0, right: 0, top: 0, bottom: 0,
  child: Container(color: Colors.black54),
)
```

---

## 十一、滚动组件

### SingleChildScrollView — 单子组件滚动

包裹单个子组件使其具有滚动能力：

```dart
SingleChildScrollView(
  padding: EdgeInsets.all(10),
  child: Column(
    children: List.generate(50, (index) {
      return Container(
        margin: EdgeInsets.only(top: 10),
        height: 80,
        color: Colors.blue,
        child: Center(child: Text("第 $index 项")),
      );
    }),
  ),
)
```

#### 滚动控制

通过 `ScrollController` 控制滚动位置：

```dart
final ScrollController _controller = ScrollController();

// 滚动到底部
_controller.animateTo(
  _controller.position.maxScrollExtent,
  duration: Duration(seconds: 1),
  curve: Curves.ease,
);

// 滚动到顶部
_controller.animateTo(0, duration: Duration(seconds: 1), curve: Curves.ease);
```

### ListView — 列表组件

**懒加载**，只构建可见项，性能优于 `SingleChildScrollView`。

**默认构造：**

```dart
ListView(
  padding: EdgeInsets.all(10),
  children: List.generate(100, (index) {
    return ListTile(title: Text("第 $index 项"));
  }),
)
```

**ListView.builder（推荐）：**

```dart
ListView.builder(
  itemCount: 100,
  itemBuilder: (context, index) {
    return ListTile(title: Text("第 $index 项"));
  },
)
```

**ListView.separated（带分隔线）：**

```dart
ListView.separated(
  itemCount: 100,
  itemBuilder: (context, index) {
    return ListTile(title: Text("第 $index 项"));
  },
  separatorBuilder: (context, index) => Divider(height: 1),
)
```

### GridView — 网格布局

```dart
GridView.count(
  crossAxisCount: 3,       // 每行 3 列
  mainAxisSpacing: 10,     // 垂直间距
  crossAxisSpacing: 10,    // 水平间距
  childAspectRatio: 1.0,   // 宽高比
  padding: EdgeInsets.all(10),
  children: List.generate(30, (index) {
    return Container(
      color: Colors.blue,
      child: Center(child: Text("$index", style: TextStyle(color: Colors.white))),
    );
  }),
)
```

### PageView — 整页翻滚

实现分页滚动效果，常用于引导页、图片轮播：

```dart
PageView(
  children: [
    Container(color: Colors.red, child: Center(child: Text("第 1 页"))),
    Container(color: Colors.green, child: Center(child: Text("第 2 页"))),
    Container(color: Colors.blue, child: Center(child: Text("第 3 页"))),
  ],
)
```

---

## 十二、组件通信

### 父传子 — 构造函数

父组件通过构造函数将数据传给子组件。子组件用 `final` 声明属性，有状态组件通过 `widget.属性名` 访问。

```dart
// 父组件
Child(message: "张三")

// 无状态子组件
class Child extends StatelessWidget {
  final String message;
  const Child({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    return Text(message);
  }
}

// 有状态子组件 — 通过 widget.message 访问
class _ChildState extends State<Child> {
  @override
  Widget build(BuildContext context) {
    return Text(widget.message);
  }
}
```

### 子传父 — 回调函数

父组件传递一个函数给子组件，子组件调用该函数将数据传回：

```dart
// 父组件
Child(
  title: "点击删除",
  onDelete: (index) {
    setState(() { list.removeAt(index); });
  },
)

// 子组件
class Child extends StatelessWidget {
  final String title;
  final Function(int) onDelete;
  const Child({super.key, required this.title, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: () => onDelete(0),
      icon: Icon(Icons.delete),
    );
  }
}
```

---

## 十三、网络请求 — Dio

### 安装

```bash
flutter pub add dio
```

### 基本用法

```dart
Dio().get("https://api.example.com/data").then((value) {
  print(value.data);
}).catchError((error) {
  print(error);
});
```

### 封装 Dio 工具类

```dart
class DioUtil {
  final Dio _dio = Dio();

  DioUtil() {
    _dio.options
      ..baseUrl = "https://api.example.com/"
      ..connectTimeout = Duration(seconds: 10)
      ..sendTimeout = Duration(seconds: 10)
      ..receiveTimeout = Duration(seconds: 10);

    // 拦截器
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        print("请求: ${options.uri}");
        return handler.next(options);
      },
      onResponse: (response, handler) {
        print("响应: ${response.statusCode}");
        return handler.next(response);
      },
      onError: (error, handler) {
        print("错误: ${error.message}");
        return handler.next(error);
      },
    ));
  }

  Future<Response> get(String url, {Map<String, dynamic>? params}) {
    return _dio.get(url, queryParameters: params);
  }
}
```

> **Web 端跨域问题：** Flutter Web 默认会遇到跨域限制，需要后端配置 CORS 或使用代理。

---

## 十四、路由管理

### 基本路由

使用 `Navigator.push` 和 `Navigator.pop` 进行页面跳转：

```dart
// 跳转到新页面
Navigator.push(context, MaterialPageRoute(
  builder: (context) => DetailPage(),
));

// 返回上一页
Navigator.pop(context);
```

### 命名路由

在 `MaterialApp` 中注册路由表，使用路由名称跳转：

```dart
MaterialApp(
  routes: {
    '/list': (context) => ListPage(),
    '/detail': (context) => DetailPage(),
  },
  initialRoute: '/list',
)

// 跳转
Navigator.pushNamed(context, '/detail');

// 传递参数
Navigator.pushNamed(context, '/detail', arguments: {"id": 42});

// 接收参数（在 initState 中使用 Future.microtask）
Map<String, dynamic> params =
    ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
```

### 路由拦截 — onGenerateRoute

在路由跳转前进行拦截判断（如登录检查）：

```dart
MaterialApp(
  routes: {
    "/goodsList": (context) => GoodsList(),
    "/cartList": (context) => CartList(),
    "/login": (context) => LoginPage(),
  },
  initialRoute: "/goodsList",
  onGenerateRoute: (settings) {
    if (settings.name == "/cartList") {
      bool isLogin = false;
      if (isLogin) {
        return MaterialPageRoute(builder: (context) => CartList());
      } else {
        return MaterialPageRoute(builder: (context) => LoginPage());
      }
    }
    return null;
  },
)
```

### 404 处理 — onUnknownRoute

处理未注册的路由：

```dart
onUnknownRoute: (settings) {
  return MaterialPageRoute(builder: (context) => NotFoundPage());
},
```

---

## 总结

| 知识点 | 核心要点 |
|---|---|
| Widget | Flutter 一切皆 Widget |
| StatelessWidget | 无状态，只负责渲染 |
| StatefulWidget | 有状态，管理可变数据 |
| setState | 触发 UI 重新渲染 |
| 布局 | Column/Row/Flex/Stack/Wrap |
| 滚动 | ListView/GridView/PageView |
| 组件通信 | 构造函数(父→子) / 回调(子→父) |
| 网络请求 | Dio + 拦截器封装 |
| 路由 | 基本路由 / 命名路由 / 路由拦截 |

掌握了以上内容，你已经具备了 Flutter 开发的基础能力。接下来可以深入学习状态管理（Provider / Riverpod）、动画、自定义绘制等进阶主题。
