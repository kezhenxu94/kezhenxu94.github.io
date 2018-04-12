---
title: Caching with Nginx
date: 2018-03-17 15:08:16
tags: [Caching, Nginx]
---

## Problem

过去几周, 随着公司产品的用户量不断增加, 每当高峰期 API 服务器(只有 1 个)总会因为用户请求数量过多导致响应时间过长, 客户端等待超时主动断开链接, 最终大部分用户的请求都没有得到正常响应. 

经过分析发现 API 服务器响应时间过长的原因在于每次客户端请求接口时 API 程序都要向数据库发送查询语句, 且查询返回的数据量相当大, 因此第一反应是优化数据库查询 SQL 和给 API 程序加上数据库查询的缓存, 但为了在短时间内尽快恢复后台 API 服务, 且考虑到该项目客户端对接口数据的实时性并没有很大的要求, 因此决定先使用 Nginx 对接口的返回结果进行缓存, 后面再进行 SQL 优化和对 API 程序的数据库查询结果进行缓存.

## Solution

以下是 Nginx 的初始配置: (域名等信息已做了修改, 去掉无关的配置信息)

```nginx
log_format example '[$time_local]\t$remote_addr\t$upstream_addr\t"'
				   '$http_user_agent"\t"$http_x_forwarded_for"\t"$request"\t'
				   '$status\t$body_bytes_sent\t"$http_referer"';

server {
	server_name api.example.cn;
	listen 8090;

	gzip on;
	access_log /var/log/nginx/example-access-8090.log example;
	error_log  /var/log/nginx/example-error-8090.log;

	location / {
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header REMOTE-HOST $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_pass http://localhost:9898$request_uri;
	}
}
```

最初对 Nginx 的应用实际很简单, 就是单纯用来做端口转发, 把外部对 8090 的端口访问转发到本地的 9898 端口.

为了让 Nginx 对上游服务器的响应结果进行缓存, 需要使用两个指令 `proxy_cache_path` 和 `proxy_cache`, `proxy_cache_path` 指令定义了缓存存放的地址及缓存大小等信息, `proxy_cache` 指令真正启用接口缓存.

以下是修改后的 Nginx 配置: 

```nginx
log_format example '[$time_local]\t$remote_addr\t$upstream_addr\t"'
				   '$http_user_agent"\t"$http_x_forwarded_for"\t"$request"\t'
				   '$status\t$body_bytes_sent\t"$http_referer"\t$upstream_cache_status';

proxy_cache_path /tmp/caches/nginx levels=1:2 keys_zone=example:1m max_size=1g inactive=5m use_temp_path=off;

server {
	server_name api.example.cn;
	listen 8090;

	gzip on;
	access_log /var/log/nginx/example-access-8090.log example;
	error_log  /var/log/nginx/example-error-8090.log;

	location / {
		proxy_cache example;
		proxy_cache_valid 200 10m;
		proxy_cache_lock on;
		proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;

		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header REMOTE-HOST $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_pass http://localhost:9898$request_uri;
	}
}
```

`proxy_cache_path` 指令中:
- `/tmp/caches/nginx` 指定了缓存数据被存放的文件目录路径, 这是因为 Nginx 会使用多个文件保存缓存数据, 这些文件会保存在这个目录下;
- `levels=1:2` 指定了缓存数据文件的目录层次, 这里指定了 Nginx 使用 2 层目录来存放数据文件 (也是大部分情况下推荐的层次数), 如果不指定 Nginx 将会把所有数据文件都放在以上指定的文件目录 `/tmp/caches/nginx` 下;
- `keys_zone=example:10m` 指定了一个名为 `example` 的内存区域用来存放缓存的元数据 (如缓存的 `key`), 虽然 Nginx 把缓存数据放在文件中, 但是在内存中保留缓存的 `key` 值可以快速判断一个数据有没有被缓存命中; 其中 `1m` 表示为此分配的内存大小, `1m` 的内存可以存放大概 8000 个 `key`;
- `max_size=1g` 指定了缓存的数据文件最多达到 `1g`, 如果不指定的话, 缓存文件可能 (只是可能, 因为缓存会失效) 会一直增长直到物理硬盘的容量;
- `inactive=5m` 指定了如果缓存的数据 5 分钟内都没有被访问, 就会被移除, 此时不会管该数据的过期时间被设置为多久, 因为此处已将该缓存数据标记为 "不活跃"; 
- `use_temp_path=off` 指定了让 Nginx 直接把缓存的数据文件写到上面定义的 `/tmp/caches/nginx` 目录下, 而不是先写到一个临时文件, 这可以避免没有必要的文件复制 (先写到临时文件, 再复制到指定的目录下);

接下来使用 `proxy_cache` 指令真正启用缓存, 其中:
- `proxy_cache example` 指定该接口使用上面定义的名为 `example` 的内存空间;
- `proxy_cache_valid 200 10m` 指定只有上游服务器返回的 `http` 状态码为 `200` 的时候, 该结果才会被缓存, 且缓存时间为 10 分钟, 如果不指定 `200`, 则上游服务器如果返回 `500` (服务器内部错误), 该结果也会被缓存;
- `proxy_cache_lock on` 指定了如果有多个客户端同时请求相同 `key` 值的数据, 那么只有其中一个请求会被发送到上游服务器, 其他的请求会等待, 然后直接使用该结果;
- `proxy_cache_use_stale` 一行则指定了当上游服务器出现故障 (`error`), 超时 (`timeout`), 或者返回状态码是 500, 502, 503, 504 的时候, Nginx 使用已经缓存的数据 (无论是否已经过期) 先 "顶上" 返回给客户端;

> 其中 `proxy_cache_use_stale` 指令非常适用于本项目, 因为只有一台 API 服务器 (即 Nginx 的上游服务器), 在更新代码重新部署程序的时候 API 服务完全不可用, 使用 `proxy_cache_use_stale` 指令后, 在重新部署 API 程序的过程中, Nginx 可以使用缓存的数据 (甚至是过期的数据) 返回, 过期 (expired) 的数据在 Nginx 缓存中称为 "脏 (stale) 数据", 脏数据即使已经过期, 但仍然可能会被返回给客户端, 而且这种情况下不会被缓存管理器清理掉.

## Result

为了观察缓存确实起作用, 还对 `log_format` 指令进行修改, 在最后添加了 `upstream_cache_status` 变量, 可以看到哪些请求命中缓存 (`HIT`), 哪些请求没有命中 (`MISS`), 以下是其中一部分日志数据:

```text
[17/Mar/2018:17:33:41 +0900]	1.75.4.100	127.0.0.1:9898	"okhttp/3.4.2"	"-"	"GET /search/video?q=%E3%83%88%E3%82%A5%E3%83%AF%E3%82%A4%E3%82%B9&t=video&size=20&pageToken= HTTP/1.1"	200 4143	"-"	MISS
[17/Mar/2018:17:33:41 +0900]	121.41.117.242	-	"Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Win64; x64; Trident/5.0)"	"-"	"GET /music/discovery HTTP/1.1"	200 9383	"-"	HIT
[17/Mar/2018:17:33:41 +0900]	1.75.199.178	-	"okhttp/3.4.2"	"-"	"GET /music/mfmTackList?playlistId=352&start=0&rows=20 HTTP/1.1"	200 1537	"-"	HIT
[17/Mar/2018:17:33:42 +0900]	122.218.113.139	-	"okhttp/3.4.2"	"-"	"GET /search/searchAllInOne?q=%E5%AE%89%E5%AE%A4%E5%A5%88%E7%BE%8E%E6%81%B5&size=20 HTTP/1.1"	200 3719	"-"	HIT
[17/Mar/2018:17:33:42 +0900]	121.119.112.66	172.24.49.213:9898	"okhttp/3.4.2"	"-"	"GET /search/video?q=%E3%81%97%E3%82%83%E3%81%AAed&t=video&size=20&pageToken=CBQQAA HTTP/1.1"	200 4499	"-"	MISS
[17/Mar/2018:17:33:42 +0900]	1.75.251.52	-	"okhttp/3.4.2"	"-"	"GET /discovery/latest?type=Japan&offset=40&limit=20 HTTP/1.1"	200 2385	"-"	HIT
[17/Mar/2018:17:33:42 +0900]	61.207.179.98	-	"okhttp/3.4.2"	"-"	"GET /music/searchKeyword?platform=android&app_name=musicfm&app_lang=zh-CN&app_platform=android&app_version=3.3.6 HTTP/1.1"	200 1078	"-"	HIT
[17/Mar/2018:17:33:42 +0900]	182.251.141.47	[::1]:9898	"okhttp/3.4.2"	"-"	"GET /search/video?q=%E3%83%9C%E3%82%AB%E3%83%AD%20%E3%83%94%E3%82%A2%E3%83%8E&t=video&size=20&pageToken=CDwQAA HTTP/1.1"	200 5068	"-"	MISS
[17/Mar/2018:17:33:42 +0900]	126.234.120.45	127.0.0.1:9898	"okhttp/3.4.2"	"-"	"GET /search/video?q=%E4%B8%AD%E5%B3%B6%E3%81%BF%E3%82%86%E3%81%8D&t=video&size=20&pageToken= HTTP/1.1"	200 4038	"-"	MISS
[17/Mar/2018:17:33:42 +0900]	221.121.223.148	127.0.0.1:9898	"okhttp/3.4.2"	"-"	"GET /search/searchAllInOne?q=%E4%BA%88%E5%91%8A&size=20 HTTP/1.1"	200 3648	"-"	MISS
```

最后一个字段可以看到缓存的命中情况, `HIT` 为命中缓存, `MISS` 为没有命中缓存, 如果上游服务器挂了并且设置了 `proxy_cache_use_stale` 指令, 那么最后一个字段为 `STALE`.
