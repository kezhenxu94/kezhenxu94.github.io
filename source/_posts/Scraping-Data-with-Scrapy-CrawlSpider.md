---
title: Scraping Data with Scrapy - CrawlSpider
tags:
  - Scrapy
  - Python
  - Scraping
date: 2018-03-30 10:02:06
updated: 2018-03-30 17:45:06
---

## Problem

上一篇文章总结了使用 Scrapy 中的 `scrapy.Spider` 类扒取静态页面网站的方法; 文章末尾成功扒取到目标网站的数据, 下载了图片到本地文件, 但也发现了一些可以优化的地方:

- 待扒取的网页地址需要人工寻找: 我们需要使用选择器选择相册列表的 `html` 标签, 需要使用选择器选择翻页的 `html` 标签, 提取 url 链接;

- 下载的图片文件全部存放在一层目录下, 没有按所属相册分层存放;

本文将总结 `scrapy.CrawlSpider` 的基本用法和自定义 `pipeline` 组件的使用, 并尝试使用 `scrapy.CrawlSpider` 和自定义 `ImagePipeline` 解决以上两个问题;

## Prerequisites

本文所使用的环境:

- OS: macOS High Sierra

- Python: 2.7

- Scrapy: 1.4.0

本文在 {% post_link Scraping-Data-with-Scrapy-Getting-Started 上一篇文章 %} 的基础上进行优化, 如果没有阅读过上一篇文章, 也可以直接从 [此处](https://github.com/kezhenxu94/scrapy.mmonly.cc) 获得上一篇文章的最终代码 (切换到 v1 分支);

## Solution

`CrawlSpider` 是在全站扒取和扒取 "规则的" 网站中最经常使用到的 Spider, 这里的 "规则的" 一般是指网页的 url 与网页的内容有一定的映射关系, 本文与上文待扒取的网站就是很典型的 "规则的" 网站, 该网站 url 主要规则如下:

除了协议和主机名这一部分 (即 http://mmonly.cc) 之外:

- url 的第一个路径部分 (Path Segment) 是该页面的主分类, 如主分类 "美女图片" 的 url 为 http://mmonly.cc/mmtp/ , 主分类 "帅哥图片" 的 url 为 http://mmonly.cc/sgtp/ 等;

- url 的第二个路径部分是该页面的子分类, 如 "美女图片" 下的子分类 "丝袜美女" 的 url 为 http://mmonly.cc/mmtp/swmn/, 主分类 "帅哥图片" 下的子分类 "肌肉帅哥" 的 url 为 http://mmonly.cc/sgtp/jrsg/;

- url 的第三个路径部分是该页面的翻页信息, 如 "美女图片" 第二页的 url 为 http://mmonly.cc/mmtp/list_9_2.html, "美女图片" 下的 "丝袜美女" 的第二页 url 是 http://mmonly.cc/mmtp/swmn/list_11_2.html;

总结起来该网站的 url 规则就是:

```text Rules of urls
http://mmonly.cc/mmtp/swmn/list_11_2.html
                      │    │     │
                      │    │     └── 翻页信息
                      │    └── 子分类
                      └── 主分类

http://mmonly.cc/mmtp/swmn/222081.html
                      │    │     │
                      │    │     └── 相册的 ID
                      │    └── 子分类
                      └── 主分类

http://mmonly.cc/mmtp/swmn/222081_2.html
                      │    │     │   │
                      │    │     │   └── 下划线加页数
                      │    │     └── 相册的 ID
                      │    └── 子分类
                      └── 主分类
```

`scrapy.CrawlSpider` 定义了一个 `rules` 属性, 这是一个 `scrapy.spiders.crawl.Rule` 数组类型, 该属性存放了将会被扒取的 url 的规则集合, 每一个元素都可以指定一个规则和回调函数;

## Show Me the Code

### Using scrapy.CrawlSpider

为了使用 `scrapy.CrawlSpider` 类, 修改上文中的 `mmonly.py` 文件, 使 `MmonlySpider` 类继承自 `scrapy.CrawlSpider`, 手动解析 url 的回调函数也不需要了, 直接删除, 添加 `rules` 属性, 修改如下, 最终代码见 GitHub v2 分支:

{% include_code lang:python mmonly.py Scraping-Data-with-Scrapy-CrawlSpider/v1/mmonly.py %}

其中:

- `name = 'mmonly'`: 指定了该 Spider 的名称, 在一个 Scrapy 项目中必须唯一;

- `allowed_domains = ['mmonly.cc']`: 指定了该 Spider 需要扒取的网站的域名, 不在该集合内的域名将不会被扒取;

- `start_urls = ['http://mmonly.cc/mmtp/']`: 指定了该 Spider 的入口地址, Spider 会从这个地址列表中的地址开始扒取;

- `rules` 定义了一个规则集合, 其中: 

	- 第 17 行创建了一个 `Rule` 对象, `link_extractor` 表示需要抽取链接出来下一步接着扒取的 url 规则对象, 这里使用默认的 `LinkExtractor` 类, 该类的 `allow` 表示要抽取出来下一步接着扒取的 url 的正则表达式, 类似的属性还有 `deny`, 表示要过滤掉不抽取出来的 url 的正则表达式; `callback` 表示使用这个 `LinkExtractor` 抽取出来的 url 应该使用哪个回调函数进行解析, `follow` 表示使用这条规则抽取出来的页面使用 `callback` 函数解析完后, 是否还要对该页面上的链接进行再次扒取;

	- 第 18 行创建另一个 `Rule` 对象, 这个规则主要用于抽取相册地址, 然后对抽取出来的相册地址再次扒取 (此时扒取的就是相册内容了, 即画廊); 注意这里并没有显式指定 `follow=True`, 这是因为如果该 `LinkExtractor` 的 `callback` 没有指定, 那么 `follow` 默认就是 `True`, 如果 指定了 `callback`, 那么 `follow` 默认就是 `False`, 这就是上一条规则里面需要显式指定 `follow=True` 的原因, 否则会导致画廊无法翻页, 因为解析完第一张图片之后就停止了;

> 这里需要注意的是, 由于使用了 `scrapy.CrawlSpider` 指定了需要扒取的 url 正则表达式, `scrapy.CrawlSpider` 会自动抽取出符合正则表达式的 url, 待扒取的 url 不需要我们手动抽取, 也就不需要相应的解析函数了, 这里唯一需要解析的是当 url 是画廊页面的时候, 我们才从中抽取出图片的 url, 标题, 所以整个 Spider 只需要一个解析函数;

### Customizing ImagePipeline

为了将下载的图片分相册文件夹存放, 需要自定义 `ImagePipeline`, 为了最小化代码量, 我们在 `pipelines.py` 文件中自定义一个继承自 `scrapy.pipelines.images.ImagesPipeline` 的 pipeline 组件 `MyImagesPipeline`, 查看 `scrapy.pipelines.images.ImagesPipeline` 类的源代码发现, 为了生成存放图片的路径, 该类定义了一个 `file_path` 方法, 为了自定义存放图片的路径, 我们只要覆盖该方法, 就可以修改图片存放路径了:

{% include_code 'pipelines.py' lang:python Scraping-Data-with-Scrapy-CrawlSpider/v1/pipelines.py %}

其中:

- `super_file_path`: 首先调用父类的 `file_path` 方法, 得到默认的路径; 我们想自定义图片存放的路径, 但对于图片的文件名我们没有特殊要求, 还是希望使用默认的图片名;

- `item`: 为了将图片按照分类和相册标题分文件夹存放, 在 `file_path` 方法中需要得到 `item` 数据, 但该方法中的三个参数都没有这个数据, 因此我们无法得到相关的信息, 但查看代码时发现, 在调用 `file_path` 方法前, 还调用了 `get_media_requests`, 该方法中就有 `item` 信息; 这里要借助 `request` 对象的 `meta` 属性, 这个属性可以用于存放请求的一些额外数据, 因此我们还覆盖了 `get_media_requests` 方法, 在这里将 `item` 存放到 `request.meta` 中, 然后在 `file_path` 中取出;

## Running

使用 `scrapy crawl mmonly` 运行爬虫;

## Result

输出结果与前一篇文章基本一致, 下载的图片路径也是按照分类和相册名分文件夹存放好;

## What's Next

以上就是使用 Scrapy 扒取静态页面网站的两种方式, 总结起来:

- 对于需要自定义扒取范围或者不规则的任务, 使用 `scrapy.Spider`;

- 对于需要全站扒取的或者扒取规则网站部分数据的任务, 使用 `scrapy.CrawlSpider`;

对于非静态页面网站的类型又分为两种, 后面将继续总结.
