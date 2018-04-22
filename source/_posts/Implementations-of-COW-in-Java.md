---
title: Implementations of COW in Java
tags:
  - Java
  - Concurrent
  - Java Collection
  - Copy on Write
date: 2018-04-22 15:47:20
updated: 2018-04-22 15:47:20
---


## Background

写时拷贝 (Copy on Write, COW) 有时也叫 "隐式共享", 顾名思义, 就是让所有需要使用资源 R 的使用者共享资源 R 的同一个副本, 当其中的某一个使用者要对资源 R 进行修改操作时, 先复制 R 的一个副本 R' , 再进行修改操作;

## Problem

在 Java 集合框架中, 像 `ArrayList`, `HashSet` 等基础集合类是非线程安全的, 在多线程环境中同时进行遍历和修改操作可能会出现 `ConcurrentModificationException`; 可以对每个操作都进行同步以解决这个问题, 但对于大部分操作是读取数据的集合进行同步可能会使性能急剧下降, 在这种情况下这种性能损失是没有必要的; 

举个例子, 以下的坐标中, x 轴表示时间轴, y 轴表示不同的线程, `+` 表示读取操作, `*` 表示修改操作:

```text
| ++ ++ ++   ++ ++ ++ ++
|++ + ++ +  ++ + +++ + +
|  ++ ++ *    ++ +* ++ +
| ++ + +   * ++ +  ++ + 
|+ + +++ *  + + +++ + ++
| + + +      + + + + + +
+----------------------
         1 2      3
```

其中除了 1 2 3 这三个时刻之外, 其他时间都是只有读取操作, 在除了 1 2 3 之外的时间进行同步就是没有必要的; 

因此我们希望使用一种技术来处理那些在多线程环境下 "读取操作" 远远多于 "修改操作" 的资源, 使得不需要通过对每一个操作都进行同步;

## Solution

Java 类库中提供了两个 Copy-on-Write 的类: `CopyOnWriteArrayList` 和 `CopyOnWriteArraySet`, 分别实现了 `List` 和 `Set` 两个接口;

## How CopyOnWriteArrayList Works

`CopyOnWriteArrayList` 只有在对其进行修改操作时才会进行同步操作, 因此其 `add`, `remove` 等方法中均使用了同步机制; 在 `CopyOnWriteArrayList` 中, 定义了一个可重入锁:

```java CopyOnWriteArrayList.java
final transient ReentrantLock lock = new ReentrantLock();
```

该锁用于对所有修改集合的方法 (`add`, `remove` 等) 进行同步, 在进行实际修改操作时, 会先复制原来的数组, 再进行修改, 最后替换原来的:

```java CopyOnWriteArrayList.java
public boolean add(E e) {
	final ReentrantLock lock = this.lock;
	lock.lock();
	try {
		Object[] elements = getArray();
		int len = elements.length;
		Object[] newElements = Arrays.copyOf(elements, len + 1);
		newElements[len] = e;
		setArray(newElements);
		return true;
	} finally {
		lock.unlock();
	}
}
```

由于在修改时复制了一份数据, 因此所有读取操作都无需进行同步:

```java CopyOnWriteArrayList.java
public E get(int index) {
	return get(getArray(), index);
}
```

但也会因此引入 "弱一致性" 问题; 所谓 "弱一致性" 是指当一个线程正在读取数据时, 若此时有另一个线程同时在修改该区域的数据, 读取的线程将无法读取最新的数据, 即该读取线程只能读取到它读取时刻以前的最新数据; 

"弱一致性" 的另一个体现是当使用迭代器的时候, 使用迭代器遍历集合时, 该迭代器只能遍历到创建该迭代器时的数据, 对于创建了迭代器后对集合进行的修改, 该迭代器无法感知; 这是因为创建迭代器时, 迭代器对原始数据创建了一份 "快照 (Snapshot)"; 因此 `CopyOnWriteArrayList` 和 `CopyOnWriteArraySet` 只能适用于对数据实时性要求不高的场景;

## How CopyOnWriteArraySet Works

`CopyOnWriteArraySet` 的实现是基于 `CopyOnWriteArrayList` 的, 其内部维护了一个 `CopyOnWriteArrayList` 实例 `al`:

```java CopyOnWriteArraySet.java
private final CopyOnWriteArrayList<E> al;

public CopyOnWriteArraySet() {
	al = new CopyOnWriteArrayList<E>();
}
```

所有对 `CopyOnWriteArraySet` 的操作都被委托给 `al`, 如 `add` 方法:

```java CopyOnWriteArraySet.java
public boolean add(E e) {
	return al.addIfAbsent(e);
}
```

是非常典型的 [组合模式](https://en.wikipedia.org/wiki/Composite_pattern) 应用;
