---
title: GitHub 贡献最佳实践
date: 2020-01-15 13:07:10
updated: 2020-01-15 13:07:10
tags:
  - Engineering
  - Open Source
---

> 本文是笔者在开源贡献中总结出来的一些关于 Git 操作的实践, 如果你有 "更佳" 的实践, 请在本文下方评论.
本文以笔者自己的 Git 工作流开始, 然后以 Q/A 形式展开, 解释工作流中的各个步骤要解决的问题, 读完第一部分之后, 你可以随意选择你需要的部分进行阅读, 或在遇到问题时再来查阅.

## Git Flow

### 0. Fork

一般情况下我们并没有要贡献的项目的写入权限, 所以需要先创建自己的一个 Fork, 直接点击项目 GitHub 页面上右上角的 Fork 按钮, 按照提示将其放到你自己的账号下即可;

> 可以使用本文代码仓库地址进行测试: https://github.com/kezhenxu94/kezhenxu94.github.io

### 1. Clone

Fork 之后你只是拥有了项目代码在 GitHub 上的一份副本, 且这个副本你拥有所有权限; 现在需要将项目代码克隆到本地机器上, 然后在本地机器上做一些修改;

此时可以使用上游仓库的地址, 也可以使用 Fork 出来的地址, 笔者比较喜欢使用 Fork 出来的地址, 下面会解释原因;

```shell
$ git clone git@github.com:your-github-id/kezhenxu94.github.io
```

这时会产生一个名字为 `origin` 的远程引用

```shell
$ git remote -v
origin	git@github.com:your-github-id/kezhenxu94.github.io (fetch)
origin	git@github.com:your-github-id/kezhenxu94.github.io (push)
```

他关联到你自己 Fork 出来的仓库, 此时就可以开始准备修改了;

### 2. Check out branch

为了保持 Fork 仓库 `master` 分支始终是干净的, 我们每次修改都会新建一个分支, 如我想修复一个空指针异常;

```shell
$ git checkout -b bugfix/npe
```

然后进行修复工作;

### 3. Commit & push

修复工作完成之后, 将代码 commit 并且 push 到我们 Fork 出来的仓库(由于没有上游仓库写入权限, 此时先 push 到我们自己的副本);

```shell
$ git add TestClass.java
$ git commit -m'Fix a NullPointerException'
$ git push origin
```

### 4. Open pull request

将代码 push 到我们的副本之后, 这时候再去上游仓库提 pull request, 等待上游仓库合并;

### 5. Sync upstream

一旦我们的 pull request 被上游仓库合并到 master 之后, 我们 Fork 出来的副本就会落后上游仓库,
我们下次贡献时也是从 Fork 仓库的 master 分支 check out 出新的分支, 那么就会落后上游仓库, 这时候会出现一些没意义的合并;
所以我们在开始新的贡献之前, 会先同步一下上游的 master, 这时候就需要先把本地工作目录和上游仓库关联起来, 所以我们再关联一个远程仓库地址;

```shell
$ git remote add upstream git@github.com:kezhenxu94/kezhenxu94.github.io
```

这时候本地工作目录就关联了两个远程仓库了, 我们切换回 master 分支然后同步上游仓库;

```shell
$ git checkout master
$ git pull upstream master
$ git push origin master
```

到此, 一个贡献的流程就已经结束, 继续重新从 master [check out 出新分支](#2-check-out-branch), 开启下一次贡献;

> 当然, 步骤 2 ~ 4 是可以并行的, 比如同时在进行多个功能开发的话;

## Q/A

### 我如何在本地 review GitHub 上的 pull request;

见过最 naive 的方式就是通过 GitHub pull request 页面, 找到发起这个 pull request 的 Fork 仓库, clone 这个仓库切到 PR 对应的分支, 进行本地 review;
但每 review 一个 PR 就得克隆一次, 非常耗时; 以下是笔者常用的几种本地 review 代码的方式:

#### 方式 0

```shell
$ git fetch upstream pull/1234/head:pr/1234 # 把 GitHub 上 PR number 为 1234 的 head 拉到本地, 命名为 pr/1234 分支
$ git checkout pr/1234 # 切换到该分支
```

#### 方式 1

```shell
$ git fetch upstream refs/pull/4236/head
$ git checkout -b owner/branch FETCH_HEAD # 其中 owner/branch 为 PR 对应的 Fork 库名和分支名
```

#### 方式 2

如果使用 IntelliJ IDEA Ultimate 版本 2018.3 版本之后, 可以在 IDEA 中直接 pull 和 check out 到 PR 分支, 操作如下:

快捷键 `Command` + `Shift` + `A` 打开快速 Action, 搜索 `view pull requests` 回车, 按照提示, check out 出相应的 PR 即可;
