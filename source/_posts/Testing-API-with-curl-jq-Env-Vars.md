---
title: 使用 `curl` 和 `jq` 测试 RESTful API - 环境变量
date: 2018-03-28 20:26:10
updated: 2018-03-28 20:26:10
tags: [Testing, CLI, Productivity]
---

## Problem

{% post_link Testing-RESTful-API-with-curl-and-jq-Getting-Started  上一篇文章 %} 介绍了如何使用 `curl` 和 `jq` 进行简单地测试 RESTful 接口; 在实际情况中, 我们通常会有多个部署环境, 如开发环境, 测试环境, 用户验收测试环境 (UAT), 正式环境等; 这些不同的环境通常会使用不同的域名区分, 但接口的路径总是一样的; 使用 `curl` 进行测试的时候, 如果需要切换不同的环境就需要修改接口的地址, 非常不便;

像 [Postman](https://www.getpostman.com) 这样的工具提供了环境变量 (Environment Variables) 的概念, 用户只要定义诸如 `devel`, `test`, `uat`, `prod` 这样的环境, 然后再在各个环境中定义诸如 `host`, `port` 等变量, 那么测试时使用的接口就可以使用这些变量, 如:

```text
http://{{host}}:{{port}}/rest/greeting
```

在运行测试用例的时候只需要切换不同的环境, 实际调用的接口中的变量就会被相应环境中定义的值所替换, 达到切换环境的目的; 

> 可以在 [这里](https://www.jianshu.com/p/354cd8a3e18c) 看到 Postman 使用环境变量的教程;

Shell 命令行中也有环境变量的概念, 而且同样也可以用来实现切换测试接口环境的功能;

## Solution

### Variables

在 Bash Shell 终端中, 可以使用语句 `a=3` 定义一个普通变量 `a` 并将其赋值为 `3`, 可以使用 `$a` 引用变量 `a` 的值; 为了实现上述切换环境的功能, 最简单的实现方式就是把不同环境下会变化的接口部分分别定义成变量, 然后在调用时用变量替换:

#### Solution 0 - Naive

```shell
$ host_test=api.groupy.cn
$ host_prod=api.groupy.vip
$ port_test=8080
$ port_prod=8080
$ curl "http://$host_test:$port_test/some/api"
$ curl "http://$host_prod:$port_prod/some/api"
```

> {% post_link Testing-RESTful-API-with-curl-and-jq-curl-basis 前面的文章 %} 中提到过, `curl` 命令中始终把 url 用单引号包围起来是个好的习惯, 但此处却不应该使用单引号, 原因是 Bash Shell 终端中对于单引号包围的字符串, 其内容如果包含变量, 变量并不会被解析, 也就是说如果以上使用单引号包围 url 的话, 那么 `curl` 命令最终会下载的 url 就是 `http://$host_test:$port_test/some/api`, 这显然是错误的;

以上首先定义了正式/测试环境的 `host`, `port`, 然后在实际调接口的时候再使用定义好的变量进行替换;

乍一看你可能会觉得 "这仿佛是在逗我", 比直接输入正式/测试环境的完整接口地址还麻烦 ~\_~;; 特别是如果不同环境之间接口变化的部分很多 (这里只有 `host` 和 `port`) 的时候, 需要定义一大堆变量;

#### Solution 1 - Simple

以上操作中的每一行命令都可以看作是 Bash Shell 的一行代码, 如果把上面的命令都放到一个文件中, 然后运行文件, 命令就可以批量运行了, 定义变量的语句也不例外; 因此可以考虑把区分环境的变量定义分别存放到不同的文件中, 需要切换环境的时候就运行不同的变量定义文件;

```shell
$ echo 'host=api.groupy.cn' > /tmp/test.sh
$ echo 'port=8080' >> /tmp/test.sh
$ echo 'host=api.groupy.vip' > /tmp/prod.sh
$ echo 'port=8080' >> /tmp/prod.sh

$ . /tmp/test.sh # 切换到测试环境
$ curl "http://$host:$port/some/api"
$ # 其他在测试环境的接口测试

$ . /tmp/prod.sh # 切换到正式环境
$ curl "http://$host:$port/some/api"
$ # 其他在正式环境的接口测试
```

其中:

- `echo 'host=api.groupy.cn' > /tmp/test.sh`: `echo` 命令单纯地把定义测试环境的 `host` 变量的代码打印到控制台, `>` 符号把控制台的输出重定向到文件 `/tmp/tesh.sh` 中, 如果文件不存在, 则新建一个并写入, 如果文件存在, 则清空文件再写入;

- `echo 'port=8080' >> /tmp/test.sh`: 同样, 仅仅是把定义测试环境的 `port` 变量的代码打印到控制台, 再由 `>>` 符号把输出重定向到文件 `/tmp/test.sh`, 此处的重定向符号为两个尖括号 `>>`, 与只有一个尖括号 `>` 的重定向不同的是, 在重定向的文件已经存在的时候, `>>` 会在文件的末尾追加内容而不是先清空文件;

- 接下来两行代码功能类似, 只是把定义正式环境的变量存放到不同的文件;

- `. /tmp/test.sh`: 把文件 `/tmp/test.sh` 中定义变量的代码在控制台执行一遍, 该代码执行完之后, 当前命令行的环境中遍有了 `host`, `port` 等变量了, 可以使用 `echo $host` 查看是否是相应环境的值;

- 此后就可以统一使用 `curl http://$host:$port/some/api` 测试了, 只要在需要切换环境的时候执行一次相应的 `. /tmp/test.sh` 或 `. /tmp/prod.sh`, 后续的所有操作就都是在该环境下进行;

> 前面 1 - 4 步都可以使用普通的文本编辑器 (VIM, Emacs, Notepad 等) 进行编辑文件后保存;

