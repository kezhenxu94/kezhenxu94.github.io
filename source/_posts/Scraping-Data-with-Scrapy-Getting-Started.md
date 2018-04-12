---
title: Scraping Data with Scrapy - Getting Started
tags:
  - Scrapy
  - Python
  - Scraping
date: 2018-03-29 15:44:43
updated: 2018-03-29 15:44:43
---


## Background

第二份实习兼第一份工作到此终于告一段落, 16 个月的时间里学了很多新东西也实践了很多想法, 一直没有认真总结过; 人说 "盖棺定论" , 对于这份工作, 也应该在它结束了的时候, 好好总结一下; 

最近在面试的时候, 经常会被问到在这份工作中学到了什么, 每次首先出现在我脑子里面的, 都是 "爬虫"; 后来仔细想想原因, 当然不仅仅是因为当初应聘 "Java 后台工程师" 而进来后的第一项工作却是去写爬虫, 更多的是在做爬虫的连续三个多月时间里, 从对爬虫一无所知, 到建立起对爬虫的系统认识和完整方法论, 整个过程收获非常多, 因此给我留下很深的印象; 而这也成为面试官比较感兴趣的话题;

## Problem

本文将使用一个以前在工作中遇到的爬虫案例 (该项目现已终止, 因此没有商业方面的问题), 总结待扒取网站的第一种类型: 静态页面网站;

静态页面网站也是爬虫任务中最简单的一种网站类型, 这种网站有以下几个特点:

- 几乎每一次用户操作都是一个新的页面请求, 反映在浏览器的路径栏中就是每一次操作路径栏的地址都发生变化;
- 几乎每一个页面都是静态页面, 没有 JS 加载出来的页面元素, 反映在浏览器上就是页面从出现到完整渲染出来之间没有明显的布局变化; 这从人类感知上可能会有误差, 但后面会介绍准确的判断方式;

本文将扒取的网站是 [唯一图库](http://mmonly.cc), http://mmonly.cc , 该网站提供了很多的图片并对图片进行了分类, 本文的任务是从该网站上扒取 "美女图片" 类别及其子类别下的图片;

## Prerequisites

本文所使用的环境:
- OS: macOS High Sierra
- Python: 2.7
- Scrapy: 1.4.0

## Solution

在接到这样的爬虫任务之后, 首先需要确定该网站的类型, 该任务中涉及的页面主要有:

- 某个分类的页面;
- 某个分类的子类别页面;
- 某个子类别的相册列表页面;
- 某个相册的画廊页面 (Gallery);

操作如下:

- 打开该网站的主页, 在导航栏/菜单栏切换不同的分类, 路径栏地址都在发生变化, 页面布局没有明显变化;
- 在美女图片分类下切换不同的子分类, 路径栏地址都在发生变化, 页面布局没有明显变化;
- 在美女图片随意一个子分类页面中, 随便点击一个相册, 进入相册浏览页面, 在切换上一张和下一张时, 路径栏地址都在变化;

可以确定该网站基本就是静态页面网站;

## Show Me the Code

确定了网站的类型之后, 就可以开始写代码了;

> 可以在 [此处](https://github.com/kezhenxu94/scrapy.mmonly.cc) 获得最终的代码: 切换到不同分支查看代码版本;

### Creating a Scrapy Project

> 如果还没有安装 Scrapy , 可以参照 [这里](https://scrapy.org) 安装

使用以下命令新建一个 Scrapy 项目, 将其命名为 `mmonly_cc`:

```shell
$ scrapy startproject mmonly_cc
```

完成之后 `mmonly_cc` 的目录结构如下:

```shell
$ tree 
.
└── mmonly_cc
    ├── mmonly_cc
    │   ├── __init__.py
    │   ├── items.py
    │   ├── middlewares.py
    │   ├── pipelines.py
    │   ├── settings.py
    │   └── spiders
    │       └── __init__.py
    └── scrapy.cfg

3 directories, 7 files
```

其中:

- `items.py`: 存放了扒取结果的数据结构, 通常我们会直接使用 `Python` 的 `Dictionary` 结构;
- `middlewares.py`: 存放了爬虫的中间件, 如用于下载 `html` 页面的下载器中间件;
- `pipelines.py`: 存放了爬虫扒取数据过程中需要使用的过滤器/管道, 如用于过滤不符合要求的数据, 导出数据到存储介质 (数据库, 文件);
- `settings.py`: 配置 Scrapy 项目的配置文件;
- `spiders`: 存放爬虫的文件夹, 一个复杂的网站可能需要组合多个爬虫 (Spiders), 各个爬虫根据一定逻辑分别独立扒取特定部分数据;
- `scrapy.cfg`: 配置 Scrapy 部署信息的配置文件, Scrapy 项目可能会被部署到远程服务器, 大型爬虫可能需要部署到服务器集群;

### Writing a Spider

本爬虫任务相对较小, 因此只需要一个 Spider 就可以了, 在 `spiders` 文件夹下新建一个 `mmonly.py` 文件, 其内容如下:

{% include_code 'mmonly.py' lang:python Scraping-Data-with-Scrapy-Getting-Started/v1/mmonly.py %}

其中:

- 定义了一个 Spider `MmonlySpider`, 继承自 `scrapy.Spider`, `scrapy.Spider` 定义了一个 Spider 常见的基本属性和基本方法;
- 给这个 Spider 一个名字 `name='mmonly.cc'`, 该名字在一个 Scrapy 项目中必须是唯一的;
- 列出 "美女图片" 分类下的所有子分类 `categories`; 由于写作本文时待扒取的网站该分类的下拉菜单无法展开, 因此这里手动列出了所有子分类;
- 覆盖 `scrapy.Spider` 类的 `start_requests` 方法, 该方法返回爬虫的入口地址, 即爬虫从哪个/些地址开始扒取; 入口地址可以是多个; 由于这些入口地址是各个子分类的相册列表, 所以其回调函数 (callback) 是用于解析相册地址和翻页的解析函数 (`parse_category_list`);
- `parse_category_list` 方法用于解析一个子分类的相册列表, 该方法会把解析出来的各个相册地址返回; 由于这些返回的地址是一个相册的画廊页面, 因此回调函数使用了解析画廊单张图片和翻页的解析函数 (`parse_category_list_item`); 该函数还负责子分类相册列表的翻页, 这些翻页链接对应的页面跟本函数正在解析的页面类型一致, 因此回调函数是自己, `parse_category_list`; 是一个间接的递归调用;
- `parse_category_list_item` 方法用于解析一个相册的画廊页面当前显示的图片, 将其图片地址, 标题和原网页地址输出, 并把下一页的页面 (也是一个画廊页面) 地址输出;

> 以上的回调函数中, 如果返回值是一个 `items.py` 中定义的数据结构或 `dictionary`, 那么该返回值就作为爬虫扒取的最终数据输出 (如 `parse_category_list_item` 前半部分的返回); 如果返回值是一个 `scrapy.Request` 对象, 那么 Scrapy 会将其作为新的入口地址, 进行扒取 (如 `parse_category_list_item` 后半部分输出和 `parse_category_list`);

其中使用到了一些基本的 css 选择器, 到后面将逐渐转而使用更为高效和灵活的 xpath 选择器;

### Applying a Pipeline

以上就可以获得图片的基本信息, 如地址, 标题; 但为了下载图片到本地/或云端存储器, 需要应用 Scrapy 的 `scrapy.pipelines.images.ImagesPipeline` 管道组件, 该组件会将 url 对应的图片下载到指定的存储位置;

为了启用 `scrapy.pipelines.images.ImagesPipeline` 管道组件, 需要在 `settings.py` 中将以下代码注释去掉, 并加上 `scrapy.pipelines.images.ImagesPipeline` 管道组件:

```python settings.py
ITEM_PIPELINES = {
	'scrapy.pipelines.images.ImagesPipeline': 100,
	'mmonly_cc.pipelines.MmonlyCcPipeline': 300,
}
IMAGES_STORE = '/tmp/mmonly'
```

其中:

- `ITEM_PIPELINES` 的 `key` 是管道组件对应的类, `value` 是该管道的顺序, 顺序越小越先起作用;
- `scrapy.pipelines.images.ImagesPipeline` 默认会读取扒取的最终数据结构中的 `image_urls` 字段, 将其作为 url 数组遍历, 下载各个 url 对应的图片; 因此我们需要修改上面 Spider 的返回结果中 `image_src` 的名字和值为 `'image_urls': [image_src]`; 见最终代码;
- `IMAGES_STORE` 配置了下载下来的图片被存放的位置为 `/tmp/mmonly`; 存放的位置支持本地磁盘, AWS 的 S3 服务器, 更多支持请看 [文档](https://doc.scrapy.org/en/latest/topics/media-pipeline.html);

## Running

使用 `scrapy crawl mmonly.cc` 运行名为 `mmonly.cc` 的 Spider, 这也就是前面所说每一个 Spider 的 `name` 属性必须唯一的原因, 否则 Scrapy 不知道你究竟要运行哪一个 Spider; 如果没有报错, 会在控制台中看到类似这样的输出:

```text
...
{
 'image_urls': [u'http://t1.mmonly.cc/uploads/tu/201704/9999/7b62320a7c.jpg'],
 'images': [{'checksum': '43cdc28916df7694067b718b79018e80',
             'path': u'wgmv/\u97e9\u56fd\u7f8e\u5973\u5927\u80c6\u5199\u771f \u97e9\u56fd\u5927\u80f8\u7f8e\u5973\u79c1\u623f\u6027\u611f\u5199\u771f/5cb42cac099e809760ae2223d5c32f917ddf1275.jpg',
             'url': 'http://t1.mmonly.cc/uploads/tu/201704/9999/7b62320a7c.jpg'}],
 'source_url': 'http://www.mmonly.cc/mmtp/wgmv/138824.html',
 'title': u'\u97e9\u56fd\u7f8e\u5973\u5927\u80c6\u5199\u771f \u97e9\u56fd\u5927\u80f8\u7f8e\u5973\u79c1\u623f\u6027\u611f\u5199\u771f'
...
```


## Result

如果想把输出的结果保存到文件, 可以使用 `-o` 参数, `-o` 参数后的文件名如果是`.json` 结尾的, 将保存为 `json` 格式的文件, 如果是以 `.jl` 结尾的, 将保存为 `json line` 格式的文件, 更多格式请参考 [文档](https://doc.scrapy.org/en/latest/topics/feed-exports.html);

## What's Next

以上代码虽然扒取到了想要的信息并将图片成功下载下来了, 但在解析网页链接时我们手动做了太多, 考虑到该网站的各种分类和图片的 url 都有一定的规律, 后面将会使用 Scrapy 提供的另一个便捷类 `CrawlSpider` 进行改写, 大大缩少代码;

还有另一个问题是图片虽然正确下载下来, 但所有文件都存放同一个文件夹下, 我们希望下载的图片按照原网站上的相册进行分文件夹存放, 后面将使用扩展自 `scrapy.pipelines.images.ImagesPipeline` 的自定义管道进行图片下载, 将图片分文件夹存放;

> This is Kid the Programmer, thanks for reading
