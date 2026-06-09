---
title: git基础入门
published: 2026-06-01
description: "新手git教程."
image: "./cover.webp"
tags: ["后端开发", "开发工具"]
category: Guides
draft: false
---

# 技术学习：Git

---

## 1. Git 基础与常用操作

### 1.1 什么是 Git？

Git 是一个**分布式版本控制系统**，用于跟踪文件的变化。它能让你：

- 📝 记录每次修改的历史
- 🔄 随时回退到任意历史版本
- 👥 多人协作开发，互不干扰
- 🌿 创建分支并行开发不同功能

### 1.2 安装 Git

**Windows：**
前往 [https://git-scm.com/downloads](https://git-scm.com/downloads) 下载安装包，按默认选项安装即可。

### 1.3 初始配置

安装完成后，**第一件事**是设置你的身份信息：

```bash
# 设置用户名（会出现在每次提交记录中）
git config --global user.name "你的名字"

# 设置邮箱
git config --global user.email "你的邮箱@example.com"

# 设置默认编辑器（可选）
git config --global core.editor "code --wait"   # VS Code
git config --global core.editor "vim"            # Vim

# 查看所有配置
git config --list
```

> 💡 `--global` 表示全局生效。如果你只想在某个项目中使用不同名字，可以在项目目录内去掉 `--global` 执行。

### 1.4 核心概念

在学习命令之前，先理解 Git 的三个区域：

```
工作区 (Working Directory)   →  你实际编辑的文件
    ↓ git add
暂存区 (Staging Area)        →  准备提交的文件快照
    ↓ git commit
本地仓库 (Local Repository)  →  历史提交记录
    ↓ git push
远程仓库 (Remote Repository) →  GitHub 等服务器上的仓库
```

### 1.5 仓库操作

#### 创建新仓库

```bash
# 在当前目录初始化一个 Git 仓库
git init

# 创建一个新目录并初始化
git init my-project
```

执行后会在目录下生成一个 `.git` 隐藏文件夹，这就是 Git 的数据库。

#### 克隆远程仓库

````bash
# 克隆仓库到本地（HTTPS 方式）
git clone https://github.com/用户名/仓库名.git

```bash
# 查看工作区和暂存区的状态
git status

# 简洁模式
git status -s
````

`git status -s` 的输出示例：

```
 M README.md      # 已修改但未暂存
M  src/app.js      # 已修改并已暂存
?? new-file.txt    # 未跟踪的新文件
A  config.yaml     # 新添加到暂存区的文件
```

#### 添加文件到暂存区

```bash
# 添加单个文件
git add README.md

# 添加所有修改的文件
git add .

# 添加所有 .js 文件
git add *.js

# 添加某个目录下的所有文件
git add src/

```

#### 提交

```bash
# 提交暂存区的内容
git commit -m "提交说明"

# 推荐的提交说明格式：
git commit -m "feat: 添加用户登录功能"
git commit -m "fix: 修复页面闪退问题"
git commit -m "docs: 更新 README 文档"
git commit -m "refactor: 重构数据处理模块"

# 添加所有已跟踪文件的修改并提交（跳过 git add）
git commit -am "提交说明"

# 修改上一次的提交说明
git commit --amend -m "新的提交说明"
```

> ✅ **提交说明规范**：推荐使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：
>
> - `feat`: 新功能
> - `fix`: 修复 Bug
> - `docs`: 文档变更
> - `style`: 代码格式（不影响逻辑）
> - `refactor`: 重构
> - `test`: 添加测试
> - `chore`: 构建/工具变更

#### 查看历史

```bash
# 查看完整提交历史
git log

# 简洁的一行显示
git log --oneline

# 带分支图的显示
git log --oneline --graph --all

# 查看最近 5 次提交
git log -5

# 查看某文件的修改历史
git log -- README.md

# 查看每次提交具体改了什么
git log -p

# 查看某次提交的详细内容
git show <commit-id>
```

#### 查看差异

```bash
# 工作区 vs 暂存区（还没 add 的改动）
git diff

# 暂存区 vs 最新提交（已 add 但未 commit 的改动）
git diff --staged

# 某个文件的差异
git diff README.md
```

### 1.7 分支操作

分支是 Git 最强大的功能之一，让你可以独立开发而不影响主线。

```bash
# 查看所有本地分支（当前分支前面有 * 号）
git branch

# 查看所有分支（包括远程）
git branch -a

# 创建新分支
git branch feature-login

# 切换到新分支
git checkout feature-login

# 创建并切换到新分支（常用）
git checkout -b feature-login

# 切换到已有分支
git checkout main

# 合并指定分支到当前分支
git merge feature-login

# 重命名当前分支
git branch -m 旧名称 新名称
```

### 1.8 远程操作

```bash
# 查看远程仓库信息
git remote -v

# 添加远程仓库
git remote add origin git@github.com:用户名/仓库名.git

# 推送到远程仓库
git push origin main

# 第一次推送并建立跟踪关系
git push -u origin main

# 拉取远程更新（合并到本地）
git pull origin main

```

### 1.9 暂存工作区（Stash）

```bash
# 暂存当前工作区的修改
git stash

# 查看暂存列表
git stash list

```

### 1.11 .gitignore 文件

`.gitignore` 文件告诉 Git 哪些文件不需要跟踪。

```gitignore
# 忽略所有 .log 文件
*.log

# 忽略 node_modules 目录
node_modules/

# 忽略 .env 环境变量文件
.env

# 忽略所有 .tmp 文件但保留 important.tmp
*.tmp

# 忽略 build 目录
/build/

# 忽略 IDE 配置
.idea/
.vscode/
```
