---
title: FastAPI简单开发
published: 2026-06-10
description: "FastAPI的实际开发demo"
image: "./cover.webp"
tags: ["后端开发", "Python", "FastAPI"]
category: Guides
draft: false
---

作为一个前端，之前一直用 Express 写后端，这次尝试用 FastAPI 搭一个异步的服务，记录一下整个过程和踩过的坑。

---

## 目录

1. [项目初始化](#项目初始化)
2. [环境变量](#环境变量)
3. [数据库配置](#数据库配置)
4. [模型层](#模型层)
5. [数据结构层（Schemas）](#数据结构层schemas)
6. [工具层（安全相关）](#工具层安全相关)
7. [控制器层](#控制器层)
8. [路由层](#路由层)
9. [入口文件（main.py）](#入口文件mainpy)
10. [头像上传接口](#头像上传接口)
11. [深入理解：yield 语法](#深入理解yield-语法)
12. [深入理解：async / await](#深入理解async--await)
13. [FastAPI vs Express 对比论证](#fastapi-vs-express-对比论证)

---

## 项目初始化

用 uv 创建项目，uv 是 Python 的包管理工具，类似前端的 npm。

```bash
uv init fastapi-demo
```

### 目录结构

```
- configs        # 配置层：数据库连接、引擎、基类
- controllers    # 控制器层：业务逻辑
- models         # 模型层：数据库表结构定义
- routers        # 路由层：接口定义
- schemas        # 数据层：请求和响应的数据格式
- utils          # 工具层：JWT、密码加密
- statics        # 静态文件
- main.py        # 入口文件
```

### 依赖安装

直接在 `pyproject.toml` 里加就行：

```toml
dependencies = [
    "aiomysql>=0.3.2",               # MySQL异步驱动
    "bcrypt>=5.0.0",                  # 密码加密
    "fastapi[standard]>=0.136.3",     # FastAPI框架
    "pydantic[email]>=2.0",           # 数据校验，email支持
    "pyjwt>=2.13.0",                  # JWT生成和解析
    "python-dotenv>=1.2.2",           # 读取.env文件
    "sqlalchemy[asyncio]>=2.0.50",    # ORM框架，异步支持
]
```

```bash
uv sync
```

---

## 环境变量

项目根目录创建 `.env` 文件，存放数据库和 JWT 的配置。用 `python-dotenv` 来读取。

```bash
# 数据库配置
DATABASE_TYPE=mysql
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=000000
DATABASE_NAME=fast_post
DATABASE_CHARSET=utf8mb4

# JWT配置
TOKEN_SECRET=fast_post    # 签名密钥，随便填个字符串
ALGORITHM=HS256           # 加密算法
TOKEN_EXPIRED=86400       # 过期时间（秒）
```

需要注意的是，`ALGORITHM` 这个变量很容易忘，如果 `.env` 里没配，程序启动就会报错：

```
ValueError: TOKEN_SECRET 和 ALGORITHM 环境变量未配置
```

---

## 数据库配置

`configs/db_config.py` 是整个数据库的核心配置，做三件事：

1. 创建异步引擎（连接池）
2. 定义模型基类（所有表的公共字段）
3. 创建会话工厂（每次请求的数据库连接）

```py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# 读取环境变量，拼接连接字符串
db_type = os.getenv("DATABASE_TYPE")
host = os.getenv("DATABASE_HOST")
port = os.getenv("DATABASE_PORT")
user = os.getenv("DATABASE_USER")
password = os.getenv("DATABASE_PASSWORD")
database = os.getenv("DATABASE_NAME")
charset = os.getenv("DATABASE_CHARSET")

ASYNC_DATABASE_URL = (
    f"{db_type}+aiomysql://{user}:{password}@{host}:{port}/{database}?charset={charset}"
)

# 创建异步引擎
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=True,        # 打印 SQL 语句（调试用）
    pool_size=10,     # 连接池大小
    max_overflow=20,  # 超出连接池大小后最多可创建的连接数
)

# 模型基类，所有表都继承这个
class Base(DeclarativeBase):
    create_time: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),   # 数据库层面：插入时自动生成时间
        comment="创建时间"
    )
    update_time: Mapped[datetime] = mapped_column(
        DateTime,
        onupdate=func.now(),         # 更新时数据库自动设为当前时间
        server_default=func.now(),
        comment="更新时间"
    )

# 会话工厂
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False           # 提交后对象不过期（避免重新查询）
)

# 数据库会话依赖注入
async def get_database_session():
    async with AsyncSessionLocal() as session:
        try:
            yield session             # 将 session 交给接口使用
            await session.commit()    # 请求正常结束 → 提交
        except Exception:
            await session.rollback()  # 出现异常 → 回滚
            raise                     # 重新抛出异常，让上层感知
        finally:
            await session.close()     # 无论如何都要关闭连接
```

### 连接字符串格式

不同数据库的连接字符串格式不一样，这里用的是 MySQL + aiomysql：

| 数据库 | 驱动 | 连接字符串格式 |
|--------|------|---------------|
| MySQL | aiomysql | `mysql+aiomysql://user:pass@host:port/db` |
| PostgreSQL | asyncpg | `postgresql+asyncpg://user:pass@host:port/db` |
| SQLite | aiosqlite | `sqlite+aiosqlite:///./db.sqlite3` |

### get_database_session 为什么要用 yield

这个函数是个**依赖注入生成器**，用了 `yield` 变成生成器函数。FastAPI 会自动管理它的生命周期：

- **请求进来时**：创建 session，`yield` 把 session 交出去给接口用
- **请求正常结束时**：`yield` 之后的代码执行 → `commit()` → `close()`
- **请求异常时**：`except` 块捕获 → `rollback()` → `close()`

相当于 Express 里中间件手动管理连接的那一套，FastAPI 通过 `yield` 自动帮你处理了。

> 更详细的 yield 原理分析见 [深入理解：yield 语法](#深入理解yield-语法)

---

## 模型层

模型就是数据库表的 Python 映射，继承上面定义的 `Base` 基类。

`models/user.py`
```py
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, Boolean
from configs.db_config import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="用户ID")
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, comment="用户名")
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, comment="邮箱")
    password: Mapped[str] = mapped_column(String(255), nullable=False, comment="密码")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, comment="是否激活")
    avatar: Mapped[str] = mapped_column(String(255), default="", comment="用户头像")
```

`Mapped[type]` 是 SQLAlchemy 2.0 的写法，比之前的 `Column(String)` 类型提示更好，IDE 能自动推断类型。

### 字段参数速查

| 参数 | 作用 | 示例 |
|------|------|------|
| `primary_key` | 主键 | `primary_key=True` |
| `autoincrement` | 自增 | `autoincrement=True` |
| `unique` | 唯一约束 | `unique=True` |
| `nullable` | 是否可空 | `nullable=False` |
| `default` | Python 层面默认值 | `default=True` |
| `server_default` | 数据库层面默认值 | `server_default=func.now()` |
| `comment` | 字段注释 | `comment="用户名"` |

---

## 数据结构层（Schemas）

Schemas 用 Pydantic 定义请求和响应的数据格式，类似前端的 TypeScript 类型定义。FastAPI 会自动用这些 Schema 做请求体校验，校验不过直接返回 422。

`schemas/user.py`
```py
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# 注册请求
class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50, description="用户名")
    email: EmailStr = Field(..., description="邮箱")
    password: str = Field(..., min_length=6, max_length=128, description="密码")

# 注册响应
class UserRegisterResponse(BaseModel):
    id: int = Field(..., description="用户ID")
    username: str = Field(..., description="用户名")
    email: EmailStr = Field(..., description="邮箱")
    is_active: bool = Field(..., description="是否激活")

# 登录请求
class UserLoginRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50, description="用户名")
    password: str = Field(..., min_length=6, max_length=128, description="密码")

# 登录响应
class UserLoginResponse(BaseModel):
    access_token: str = Field(..., description="访问令牌")
    type_token: str = Field("bearer", description="令牌类型")

# 个人信息响应（注意：create_time 用 datetime 类型，不是 str）
class UserProfileResponse(BaseModel):
    id: int = Field(..., description="用户ID")
    username: str = Field(..., description="用户名")
    email: EmailStr = Field(..., description="邮箱")
    is_active: bool = Field(..., description="是否激活")
    avatar: str = Field(..., description="用户头像")
    create_time: datetime = Field(..., description="创建时间")
    update_time: datetime = Field(..., description="更新时间")

# 修改个人信息请求
class UserUpdateProfileRequest(BaseModel):
    email: EmailStr = Field(..., description="邮箱")
    avatar: str = Field(..., max_length=255, description="用户头像")
```

- `Field(...)` 里的 `...`（Ellipsis）表示**必填**，相当于 `required`
- `EmailStr` 是 Pydantic 内置的邮箱类型，会自动校验邮箱格式
- 响应里 `create_time` 必须是 `datetime` 类型，不能用 `str`，因为数据库返回的是 Python `datetime` 对象

### Pydantic datetime 类型序列化

数据库的 `DateTime` 字段返回的是 Python `datetime` 对象，Pydantic Schema 中**必须用 `datetime` 类型**，不能用 `str`：

```py
# ❌ 错误：数据库返回 datetime，但 schema 期望 str
class UserProfileResponse(BaseModel):
    create_time: str = Field(...)  # 运行时报错：Input should be a valid string

# ✅ 正确：使用 datetime 类型
from datetime import datetime

class UserProfileResponse(BaseModel):
    create_time: datetime = Field(...)
```

FastAPI 会自动把 `datetime` 对象序列化成 ISO 格式字符串（如 `"2026-06-09T22:20:18"`），前端直接可用。

---

## 工具层（安全相关）

`utils/security.py` 封装了密码加密和 JWT 相关操作，是最容易出 bug 的一层。

```py
import os
import jwt
import bcrypt
from jwt.exceptions import InvalidTokenError
from dotenv import load_dotenv
from typing import Annotated
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from datetime import datetime, timedelta, timezone

load_dotenv()

# 读取环境变量，给默认空字符串避免 None
TOKEN_SECRET: str = os.getenv("TOKEN_SECRET", "")
ALGORITHM: str = os.getenv("ALGORITHM", "")
if not TOKEN_SECRET or not ALGORITHM:
    raise ValueError("TOKEN_SECRET 和 ALGORITHM 环境变量未配置")

# 密码加密
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed_password.decode("utf-8")

# 密码验证
def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )

# 生成 JWT Token
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, TOKEN_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

# 解析 JWT Token
async def decode_token(
    token: Annotated[str, Depends(OAuth2PasswordBearer(tokenUrl="/users/token"))],
    db: Annotated[AsyncSession, Depends(get_database_session)]
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, TOKEN_SECRET, algorithms=[ALGORITHM])
        username = payload.get("username")
        userid = payload.get("id")
        if username is None or userid is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception
    from models.user import User
    stmt = select(User).where(User.id == userid)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user
```

### bcrypt 注意事项

- `hashpw` 返回的是 `bytes`，需要 `.decode("utf-8")` 转成字符串再存数据库
- `checkpw` 的两个参数都必须是 `bytes`，所以要 `.encode("utf-8")`
- 函数签名返回类型是 `str`，不 return 的话类型检查器会报错

### Annotated 类型标注

`decode_token` 函数的参数写法比较特殊：

```py
token: Annotated[str, Depends(OAuth2PasswordBearer(tokenUrl="/users/token"))]
```

这里 `Annotated` 是**类型标注**，不是默认值。不能写成：

```py
# ❌ 错误写法，Annotated 不能赋值给 str 类型
token: str = Annotated[str, Depends(OAuth2PasswordBearer(tokenUrl="/users/token"))]
```

`Annotated[str, ...]` 本身就是一个类型，表示「这个参数是 str 类型，同时带有额外的元信息（依赖注入）」。FastAPI 读取这个元信息，自动调用 `Depends()` 里的函数完成注入。

### os.getenv 的类型问题

`os.getenv()` 返回的是 `str | None`，但 `jwt.encode()` 要求 key 不能是 None。解决方式是给默认值：

```py
# ✅ 正确：给默认空字符串，后面再检查
TOKEN_SECRET: str = os.getenv("TOKEN_SECRET", "")
if not TOKEN_SECRET or not ALGORITHM:
    raise ValueError("TOKEN_SECRET 和 ALGORITHM 环境变量未配置")
```

### jwt.decode 的 algorithms 参数

`jwt.decode` 的 `algorithms` 参数**必须是列表**，不能是字符串：

```py
# ❌ 错误
payload = jwt.decode(token, TOKEN_SECRET, algorithms=ALGORITHM)

# ✅ 正确
payload = jwt.decode(token, TOKEN_SECRET, algorithms=[ALGORITHM])
```

### 踩坑：JWT payload key 不匹配

生成 token 和解析 token 时，payload 的 key 必须一致：

```py
# controllers/user.py - 生成 token 时用的是 "user"
access_token = create_access_token(
    data={"user": db_user.username},  # key 是 "user"
)

# utils/security.py - 解析 token 时取的是 "username"
payload = jwt.decode(token, TOKEN_SECRET, algorithms=[ALGORITHM])
username = payload.get("username")  # key 是 "username"，永远拿不到值！
```

这会导致认证永远失败，因为 `payload.get("username")` 返回 None，然后抛出 401 错误。

**解决方案**：统一 key 名称，并且同时存 `username` 和 `id`：

```py
# controllers/user.py
data={
    "username": db_user.username,  # 统一用 "username"
    "id": db_user.id               # 同时存 id，方便解析时直接查询
}
```

---

## 控制器层

控制器写具体业务逻辑，处理注册、登录、个人信息、头像上传。

`controllers/user.py`
```py
from datetime import timedelta
import os
import uuid

from fastapi import HTTPException, Depends, status, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from configs.db_config import get_database_session
from utils.security import hash_password, verify_password, create_access_token
from schemas.user import UserRegisterRequest, UserLoginRequest, UserUpdateProfileRequest
from models.user import User

# 用户注册
async def register(user: UserRegisterRequest, db: AsyncSession = Depends(get_database_session)):
    # 检查用户名是否存在
    stmt = select(User).where(User.username == user.username)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="用户名已存在")

    # 检查邮箱是否存在
    stmt = select(User).where(User.email == user.email)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="邮箱已被注册")

    # 创建用户，密码加密存储
    new_user = User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password)
    )
    db.add(new_user)
    await db.flush()       # 立即执行 SQL（获得自增 ID）
    await db.refresh(new_user)  # 刷新对象（获取 create_time 等默认值）
    return new_user

# 用户登录
async def login(user: UserLoginRequest, db: AsyncSession = Depends(get_database_session)):
    stmt = select(User).where(User.username == user.username)
    result = await db.execute(stmt)
    db_user = result.scalar_one_or_none()

    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    if not db_user.is_active:
        raise HTTPException(status_code=400, detail="用户已被禁用")

    access_token = create_access_token(
        data={"username": db_user.username, "id": db_user.id},
        expires_delta=timedelta(minutes=15),
    )
    return {"access_token": access_token, "token_type": "bearer"}
```

### flush vs refresh 的区别

| 方法 | 作用 | 类比 |
|------|------|------|
| `db.add(obj)` | 把对象加入会话跟踪（暂未发 SQL） | `git add`（暂存） |
| `await db.flush()` | 立即把 SQL 发给数据库执行 | `git commit`（提交） |
| `await db.refresh(obj)` | 从数据库重新读取最新数据到对象 | 刷新页面看最新结果 |

注册时必须先 `flush` 再 `refresh`，因为 `id`（自增主键）和 `create_time` 是数据库生成的，不刷新 Python 对象里拿不到这些值。

### 踩坑：变量名遮蔽

login 函数里有个很容易犯的错：查询数据库后用 `user` 接收结果，会覆盖掉参数里的 `user`。

```py
# ❌ 错误示范
async def login(user: UserLoginRequest, db: AsyncSession):
    stmt = select(User).where(User.username == user.username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()  # 这里覆盖了参数 user！
    # 下面的 user.password 其实是数据库对象的 password 和自己的比，永远为 True
    if not user or not verify_password(user.password, user.password):
        ...
```

正确做法是用不同的变量名，比如 `db_user` 来接收数据库查询结果。

---

## 路由层

路由层只做两件事：定义接口路径，调用控制器。

`routers/user.py`
```py
from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from configs.db_config import get_database_session
from schemas.user import (
    UserRegisterRequest, UserRegisterResponse,
    UserLoginRequest, UserLoginResponse,
    UserProfileResponse, UserUpdateProfileRequest
)
from controllers.user import (
    register as register_controller,
    login as login_controller,
    get_profile as get_profile_controller,
    update_profile as update_profile_controller,
    upload_avatar as upload_avatar_controller
)
from utils.security import decode_token

router = APIRouter(prefix="/users", tags=["用户"])

@router.post("/register", response_model=UserRegisterResponse, summary="用户注册")
async def register(user: UserRegisterRequest, db = Depends(get_database_session)):
    return await register_controller(user, db)

@router.post("/login", response_model=UserLoginResponse, summary="用户登录")
async def login(user: UserLoginRequest, db = Depends(get_database_session)):
    return await login_controller(user, db)

@router.get("/profile", response_model=UserProfileResponse, summary="获取个人信息")
async def get_profile(current_user = Depends(decode_token)):
    return get_profile_controller(current_user)

@router.put("/profile", response_model=UserProfileResponse, summary="更新个人信息")
async def update_profile(
    update_data: UserUpdateProfileRequest,
    current_user = Depends(decode_token),
    db: AsyncSession = Depends(get_database_session)
):
    return await update_profile_controller(update_data, current_user, db)

@router.post("/avatar", summary="上传头像")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user = Depends(decode_token),
    db: AsyncSession = Depends(get_database_session)
):
    return await upload_avatar_controller(file, current_user, db)
```

### `response_model` 的作用

路由装饰器里指定 `response_model=UserRegisterResponse`，FastAPI 会：
1. 把返回值自动转换成 `UserRegisterResponse` 的格式
2. **过滤掉 Schema 里没定义的字段**（比如 `password` 不会泄露出去）
3. 自动生成 Swagger 文档的响应示例

### 踩坑：函数名遮蔽导致递归

路由层导入控制器函数时，如果路由函数和控制器函数同名，会遮蔽导入：

```py
from controllers.user import register, login

# ❌ 这个 register 遮蔽了上面导入的 register
@router.post("/register")
async def register(user, db):
    return await register(user, db)  # 调用的是自己，无限递归！
```

解决方案是导入时起别名：

```py
# ✅ 正确
from controllers.user import register as register_controller
from controllers.user import login as login_controller
```

---

## 入口文件（main.py）

`main.py` 把所有东西串起来：生命周期管理、CORS、静态文件、路由注册。

```py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from configs.db_config import async_engine, Base
from models.user import User  # 导入所有模型，确保它们被注册到 Base.metadata
from routers.user import router as user_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理：启动时建表，关闭时清理"""
    # 启动时：创建所有表
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ 数据库表创建完成")
    yield
    # 关闭时：释放引擎资源
    await async_engine.dispose()
    print("👋 数据库连接已关闭")


app = FastAPI(lifespan=lifespan)

# 跨域挂载
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件挂载
app.mount("/statics", StaticFiles(directory="statics"), name="static")

# 挂载用户路由
app.include_router(user_router)


@app.get("/")
async def root():
    return {"message": "FastAPI 学习项目运行中 🚀"}
```

### lifespan 生命周期

`lifespan` 是 FastAPI 的应用生命周期钩子，使用了 `@asynccontextmanager` 装饰器：

- `yield` **之前**的代码 → **启动时**执行（建表、初始化连接等）
- `yield` **之后**的代码 → **关闭时**执行（释放连接、清理资源等）

类似 Express 里 `server.on('listening', callback)` 和 `process.on('SIGTERM', callback)` 的结合体。

### 模型必须显式导入

```py
from models.user import User  # 虽然代码里没直接用到 User
```

这行虽然看起来没用，但**必须导入**！因为 SQLAlchemy 通过 `Base.metadata` 来发现所有的表定义。只有被导入过的模型才会注册到 `Base.metadata` 里，`create_all` 才能找到并创建对应的表。

---

## Swagger UI 认证配置

FastAPI 的 Swagger UI 支持 OAuth2 认证，但配置时有几个坑。

### 问题一：tokenUrl 指向错误

`OAuth2PasswordBearer` 的 `tokenUrl` 参数告诉 Swagger UI 去哪里获取 token。如果配置错误，会报 `Not Found`：

```py
# ❌ 错误：tokenUrl 指向不存在的路径
async def decode_token(
    token: Annotated[str, Depends(OAuth2PasswordBearer(tokenUrl="token"))],
    ...
):
```

必须指向**实际存在的登录端点路径**。

### 问题二：请求格式不匹配

这是最容易踩的坑。Swagger UI 的 OAuth2 认证使用**表单格式**发送请求：

```
Content-Type: application/x-www-form-urlencoded
body: username=test&password=123456
```

但我们的登录端点期望 **JSON 格式**：

```py
# /users/login 端点期望 JSON
@router.post("/login")
async def login(user: UserLoginRequest):  # Pydantic 模型 → 期望 JSON
    ...
```

如果直接用 `/users/login` 作为 `tokenUrl`，Swagger UI 会报 `422 Unprocessable Content`。

### 解决方案：创建专用 token 端点

创建一个单独的端点来处理 Swagger UI 的表单格式认证请求：

```py
# routers/user.py
from fastapi.security import OAuth2PasswordRequestForm

@router.post("/token", summary="获取Token（Swagger UI专用）")
async def token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_database_session)
):
    user = UserLoginRequest(username=form_data.username, password=form_data.password)
    return await login_controller(user, db)
```

这样就有两个登录端点：

| 端点 | 用途 | Content-Type | 接收方式 |
|------|------|-------------|---------|
| `/users/login` | 前端 / 客户端 | `application/json` | Pydantic 模型 |
| `/users/token` | Swagger UI | `application/x-www-form-urlencoded` | `OAuth2PasswordRequestForm` |

`OAuth2PasswordRequestForm` 是 FastAPI 内置的表单类，专门用于接收 OAuth2 标准格式的表单数据。

---

## 头像上传接口

这是本项目新增的功能，实现用户上传头像并返回可访问的 URL。

### 完整流程

```
客户端 (multipart/form-data)
  → routers/user.py          （接收 UploadFile）
  → controllers/user.py      （校验 → 保存 → 更新数据库）
  → statics/avatars/          （文件存储位置）
  → /statics/avatars/xxx.jpg  （访问 URL）
```

### 路由层：接收文件

```py
from fastapi import UploadFile, File

@router.post("/avatar", summary="上传头像")
async def upload_avatar(
    file: UploadFile = File(...),           # 文件参数
    current_user = Depends(decode_token),    # JWT 认证
    db: AsyncSession = Depends(get_database_session)
):
    return await upload_avatar_controller(file, current_user, db)
```

关键参数说明：
- `UploadFile` — FastAPI 内置的文件类型，封装了文件元信息和异步读写方法
- `File(...)` — 告诉 FastAPI 这个参数来自 `multipart/form-data`，`...` 表示必传
- 和普通的 `Form()` 不同，`File()` 专门处理文件上传流

### 控制器层：校验 + 保存

```py
import os
import uuid

STATIC_DIR = "statics"
AVATARS_DIR = os.path.join(STATIC_DIR, "avatars")

async def upload_avatar(file: UploadFile, current_user: User, db: AsyncSession):
    # ========== 1. 校验文件类型 ==========
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只支持 JPG、PNG、GIF、WebP 格式的图片"
        )

    # ========== 2. 校验文件大小（限制 5MB）==========
    max_size = 5 * 1024 * 1024  # 5MB = 5 * 1024 * 1024 字节
    file_content = await file.read()  # 异步读取文件内容到内存
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="文件大小不能超过 5MB"
        )

    # ========== 3. 生成唯一文件名 ==========
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"  # 例如：a1b2c3d4...jpg

    # ========== 4. 保存到磁盘 ==========
    file_path = os.path.join(AVATARS_DIR, unique_filename)
    with open(file_path, "wb") as f:
        f.write(file_content)  # 注意：这里是同步写，也可以用 aiofiles 异步写

    # ========== 5. 生成访问 URL ==========
    avatar_url = f"/statics/avatars/{unique_filename}"

    # ========== 6. 更新数据库 ==========
    current_user.avatar = avatar_url
    await db.flush()
    await db.refresh(current_user)

    return {"avatar_url": avatar_url}
```

### 关键设计决策

| 决策 | 做法 | 原因 |
|------|------|------|
| 文件名 | `uuid.uuid4().hex` | 防止重名覆盖 + 防止路径遍历攻击 |
| 文件校验 | 先查 Content-Type，再查大小 | Content-Type 只是声明值，文件头验证更安全（可加 `python-magic`） |
| 存储路径 | `statics/avatars/` | 在 `main.py` 已挂载 `StaticFiles`，文件可直接通过 URL 访问 |
| 存储方式 | 本地磁盘 | 简单场景够用，生产环境建议用 OSS/S3 |
| URL 存储 | 存相对路径，不存绝对路径 | 方便迁移，前端拼接 `BASE_URL + avatar_url` |

### UploadFile 对象属性

| 属性 / 方法 | 说明 | 返回值 |
|------------|------|--------|
| `file.filename` | 原始文件名 | `str \| None` |
| `file.content_type` | MIME 类型（客户端声明） | `str \| None` |
| `file.size` | 文件大小（需先读完才准确） | `int \| None` |
| `await file.read()` | 异步读取全部内容 | `bytes` |
| `await file.read(N)` | 异步读取 N 字节 | `bytes` |
| `await file.seek(N)` | 移动读取指针 | — |

### 安全注意事项

1. **文件类型不要只信 Content-Type**：客户端可以伪造。更安全的做法是用 `python-magic` 检查文件魔法数字（magic bytes）
2. **文件名不要直接使用用户传来的**：`../../../etc/passwd` 这种路径遍历攻击，用 `uuid` 彻底避免
3. **文件大小要限制**：防止用户上传超大文件撑爆磁盘，FastAPI 本身没有默认限制
4. **上传频率要限制**：生产环境建议加 rate limit，防止恶意刷上传

---

## 深入理解：yield 语法

### 什么是生成器（Generator）

Python 里，一个函数里如果有 `yield` 关键字，它就不再是普通函数，而是**生成器函数**。调用它不执行函数体，而是返回一个生成器对象。

```py
# 普通函数：一次性全部返回
def normal():
    return [1, 2, 3]      # 一次性返回整个列表

# 生成器函数：一个一个地「产」
def generator():
    yield 1                # 返回 1，暂停
    yield 2                # 返回 2，暂停
    yield 3                # 返回 3，结束

gen = generator()
print(next(gen))  # 1
print(next(gen))  # 2
print(next(gen))  # 3
```

### yield 在数据库会话中的原理

`get_database_session` 就是一个生成器函数：

```py
async def get_database_session():
    async with AsyncSessionLocal() as session:   # ① 创建会话
        try:
            yield session                        # ② 交出 session，挂起等待
            await session.commit()               # ④ 请求正常 → 提交
        except Exception:
            await session.rollback()             # ④' 请求异常 → 回滚
            raise
        finally:
            await session.close()                # ⑤ 无论如何都要关闭
```

**执行流程**：

```
请求进入
  → FastAPI 调用 get_database_session()
  → 执行到 yield session，交出 session，函数挂起
  → 接口函数使用这个 session 进行数据库操作
  → 接口函数返回后
  → FastAPI 恢复生成器执行 yield 后面的代码
  → commit() / rollback() → close()
  → 请求结束
```

这就是 **FastAPI 依赖注入 + 生成器的核心机制**——`yield` 把「准备资源」和「清理资源」写在了同一个函数里，代码更内聚。

### yield 和 return 的本质区别

| 特性 | `return` | `yield` |
|------|---------|---------|
| 执行次数 | 一次 | 可以多次 |
| 函数状态 | 返回后函数结束 | 返回后函数暂停，可以恢复 |
| 返回值 | 返回一个值 | 返回一个生成器对象 |
| 后续代码 | 不执行 | `yield` 后面的代码在下次 `next()` 时执行 |
| 典型用途 | 计算一个结果 | 惰性序列、资源管理、依赖注入 |

### 同步 yield 示例（理解基础）

```py
# 一个简单的资源管理器
def managed_resource():
    print("打开资源")
    resource = {"data": "some data"}
    yield resource           # 交出去
    print("关闭资源")        # 用完后自动执行

# 使用
for res in managed_resource():
    print(res)  # 拿到 resource 使用
    # 循环结束后自动打印「关闭资源」
```

### 异步 yield（本项目的实际用法）

```py
async def get_database_session():
    async with AsyncSessionLocal() as session:  # async with = 异步上下文管理器
        try:
            yield session
            await session.commit()              # await = 等待异步操作完成
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

异步版本多了两个关键点：
- `async def` → 定义异步生成器函数
- `async with` / `await` → 等待异步 I/O 操作（数据库连接、查询等）
- `yield` → 和同步版本一样暂停并返回值，但只能在 `async def` 里用

### lifespan 中的 yield

```py
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ===== 启动阶段 =====
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ 数据库表创建完成")
    # ===== 运行阶段 =====
    yield
    # ===== 关闭阶段 =====
    await async_engine.dispose()
    print("👋 数据库连接已关闭")
```

`@asynccontextmanager` 装饰器把一个异步生成器包装成**异步上下文管理器**。FastAPI 把这个上下文管理器作为应用的生命周期：

- `yield` 前 → `app` 启动时执行（建表）
- `yield` 后 → `app` 关闭时执行（释放连接）
- 中间 → 应用正常运行处理请求

> Express 类比：`yield` 前 = `server.listen()` 的回调，`yield` 后 = `process.on('SIGTERM')` 的回调。

---

## 深入理解：async / await

### 为什么需要异步

服务器的瓶颈通常是 I/O 等待（数据库查询、文件读写、网络请求），而不是 CPU 计算。同步模型下，每个请求在等待 I/O 时会阻塞整个线程。

```
同步模型（Express 默认）：
请求1: [===CPU===][======等待数据库======][===CPU===]
请求2:                                     [===CPU===][======等待数据库======]
                                              ↑ 请求2必须等请求1完成
总时间：所有请求时间之和

异步模型（FastAPI）：
请求1: [===CPU===][======等待数据库======][===CPU===]
请求2:     [===CPU===][======等待数据库======][===CPU===]
请求3:         [===CPU===][======等待数据库======][===CPU===]
                ↑ 等待期间去处理其他请求
总时间：≈ 最慢的一个请求
```

### async / await 基本规则

| 规则 | 说明 | 示例 |
|------|------|------|
| `async def` 定义协程 | 这是一个可以挂起的函数 | `async def login(...):` |
| `await` 等待协程 | 挂起当前协程，等待另一个协程完成 | `await db.execute(stmt)` |
| 只能在 `async def` 里 `await` | 不能在普通函数里用 `await` | — |
| `await` 不阻塞事件循环 | 等待期间可以去执行其他协程 | — |
| 调用 `async def` 不执行 | `f()` 返回协程对象，需要 `await f()` 才执行 | — |

### 本项目中的 async / await 使用模式

#### 模式 1：路由函数 → 控制器函数

```py
# routers/user.py
@router.post("/login")
async def login(user: UserLoginRequest, db = Depends(get_database_session)):
    return await login_controller(user, db)   # 等待控制器执行完成
    #     ^^^^^ 必须加 await，因为 login_controller 是 async def
```

**规则**：调用一个 `async def` 函数，必须 `await` 才能拿到返回值。否则拿到的是一个协程对象。

#### 模式 2：数据库查询

```py
# controllers/user.py
async def register(user, db):
    stmt = select(User).where(User.username == user.username)
    result = await db.execute(stmt)             # 等待数据库返回结果
    #       ^^^^^ 所有数据库操作都必须 await

    new_user = User(...)
    db.add(new_user)                            # add 是同步的，不需要 await
    await db.flush()                            # flush 是异步的，必须 await
    await db.refresh(new_user)                  # refresh 是异步的，必须 await
    return new_user
```

**什么需要 await**：
- `db.execute(stmt)` — 执行 SQL 查询 ✓
- `db.flush()` — 发送 SQL 到数据库 ✓
- `db.refresh(obj)` — 从数据库重读数据 ✓
- `db.add(obj)` — 只是加入会话跟踪，不涉及 I/O ✗

#### 模式 3：JWT 解析（异步依赖注入）

```py
# utils/security.py
async def decode_token(
    token: Annotated[str, Depends(OAuth2PasswordBearer(tokenUrl="/users/token"))],
    db: Annotated[AsyncSession, Depends(get_database_session)]
):
    payload = jwt.decode(token, TOKEN_SECRET, algorithms=[ALGORITHM])  # JWT 解码是同步的
    # ...
    result = await db.execute(stmt)   # 数据库查询是异步的
    user = result.scalar_one_or_none()
    return user
```

这个函数混合了同步和异步操作：
- `jwt.decode()` — 纯 CPU 计算，**不需要** `await`
- `db.execute()` — 数据库 I/O，**必须** `await`

#### 模式 4：文件读取

```py
# controllers/user.py - 头像上传
async def upload_avatar(file, current_user, db):
    file_content = await file.read()   # UploadFile.read() 是 async 的
    #            ^^^^^

    with open(file_path, "wb") as f:
        f.write(file_content)          # 磁盘写入是同步的
```

**注意**：`UploadFile` 的 `read()` 是异步的，但 Python 的 `open()` 和 `write()` 是**同步**的。如果要完全异步写文件，需要用 `aiofiles` 库：

```py
import aiofiles
async with aiofiles.open(file_path, "wb") as f:
    await f.write(file_content)
```

### 常见错误

```py
# ❌ 错误 1：忘记 await
result = db.execute(stmt)       # 拿到的不是查询结果，而是协程对象！
user = result.scalar_one_or_none()  # 报错：Coroutine 没有这个方法

# ✅ 正确
result = await db.execute(stmt)

# ❌ 错误 2：在普通函数里用 await
def login(user, db):
    result = await db.execute(stmt)  # SyntaxError!

# ✅ 正确
async def login(user, db):
    result = await db.execute(stmt)

# ❌ 错误 3：async def 调用没 await
async def register():
    ...
    login(user, db)    # 拿到了协程对象，但不会执行，也不会报错！
    return "done"      # login 根本没跑

# ✅ 正确
await login(user, db)
```

### 本项目中哪些函数是 sync，哪些是 async ？

| 函数 | 类型 | 原因 |
|------|------|------|
| `hash_password()` | sync | 纯 CPU 计算（bcrypt），无 I/O |
| `verify_password()` | sync | 纯 CPU 计算（bcrypt），无 I/O |
| `create_access_token()` | sync | 纯 CPU 计算（JWT 编码），无 I/O |
| `decode_token()` | async | 需要查询数据库（I/O） |
| `register()` | async | 需要查询和插入数据库（I/O） |
| `login()` | async | 需要查询数据库（I/O） |
| `get_profile()` | sync | 只返回已注入的 user 对象，无 I/O |
| `update_profile()` | async | 需要查询和更新数据库（I/O） |
| `upload_avatar()` | async | 需要读文件和更新数据库（I/O） |
| `get_database_session()` | async | 包含 `yield`，是异步生成器 |

### 核心原则

> **涉及 I/O 操作的函数 → `async def` + `await`**  
> **纯 CPU 计算的函数 → 普通 `def`**  
> **调用 `async def` 函数 → 必须 `await`**

---

## 请求流转总结

一个请求从前端到数据库的完整链路：

```
客户端请求
  → routers/user.py        （路由层：解析参数，注入依赖）
  → controllers/user.py    （控制器层：业务逻辑）
  → models/user.py         （模型层：SQLAlchemy ORM 查询）
  → configs/db_config.py   （数据库会话：执行 SQL）
  → MySQL 数据库
```

各层职责对比：

| 层 | 文件 | 职责 | 类比 Express |
|----|------|------|-------------|
| 路由层 | routers/ | 定义路径、参数校验、调用控制器 | Router |
| 控制器层 | controllers/ | 业务逻辑处理 | Controller / Middleware |
| 模型层 | models/ | 数据库表结构定义 | Mongoose Schema |
| 数据层 | schemas/ | 请求响应格式定义 + 自动校验 | TypeScript Interface + Joi |
| 配置层 | configs/ | 数据库连接、引擎、会话管理 | db.js / knexfile.js |
| 工具层 | utils/ | 通用工具函数（JWT、加密） | utils/ |

---

## FastAPI vs Express 对比论证

### 整体对比

| 维度 | FastAPI (Python) | Express (Node.js) |
|------|-----------------|-------------------|
| 语言 | Python 3.7+ | JavaScript / TypeScript |
| 类型系统 | Pydantic（运行时校验） | TypeScript（编译时校验，运行时无） |
| 异步模型 | 原生 async/await（asyncio 事件循环） | async/await（Event Loop，天生异步） |
| API 文档 | 自动生成 Swagger UI + ReDoc | 需要额外集成 swagger-jsdoc |
| 数据校验 | 内置 Pydantic，校验失败自动 422 | 需要 Joi / Zod 等额外库 |
| 依赖注入 | 内置 Depends + yield 生命周期 | 需要 InversifyJS / Awilix 等额外库 |
| 数据库 ORM | SQLAlchemy（成熟、功能完整） | Prisma / TypeORM / Knex（选择多） |
| 性能 | 高性能（基于 Starlette + Uvicorn） | 高性能（事件驱动，单线程） |
| 学习曲线 | 中等（需要理解 asyncio、类型标注） | 低（JS 生态，前端无缝衔接） |
| 生态 | 中等（FastAPI 专用插件较少） | 巨大（npm 生态极其丰富） |

### 路由定义对比

| 写法 | FastAPI | Express |
|------|---------|---------|
| 定义路由 | `@router.post("/register")` 装饰器 | `router.post("/register", handler)` |
| 路径参数 | `@router.get("/users/{id}")` — 自动解析 | `router.get("/users/:id", ...)` — req.params |
| 查询参数 | `def handler(q: str = Query(...))` — 自动校验 | `req.query.q` — 手动取值 |
| 请求体 | `def handler(body: PydanticModel)` — 自动解析+校验 | `req.body` — 手动解析 + Joi 校验 |
| 响应声明 | `response_model=XXX` — 自动过滤字段 | 手动 `res.json()` |
| 文件上传 | `def handler(file: UploadFile = File(...))` | multer 中间件 + `req.file` |

### 中间件 & 依赖注入对比

| 场景 | FastAPI | Express |
|------|---------|---------|
| 请求级中间件 | `Depends(fn)` — 声明式、类型安全 | `app.use(fn)` — 管道式 |
| 数据库连接管理 | `yield session` → 自动 commit/rollback/close | 手动 `req.db = conn` → 中间件手动管理 |
| 认证 | `Depends(decode_token)` → 直接拿到 User 对象 | 中间件 `req.user = user` → `next()` |
| CORS | `app.add_middleware(CORSMiddleware, ...)` | `app.use(cors())` |
| 静态文件 | `app.mount("/statics", StaticFiles(...))` | `app.use(express.static(...))` |

**FastAPI 依赖注入示例**：

```py
# FastAPI：声明式，类型安全
@router.get("/profile")
async def get_profile(current_user = Depends(decode_token)):
    return get_profile_controller(current_user)
    # current_user 就是 User ORM 对象，直接可以用
```

**Express 等价写法**：

```js
// Express：手动中间件，手动取结果
router.get("/profile", authMiddleware, async (req, res) => {
    const user = await User.findById(req.userId);  // 还要再查一次
    res.json(user);
});
```

**关键差异**：FastAPI 的 `Depends` 可以把认证 + 数据库查询全部内聚在一个函数里，路由层直接拿到完整的 `User` 对象。而 Express 的中间件通常只能在 `req` 上挂一个标识（比如 `req.userId`），在路由处理函数里还得再查一次数据库。

### 数据库操作对比

| 操作 | FastAPI (SQLAlchemy 2.0) | Express (Prisma / Mongoose) |
|------|--------------------------|---------------------------|
| 定义模型 | `class User(Base):` + `Mapped[type]` | `model User { ... }` (Prisma) / `new Schema({...})` (Mongoose) |
| 查询 | `select(User).where(...)` → `await db.execute(stmt)` | `prisma.user.findMany({ where: ... })` / `User.find({...})` |
| 插入 | `db.add(obj)` → `await db.flush()` | `prisma.user.create({ data: ... })` / `new User({...}).save()` |
| 事务 | `yield session` 自动管理 | 手动 `await prisma.$transaction(...)` |
| 类型推断 | `Mapped[int]` → IDE 知道 `user.id` 是 int | Prisma 自动生成 TypeScript 类型 |

### 文件上传对比

| 步骤 | FastAPI | Express (multer) |
|------|---------|------------------|
| 接收文件 | `file: UploadFile = File(...)` 声明式 | `upload.single('file')` 中间件 |
| 读取内容 | `await file.read()` | `fs.readFileSync(req.file.path)` 或 `req.file.buffer` |
| 类型校验 | 手动 `if file.content_type not in allowed_types` | 手动 + `fileFilter` 回调 |
| 大小限制 | 手动 `if len(content) > MAX_SIZE` | multer `limits.fileSize` 配置 |
| 保存到磁盘 | `open(path, "wb").write(content)` | multer 自动保存（`dest` 配置） |

### 类型安全对比

```
FastAPI + Pydantic：
  Request → Pydantic 校验（运行时）→ 如果格式不对 → 自动 422
  Response → Pydantic 序列化（自动过滤多余字段）

Express + TypeScript：
  Request → 手动校验（Joi/Zod）→ 如果格式不对 → 手动 res.status(400)
  Response → 手动 res.json()（多余字段可能泄露）
```

**关键差异**：FastAPI 的 Pydantic 是**运行时**校验，部署后依然生效。TypeScript 的类型检查只在**编译时**生效，运行时 `req.body` 仍然是 `any`，必须引入 Zod / Joi 做运行时校验。

### 开发体验对比

| 特性 | FastAPI | Express |
|------|---------|---------|
| 自动文档 | ✅ Swagger UI 开箱即用 | ❌ 需要额外配置 |
| 热重载 | `uvicorn --reload` | `nodemon` / `ts-node --watch` |
| 调试 | 标准 Python 调试器 | Chrome DevTools / VS Code |
| 代码量 | 更少（自动校验、自动文档） | 更多（需要手动处理很多事） |
| 错误提示 | 详细的 Pydantic 校验错误 | 需要自己处理和格式化错误 |

### 选择建议

| 场景 | 推荐 |
|------|------|
| 前端开发者想快速写 API | Express（JS 全栈，无缝切换） |
| 需要自动生成 API 文档 | FastAPI（Swagger UI 零配置） |
| 数据密集型应用 | FastAPI（SQLAlchemy + Pydantic 类型安全） |
| 高并发 I/O 密集型 | 两者都可以（异步模型都很成熟） |
| 团队以 Python 为主 | FastAPI |
| 团队以 JS/TS 为主 | Express / NestJS |
| 微服务 / 中小项目 | FastAPI（开发快，代码少） |
| 需要丰富的第三方中间件 | Express（npm 生态最大） |

### 个人总结

从 Express 转到 FastAPI 最大的感受：

1. **依赖注入是真的香** — `yield` 管理数据库连接、`Depends` 注入认证，代码逻辑内聚在一个函数里，不用像 Express 中间件那样把逻辑分散在好几个地方

2. **Pydantic 是神器** — 在 Express 里为了运行时类型校验需要额外引入 Zod + 中间件，FastAPI 直接内置，校验不过自动 422，字段过滤自动做，密码永远不会泄露到响应里

3. **async/await 写法一致** — Python 和 JS 的 async/await 语法几乎一样，前端转过来的学习成本主要不在语法，而在理解 asyncio 事件循环和 SQLAlchemy 的使用方式

4. **能自动生成文档真的太爽了** — 写完接口访问 `/docs` 就能看到 Swagger UI，可以直接在页面上测试接口，省去了 Postman 来回切的时间

5. **类型提示的坑** — Python 的类型标注是「渐进式」的，不像 TypeScript 那么严格。`os.getenv()` 返回 `str | None` 这种问题需要自己注意，类型检查器有时候不会报

---

## 启动

```bash
uv run uvicorn main:app --reload
```

访问 `http://127.0.0.1:8000/docs` 可以看到 Swagger 文档，FastAPI 自动生成的，可以直接在页面上测试接口。
