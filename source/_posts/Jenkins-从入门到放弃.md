---
title: Jenkins 从入门到放弃
tags:
  - Jenkins
  - Others
  - DevOps
date: 2018-05-20 15:33:59
updated: 2018-05-20 15:33:59
---



## Jenkins 是什么

Jenkins 是一个**自动化**服务器, 他可以用来将与**构建**, **测试**, **交付**和**发布**等相关的各种各样任务自动化. 

根据经验, 一项任务要想能够自动化, 其操作步骤应该是相对固定的, 可重复的. 例如, 如果你想对代码进行单元测试, 其步骤通常都是更新最新代码, 运行单元测试脚本/命令, 对于使用 git 作为代码版本控制系统, maven 作为构建工具的项目来说, 步骤通常是:

```shell
$ git pull
$ mvn test
```

对于运行单元测试来说, 以上两个命令还不至于导致 Jenkins 的发明. 由于软件系统开发阶段的周期从编码到交付的流程远不止一两个命令, 因此才有了 Jenkins. 

## Jenkins 的一些术语

如上所述, Jenkins 是一个自动化服务器, 并且能够被自动化的任务其步骤相对都比较固定, 因此便可以将自动化的流程抽象为一个类似现实生活中**流水线**的概念, 在 Jenkins 中这样的流水线被称为 **Pipeline(管道)**; 流水线上有多个操作阶段, 这些阶段一个接一个按序执行, 在 Jenkins 这些步骤被称为 **Stage**; 作为一个通用工具, Jenkins 无法保证所有项目的每个阶段都只有一个任务要做, 因此对每个 Stage 又分为多个步骤, 在 Jenkins 中称为 **Step**, 每个阶段包含一个或多个 Step. 

可以将一个项目的**单元测试**, **集成测试**, **构建**, **部署**整个流程当作一个 "Pipeline", 其中的**单元测试**, **集成测试**等等都看作一个一个 "Stage", 而单元测试中, 类似上面提到的两个命令 `git pull` 和 `mvn test` 就是 Step.

## 入门示例

本文将使用一个简单的 Spring MVC 项目, 演示如何使用 Jenkins 构建你的第一个 Pipeline.

对于本文中使用的 Spring MVC 项目, 可以直接在[此处](https://github.com/awesome-playground/jenkins-playground)获得.

示例项目所使用的环境:

- 操作系统: macOS High Sierra 10.13.4

- Jenkins: 2.122

- Docker: Version 18.03.1-ce-mac65 (24312)

### 获取 Jenkins

Jenkins 可以通过 Docker 安装, 同时, 由于 Jenkins 是自包含 (Self-Contained) 的 (不依赖其他乱七八糟的东西) 一个项目, 因此你也可以下载 Jenkins 的 war 包, 在安装了 JRE 的系统上都可以完美运行. 可以[在此处下载 Jenkins.war 包](https://jenkins.io/download/), 选择 "Generic Java package (.war)" 完成下载即可.

### 运行 Jenkins

下载完成后, 切换到 jenkins.war 所在目录, 使用以下命令运行 Jenkins:

```shell
$ java -jar jenkins.war --httpPort=8080
```

由于 Jenkins 提供了一个 Web 应用来让我们操作, 因此其必须占用一个 http 端口, 以上的 `--httpPort=8080` 指定了让该 Web 应用监听的端口; Jenkins 第一次启动的时候需要下载一些元数据, 因此必须保证你有稳定的网络连接, 否则可能导致启动失败或启动后无法正常运行.

待命令运行稳定后 (视机器性能, 可能需要几十秒到几分钟不等), 如果命令行没有报错, 就可以打开浏览器定位到 http://127.0.0.1:8080 (如果你改了端口号， 请对 URL 做相应修改).

### 初始化 Jenkins

第一次运行 Jenkins 的时候, 在命令行中可以看到类似下面的输出, Jenkins 为我们生成了一个管理员密码, 在第一次登陆 Jenkins Web 应用的时候需要使用该密码登陆;

```text
*************************************************************
*************************************************************
*************************************************************

Jenkins initial setup is required. An admin user has been created and a password generated.
Please use the following password to proceed to installation:

9fa5ba5b98c946ba9fe84a93e1987d8f

This may also be found at: /Users/kid/.jenkins/secrets/initialAdminPassword

*************************************************************
*************************************************************
*************************************************************
```

{% asset_img please-wait.png Jenkins 初始化中 %}

{% asset_img unlock-jenkins.png 解锁 Jenkins %}

输入管理员密码之后 Jenkins 会有一个初始化的过程.

### 选择 Jenkins 插件

Jenkins 并不自己完成流水线上的所有操作, 而是将很多操作交给其他(更擅长的)工具完成, Jenkins 本身通过插件(Plugin)的形式集成它们, 因此此时 Jenkins 会让你选择需要使用的插件, 好在 Jenkins 默认选择的插件已经足够我们这个示例使用了, 因此我们只需要选择 Jenkins 给我们建议的插件就好了:

{% asset_img customize-jenkins.png 自定义 Jenkins %}

接下来 Jenkins 会安装一系列插件, 静候其完成.

### 创建管理员账号

第一次运行 Jenkins 时生成了一个超长管理员账号, 为了避免每次都输入这么长的密码和对权限进行细化管理, 此时还要创建一个管理员账号:

{% asset_img create-first-admin-user.png 创建管理员账号 %}

按照提示填写完成, 选择 "Continue as admin" 进入下一步.

{% asset_img instance-config.png 配置 URL %}

此时会让我们填写一个 URL 地址, 该 URL 地址就是专门给刚刚创建的用户打开的, 这样就能让不同的用户有相对独立的操作空间, 此时我们暂时不需要这样的功能, 选择 "Not now".

完成!!! 选择 "Starting using Jenkins".

{% asset_img jenkins-is-ready.png Jenkins 准备完成 %}

### 创建工作项

在主操作界面上选择 "New Item" 新建一个工作项, 选择 "Multibranch Pipeline":

{% asset_img home-page.png Jenkins 主界面 %}

{% asset_img enter-item-name.png 输入项目名称 %}

### 添加源代码

选择 Branch Sources 标签下的 Add source, 由于这个项目我们是托管在 GitHub 上的, 这里选择 GitHub, 其他平台类似.

这里推荐我们提供一个凭证 Credential, 由于这个项目是一个公开的项目, 即使没有登陆的用户也可以访问到, 因此我们选择不提供凭证, 直接输入 Owner, Owner 可以根据 GitHub 的地址得到, 例如 GitHub 地址是 https://github.com/awesome-playground/jenkins-playground 的项目, 其 Owner 就是 awesome-playground, 这正是本示例项目的地址, 直接输入 awesome-playground, 然后按下 tab 键切换焦点, Jenkins 会去 GitHub 找到该 Owner 下的仓库, Repository 下拉框就出现了可供选择的项目.

{% asset_img add-source.png 添加源代码 %}

选择 jenkins-playground, 其他的保持默认即可, 后面有需要再解释其含义.

### 提供 Jenkinsfile 配置

切换到 Build Configuration 标签页, 可以看到 Mode 是 by Jenkinsfile, 也就是说该工作项目的运作模式是通过 Jenkinsfile 指定的;

你可以在前面新建工作项目的时候不选择 Multibranch Pipeline, 而是选择 Freestyle Project, 然后在界面上点点点创建一个工作流, 但是使用界面的缺点是不可重复, 如果项目有多个开发人员/测试人员需要在本地运行 Jenkins 服务器, 那么可能因为配置不一样导致运行结果不一致, 因此我们这里选择使用 Jenkinsfile 来指定这个工作流的运行;

Jenkinsfile 是一个纯文本文件, 推荐的最佳实践是将该文件也添加到版本控制系统中, 好在项目代码变更时同时更新 Jenkinsfile, 并且让持续集成/交付的演变也能被跟踪. 意料之中的是在我们的 jenkins-playground 项目中已经包含了 Jenkinsfile 文件了, Jenkins 默认会在版本控制项目的根目录读取文件名为 Jenkinsfile 的文件来运行这个项目, 如果你的配置文件名不是 Jenkinsfile, 那就要通过 Script Path 指定你自己的配置文件:

{% asset_img script-path.png 配置脚本文件路径 %}

> Jenkinsfile 的配置说明见[👇 Jenkinsfile 配置说明](#Jenkinsfile-配置说明)

{% asset_img scan-repo.png 扫描 Repo %}

Jenkins 扫描 GitHub 上的 Repo, 查找 Jenkinsfile, 一切 OK 之后, 就开始 build 了, 可以在项目列表中点击该项目中的 Last Success 或 Last Failure 旁边的 # 数字, 进入项目最近一次 Build 的详情, 然后在左侧选择 Console Output 查看构建输出:

{% asset_img item-list.png 项目列表 %}

{% asset_img console-output.png 控制台输出 %}

### Jenkinsfile 配置说明

本项目中的 Jenkinsfile 文件内容如下:

```jenkinsfile
pipeline {
  agent {
    docker {
      image 'maven:3.3.3'
    }
  }
  stages {
    stage('Unit test') {
      steps {
        sh 'mvn test'
      }
    }
    stage('Build') {
      steps {
        sh 'mvn package'
      }
    }
  }
}
```

Jenkinsfile 文件使用[**领域特定语言(Domain-Specific Language, DSL)**](https://en.wikipedia.org/wiki/Domain-specific_language)来声明 Pipeline 的运作, 这种模式称为声明式(Declarative) Pipeline; 如上所示, DSL 的语法非常简单:

`pipeline`: 声明了一个 pipeline, 因为我们这个项目需要使用 maven, 我们不想在本地安装 maven, 因此希望让 [Docker](https://www.docker.com) 来运行 maven 命令, 因此指定了该 pipeline 的一个 agent (代理) 为 `docker`, 并指定了需要的容器镜像是 maven, docker tag 是 3.3.3;

> 关于 Docker 的更多文档请查看 [Docker 官方文档](https://docs.docker.com)

- `stages`: 如上所述, Jenkins 将可重复的流水线分为多个 Stage, 此处就声明了该项目包含的阶段, 这里有两个阶段;

- `stage('Unit test')`: 声明了第一个阶段的单元测试, Unit test, 该阶段只有一个步骤, 只需要执行一个命令 `mvn test`;

- `stage('Build')`: 类似 `stage('Unit test')`;
