---
title: 使用 Nginx 进行负载均衡
tags:
  - Load Balancing
  - Nginx
date: 2018-04-09 14:53:07
updated: 2018-04-09 14:53:07
---

## Problem

使用 Nginx 进行负载均衡.

## Show Me the Code

```nginx test.conf
log_format example '[$time_local]\t$remote_addr\t$upstream_addr\t"'
				   '$http_user_agent"\t"$http_x_forwarded_for"\t"$request"\t'
				   '$status\t$body_bytes_sent\t"$http_referer"';

upstream app {
	server api1.example.com:8090;
	server api2.example.com:8090;
	server api3.example.com:8090;
}

server {
	server_name api.example.com;
	listen 8090;

	gzip on;
	access_log /var/log/nginx/example-access-8090.log example;
	error_log  /var/log/nginx/example-error-8090.log;

	location / {
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header REMOTE-HOST $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_pass http://app$request_uri;
	}
}
```

其中:
- upstream 指令定义了一个服务器组 `app`;
- 该服务器组 `app` 下有三个服务器, `api1.example.com:8090`, `api2.example.com:8090`, `api3.example.com:8090`;
- 在实际的请求转发时, 使用了 `http://app`, 此时的请求会被转发到服务器组下的三个服务器, 选择服务器的算法为 "带权重的 Round-Robin" 算法;
- 默认的权重都是 1 , 可以根据服务器的实际情况, 使用 `weight=number` 指定权重, 如为三个服务器分别指定权重 "4 4 2":
```nginx test.conf
# ...
upstream app {
	server api1.example.com:8090 weight=4;
	server api2.example.com:8090 weight=4;
	server api3.example.com:8090 weight=2;
}
# ...
```
此时的请求则会被按照 4:4:2 的比例转发到三台服务器;

## Running

使用 `nginx -s reload` 重新加载配置文件.

## Result

可以在日志文件 `/var/log/nginx/example-access-8090.log` 中的第三个字段看到实际处理请求的上游服务器地址.

## Using Docker

可以在 [此处](https://github.com/kezhenxu94/blog-code/tree/master/Load-Balancing-with-Nginx) 获得 `docker-compose.yml` 文件, 使用以下命令启动 docker 容器:

```shell
$ docker-compose up
```

然后访问 http://localhost:8080 观察 Nginx 日志输出;

该 `docker-compose` 文件定义了两个 tomcat 容器, 并且使用 Nginx 在这两个 tomcat 之间做负载均衡, 可以从 Nginx 的日志中看到实际访问的上游地址在两个 tomcat 容器间随机变化;

