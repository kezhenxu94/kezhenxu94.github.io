---
title: 使用 Checkstyle 检查代码风格
tags:
  - Engineering
  - Maven
  - Code Style
date: 2018-10-20 13:58:31
updated: 2018-10-20 13:58:31
---


> "一千个读者眼中有一千个哈姆雷特".
> "一千个开发者键盘之下, 可能有一千零一种代码风格".

## 背景

> 本文所有代码可以从 [GitHub](https://github.com/kezhenxu94/demo-checkstyle) 获得.

{% asset_img 00.png Tabs vs Spaces %}

每个开发者都会有自己喜欢的代码风格, 但当多个开发者需要协作开发一个项目的时候, 如何避免产生图中这样的"圣战"呢.

[Checkstyle](https://github.com/checkstyle/checkstyle) 是一款能够帮助开发者编写遵循一定规范的 Java 代码的工具. 它默认支持 Google 的代码风格规范和 Sun 的代码风格规范, 这两种风格规范和大多数开发者平时使用的代码风格比较相近, 因此通常能够被大多数开发者接受. Checkstyle 也是高度可定制的, 可以根据自己/公司/组织的情况进行配置.

## 目标

通过本文, 你将了解到:

- 如何通过 Maven 插件, 在打包(或测试)期间自动检查代码风格;

- 如何配置自定义的代码风格规范;

- 如何忽略某种类型的代码风格检测;

- 如何在提交代码时自动检查代码风格;

## 前提

首先我们先使用 Maven 创建一个示例项目, 下文基于该项目进行讲解:

```shell
$ mvn archetype:generate \
		-DgroupId=me.kezhenxu94.demo \
		-DartifactId=checkstyle \
		-DarchetypeArtifactId=maven-archetype-quickstart \
		-DinteractiveMode=false
```

## 方案

### 使用 Maven 插件进行风格检查

Checkstyle 提供了 Maven 构建工具的插件, 支持在构建期间对代码风格进行检查, 为了在 Maven 中集成 Checkstyle, 需要在 `pom.xml` 文件的 `<build>` / `<plugins>` 节点下, 增加 Checkstyle 的插件:

```xml pom.xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-checkstyle-plugin</artifactId>
  <version>3.0.0</version>
</plugin>
```

至此, 就可以使用 `mvn checkstyle:check` 命令进行风格检查了:

```text
mvn checkstyle:check
[INFO] Scanning for projects...
[INFO]
[INFO] ------------------------------------------------------------------------
[INFO] Building checkstyle 1.0-SNAPSHOT
[INFO] ------------------------------------------------------------------------
[INFO]
[INFO] --- maven-checkstyle-plugin:3.0.0:check (default-cli) @ checkstyle ---
[WARNING] File encoding has not been set, using platform encoding UTF-8, i.e. build is platform dependent!
[INFO] There are 11 errors reported by Checkstyle 6.18 with sun_checks.xml ruleset.
[ERROR] src/main/java/me/kezhenxu94/demo/App.java:[0] (javadoc) JavadocPackage: Missing package-info.java file.
[ERROR] src/main/java/me/kezhenxu94/demo/App.java:[7] (regexp) RegexpSingleline: Line has trailing spaces.
[ERROR] src/main/java/me/kezhenxu94/demo/App.java:[7,1] (design) HideUtilityClassConstructor: Utility classes should not have a public or default constructor.
[ERROR] src/main/java/me/kezhenxu94/demo/App.java:[8,1] (blocks) LeftCurly: '{' at column 1 should be on the previous line.
[ERROR] src/main/java/me/kezhenxu94/demo/App.java:[9,5] (javadoc) JavadocMethod: Missing a Javadoc comment.
[ERROR] src/main/java/me/kezhenxu94/demo/App.java:[9,29] (whitespace) ParenPad: '(' is followed by whitespace.
[ERROR] src/main/java/me/kezhenxu94/demo/App.java:[9,30] (misc) FinalParameters: Parameter args should be final.
[ERROR] src/main/java/me/kezhenxu94/demo/App.java:[9,43] (whitespace) ParenPad: ')' is preceded with whitespace.
[ERROR] src/main/java/me/kezhenxu94/demo/App.java:[10,5] (blocks) LeftCurly: '{' at column 5 should be on the previous line.
[ERROR] src/main/java/me/kezhenxu94/demo/App.java:[11,28] (whitespace) ParenPad: '(' is followed by whitespace.
[ERROR] src/main/java/me/kezhenxu94/demo/App.java:[11,43] (whitespace) ParenPad: ')' is preceded with whitespace.
[INFO] ------------------------------------------------------------------------
[INFO] BUILD FAILURE
[INFO] ------------------------------------------------------------------------
[INFO] Total time: 2.468 s
[INFO] Finished at: 2018-10-20T14:55:30+08:00
[INFO] Final Memory: 14M/270M
[INFO] ------------------------------------------------------------------------
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-checkstyle-plugin:3.0.0:check (default-cli) on project checkstyle: You have 11 Checkstyle violations. -> [Help 1]
[ERROR]
[ERROR] To see the full stack trace of the errors, re-run Maven with the -e switch.
[ERROR] Re-run Maven using the -X switch to enable full debug logging.
[ERROR]
[ERROR] For more information about the errors and possible solutions, please read the following articles:
[ERROR] [Help 1] http://cwiki.apache.org/confluence/display/MAVEN/MojoFailureException
```

可以看到运行结果输出了一系列 `ERROR`, 并显示 `BUILD FAILURE`, 表示代码风格检查不通过.

我们不想每次都手动执行风格检查命令, 希望在编译或打包期间, 自动运行风格检查任务, 可以将该插件任务绑定到 Maven 运行生命周期中.

```xml pom.xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-checkstyle-plugin</artifactId>
  <version>3.0.0</version>
  <executions>
    <execution>
      <id>validate</id>
      <phase>validate</phase>
      <goals>
        <goal>check</goal>
      </goals>
    </execution>
  </executions>
</plugin>
```

以上代码将 `checkstyle` 插件的 `check` 任务绑定到 Maven 的 `validate` 阶段运行. Maven 的 `validate` 任务是在编译代码任务(`compile`)之前运行的一个任务. 同理可以将其绑定到任意生命周期阶段.

### 配置自定义的代码风格规范

以上我们只是直接引入了 `checkstyle` 插件, 并没有配置相关的代码风格规范. Checkstyle 插件默认使用了 Sun 的代码风格规范, 我们可以在 `plugin` 节点中加入 `<configuration>` 节点进行相关配置.

```xml pom.xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-checkstyle-plugin</artifactId>
  <version>3.0.0</version>
  <configuration>
    <configLocation>google_checks.xml</configLocation>
  </configuration>
  <executions>
    <execution>
      <id>validate</id>
      <phase>validate</phase>
      <goals>
        <goal>check</goal>
      </goals>
    </execution>
  </executions>
</plugin>
```

以上的 `configLocation` 配置了风格规范文件路径为 `google_checks.xml`, `google_checks.xml` 是 Checkstyle 插件默认提供的两个配置之一, 另一个就是我们不指定该选项时使用的, `sun_checks.xml`.

改成 `google_checks.xml` 之后, 我们再执行 `mvn validate`, 发现校验失败, 且失败的信息与上次并不一样, 这是因为 Sun 的代码风格规范和 Google 的代码风格并不一样.

为了自定义风格规范, 我们只需要找到自带的风格规范文件, 复制一份并修改其中的配置, 并将 `configLocation` 指定为我们自己的文件即可. `google_checks.xml` 可以在 [Checkstyle 源码](https://github.com/checkstyle/checkstyle/blob/master/src/main/resources/google_checks.xml)中找到. 将其复制并存放为 `my_checks.xml` 文件.

为了测试方便, 我们把其中的 `<module name="LineLength">` 这个配置下的 `<property name="max" value="100"/>` 改成 `<property name="max" value="40"/>`, 再把 `pom.xml` 文件中的 `google_checks.xml` 改成 `my_checks.xml`

再次运行 `mvn validate` 命令, 发现校验失败, 且多了一种失败的原因:

```text
[WARN] /private/tmp/checkstyle/src/main/java/me/kezhenxu94/demo/App.java:11: Line is longer than 40 characters (found 45). [LineLength]
```

因为我们的代码有些行长度超过 40 个字符.

以上表明我们自己定义的代码风格生效.

### 忽略某种类型的代码风格检测

在所有开发人员之间统一代码风格能够保持整个项目代码风格一致, 增强可读性. 但即使是 Google 的代码风格规范也并不适用于所有情况. 有时候我们并不希望对某些代码文件进行风格检查, 常见的情况是我们引入了一些第三方的包或工具类, 这些包或工具类可能是某些个人开发者开发, 并没有上传到 Maven 中央仓库, 因此会直接拷贝其代码进入我们项目中. 这种情况下我们并不希望对他们的代码进行风格检查, 因为这样一来如果其风格不符合规范, 我们还得一个一个修改其代码. 这种情况下可以使用 Checkstyle 工具的 Supressing 功能.

在 `my_checks.xml` 文件同级目录下建立一个新的文件 `suppressions.xml`:

```xml suppressions.xml
<?xml version="1.0"?>
<!DOCTYPE suppressions PUBLIC
    "-//Checkstyle//DTD SuppressionFilter Configuration 1.2//EN"
    "https://checkstyle.org/dtds/suppressions_1_2.dtd">
<suppressions>
  <suppress checks=".*" files=".*thirdparties.*"/>
</suppressions>
```

以上配置表示, 所有包名包含 `thirdparties` 的 Java 文件都不会输出代码风格检查报告.

并在 `my_checks.xml` 文件中最后一个 `</module>` 前增加以下配置:

```xml my_checks.xml
<module name="SuppressionFilter">
  <property name="file" value="suppressions.xml"/>
  <property name="optional" value="false"/>
</module>
```

> 为了读者可以使用本文示例代码进行练习, 代码仓库中的代码在 `mvn` 生成后并不做修改, 并将以上 `thirdparties` 改为 `demo`, 使得本文示例代码能够提交到 GitHub.

### 在提交代码时自动检查代码风格

有了自动检查代码风格的工具, 有时候开发者在提交到代码仓库时, 可能会忘了执行该操作, 导致提交到代码仓库的代码是不符合代码风格规范的. 这时候可以使用 Git Hook 来保证提交前的代码是符合代码风格规范的.

Git 仓库的目录 `.git` 下, 有一个 `hooks` 文件夹, 其中放置了 Git 流中各阶段的钩子, 可以在执行相应的命令的时候被自动执行. 我们想要在执行 `git commit` 的时候, 自动进行代码风格检查, 因此复制 `.git/hooks/pre-commit.sample` 文件到 `.git.hooks/pre-commit` 文件, 在文件最后加上 `mvn validate` 命令, 执行代码风格检查. 同时, 我们还将 `my_checks.xml` 文件中的 `<property name="severity" value="error"/>` 属性值修改为 `error`, 将不符合代码风格的代码显示为 `error` 级别, 如此一来, 代码没有通过风格检测, 则提交失败, 开发者必须修改代码遵循代码风格规范.
