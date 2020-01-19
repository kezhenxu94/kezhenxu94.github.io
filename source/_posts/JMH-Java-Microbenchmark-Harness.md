---
title: JMH - Java Micro-benchmark Harness
date: 2020-01-18 22:01:19
updated: 2020-01-18 22:01:19
tags:
  - Java
  - Performance
---

# 如何使用 JMH 编写 Java 基准测试

JMH 是 Java Micro-benchmark Harness (Java 微基准测试工具) 的简称; 它能够帮助我们**正确**实现 Java 微基准测试, 本教程会介绍如何使用 JMH 来编写和运行 Java 微基准测试;

## 为何 Java 微基准测试难

编写基准测试来准确测量大型应用中的某一部分是很困难的; JVM 或底层硬件的很多优化可能会在基准测试单独执行你的组件的时候起作用, 但是当你的组件在现实中作为大型应用中的一个部分运行时, 这些优化可能就不会奏效; 实现欠佳的微基准测试可能让你错误地觉得你的组件性能比实际上要好; 由于 JMH 的作者和实现 Java 虚拟机的人是同一批人, 所以他们很明确知道究竟要如何才能进行正确的基准测试; 

编写一个正确的 Java 微基准测试通常需要先禁用 JVM 和硬件的优化, 因为这些优化可能在测试运行时奏效, 但在生产环境下可能并不生效; 这就是 JMH 帮助我们做的事;

## 快速开始 JMH 测试

开始 JMH 测试最简单的方式就是通过 JMH 的 Maven 原型来生成一个 JMH 项目. JMH 的 Maven 原型会生成一个 Java 工程, 其中有一个演示用的基准测试 Java 类, 以及一个 `pom.xml` 文件. `pom.xml` 文件包含了编译构建 JMH 基准测试需要的依赖;

以下是生成 JMH 工程模版所需要使用的 Maven 命令:

```shell
mvn archetype:generate \
  -DinteractiveMode=false \
  -DarchetypeGroupId=org.openjdk.jmh \
  -DarchetypeArtifactId=jmh-java-benchmark-archetype \
  -DgroupId=io.github.kezhenxu94 \
  -DartifactId=benchmark-test \
  -Dversion=1.0
```

## 编写基准测试

简单起见, 我们直接复用生成的基准测试类, 把我们需要进行基准测试的代码放到 `testMethod` 方法内:

```java
package io.github.kezhenxu94;

import org.openjdk.jmh.annotations.Benchmark;

public class MyBenchmark {

    @Benchmark
    public void testMethod() {
        int a = 1;
        int b = 2;
        int sum = a + b;
    }

}
```

注: 以上就是一个典型的 **"实现欠佳"** 的基准测试的例子, 因为 JVM 发现 `sum` 这个变量实际没有被使用, 因此 JVM 可能会直接消除对 `sum` 进行求值的运行, 甚至 JVM 的 Dead Code 优化还可能将整个方法内的代码都优化掉;
不过我们暂且不管, 先看看如何构建和运行再说;

## 构建和运行

```shell
mvn clean install
```

命令运行完成后会在 `target` 文件夹下生成 `benchmarks.jar` 文件, 其中包含了你自己写的测试代码, 以及运行 JMH 需要的依赖, 是一个完全自包含的 `jar` 包 (fat jar);

有了 `benchmarks.jar` 文件之后, 就可以直接运行起来了:

```shell
java -jar target/benchmarks.jar
```

运行基准测试耗时比较久, JMH 会进行一些 "预热" 操作, 还会运行多个迭代, 确保基准测试的结果稳定; 如果你运行的次数越多, 得到的结果就越准确;

> 运行基准测试期间, 你应该尽可能不要操作电脑, 尽可能关闭所有其他的应用, 如果此时你还在运行其他应用的话, 这些应用会抢占 CPU 资源, 导致你的基准测试效果偏差;

## 基准测试模式 Mode

JMH 能够在不同的模式下进行基准测试, 基准测试的类型表明你想进行测量的方向; JMH 提供了如下几种测试模式:

 模式 | 备注
 -------------------------- | --- 
 吞吐量(throughput) | 测量了每秒内能进行的操作次数; 也就是说基准方法每秒内能运行多少次 
 平均时间(average time) | 测量了基准方法每次运行消耗的平均时间
 采样时间(sample time) | 测量了基准方法的运行时间, 包括最大运行时间, 最小运行时间等
 单次运行时间(single shot time) | 测量了基准方法运行一次需要的时间, 这是用来测试 "冷启动"(JVM 没有预热的情况) 的最佳模式
 所有(all) | 以上所有都进行测量

默认的测试模式是吞吐量; 可以使用注解 `BenchmarkMode` 来声明你要进行的基准测试模式;

当测试模式是吞吐量的时候, 你还可以配合注解 `OutputTimeUnit` 来指定你想测试的时间单位, 比如你想测试每分钟的吞吐量, 可以使用 `@OutputTimeUnit(TimeUnit.MINUTES)`;

## 基准测试状态 State

有时候我们的基准测试需要一些初始化操作, 但是并不想基准测试把这些初始化操作时间也测试进去, 这时候可以通过提供一些 "状态" 类, 然后 JMH 会把这些状态类的实例传递到基准方法中:

```java
@State(Scope.Thread)
public static class MyState {
    public int a = 1;
    public int b = 2;
    public int sum ;
}

@Benchmark
public void testMethod(MyState state) {
    state.sum = state.a + state.b;
}
```

其中 `MyState` 就是用来封装我们需要的初始状态的类, 在这个类中的操作不会被 JMH 测量;

一个类要成为状态类需要符合以下几个要求:

- 类修饰符必须是 `public`;
- 如果是内部类, 必须是静态的;
- 必须拥有无参构造函数;

### 状态域 Scope

一个状态对象可以被复用, 但是复用的范围是由状态域指定的; 有几种域可供选择, 都可以通过注解 `@State` 的参数指定:

 域 | 说明
 -- | --
 线程(Thread) | 每一个运行基准测试的线程都会创建一个自己的状态对象
 组(Group) | 每一个运行基准测试的线程组都会创建一个状态对象
 基准测试(Benchmark) | 一个基准测试中的所有线程都共用一个状态对象

### 状态对象 `@Setup` 和 `@TearDown`

有 JUnit 单元测试经验的朋友很容易理解这两个注解的作用, 在状态对象中, 由于状态也有生命周期, 因此可以使用这两个注解来将状态对象的方法设置为初始化和释放资源的方法; 这些生命周期方法都不会被 JMH 进行测量;

`@Setup` 和 `@TearDown` 也接收参数, 参数取值和含义分别如下:

 取值 | 说明
 ---- | ----
 Level.Trial | 一次完整的运行, 即一次 Fork 运行, 包括预热(warm up), 和所有基准测试 iterations
 Level.Iteration | 基准测试的每个 iteration
 Level.Invocation | 基准方法每次调用

## 如何编写正确的基准测试

正如文章开头所说, 有一些很常见的陷阱容易导致基准测试不能达到实际的效果, 如 JVM 对循环的优化, Dead Code 优化;

### 避免 Dead Code 优化

```java
public class MyBenchmark {
    @Benchmark
    public void testMethod() {
        int a = 1;
        int b = 2;
        int sum = a + b;
    }
}
```

以上基准测试中, JVM 发现对 `sum` 的求值没有被使用到, 会将 `int sum = a + b;` 优化掉, 进而发现 `a` 和 `b` 也没有被使用到, 将他们也优化掉, 基准测试最终测试的方法是空方法;

要避免 JVM 对 Dead Code 的优化, 我们可以将计算结果返回基准方法, 这样 JVM 就难以决定调用者是否会使用这个返回值了, 再加上 JMH 会用一些巧妙的方法来"骗过" JVM, 让它以为返回值被使用了;

另一种避免 Dead Code 优化的方式是使用 JMH 提供的"黑洞"技术, 在基准方法参数中增加 `Blackhole blackhole`, 然后在方法内使用 `blackhole.consume` 来"使用"这些原来没有用到的值;

```java
public class MyBenchmark {
   @Benchmark
   public void testMethod(Blackhole blackhole) {
        int a = 1;
        int b = 2;
        int sum = a + b;
        blackhole.consume(sum);
    }
}
```

### 避免常量合并

常量合并是 JVM 常用的另一个优化点; 基于常量的计算通常会产生常量的结果, 不管被运行多少次, JVM 可能会检测到这一点, 并且直接将表达式求值的地方替换成常量; 避免常量合并的方法可以利用前面提到的 [状态对象](#基准测试状态-State)

> 参考: http://tutorials.jenkov.com/java-performance/jmh.html#getting-started-with-jmh
