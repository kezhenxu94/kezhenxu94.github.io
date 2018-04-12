---
title: Testing RESTful API with curl and jq - curl basis
date: 2018-03-17 23:22:13
tags: 
  - CLI
  - Productivity
---

> 本文使用的所有示例接口都来自 [github 的公开接口](https://developer.github.com/v3/), 对此表示感谢

## `curl` basic usages

> 使用 `man curl` 查看 `curl` 命令的完整手册

### 使用 `curl` 调用接口

```shell
$ curl 'https://api.github.com/users/github/repos'
```

尽管这里的接口 'https://api.github.com/users/github/repos' 两侧的单引号不是必须的, 但是始终使用单引号将接口地址包围起来是一个好的习惯, 因为当接口需要多个参数时, 其中包含的 `&` 符号在 `shell` 中有特殊的含义, 可能导致结果与预期的不符;

### 使用 `curl` 下载文件

```shell
$ curl 'https://api.github.com/users/github/repos' -O
```

其中 `-O` (大写字母 O) 参数表示将该 URL 地址的返回存放到当前目录的文件中, 文件名是 URL 的最后一个 Path Segment (即最后一个/之后的所有内容), 此处为 `repos`, 如果想将返回结果存放到自定义的文件中, 可以使用 `-o` (小写字母 o) 再加文件名;

```shell
$ curl 'https://api.github.com/users/github/repos' -o /tmp/repos.json
```

以上命令将接口的返回内容存放到 `/tmp/repos.json` 文件中;

有时候在服务上需要下载一些工具的压缩包, 如 `jmeter`, `maven`, `ant`, `gradle` 等, 可以先在本地电脑上找到下载的链接, 再在服务器上使用 `curl` 命令下载文件, 如下载 `jmeter`:

```shell
$ cd /tmp/
$ curl 'http://mirrors.hust.edu.cn/apache/jmeter/binaries/apache-jmeter-4.0.zip' -O
```

以上命令将 `jmeter` 的二进制安装程序的压缩包下载到 `/tmp/apache-jmeter-4.0.zip` 文件中.

### 使用 `curl` 传递参数

默认 `curl` 命令会对后面所跟随的 URL 地址使用 `HTTP GET` 请求, `curl` 命令支持 `HTTP` 协议中诸如 `GET`, `POST`, `HEAD`, `DELETE` 等方法, 使用 `-X` 后跟随方法名对 URL 地址使用指定的 `HTTP` 方法, 如 `-XGET` 与默认行为一致, `-XPOST` 使用 `POST` 方法请求接口地址;

#### `GET` 参数

当使用 `GET` 方法时, 请求参数 (Query String) 为 URL 的一部分, 可以直接写在 URL 中, 如:

```shell
$ curl -XGET 'https://api.github.com/users/github/repos?type=owner'
```

但当请求参数不为纯 ASCII 字符的时候, 需要使用 `-G` 参数进行传递, 如:

```shell
$ curl -XGET 'https://api.github.com/search/repositories?q=极客' 
```

会返回一个错误的 html 页面 (而不是 json ), 因为其中非 ASCII 字符 "极客" 被 `curl` 处理后不知道成了什么, 导致 github 说该请求不符合 API 说明文档, 当 Query String 含有非 ASCII 字符时应该使用 `-G` 进行传递:

```shell
$ curl -XGET 'https://api.github.com/search/repositories?sort=stars' -G --data-urlencode 'q=极客'
```

如上所示, 如果有多个参数, 只有其中的非 ASCII 字符串需要使用 --data-urlencode 进行传递, 其余的纯 ASCII 参数使用原来的传递方式进行, 纯 ASCII 字符参数当然也可以使用 --data-urlencode 进行传递, 因此上面的请求与以下请求是等价的:

```shell
$ curl -XGET 'https://api.github.com/search/repositories' -G --data-urlencode 'q=极客' --data-urlencode 'sort=stars'
```

> NOTE: 如果非 ASCII 字符串被进行 URL 编码了之后为纯 ASCII 字符, 则可以不使用 -G 进行传递, 直接跟在 URL 中

#### `POST` 参数

当使用 `POST` 请求时, `POST` 请求的参数包括 Query String 以及 Body, 其中 Query String 和上面的 `GET` 请求参数传递一样, 而要传递 Body 则需要使用 `-d` 参数:

```shell
$ curl -XPOST 'http://example.com/' -d'
{
	"key1": "value1",
	"key2": "value2"
}'
```

> 按照 `RESTful` 风格, `POST` 请求将会改变服务器的资源, 此处没有找到合适的测试接口, 因此随便使用一个地址

以上 `-d` 参数紧跟着一个字符串, 用单引号包围, 字符串为一个 `json` 字符串;

如果传递的 Body 内容非常长, 输入的时候可能不太方便, 并且在重复测试的时候要重复输入, 非常不方便, 可以先将 Body 数据存放到文件中, `-d` 参数支持使用文件作为输入, 如文件 /tmp/request-body.json 内容为:

```json
{
	"key1": "value1",
	"key2": "value2"
}
```

则上面的命令与以下命令等价:

```shell
$ curl -XPOST 'http://example.com/' -d @/tmp/request-body.json
```

#### `Header` - 头部参数

除了可以对 `HTTP` 各种请求方法传递参数, `curl` 也可以在进行请求时设置 `HTTP` 的请求头, 使用 `-H` 指定, 如 `HTTP` [基本验证 (Basic Auth)](https://en.wikipedia.org/wiki/Basic_access_authentication) 要求在请求接口时带上 `Authorization` 请求头:

```shell
$ curl 'https://api.github.com/user/keys/' -H'Authorization: Basic xxxxx' -H'Referer: www.google.com'
```

其中 `/user/keys` 接口要求调用时必须使用 `Basic Authentication`, 因此必须使用 `-H` 设置请求头, 如上, `-H` 可以多次使用设置多个请求头, 以上示例还设置了 `Referer` 请求头;

> `Basic Authentication` 也可以使用 `curl -u username:password` 进行设置, 实际上 `Authorization` 头部中的 `Basic` 后面带的一串字符串就是 `username:password` 的 `base64` 编码, 如用户名是 Aladdin 密码是 OpenSesame, 而字符串 "Aladdin:OpenSesame" 的 `base64` 编码为 "QWxhZGRpbjpPcGVuU2VzYW1l", 那么 `Authorization` 头部就是 `Authorization: Basic QWxhZGRpbjpPcGVuU2VzYW1l`;
