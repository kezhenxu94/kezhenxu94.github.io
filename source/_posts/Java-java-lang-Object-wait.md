---
title: 'Java java.lang.Object#wait'
tags:
  - Java
  - Thread
  - Concurrent
date: 2018-04-11 11:31:04
updated: 2018-04-11 11:31:04
---


## Why `java.lang.Object`

从 `wait` 方法的完整方法签名可以看出, `wait` 方法是定义在 `java.lang.Object` 类中的方法; 众所周知, 在 Java 中 `Object` 类是所有类的父类, 要了解 Java 类库的设计者把 `wait` 方法定义在这样一个超级父类中的原因, 就先要了解 **等待集合 (Wait Sets)** 的概念;

## Wait Sets

在 Java 中, 所有的对象都关联了一个**等待集合**, **等待集合**是一个线程的集合, 在这个集合中的所有线程都在等待着某个事件的发生;

从 Java 语言层面, 修改一个对象关联的**等待集合**的操作只有通过调用该对象的 `wait`, `notify` 或 `notifyAll` 方法, 一个拥有该对象锁的线程调用其 `wait` 方法将会把自己放到该对象的等待集合中, 而调用该对象的 `notifyAll` 方法将会把该对象关联的等待集合中的所有线程唤醒并移出等待集合;
	
由此可见, 上述 "等待集合中的所有线程都在等待某个事件的发生" 中的 "事件" 就是 "其他线程调用该对象的 `notify` 或 `notifyAll` 方法 (也可能是该线程的中断异常);

因为所有对象都关联了一个等待集合, `wait`, `notify`, `notifyAll` 是修改等待集合的唯一方法, 所以所有对象也都必须有这三个方法, 将 `wait`, `notify`, `notifyAll` 方法定义在 `Object` 类中似乎也就合理了;

> 关于 Wait Sets 的更多详情, 可以查看 [Java 语言规范文档](https://docs.oracle.com/javase/specs/jls/se8/html/jls-17.html#jls-17.2)

## Using `wait` and `notify`

如前所述, `wait`, `notify` 和 `notifyAll` 方法是修改等待集合中的线程的状态的方法: 

- `a.wait()`: 将当前线程放到对象 `a` 的等待集合中;
- `a.notifyAll()`: 将对象 `a` 等待集合中的所有线程唤醒;
- `a.notify()`: 将对象 `a` 等待集合中的随机一个线程唤醒;

### Producer-Consumer

从 `wait` 和 `notify` 方法对线程产生的影响来看, 他们的作用更多是作为线程之间的协调机制, 关于线程之间的协调在 "生产者-消费者" 场景下比较常见, 以下将使用 `wait` 和 `notifyAll` 方法实现一个最简单的 "生成者-消费者" 示例;

> 完整的示例代码可以在 [这里](https://github.com/kezhenxu94/blog-code/tree/master/Java-java-lang-Object-wait) 找到

### Producer

生产者的代码如下:

{% include_code lang:java Java-java-lang-Object-wait/src/me/kezhenxu94/blog/IntegerProducer.java %}

其中需要注意的是:

- 在调用 `resources.wait()` 时, 当前线程必须拥有 `resources` 的锁, 否则将抛出 `IllegalMonitorStateException` 异常, 这就是在调用 `resources.wait()` 方法时用 `synchronized (resources)` 同步代码块包围的原因, 确保在进入该代码块时当前线程拥有 `resources` 的锁;

- 当线程从 `resources.wait()` 处接着往下执行的时候, 即被其他线程通过 `resources.notifyAll()` 方法唤醒的时候, 生产者并没有马上生产资源, 而是需要再次检查资源是否已经满了, 这是因为当消费者消费完资源调用 `resources.notifyAll()` 之后, 等待集合中的所有线程会重新开始竞争 `resources` 的锁, 此时可能是另外的生产者获得了锁并且生产资源使资源满了, 这就是需要使用 `while (resources.isEmpty())` 包围 `resources.wait()` 的原因;
