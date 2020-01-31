---
title: 使用 `curl` 和 `jq` 测试 RESTful API - 入门
date: 2018-03-17 20:45:21
updated: 2018-03-28 20:30:11
tags: [Testing, CLI, Productivity]
---

## Problem

目前用于测试 `RESTful` 接口的工具多种多样, 从像 [Postman](https://www.getpostman.com), [Cocoa Rest Client](https://mmattozzi.github.io/cocoa-rest-client/) 这样的独立运行的应用程序, 到像 [Postman](https://chrome.google.com/webstore/detail/postman/fhbjgbiflinjbdggehcddcbncdddomop?hl=en) 这样的浏览器插件, 以及像 [Editor-based Rest Client](https://blog.jetbrains.com/phpstorm/2017/09/editor-based-rest-client/) 这样的 IDE 插件, 功能都非常专业和强大; 但对于非重度测试人员可能并不想在电脑上安装太多不常用的软件, 或者对于已经熟悉了命令行操作和 `Shell` 脚本编程的人来说可能想使用已经熟悉的既有的工具进行测试 `RESTful` 接口, 那么 `curl` 和 `jq` 的组合将是这类人的不二选择.

## Prerequisite

- `curl`: 几乎所有的 `*nix` 系统都已经自带了 `curl` 命令, 如果你的系统太奇葩没有自带, 可以到 [这里](https://curl.haxx.se) 下载安装;
- `jq`: 大部分的 `*nix` 系统似乎都没有默认安装 `jq`, 但好在	`jq` 的安装并不复杂, 可以在 [这里](https://stedolan.github.io/jq/download/) 找到对应的系统的安装方法, 如果在这里找不到对应的系统或者你想完全控制安装过程所做的修改, 也可以按 [这里](https://stedolan.github.io/jq/download/) 的教程进行源代码安装;

> 可以使用 `curl -V` 和 `jq` 验证系统上是否有 `curl` 和 `jq` 工具可用, 如果有类似以下的输出则表明系统有可用的 `curl` 版本和/或 `jq` 版本:
```shell
$ curl -V
curl 7.54.0 (x86\_64-apple-darwin17.0) libcurl/7.54.0 LibreSSL/2.0.20 zlib/1.2.11 nghttp2/1.24.0
Protocols: dict file ftp ftps gopher http https imap imaps ldap ldaps pop3 pop3s rtsp smb smbs smtp smtps telnet tftp 
Features: AsynchDNS IPv6 Largefile GSS-API Kerberos SPNEGO NTLM NTLM\_WB SSL libz HTTP2 UnixSockets HTTPS-proxy 

$ jq
jq - commandline JSON processor [version 1.5rc2-245-g7b81a83-dirty]

Usage:	jq [options] <jq filter> [file...]
	jq [options] --args <jq filter> [strings...]
	jq [options] --jsonargs <jq filter> [JSON_TEXTS...]
```
> 如果输出是这样的: `-bash: curl: command not found` 和 `-bash: jq: command not found`, 说明没有可用的 `curl` 版本或 `jq` 版本, 需要自己安装;

## Solution

### `curl` 的基本用法

查看另一篇文章: {% post_link Testing-RESTful-API-with-curl-and-jq-curl-basis "curl 的基本用法" %}

### `jq` 的基本用法

查看另一篇文章: {% post_link Testing-RESTful-API-with-curl-and-jq-jq-basis "jq 的基本用法" %}

### 连接 `curl` 和 `jq` 

`curl` 命令请求 `RESTful` 接口返回 `json` 字符串, `jq` 接收 `json` 字符串作为输入进行操作, 在 `Linux` 下使用管道符进行连接是很自然的事:

```shell
$ curl 'api.groupy.cn:8080/video/top' | jq
```

### 对比两个接口的返回

之前在重构接口代码的时候, 为了保证重构后的接口返回数据和重构前一致, 就需要在本地运行重构后的代码, 然后对比本地接口的返回和线上接口返回的差异;

虽然像 [Beyond Compare](https://www.scootersoftware.com) 这样的工具可以用来对比两个文件的区别, 但是如果仅仅只是为了比较两个纯文本文件的差异, 用 Beyond Compare 就显得有点杀鸡用牛刀了, Linux 自带的 `vimdiff` 命令足矣;

`vimdiff` 命令接收任意多个文件名作为参数, 比较他们的内容, 对于相同的行 `vimdiff` 自动折叠起来, 对不不同的行 `vimdiff` 高亮显示, 非常方便;

为了比较两个接口的返回, 可以先将两个接口的返回保存到文件中, 这在 {% post_link Testing-RESTful-API-with-curl-and-jq-curl-basis "curl 的基本用法" %} 中已经讲过;

以下将一步步简化对比两个接口 `api.groupy.cn:8080/video/top?filter=PublishTime` 和 `api.groupy.cn:8080/video/top?filter=score`  返回值的操作:

- 操作 1

```shell
$ curl 'api.groupy.cn:8080/video/top?filter=PublishTime' -O # 在当前目录下产生一个 top?filter=PublishTime 文件
$ curl 'api.groupy.cn:8080/video/top?filter=score' -O # 在当前目录下产生一个 top?filter=score 文件
$ vimdiff top\?filter\=PublishTime top\?filter\=score # 使用 vimdiff 对比两个文件, 由于问号 ? 和等号 = 在 shell 中有特殊含义, 使用 \ 转义, 可以使用 tab 自动补全文件名
```

> \# 是 shell 中的注释符号, # 直到行末的所有字符串被视为注释

由于接口返回的字符串并没有经过格式化, 以上两个 `curl` 命令执行结果产生的文件内容都是只有一行字符串, 使用 `vimdiff` 打开发现根本很难比较 ╮(╯▽╰)╭  , 可以使用 `jq` 命令先格式化之后再比较;

- 操作 2

```shell
$ curl 'api.groupy.cn:8080/video/top?filter=PublishTime' -O # 在当前目录下产生一个 top?filter=PublishTime 文件
$ curl 'api.groupy.cn:8080/video/top?filter=score' -O # 在当前目录下产生一个 top?filter=score 文件
$ jq . top\?filter\=PublishTime > publishTime.json # 使用 jq 格式化后, 使用 > 重定向输出到另一个文件 PublishTime.json 中
$ jq . top\?filter\=score > score.json # 使用 jq 格式化后, 使用 > 重定向输出到另一个文件 score.json 中
$ vimdiff publishTime.json score.json # 使用 vimdiff 对比格式化后的两个文件
```

以上操作会产生 4 个文件, 如果要对比的接口很多, 不久当前目录下就会有一大堆文件, 其中 `curl` 产生的两个文件是 "中间" 文件, 因此很容易想到使用管道符把 `curl` 和 `jq` 命令串联起来, 消除 "中间文件":

- 操作 3

```shell
$ curl 'api.groupy.cn:8080/video/top?filter=PublishTime' | jq . > publishTime.json
$ curl 'api.groupy.cn:8080/video/top?filter=score' | jq . > score.json
$ vimdiff publishTime.json score.json # 使用 vimdiff 对比格式化后的两个文件
```

以上操作都使用了 `>` 输出重定向, 把本来应该输出到控制台的内容重定向到一个文件中, Linux 除了输出重定向, 还有输入重定向, 输入重定向可以使用文件或命令的输出作为本来应该在控制台输入的内容, `vimdiff` 命令也同样可以使用输入重定向, 把上面两个 `curl` 命令的输出作为输入文件重定向到 `vimdiff` 命令中;

- 终极操作

```shell
$ vimdiff <(curl 'api.groupy.cn:8080/video/top?filter=PublishTime' | jq . -S) <(curl 'api.groupy.cn:8080/video/top?filter=score' | jq . -S)
```

以上命令将两个 `curl` 的执行结果使用 `<` 重定向到 `vimdiff` 的输入, 由于 `json` 对象的 `key` 值顺序不重要, 在对比接口时应该忽略他们的顺序, 因此还使用了 `jq` 命令的 `-S` 参数对 `key` 值进行排序;

