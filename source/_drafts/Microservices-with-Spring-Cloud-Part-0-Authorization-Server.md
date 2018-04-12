---
title: Microservices with Spring Cloud Part 0 - Authorization Server
date: 2018-03-26 15:14:33
tags: [Spring, Spring Cloud, Microservices, Kotlin]
---

> 本系列文章是记录使用 Spring Boot 2 和 Spring Cloud Finchley.M8 (截至此文写作时都是最新版本) 搭建一个微服务系统基本代码框架的过程和期间遇到的问题及解决办法.
> 这是本系列文章的第 0 篇, 感谢阅读.

## Background

微服务架构具有非常典型的 "分而治之" (Divide and Conquer) 思想, 其中的每个 "服务" 独立开发, 只负责单一的职责, 通过 ["注册服务" (Service Registry)](http://microservices.io/patterns/service-registry.html) 将本服务的功能提供给其他服务使用, 通过 ["发现服务" (Service Discovery)](http://microservices.io/patterns/client-side-discovery.html) 使用其他服务提供的功能, "注册服务-发现服务" 把所有服务关联起来, 为终端用户提供完整的功能. 

一个可靠的微服务架构系统需要完善的权限管理机制, 本文将使用 Spring Security 构建一个授权服务器, 作为微服务架构系统的其中一个 "服务", 它将负责认证用户的身份和为用户访问后续其他服务提供一个通用的 Token .

## Prerequisites

本文中所使用的环境:
- OS: macOS High Sierra
- Java SDK: 1.8
- Kotlin: 1.2.20
- Spring Cloud: Finchley.M8
- Maven: 3.3.9

## Show Me the Code

### Dependency Management

Spring Cloud 项目一般包含非常复杂的依赖关系 (Dependencies), 一旦依赖关系中出现版本不匹配, 编译时虽然没有问题, 但运行时会出现各种莫名其妙的错误; 为了帮助开发者管理这些依赖, Spring Cloud 提供了一个 packaging 类型为 pom 的 Maven 项目, 其中定义了 Spring Cloud 相关的依赖的版本, 使用 Maven 作为构建工具的项目只需要继承这个 pom 项目, 指定所使用的 Spring Cloud 主版本, 其他的依赖库的版本会自动选择. 

> Spring Cloud 也为使用 Gradle 作为构建工具的开发者提供了类似的插件, 只要启用该插件 Spring Cloud 所需要的依赖也会自动选择合适版本

一个微服务架构的系统包含多个服务, 为了保证各个服务使用的依赖库的版本一致, 这里将创建一个 Maven 根项目, 该项目的作用与 Spring Cloud 提供的一样, 只不过此项目先继承 Spring Cloud 所提供的 pom 项目, 然后定义除了 Spring Cloud 以外的依赖的版本, 最后在此项目下建立多个子模块 (Module) , 每个模块的依赖包版本从根项目继承而来;

以下是根项目的 `pom.xml` 文件:

{% gist 7c3e74645786b4399167bdd1b1035ce5 %}

> 其中使用了 `spring-boot-maven-plugin` 插件, 该插件能够方便地在命令行使用 `mvn spring-boot:run` 启动 Spring Boot 项目, 但有时候为了在 IDE 中调试代码, 需要使用 IDE 的调试器连接到从命令行运行的 Java 程序, 因此在根项目的 `pom.xml` 文件中定义了一个 `jvm` 属性 `jvmArguments`, 并且作为启动参数传递给 `spring-boot-maven-plugin` 插件

有了以上的 Maven 项目, 就可以让各个服务的代码模块继承它, 项目相关的依赖 (如 Kotlin 版本, Java 版本等) 的版本也能保证一致性;

以下是授权服务器 (Authorization Server, AS) 模块的 Maven 项目的 `pom.xml` 文件:

{% gist cfc18ea1f4346a75318a4bb037f8d649/72218e3b390c2097e33585003cb878bacb618d8b %}

> 其中 `jvmArguments` 属性覆盖了父项目的同名属性, 这是因为本地调试时, 微服务系统的多个模块可能需要同时运行, 如果每个模块都在命令行启动并且需要使用 IDE 的调试器连接进行调试的话, 那么启动的 Java 进程需要指定端口监听 IDE 调试器的连接, 就是 `jvmArguments` 中的 `address=5005`, 为了区分各个模块监听调试器的端口号, 子模块需要覆盖 `jvmArguments` 属性, 并修改 `address` 的值, 这也是根项目中的 `jvmArguments` 属性为空的原因

### Application Configuration


