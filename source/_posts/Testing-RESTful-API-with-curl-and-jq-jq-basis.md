---
title: 使用 `curl` 和 `jq` 测试 RESTful API - `jq` 基础
date: 2018-03-18 10:34:15
tags: [CLI, Productivity]
---

{% include_code "A json file for testing" lang:json Testing-RESTful-API-with-curl-and-jq-jq-basis/test.json %}

## `jq` 基础用法

> 在 [这里](https://stedolan.github.io/jq/manual/) 查看 `jq` 的完整手册

### 使用 `jq` 格式化 json 

```shell
$ echo '{"key": "value"}' | jq
```

以上命令 `echo` 命令打印字符串 `{"key": "value"}` 到控制台, 管道符 (pipeline) `|` 将前面的命令的输出作为后面 `jq` 的输入, `jq` 会格式化该字符串;

```shell
$ cat /tmp/test.json | jq
```

以上命令将文件 `/tmp/test.json` 的内容打印到控制台, 管道符 (pipeline) `|` 将前面的命令的输出作为后面 `jq` 的输入, 因此该命令是将文件 `/tmp/test.json` 内的字符串作为 `jq` 命令的输入, 来运行 `jq` 命令;

使用 `jq` 格式化 json 文件也可以使用以下用法:

```shell
$ jq . /tmp/test.json
```

其中 `.` 是 `jq` 的一种过滤器, 表示把格式化后的 json 原样打印出来, 更多的过滤器参见后文;

{% include_code "格式化后的 test-formatted.json" lang:json Testing-RESTful-API-with-curl-and-jq-jq-basis/test-formatted.json %}

### 使用 `jq` 过滤器

如果想对 json 字符串进行操作, 可以使用 `jq` 的过滤器;

#### 提取 keys 

在做网络爬虫和对接第三方 API 的时候, 经常需要对第三方的 API 返回结果建立对应的 `Java Bean`, 其中最无聊的操作就是一个一个复制第三方 API 返回的 json 的所有 key , 作为 `Java Bean` 的字段名, 使用 `jq` 的 `keys` 过滤器可以简化这个无聊的过程:

```shell
$ jq 'keys' /tmp/test.json
[
  "data",
  "errorMsg",
  "status"
]
```

#### 提取一个 key 值

`jq` 默认将原 json 字符串格式化并原样打印, 如果只对 json 中的一个字段的值感兴趣, 可以在 `.` 后加字段名, `jq` 将只打印该字段的值:

```shell
$ jq '.status' /tmp/test.json
200
```

#### 提取多个 key 值

如果想提取多个 key 值, 可以使用逗号分隔要提取的 `key` 名称:

```shell
$ jq '.status, .errorMsg' /tmp/test.json
```

#### 计算长度 length

有时候为了验证一个接口返回的数据数量是否与预期的一致, 如对于分页接口要验证返回每页数量是否与期望的一致, 可以使用 `length` 过滤器

- 如果输入是 json 对象, `length` 过滤器将计算该对象的 key 数量:

```shell
$ jq 'length' /tmp/test.json
3
```

- 如果输入是 json array 数组, `length` 过滤器计算该数组的元素个数:

```shell
$ jq '.data | length' /tmp/test.json
10
```

`jq` 的过滤器同样使用管道符 `|` 串联多个过滤器, 以上命令先抽取出 `data` 字段的值 (此处是一个数组), 然后将该值作为过滤器 `length` 的输入, 所以以上命令计算了 `data` 字段数组长度;

#### 提取数组所有元素的 key 值

测试 json 文件中 `data key` 所对应的值是一个 `video` 对象的数组, 为了提取所有 `video` 的 `title` 字段, 可以将 "提取 key 值" 的过滤器串联起来使用:

```shell
$ jq '.data[] | .title' /tmp/test.json
```

以上命令中, `.data` 提取出 json 对象的 `data` 字段, 此时结果是一个 `json array` 数组, 由于 `.key` 这种过滤器是提取 `json object` 对象的 `key` 值的操作, 因此使用了 `[]` 将该数组拆分为一个一个的 `json object` 作为后面 `.title` 过滤器的输入;

对于连续的 `key` 值抽取, 可以不使用管道符, 直接串联过滤器, 所以以上命令和以下命令等价:

```shell
$ jq '.data[].title' /tmp/test.json
```

> 为了弄清 `[]` 的用法, 可以分别执行 `jq .data /tmp/test.json` 和 `jq .data[] /tmp/test.json` 对比输出结果

以上的命令输出了所有 `video` 的 `title` 字段值:

```text
"可以"
"参加了喔"
"😂"
"hi"
"冷漠"
"页"
"哈哈"
"来了"
"2"
"参加"
```

#### 使用 `jq` 函数

对于以上的 `test.json` 文件, 过滤器 `.data[].publishTime` 提取出所有视频的发布时间, 但该时间是一个 `unix` 时间戳, 不方便人阅读, 使用 `todate` 函数可以将时间戳转换成时间字符串:

```shell
$ jq '.data[].publishTime | todate' /tmp/test.json
"50130-09-04T00:33:20Z"
"50171-12-11T00:30:00Z"
"50171-12-13T18:20:00Z"
"50143-09-17T18:30:00Z"
"50172-02-02T16:16:40Z"
"50171-12-23T18:36:40Z"
"50171-12-22T21:46:40Z"
"50171-12-22T05:06:40Z"
"50171-12-20T22:50:00Z"
"50171-12-20T12:16:40Z"
```

看到转换后的时间年份非常大, 这是因为 `publishTime` 字段是精确到毫秒的时间戳, 而 `todate` 函数是把它当作精确到秒的时间戳来转换的, 为了纠正该错误, 可以使用 `jq` 的四则运算:

```shell
$ jq '.data[].publishTime / 1000 | todate' /tmp/test.json
"2018-02-28T07:48:02Z"
"2018-03-15T09:33:09Z"
"2018-03-15T09:37:06Z"
"2018-03-05T02:04:57Z"
"2018-03-15T10:50:25Z"
"2018-03-15T09:51:31Z"
"2018-03-15T09:50:16Z"
"2018-03-15T09:49:16Z"
"2018-03-15T09:47:27Z"
"2018-03-15T09:46:49Z"
```

以上 `/ 1000` 将 `publishTime` 除以 1000 转换成秒后, 再进行 `todate` 转换;
