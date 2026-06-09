---
title: TypeScript 基础入门
published: 2026-06-01
description: "TypeScript 核心语法笔记，涵盖类型系统、接口、泛型、类和模块化等基础知识。"
image: "./cover.webp"
tags: ["前端开发", "TypeScript"]
category: Guides
draft: false
---

# TypeScript 基础入门

TypeScript 是微软开发的 JavaScript 超集，它在 JS 的基础上增加了**类型系统**。每个变量在定义时都需要指定类型，编译后会生成普通的 JavaScript 代码。

## 快速开始

```bash
# 全局安装
npm install -g typescript

# 生成 tsconfig.json 配置文件
tsc --init

# 监听文件变化并自动编译
tsc -w index.ts --target es6
```

---

## 一、基本类型

TS 对 JS 的基本类型都做了类型限定：

```ts
let num: number = 123;
let str: string = 'hello';
let bool: boolean = true;
let und: undefined = undefined;
let nul: null = null;
let sym: symbol = Symbol('sym');
```

### any — 任意类型

`any` 表示任意类型，使用后会跳过类型检查。既然用了 TS，就尽量别用 `any`，否则和 JS 没区别了。

```ts
let val: any = 123;
val = 'hello';  // 不报错
val = true;     // 不报错
```

### unknown — 未知类型

`unknown` 和 `any` 类似，但更安全。使用前必须先判断类型：

```ts
let val: unknown = 123;

if (typeof val === 'number') {
  console.log(val + 1);  // 类型收窄后才能使用
}
```

### never — 永不存在的类型

`never` 表示永远不会出现的值，常见于死循环或抛出异常的函数：

```ts
function throwError(): never {
  throw new Error('出错了');
}

function infiniteLoop(): never {
  while (true) {
    console.log('永远停不下来');
  }
}
```

**对比总结：**

| 类型 | 含义 | 是否安全 | 使用场景 |
|---|---|---|---|
| `any` | 任意类型 | ❌ 跳过检查 | 尽量避免 |
| `unknown` | 未知类型 | ✅ 需要类型判断后才能使用 | 接收不确定类型的数据 |
| `never` | 永不存在 | — | 死循环、抛异常 |

---

## 二、数组与元组

### 数组声明

```ts
// 只能存放 string
let arr: string[] = ['a', 'b'];

// 先声明后赋值
let nums: number[];
nums = [1, 2, 3];

// 二维数组
let matrix: string[][] = [['a'], ['b']];

// 包含多种类型的数组（联合类型）
let mixed: (string | number)[] = [1, 'hello', 2, 'world'];

// 对象数组
let users: { name: string; age: number }[] = [
  { name: '张三', age: 18 },
  { name: '李四', age: 20 },
];

// 泛型写法
let arr2: Array<number> = [1, 2, 3];
```

### 元组 Tuple

元组限定了数组的**长度**和**每个位置的类型**：

```ts
let tuple: [string, number] = ['hello', 123];
// let wrong: [string, number] = [123, 'hello']; // 报错，顺序不对

// 先声明后赋值
let pair: [string, number];
pair = ['hello', 123];

// push 只能添加已定义的类型
pair.push('world');  // ✅ string 是联合类型的一部分
// pair.push(true);  // ❌ boolean 不在类型定义中
```

---

## 三、对象类型

直接用 `object` 声明没有意义（等同于 `any`），应该限定对象中每个属性的类型：

```ts
let user: {
  name: string;
  age: number;
} = { name: '张三', age: 18 };
```

### 属性修饰符

| 修饰符 | 含义 | 示例 |
|---|---|---|
| 可选属性 | 可有可无 | `age?: number` |
| 只读属性 | 不可修改 | `readonly id: number` |
| 任意属性 | 允许添加额外属性 | `[key: string]: any` |

```ts
let user: {
  name: string;
  age?: number;           // 可选
  readonly id: number;    // 只读
  [key: string]: any;     // 任意属性
} = {
  name: '张三',
  id: 1,
  hobby: ['coding'],      // 任意属性允许添加额外字段
};

user.name = '李四';       // ✅ 正常属性可修改
// user.id = 2;           // ❌ 只读属性不可修改
```

**注意：** 任意属性的类型必须是其他属性类型的父类。如果已有 `number` 类型的属性，任意属性就不能只声明为 `string`，需要用 `any` 包容。

### 内置对象

```ts
let err: Error = new Error('失败');
let date: Date = new Date();
let reg: RegExp = /\d+/;
let body: HTMLElement = document.body;
```

---

## 四、函数类型

### 基本定义

函数需要定义参数类型和返回值类型：

```ts
function add(a: number, b: number): number {
  return a + b;
}

// 没有返回值用 void
function log(msg: string): void {
  console.log(msg);
}
```

### 函数表达式与箭头函数

```ts
// 函数表达式
const add = function (a: number, b: number): number {
  return a + b;
};

// 箭头函数
const add = (a: number, b: number): number => a + b;
```

### 单独定义函数类型

```ts
let fn: (a: string) => string;
fn = (a: string): string => a + ' world';
```

### 可选参数与默认值

```ts
// 可选参数必须放在最后
function greet(name: string, msg?: string): string {
  return `Hello, ${name}${msg ? ', ' + msg : ''}`;
}

greet('张三');           // ✅
greet('张三', '你好');   // ✅
```

### 剩余参数

```ts
function sum(a: number, ...rest: number[]): number {
  return rest.reduce((acc, cur) => acc + cur, a);
}

sum(1, 2, 3, 4); // 10
```

### 返回值类型

```ts
// 返回对象
function createUser(age: number): { name: string; age: number } {
  return { name: '张三', age };
}

// 返回函数
function factory(): (x: number) => number {
  return (x: number) => x * 2;
}

// 返回数组
function getNames(): string[] {
  return ['张三', '李四'];
}
```

---

## 五、联合类型

联合类型表示一个值可以是几种类型之一，用 `|` 分隔：

```ts
let val: string | number = 'hello';
val = 123;  // ✅

// 不确定具体类型时，只能使用共有方法
function print(val: string | number): void {
  val.toString();  // ✅ string 和 number 都有 toString
  // val.substring(); // ❌ number 没有 substring
}

// 数组中存放多种类型
let arr: (string | number | boolean)[] = [1, 'hello', true];
```

---

## 六、类型推论

TS 会根据赋值自动推断类型，不需要每次都手动声明：

```ts
let a = 123;      // 自动推断为 number
// a = 'hello';   // ❌ 不能将 string 赋给 number

function add(a = 10, b) {
  // a 被推断为 number，b 被推断为 any
  return a + b;
}
```

**规则：** 声明时赋了值就自动推断，没赋值默认是 `any`。

---

## 七、typeof 与 keyof

### typeof — 获取类型

TS 中的 `typeof` 可以用来获取一个变量的类型：

```ts
const person = { name: '张三', age: 18 };
type Person = typeof person; // { name: string; age: number }

const p2: Person = { name: '李四', age: 20 }; // 复用类型
```

### keyof — 获取键名联合类型

`keyof` 接收一个对象类型，返回所有键名组成的联合类型：

```ts
type Person = { name: string; age: number };
type Keys = keyof Person; // 'name' | 'age'

const key: Keys = 'name'; // ✅
// const key2: Keys = 'sex'; // ❌
```

---

## 八、映射类型

用 `in` 遍历联合类型的每个成员，批量生成属性：

```ts
type Axis = 'x' | 'y' | 'z';

// 等价于 { x: number; y: number; z: number }
type Point = {
  [key in Axis]: number;
};

const p: Point = { x: 1, y: 2, z: 3 };
```

配合 `keyof` 使用：

```ts
type Props = { a: number; b: string; c: boolean };

// 所有属性变为 string
type StringProps = { [key in keyof Props]: string };

// 保持原类型
type SameProps = { [key in keyof Props]: Props[key] };

// 所有属性变为可选
type Optional = { [key in keyof Props]?: Props[key] };

// 所有属性变为只读
type Readonly = { readonly [key in keyof Props]: Props[key] };
```

---

## 九、interface 接口

接口用来定义对象的结构，比 `type` 更适合描述对象：

```ts
interface User {
  name: string;
  age: number;
  salary: number;
}

const user: User = {
  name: '张三',
  age: 21,
  salary: 10000,
};
```

接口支持**可选属性**、**只读属性**和**任意属性**：

```ts
interface User {
  name: string;
  age?: number;                // 可选
  readonly id: number;         // 只读
  [key: string]: string | number; // 任意属性
}
```

### 接口继承

用 `extends` 继承已有接口，避免重复定义：

```ts
interface Person {
  name: string;
  age: number;
  address: string;
}

interface Girl extends Person {
  height: number;
  hobby: string[];
}

interface Boy extends Person {
  salary: number;
  car: string[];
}

// 可以继承多个接口
interface Worker extends Person {
  company: string;
}
```

### 同名接口合并

两个同名接口的属性会自动合并：

```ts
interface Config {
  name: string;
}

interface Config {
  port: number;
}

// 等价于 { name: string; port: number }
const config: Config = { name: 'server', port: 3000 };
```

### 接口定义数组和函数

```ts
// 定义数组
interface StringArray {
  [index: number]: string;
}
const arr: StringArray = ['a', 'b'];

// 定义函数
interface Calc {
  (a: number, b: number): number;
}
const add: Calc = (a, b) => a + b;
```

**interface vs type：**

| 特性 | interface | type |
|---|---|---|
| 定义对象 | ✅ | ✅ |
| 继承（extends） | ✅ | ✅（用 `&`） |
| 同名合并 | ✅ | ❌ |
| 联合类型 | ❌ | ✅ |
| 映射类型 | ❌ | ✅ |

---

## 十、交叉类型

交叉类型用 `&` 连接，表示**同时满足**多个类型：

```ts
type Person = { name: string; age: number };
type Employee = { salary: number; address: string };

type Worker = Person & Employee;

const worker: Worker = {
  name: '张三',
  age: 18,
  salary: 10000,
  address: '北京',
};
```

**注意：** 不要对基本类型使用交叉，结果会变成 `never`：

```ts
type Impossible = string & number; // never
```

---

## 十一、类型断言

当你比编译器更确定变量的类型时，可以使用类型断言：

```ts
function printLen(val: string | number): void {
  (val as string).length;  // 断言为 string
}

printLen('hello');  // ✅ 运行正常
printLen(123);      // ⚠️ 编译不报错，但运行时 undefined
```

### 非空断言

用 `!` 告诉编译器这个值一定不是 `null` 或 `undefined`：

```ts
let el: HTMLElement | null = document.getElementById('app');
el!.style.color = 'red';  // 非空断言
```

### 双重断言

不推荐使用，仅在极端情况下用来绕过类型检查：

```ts
// 先断言为 any，再断言为目标类型
(val as any as TargetType);
```

**断言规则：**

| 场景 | 是否允许 |
|---|---|
| 子类型 → 父类型 | ✅ |
| 父类型 → 子类型 | ⚠️ 编译通过，运行可能出错 |
| 任意类型 → any | ✅ |
| any → 任意类型 | ✅ |
| 不相关类型互转 | ❌ 需要双重断言 |

---

## 十二、枚举

当一个变量只有固定的几个取值时，使用枚举可以提升代码可读性：

```ts
enum OrderStatus {
  Unpaid,     // 0（默认从 0 开始）
  Paid,       // 1
  Shipped,    // 2
  Delivered,  // 3
}

const status = OrderStatus.Paid;
console.log(status); // 1
```

### 数字枚举

```ts
enum HttpStatus {
  OK = 200,
  NotFound = 404,
  Error = 500,
}

console.log(HttpStatus.OK);      // 200
console.log(HttpStatus[200]);    // 'OK'（反向映射）
```

### 字符串枚举

```ts
enum Msg {
  Success = '请求成功',
  Error = '网络错误',
  Bad = '参数错误',
}

console.log(Msg.Success); // '请求成功'
// console.log(Msg[200]); // ❌ 字符串枚举不支持反向映射
```

**数字枚举 vs 字符串枚举：**

| 特性 | 数字枚举 | 字符串枚举 |
|---|---|---|
| 默认值 | 从 0 递增 | 必须手动赋值 |
| 反向映射 | ✅ | ❌ |
| 运行时性能 | 更小 | 稍大 |

---

## 十三、泛型

泛型是指在定义函数、接口或类时，不预先指定具体类型，使用时再传入类型参数。

### 函数中的泛型

```ts
function identity<T>(val: T): T {
  return val;
}

identity<string>('hello');  // 显式指定
identity(123);              // 类型推断
```

多个类型参数：

```ts
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

pair<string, number>('hello', 123);
```

### 接口中的泛型

```ts
interface Box<T> {
  value: T;
}

const box: Box<number> = { value: 42 };
```

### 类中的泛型

```ts
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }
}

const numStack = new Stack<number>();
numStack.push(1);
numStack.push(2);
```

### 泛型默认值

```ts
interface ApiResponse<T = string> {
  code: number;
  data: T;
}

const res: ApiResponse = { code: 200, data: 'ok' };
const res2: ApiResponse<number[]> = { code: 200, data: [1, 2, 3] };
```

### 泛型约束

用 `extends` 限制泛型的范围：

```ts
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(val: T): void {
  console.log(val.length);
}

logLength('hello');     // ✅ string 有 length
logLength([1, 2, 3]);   // ✅ array 有 length
// logLength(123);       // ❌ number 没有 length
```

### 泛型嵌套

```ts
interface Box<T> {
  item: T;
}

// 嵌套使用
const nested: Box<Box<string>> = {
  item: { item: 'hello' },
};
```

---

## 十四、Class 类

### 基本用法

TS 中的类必须先声明属性的类型：

```ts
class Person {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  greet(): string {
    return `我是${this.name}，今年${this.age}岁`;
  }
}
```

### 访问修饰符

| 修饰符 | 类内部 | 子类 | 外部 |
|---|---|---|---|
| `public` | ✅ | ✅ | ✅ |
| `protected` | ✅ | ✅ | ❌ |
| `private` | ✅ | ❌ | ❌ |

```ts
class Animal {
  public name: string;
  protected age: number;
  private secret: string;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
    this.secret = 'hidden';
  }
}

class Dog extends Animal {
  bark(): void {
    console.log(this.name);   // ✅ public
    console.log(this.age);    // ✅ protected
    // console.log(this.secret); // ❌ private 不可访问
  }
}
```

### 静态属性与方法

用 `static` 修饰的属性和方法属于**类本身**，不属于实例：

```ts
class MathUtils {
  static PI = 3.14159;

  static square(x: number): number {
    return x * x;
  }
}

console.log(MathUtils.PI);        // 3.14159
console.log(MathUtils.square(5)); // 25
```

### readonly 只读属性

```ts
class Config {
  readonly port: number = 3000;
}

const config = new Config();
// config.port = 8080; // ❌ 只读属性不可修改
```

### 继承

用 `extends` 继承父类，用 `super` 调用父类构造器：

```ts
class Animal {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  eat(): void {
    console.log('吃东西');
  }
}

class Dog extends Animal {
  breed: string;

  constructor(name: string, breed: string) {
    super(name);
    this.breed = breed;
  }

  // 方法重写
  eat(): void {
    console.log('啃骨头');
  }

  bark(): void {
    console.log('汪汪汪');
  }
}
```

### 抽象类

抽象类不能实例化，抽象方法必须被子类实现：

```ts
abstract class Shape {
  abstract area(): number;

  describe(): void {
    console.log(`面积是 ${this.area()}`);
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }

  area(): number {
    return Math.PI * this.radius ** 2;
  }
}

// new Shape();        // ❌ 抽象类不能实例化
const c = new Circle(5);
c.describe();         // ✅ 面积是 78.54
```

### implements 实现接口

用 `implements` 让类遵循接口的约束：

```ts
interface Printable {
  print(): void;
}

interface Serializable {
  serialize(): string;
}

class Document implements Printable, Serializable {
  constructor(private content: string) {}

  print(): void {
    console.log(this.content);
  }

  serialize(): string {
    return JSON.stringify({ content: this.content });
  }
}
```

---

## 十五、模块化

任何包含 `import` 或 `export` 的文件就是一个模块，否则是全局脚本。

### 导出

```ts
// 混合导出变量和类型
const API_URL = 'https://api.example.com';
interface User { name: string; age: number }
type Status = 'active' | 'inactive';

export { API_URL, type User, type Status };
```

### 导入

```ts
import { API_URL, type User, type Status } from './api';
```

### 重导出

把多个模块的导出集中到一个文件，方便统一管理：

```ts
// types.ts
export type { User } from './user';
export type { Post } from './post';

// index.ts
export * from './types';
```

### 命名空间

在没有模块化的场景下，用 `namespace` 创建独立作用域：

```ts
namespace Utils {
  export function format(str: string): string {
    return str.trim();
  }

  export const VERSION = '1.0.0';
}

Utils.format('  hello  '); // ✅
Utils.VERSION;              // ✅
// format('hello');         // ❌ 外部不可见
```

### declare 声明文件

当使用的第三方库没有类型定义时，可以用 `declare` 手动声明：

```ts
// common.d.ts
declare function calculate(x: number, y: number): number;
declare const API_KEY: string;

// index.ts
calculate(1, 2);  // 不再报错
console.log(API_KEY);
```

为已有模块扩展类型：

```ts
// 扩展 ./config 模块
declare module './config' {
  interface Config {
    debug: boolean;
  }
}
```

---

## 总结

| 知识点 | 核心要点 |
|---|---|
| 基本类型 | `number` / `string` / `boolean` / `null` / `undefined` |
| 特殊类型 | `any`（避免使用）/ `unknown`（安全）/ `never`（永不存在） |
| 数组与元组 | `type[]` 固定类型数组，`[type1, type2]` 固定长度和位置 |
| 对象类型 | 属性类型 + 可选 `?` + 只读 `readonly` + 任意属性 |
| 联合类型 | `A \| B` 满足其一即可 |
| 交叉类型 | `A & B` 同时满足 |
| 接口 | `interface` 定义对象结构，支持继承和合并 |
| 泛型 | `<T>` 延迟确定类型，用 `extends` 约束范围 |
| 类 | 访问修饰符 + 继承 + 抽象类 + implements |
| 模块化 | `import` / `export` / `namespace` / `declare` |
