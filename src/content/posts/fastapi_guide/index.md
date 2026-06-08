---
title: FastAPI 从入门到数据库
published: 2026-06-08
description: "近日学习fastapi的总结."
image: "./cover.webp"
tags: ["后端开发", "数据库", "Python"]
category: Guides
draft: false
---

# FastAPI 从入门到数据库 — 完整学习指南

> **技术栈**：FastAPI + Uvicorn + SQLAlchemy（异步） + MySQL

---

## 📑 目录

- [一、环境准备与项目初始化](#一环境准备与项目初始化)
- [二、第一个 FastAPI 程序](#二第一个-fastapi-程序)
- [三、路径参数与验证](#三路径参数与验证)
- [四、查询参数与验证](#四查询参数与验证)
- [五、响应格式](#五响应格式)
- [六、异常处理](#六异常处理)
- [七、依赖注入系统](#七依赖注入系统)
- [八、中间件 Middleware](#八中间件-middleware)
- [九、文件上传](#九文件上传)
- [十、ORM 数据库操作（SQLAlchemy）](#十orm-数据库操作sqlalchemy)
- [十一、数据库 CRUD 完整操作](#十一数据库-crud-完整操作)
- [附录：常见问题与易错点](#附录常见问题与易错点)

---

## 一、环境准备与项目初始化

### 1.1 工具介绍

| 工具        | 说明                                                     |
| ----------- | -------------------------------------------------------- |
| **Uvicorn** | 基于 `asyncio` 的 ASGI 服务器，用于运行 FastAPI 异步应用 |
| **uv**      | Python 包管理工具，类似 pip，速度更快                    |
| **FastAPI** | 现代、高性能的 Python Web 框架，基于类型提示构建 API     |
| **VS Code** | 推荐的代码编辑器                                         |

> 📌 **官方文档**
>
> - uv 文档：<https://uv.doczh.com/getting-started>
> - FastAPI 文档：<https://fastapi.org.cn/>

### 1.2 创建项目

```bash
# 初始化项目
uv init example_project

# 进入项目目录
cd example_project

# 创建虚拟环境并安装 ruff（代码格式化工具）
uv add ruff

# 安装 FastAPI（注意加引号，确保所有终端兼容）
uv add "fastapi[standard]"
```

### 1.3 项目目录结构

```
example_project/
├── main.py          # 📌 项目入口文件
├── pyproject.toml   # 项目配置文件
├── venv/            # 虚拟环境
├── .gitignore       # Git 忽略文件
├── uv.lock          # 依赖锁定文件
├── python-version   # Python 版本文件
├── README.md        # 项目说明
├── .git/            # Git 仓库
└── __pycache__/     # Python 缓存文件
```

---

## 二、第一个 FastAPI 程序

将以下代码写入 `main.py`：

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}
```

### 启动项目

```bash
# --reload 表示代码修改后自动重新加载（开发环境推荐）
uvicorn main:app --reload
```

启动后访问 <http://127.0.0.1:8000/>，浏览器会显示：

```json
{ "Hello": "World" }
```

> 💡 **`main:app` 的含义**：`main` 是文件名（`main.py`），`app` 是文件中创建的 FastAPI 实例变量名。

---

## 三、路径参数与验证

**路径参数**是 URL 路径中的一部分，用于标识具体资源（如用户 ID、书名等）。

### 3.1 基本用法

```python
from fastapi import FastAPI, Path

app = FastAPI()

@app.get("/users/{id}")
async def get_user(id: int = Path(..., gt=0, lt=100, description="用户ID范围1-99")):
    return {"id": id}

@app.get("/users/{name}")
async def get_user_by_name(name: str = Path(..., min_length=2, max_length=10, description="用户名2-10个字符")):
    return {"name": name}
```

### 3.2 Path 验证参数速查表

| 参数         | 全称                  | 含义               | 示例                    |
| ------------ | --------------------- | ------------------ | ----------------------- |
| `gt`         | greater than          | **大于**           | `gt=0` 表示大于 0       |
| `lt`         | less than             | **小于**           | `lt=100` 表示小于 100   |
| `ge`         | greater than or equal | **大于等于**       | `ge=1` 表示大于等于 1   |
| `le`         | less than or equal    | **小于等于**       | `le=99` 表示小于等于 99 |
| `min_length` | —                     | 字符串**最小长度** | `min_length=2`          |
| `max_length` | —                     | 字符串**最大长度** | `max_length=10`         |
| `...`        | —                     | 表示参数**必填**   | `Path(...)`             |

---

## 四、查询参数与验证

**查询参数**通常用于分页、过滤等操作，出现在 URL 的 `?` 后面，如 `/users?skip=0&limit=10`。

```python
from fastapi import FastAPI, Query

app = FastAPI()

@app.get("/users")
async def get_users(
    skip: int = Query(0, description="跳过的记录数", lt=100),
    limit: int = Query(10, description="返回的记录数")
):
    return {"skip": skip, "limit": limit}
```

> 💡 **路径参数 vs 查询参数**
>
> | 类型     | 位置       | 示例 URL                 | 用途             |
> | -------- | ---------- | ------------------------ | ---------------- |
> | 路径参数 | URL 路径中 | `/users/42`              | 标识具体资源     |
> | 查询参数 | `?` 之后   | `/users?skip=0&limit=10` | 过滤、分页、排序 |

---

## 五、响应格式

FastAPI 支持多种响应格式，可在路由装饰器中通过 `response_class` 指定。

### 5.1 内置响应格式

```python
from fastapi import FastAPI, HTMLResponse, FileResponse, JSONResponse

app = FastAPI()

# 返回 HTML 页面
@app.get("/html", response_class=HTMLResponse)
async def get_html():
    return "<h1>这是标题</h1>"

# 返回文件下载
@app.get("/file", response_class=FileResponse)
async def get_file():
    return FileResponse("./files/demo.png")

# 返回 JSON 数据
@app.get("/json", response_class=JSONResponse)
async def get_json():
    return {"message": "hello world", "code": 200}
```

### 5.2 自定义响应模型（Pydantic）

使用 **Pydantic** 的 `BaseModel` 可以定义数据结构并自动进行**数据验证**。

```python
from pydantic import BaseModel, Field
from fastapi import FastAPI

app = FastAPI()

class User(BaseModel):
    id: int = Field(description="用户ID")
    username: str = Field(min_length=2, max_length=10, description="用户名，2-10个字符")
    password: str = Field(min_length=3, max_length=20, description="密码，3-20个字符")

@app.post("/register")
async def user_register(user: User):
    return {
        "id": user.id,
        "username": user.username,
        "password": user.password,
        "message": "注册成功"
    }
```

> 💡 **Pydantic 的作用**：它会自动验证请求体中的数据是否符合定义的类型和约束，不符合则返回 `422 Unprocessable Entity` 错误，无需手动写验证逻辑。

---

## 六、异常处理

使用 **`HTTPException`** 可以向客户端返回标准的 HTTP 错误响应。

```python
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.get("/news/{id}")
async def get_news(id: int):
    if id not in [1, 2, 3, 4, 5, 6]:
        raise HTTPException(status_code=404, detail="当前ID不存在")
    return {
        "id": id,
        "title": f"标题{id}",
        "content": f"内容{id}"
    }
```

| 参数          | 说明         | 示例                                                    |
| ------------- | ------------ | ------------------------------------------------------- |
| `status_code` | HTTP 状态码  | `404`（未找到）、`400`（请求错误）、`500`（服务器错误） |
| `detail`      | 错误描述信息 | `"当前ID不存在"`                                        |

---

## 七、依赖注入系统

### 7.1 什么是依赖注入？

**依赖注入（Dependency Injection）** 是 FastAPI 的核心特性之一。简单来说，它允许你把**公共逻辑**（如数据库连接、参数解析）抽取出来，在多个路由中**复用**。

### 7.2 基本用法

```python
from fastapi import FastAPI, Depends, Query

app = FastAPI()

# ① 定义依赖项（公共参数逻辑）
async def common_parameters(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, le=60)
):
    return {"skip": skip, "limit": limit}

# ② 在路由中注入依赖项
@app.get("/news")
async def get_news(commons: dict = Depends(common_parameters)):
    return {"message": "hello", "commons": commons}
```

> ⚠️ **易错点**：`Depends(common_parameters)` **不要加括号调用**！
>
> - ✅ 正确：`Depends(common_parameters)`
> - ❌ 错误：`Depends(common_parameters())`

### 7.3 依赖注入的好处

| 好处           | 说明                                 |
| -------------- | ------------------------------------ |
| **代码复用**   | 多个接口共享相同的参数验证逻辑       |
| **关注点分离** | 路由只关注业务逻辑，参数处理交给依赖 |
| **易于测试**   | 可以轻松替换依赖项进行单元测试       |

---

## 八、中间件 Middleware

**中间件**用于在请求到达路由之前、或响应返回客户端之前执行一些通用操作（如日志记录、身份验证、CORS 处理等）。

### 8.1 基本用法

```python
from fastapi import FastAPI

app = FastAPI()

@app.middleware("http")
async def middleware1(request, call_next):
    print("中间件1：请求开始")
    response = await call_next(request)  # 传递给下一个中间件或路由
    print("中间件1：请求结束")
    return response

@app.middleware("http")
async def middleware2(request, call_next):
    print("中间件2：请求开始")
    response = await call_next(request)
    print("中间件2：请求结束")
    return response

@app.get("/")
async def root():
    return {"message": "Hello World"}
```

### 8.2 执行顺序

```
请求进入 → Middleware2 → Middleware1 → 路由处理
响应返回 ← Middleware2 ← Middleware1 ← 路由处理
```

控制台输出顺序：

```
中间件2：请求开始
中间件1：请求开始
中间件1：请求结束
中间件2：请求结束
```

> 💡 **记忆口诀**：中间件像**洋葱模型**，请求从外到内，响应从内到外。后注册的中间件先接收请求。

---

## 九、文件上传

### 9.1 基本上传（保存在内存中）

FastAPI 使用 `UploadFile` 类处理文件上传，默认将文件保存在**内存**中。

```python
import os
from typing import Annotated
from fastapi import FastAPI, File, UploadFile

app = FastAPI()

# 单文件上传（文件内容以 bytes 形式接收）
@app.post("/files")
async def create_file(
    files: Annotated[list[bytes], File(description="多个文件以bytes形式")]
):
    return {"file_sizes": [len(file) for file in files]}

# 多文件上传（使用 UploadFile，可获取文件名等信息）
@app.post("/mult_files")
async def create_upload_files(
    files: Annotated[list[UploadFile], File(description="多个文件")]
):
    return {"filenames": [file.filename for file in files]}
```

### 9.2 将文件保存到服务器

需要安装异步文件处理库：

```bash
uv add aiofiles
```

完整示例：

```python
import os
from typing import Annotated
import aiofiles
from fastapi import FastAPI, File, UploadFile
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# 挂载静态文件目录，可通过 /static/xxx 访问上传的文件
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# 确保上传目录存在
os.makedirs("./uploads", exist_ok=True)

# 单文件上传并保存
@app.post("/upload_file")
async def upload_file(file: Annotated[UploadFile, File(description="单文件上传")]):
    async with aiofiles.open(f"./uploads/{file.filename}", "wb") as f:
        content = await file.read()   # 读取上传内容
        await f.write(content)        # 写入文件
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size": file.size,
        "path": f"/static/{file.filename}",
        "message": "上传成功",
    }

# 多文件上传并保存
@app.post("/upload_files")
async def upload_files(
    files: Annotated[list[UploadFile], File(description="多文件上传")]
):
    for file in files:
        async with aiofiles.open(f"./uploads/{file.filename}", "wb") as f:
            content = await file.read()
            await f.write(content)
    return {"filenames": [file.filename for file in files], "message": "上传成功"}
```

> 💡 **`Annotated` 的作用**：它是 Python 3.9+ 的类型注解语法，用于在类型提示上附加额外的元数据（如描述信息），FastAPI 会利用这些信息生成 API 文档。

---

## 十、ORM 数据库操作（SQLAlchemy）

### 10.1 什么是 ORM？

**ORM（Object Relational Mapping，对象关系映射）** 是一种将数据库表映射为 Python 对象的技术。

| 概念         | 对应关系               |
| ------------ | ---------------------- |
| 数据库**表** | → Python **类**        |
| 表中的**行** | → 类的**实例（对象）** |
| 表中的**列** | → 类的**属性**         |
| SQL 语句     | → Python **方法调用**  |

**优点**：不用手写 SQL，用 Python 代码就能操作数据库。

### 10.2 安装依赖

```bash
# SQLAlchemy 异步支持
uv add sqlalchemy[asyncio]

# MySQL 异步驱动
uv add aiomysql
```

### 10.3 完整配置代码详解

这是连接数据库的完整配置，分为 **7 个步骤**：

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func, String, Float, select
from datetime import datetime
from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager

# ========== 步骤 1：创建异步数据库引擎 ==========
ASYNC_DATABASE_URL = "mysql+aiomysql://root:000000@localhost:3306/booktest?charset=utf8mb4"
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=True,           # 是否打印 SQL 语句（调试用）
    pool_size=10,        # 连接池大小
    max_overflow=20,     # 超出连接池大小后最多可创建的连接数
)

# ========== 步骤 2：定义基类和模型类 ==========
class Base(DeclarativeBase):
    """所有模型的基类，包含公共字段"""
    create_time: Mapped[datetime] = mapped_column(
        DateTime,
        default=func.now,           # Python 层面：每次插入时调用
        server_default=func.now(),  # 数据库层面：DDL 默认值
        comment="创建时间"
    )
    update_time: Mapped[datetime] = mapped_column(
        DateTime,
        default=func.now,
        onupdate=func.now(),        # 更新记录时自动设置为当前时间
        server_default=func.now(),
        comment="更新时间"
    )

class Book(Base):
    __tablename__ = "book"    # 对应数据库中的表名
    id: Mapped[int] = mapped_column(primary_key=True, comment="书籍ID")
    bookname: Mapped[str] = mapped_column(String(255), comment="书籍名称")
    author: Mapped[str] = mapped_column(String(255), comment="作者")
    price: Mapped[float] = mapped_column(Float, comment="价格")
    publisher: Mapped[str] = mapped_column(String(255), comment="出版社")

# ========== 步骤 3：建表函数 ==========
async def create_table():
    async with async_engine.begin() as connect:
        await connect.run_sync(Base.metadata.create_all)  # 同步建表转异步执行

# ========== 步骤 4：应用生命周期管理 ==========
@asynccontextmanager
async def lifespan_app(app):
    print("应用启动中...")
    await create_table()              # 启动时自动建表
    yield                             # 应用运行中
    print("应用关闭中...")
    await async_engine.dispose()      # 关闭时释放数据库连接

app = FastAPI(lifespan=lifespan_app)

# ========== 步骤 5：创建会话工厂 ==========
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,          # 绑定数据库引擎
    class_=AsyncSession,        # 使用异步会话类
    expire_on_commit=False      # 提交后对象不过期（避免重新查询）
)

# ========== 步骤 6：数据库依赖项（自动管理会话生命周期） ==========
async def get_database():
    async with AsyncSessionLocal() as session:
        try:
            yield session       # 提供会话给路由使用
            await session.commit()    # 无异常则提交
        except Exception:
            await session.rollback()  # 有异常则回滚
        finally:
            await session.close()     # 最终关闭会话

# ========== 步骤 7：路由中使用依赖注入 ==========
@app.get("/books")
async def get_book_list(db: AsyncSession = Depends(get_database)):
    result = await db.execute(select(Book))
    books = result.scalars().all()
    return books
```

### 10.4 关键概念解释

| 概念                           | 说明                                                        |
| ------------------------------ | ----------------------------------------------------------- |
| **`create_async_engine`**      | 创建异步数据库引擎，管理连接池                              |
| **`DeclarativeBase`**          | SQLAlchemy 的声明式基类，所有模型都继承它                   |
| **`Mapped` / `mapped_column`** | SQLAlchemy 2.0 的类型映射语法，将 Python 类型映射到数据库列 |
| **`func.now`**                 | 数据库的 `NOW()` 函数，获取当前时间                         |
| **`onupdate`**                 | 当记录被更新时，自动触发设置新值                            |
| **`async_sessionmaker`**       | 异步会话工厂，用于创建数据库会话                            |
| **`expire_on_commit=False`**   | 提交事务后，对象属性不会过期，可继续访问                    |
| **`lifespan`**                 | FastAPI 的生命周期管理，在应用启动/关闭时执行逻辑           |

### 10.5 数据库 URL 格式

```
mysql+aiomysql://用户名:密码@主机:端口/数据库名?charset=utf8mb4
```

| 部分             | 说明                  | 示例        |
| ---------------- | --------------------- | ----------- |
| `mysql+aiomysql` | 数据库类型 + 异步驱动 | —           |
| `用户名`         | 数据库用户名          | `root`      |
| `密码`           | 数据库密码            | `000000`    |
| `主机`           | 数据库地址            | `localhost` |
| `端口`           | 数据库端口            | `3306`      |
| `数据库名`       | 目标数据库            | `booktest`  |

---

## 十一、数据库 CRUD 完整操作

### 11.1 查询操作

#### 查询所有数据

```python
@app.get("/books")
async def get_book_list(db: AsyncSession = Depends(get_database)):
    result = await db.execute(select(Book))   # 执行查询，返回 ORM 结果对象
    books = result.scalars().all()            # 获取所有数据（标量形式）
    return books
```

#### 查询单条数据

```python
# 方式一：通过主键查询
book = await db.get(Book, id)

# 方式二：获取查询结果的第一条
result = await db.execute(select(Book))
book = result.scalars().first()

# 方式三：查询结果恰好一条（多条会报错，没有返回 None）
book = result.scalar_one_or_none()
```

| 方法                   | 说明                       | 无数据时返回 |
| ---------------------- | -------------------------- | ------------ |
| `scalars().all()`      | 获取**所有**结果           | 空列表 `[]`  |
| `scalars().first()`    | 获取**第一条**             | `None`       |
| `scalar_one_or_none()` | 恰好**一条或无**           | `None`       |
| `scalar_one()`         | 恰好**一条**（多了抛异常） | 抛异常       |

#### 条件查询

```python
from sqlalchemy import select

# 价格 >= 200 的书籍
result = await db.execute(select(Book).where(Book.price >= 200))
books = result.scalars().all()

# 按 ID 精确查询
result = await db.execute(select(Book).where(Book.id == id))
book = result.scalar_one_or_none()
```

**条件运算符速查：**

| 运算符     | 含义            | 示例                     |
| ---------- | --------------- | ------------------------ |
| `==`       | 等于            | `Book.id == 1`           |
| `!=`       | 不等于          | `Book.id != 1`           |
| `>` / `>=` | 大于 / 大于等于 | `Book.price >= 200`      |
| `<` / `<=` | 小于 / 小于等于 | `Book.price <= 500`      |
| `&`        | **与**（AND）   | `(条件1) & (条件2)`      |
| `\|`       | **或**（OR）    | `(条件1) \| (条件2)`     |
| `~`        | **非**（NOT）   | `~条件`                  |
| `.in_()`   | **包含**        | `Book.id.in_([1, 2, 3])` |

#### 模糊查询

```python
# like 查询
# "%" 匹配零个、一个或多个字符
result = await db.execute(select(Book).where(Book.author.like("高%")))

# "_" 匹配恰好一个字符
result = await db.execute(select(Book).where(Book.author.like("高_")))
```

#### 聚合查询

```python
from sqlalchemy import func

@app.get("/books/stats")
async def get_stats(db: AsyncSession = Depends(get_database)):
    avg_result = await db.execute(select(func.avg(Book.price)))     # 平均值
    count_result = await db.execute(select(func.count(Book.id)))    # 计数
    max_result = await db.execute(select(func.max(Book.price)))     # 最大值

    return {
        "平均价格": avg_result.scalar(),
        "书籍数量": count_result.scalar(),
        "最高价格": max_result.scalar(),
    }
```

#### 分页查询

```python
# 分页公式：offset = (当前页码 - 1) * 每页数量
@app.get("/books/page")
async def get_books_by_page(
    page: int = 1,
    page_size: int = 3,
    db: AsyncSession = Depends(get_database)
):
    skip = (page - 1) * page_size
    stmt = select(Book).offset(skip).limit(page_size)
    result = await db.execute(stmt)
    return result.scalars().all()
```

| 方法        | 说明              |
| ----------- | ----------------- |
| `offset(n)` | 跳过前 n 条记录   |
| `limit(n)`  | 最多返回 n 条记录 |

---

### 11.2 新增操作

```python
from pydantic import BaseModel

# 定义请求体模型
class BookCreate(BaseModel):
    id: int
    bookname: str
    author: str
    price: float
    publisher: str

@app.post("/books/add")
async def add_book(book: BookCreate, db: AsyncSession = Depends(get_database)):
    book_obj = Book(**book.__dict__)   # 将 Pydantic 模型转为 ORM 对象
    db.add(book_obj)                   # 添加到会话
    await db.commit()                  # 提交到数据库
    return {"book": book, "msg": "添加成功"}
```

> 💡 **`**book.**dict**`的作用**：将 Pydantic 模型的字段解包为关键字参数，等价于`Book(id=book.id, bookname=book.bookname, ...)`。

---

### 11.3 更新操作

```python
from pydantic import BaseModel

class BookUpdate(BaseModel):
    bookname: str
    author: str
    price: float
    publisher: str

@app.put("/books/update/{id}")
async def update_book(id: int, data: BookUpdate, db: AsyncSession = Depends(get_database)):
    book = await db.get(Book, id)       # ① 先查询
    if book is None:
        raise HTTPException(status_code=404, detail="书籍不存在")

    book.bookname = data.bookname       # ② 修改属性
    book.author = data.author
    book.price = data.price
    book.publisher = data.publisher

    await db.commit()                   # ③ 提交到数据库
    return book
```

**更新流程**：`查询 → 修改属性 → commit`，不需要调用 `db.add()`。

---

### 11.4 删除操作

```python
@app.delete("/books/delete/{id}")
async def delete_book(id: int, db: AsyncSession = Depends(get_database)):
    book = await db.get(Book, id)       # ① 先查询
    if book is None:
        raise HTTPException(status_code=404, detail="查无此书")

    await db.delete(book)               # ② 标记删除
    await db.commit()                   # ③ 提交到数据库
    return {"msg": "删除成功"}
```

---

### 11.5 CRUD 操作总结

| 操作             | HTTP 方法 | 核心步骤                                                  |
| ---------------- | --------- | --------------------------------------------------------- |
| **查（Read）**   | `GET`     | `select()` → `execute()` → `scalars().all()` / `.first()` |
| **增（Create）** | `POST`    | 创建对象 → `db.add()` → `db.commit()`                     |
| **改（Update）** | `PUT`     | `db.get()` 查询 → 修改属性 → `db.commit()`                |
| **删（Delete）** | `DELETE`  | `db.get()` 查询 → `db.delete()` → `db.commit()`           |

---

## 附录：常见问题与易错点

### A1. 中间件执行顺序不直观

中间件按**注册的倒序**执行（后注册的先执行），像洋葱一样包裹。

### A2. 依赖注入忘记写 `Depends`

```python
# ❌ 错误：缺少 Depends
async def get_news(db: AsyncSession = get_database):

# ✅ 正确
async def get_news(db: AsyncSession = Depends(get_database)):
```

### A3. `expire_on_commit` 的坑

如果设置为 `True`（默认值），commit 后访问对象属性会触发重新查询数据库。建议设为 `False`。

### A4. 静态路由与动态路由冲突

```python
# ⚠️ 注意：静态路由要放在动态路由前面
@app.get("/books/search")    # 静态路由（先匹配）
async def search(): ...

@app.get("/books/{id}")      # 动态路由（后匹配）
async def get_book(id: int): ...
```

### A5. `file.read()` 是异步的

上传文件时，`await file.read()` 不能写成 `file.read()`，否则会得到协程对象而非文件内容。

### A6. 数据库会话一定要关闭

使用 `get_database()` 依赖注入时，`try/except/finally` 结构确保会话一定会被关闭，避免连接泄漏。

---

> 📝 **学习建议**：建议按照本文档顺序，先掌握 FastAPI 基础（路由、参数、响应），再学习依赖注入和中间件，最后攻克数据库操作。每学完一个知识点，动手写一个小练习巩固。
