---
title: SQLAlchemy 异步配置与 CRUD 操作
published: 2026-06-08
description: "基于 SQLAlchemy 2.0 的异步数据库配置，涵盖连接池、模型定义、生命周期管理和完整 CRUD 操作。"
image: "./cover.webp"
tags: ["后端开发", "数据库", "Python", "SQLAlchemy"]
category: Guides
draft: false
---

# SQLAlchemy 异步配置与 CRUD 操作

> **技术栈**：SQLAlchemy 2.0（异步） + aiomysql + MySQL

---

## 一、什么是 ORM？

**ORM（Object Relational Mapping，对象关系映射）** 将数据库表映射为 Python 对象，用代码操作数据库而不用手写 SQL。

| 数据库概念 | Python 对应 |
|---|---|
| 表（Table） | 类（Class） |
| 行（Row） | 实例（Object） |
| 列（Column） | 属性（Attribute） |
| SQL 语句 | 方法调用 |

---

## 二、安装依赖

```bash
# SQLAlchemy 异步支持
uv add sqlalchemy[asyncio]

# MySQL 异步驱动
uv add aiomysql
```

---

## 三、完整配置（7 步）

### 3.1 创建异步引擎

```python
from sqlalchemy.ext.asyncio import create_async_engine

ASYNC_DATABASE_URL = "mysql+aiomysql://root:password@localhost:3306/mydb?charset=utf8mb4"

async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=True,          # 打印 SQL 语句（调试用，生产环境关闭）
    pool_size=10,       # 连接池大小
    max_overflow=20,    # 超出连接池后最多可创建的连接数
)
```

**数据库 URL 格式：**

```
mysql+aiomysql://用户名:密码@主机:端口/数据库名?charset=utf8mb4
```

| 部分 | 说明 | 示例 |
|---|---|---|
| `mysql+aiomysql` | 数据库类型 + 异步驱动 | — |
| `用户名` | 数据库用户名 | `root` |
| `密码` | 数据库密码 | `password` |
| `主机` | 数据库地址 | `localhost` |
| `端口` | 数据库端口 | `3306` |
| `数据库名` | 目标数据库 | `mydb` |

> **常用异步驱动：**
>
> | 数据库 | 安装命令 | URL 前缀 |
> |---|---|---|
> | MySQL | `uv add aiomysql` | `mysql+aiomysql` |
> | PostgreSQL | `uv add asyncpg` | `postgresql+asyncpg` |
> | SQLite | `uv add aiosqlite` | `sqlite+aiosqlite` |

### 3.2 定义基类和模型

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, String, Float, func
from datetime import datetime

# 基类：所有模型都继承它
class Base(DeclarativeBase):
    create_time: Mapped[datetime] = mapped_column(
        DateTime,
        default=func.now,           # Python 层面：插入时调用
        server_default=func.now(),  # 数据库层面：DDL 默认值
        comment="创建时间"
    )
    update_time: Mapped[datetime] = mapped_column(
        DateTime,
        default=func.now,
        onupdate=func.now(),        # 更新记录时自动设置
        server_default=func.now(),
        comment="更新时间"
    )

# 模型类：对应数据库中的一张表
class Book(Base):
    __tablename__ = "book"

    id: Mapped[int] = mapped_column(primary_key=True, comment="书籍ID")
    bookname: Mapped[str] = mapped_column(String(255), comment="书名")
    author: Mapped[str] = mapped_column(String(255), comment="作者")
    price: Mapped[float] = mapped_column(Float, comment="价格")
    publisher: Mapped[str] = mapped_column(String(255), comment="出版社")
```

**`Mapped` / `mapped_column` 速查：**

| 参数 | 说明 | 示例 |
|---|---|---|
| `primary_key` | 主键 | `mapped_column(primary_key=True)` |
| `String(n)` | 字符串，最大长度 n | `mapped_column(String(255))` |
| `Float` | 浮点数 | `mapped_column(Float)` |
| `Integer` | 整数 | `mapped_column(Integer)` |
| `Boolean` | 布尔值 | `mapped_column(Boolean)` |
| `DateTime` | 日期时间 | `mapped_column(DateTime)` |
| `comment` | 字段注释 | `mapped_column(comment="书名")` |
| `default` | Python 层默认值 | `default=func.now` |
| `server_default` | 数据库层默认值 | `server_default=func.now()` |
| `onupdate` | 更新时自动触发 | `onupdate=func.now()` |

### 3.3 建表函数

```python
async def create_table():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

> `run_sync` 将同步的建表操作转为异步执行。

### 3.4 应用生命周期管理

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app):
    print("应用启动...")
    await create_table()            # 启动时自动建表
    yield                           # 应用运行中
    print("应用关闭...")
    await async_engine.dispose()    # 关闭时释放连接池

app = FastAPI(lifespan=lifespan)
```

### 3.5 创建会话工厂

```python
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,          # 绑定引擎
    class_=AsyncSession,        # 使用异步会话
    expire_on_commit=False      # 提交后对象不过期（推荐）
)
```

| 参数 | 说明 |
|---|---|
| `bind` | 绑定的数据库引擎 |
| `class_` | 会话类，异步场景用 `AsyncSession` |
| `expire_on_commit` | 设为 `False` 可避免提交后重新查询，推荐 |

### 3.6 数据库依赖项

```python
async def get_database():
    async with AsyncSessionLocal() as session:
        try:
            yield session           # 提供给路由
            await session.commit()  # 无异常则提交
        except Exception:
            await session.rollback()  # 有异常则回滚
        finally:
            await session.close()     # 关闭会话
```

### 3.7 路由中使用

```python
from fastapi import Depends
from sqlalchemy import select

@app.get("/books")
async def get_books(db: AsyncSession = Depends(get_database)):
    result = await db.execute(select(Book))
    return result.scalars().all()
```

---

## 四、CRUD 操作

### 4.1 查询（Read）

#### 查询所有

```python
result = await db.execute(select(Book))
books = result.scalars().all()
```

#### 查询单条

```python
# 通过主键查询
book = await db.get(Book, 1)

# 获取第一条
result = await db.execute(select(Book))
book = result.scalars().first()

# 恰好一条（多条抛异常，无数据返回 None）
book = result.scalar_one_or_none()
```

| 方法 | 说明 | 无数据时 |
|---|---|---|
| `scalars().all()` | 所有结果 | `[]` |
| `scalars().first()` | 第一条 | `None` |
| `scalar_one_or_none()` | 一条或无 | `None` |
| `scalar_one()` | 恰好一条 | 抛异常 |

#### 条件查询

```python
from sqlalchemy import select

# 价格 >= 200
result = await db.execute(select(Book).where(Book.price >= 200))

# 精确查询
result = await db.execute(select(Book).where(Book.id == 1))

# 多条件 AND
result = await db.execute(
    select(Book).where(Book.price >= 100, Book.author == "鲁迅")
)
```

**条件运算符：**

| 运算符 | 含义 | 示例 |
|---|---|---|
| `==` | 等于 | `Book.id == 1` |
| `!=` | 不等于 | `Book.id != 1` |
| `>` / `>=` | 大于 / 大于等于 | `Book.price >= 200` |
| `<` / `<=` | 小于 / 小于等于 | `Book.price <= 500` |
| `&` | AND | `(条件1) & (条件2)` |
| `\|` | OR | `(条件1) \| (条件2)` |
| `~` | NOT | `~条件` |
| `.in_()` | 包含 | `Book.id.in_([1, 2, 3])` |

#### 模糊查询

```python
# % 匹配零个或多个字符
result = await db.execute(select(Book).where(Book.author.like("鲁%")))

# _ 匹配恰好一个字符
result = await db.execute(select(Book).where(Book.author.like("鲁_")))
```

#### 聚合查询

```python
from sqlalchemy import func

# 平均值
avg = await db.execute(select(func.avg(Book.price)))
print(avg.scalar())

# 计数
count = await db.execute(select(func.count(Book.id)))
print(count.scalar())

# 最大值
max_price = await db.execute(select(func.max(Book.price)))
print(max_price.scalar())
```

#### 分页查询

```python
# 分页公式：offset = (page - 1) * page_size
async def get_books(page: int = 1, page_size: int = 10, db: AsyncSession = Depends(get_database)):
    skip = (page - 1) * page_size
    stmt = select(Book).offset(skip).limit(page_size)
    result = await db.execute(stmt)
    return result.scalars().all()
```

| 方法 | 说明 |
|---|---|
| `offset(n)` | 跳过前 n 条 |
| `limit(n)` | 最多返回 n 条 |

---

### 4.2 新增（Create）

```python
from pydantic import BaseModel

class BookCreate(BaseModel):
    bookname: str
    author: str
    price: float
    publisher: str

@app.post("/books")
async def create_book(data: BookCreate, db: AsyncSession = Depends(get_database)):
    book = Book(**data.model_dump())  # Pydantic 模型转 ORM 对象
    db.add(book)
    await db.commit()
    return book
```

---

### 4.3 更新（Update）

```python
@app.put("/books/{id}")
async def update_book(id: int, data: BookCreate, db: AsyncSession = Depends(get_database)):
    book = await db.get(Book, id)       # ① 查询
    if book is None:
        raise HTTPException(status_code=404, detail="书籍不存在")

    book.bookname = data.bookname       # ② 修改属性
    book.author = data.author
    book.price = data.price
    book.publisher = data.publisher

    await db.commit()                   # ③ 提交
    return book
```

> **流程：** 查询 → 修改属性 → commit，不需要 `db.add()`。

---

### 4.4 删除（Delete）

```python
@app.delete("/books/{id}")
async def delete_book(id: int, db: AsyncSession = Depends(get_database)):
    book = await db.get(Book, id)       # ① 查询
    if book is None:
        raise HTTPException(status_code=404, detail="书籍不存在")

    await db.delete(book)               # ② 标记删除
    await db.commit()                   # ③ 提交
    return {"msg": "删除成功"}
```

---

## 五、CRUD 总结

| 操作 | HTTP 方法 | 核心步骤 |
|---|---|---|
| **查** | `GET` | `select()` → `execute()` → `scalars().all()` |
| **增** | `POST` | 创建对象 → `db.add()` → `db.commit()` |
| **改** | `PUT` | `db.get()` 查询 → 修改属性 → `db.commit()` |
| **删** | `DELETE` | `db.get()` 查询 → `db.delete()` → `db.commit()` |

---

## 六、常见问题

### Q1：`expire_on_commit` 有什么影响？

设为 `True`（默认）时，commit 后访问对象属性会重新查询数据库。**推荐设为 `False`**，避免不必要的查询。

### Q2：会话忘记关闭怎么办？

使用 `get_database()` 依赖注入，`try/except/finally` 结构确保会话一定被关闭，不会连接泄漏。

### Q3：`db.add()` 和 `db.commit()` 的区别？

- `db.add()` — 把对象加入会话（内存中），还没写入数据库
- `db.commit()` — 提交事务，真正写入数据库

### Q4：更新时需要 `db.add()` 吗？

不需要。查询出来的对象已经在会话中跟踪了，直接修改属性然后 commit 即可。
