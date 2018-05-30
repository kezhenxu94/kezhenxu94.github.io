---
title: BitSet 非 Set
tags:
  - Java
  - Interview
  - Bit Operation
date: 2018-04-21 12:34:09
updated: 2018-04-21 12:34:09
---



## Background

`java.util.BitSet` 是 Java 中的一个类, 命名规则很像 {% post_link EnumSet-A-Special-Set 上一篇文章中 %} 的 `EnumSet`, 但 `BitSet` 却并不是 Java 集合框架中的一员:

```java BitSet.java
public class BitSet implements Cloneable, java.io.Serializable {
	// ...
}
```

对 `BitSet` 类的使用可以从一道笔试题引出;

## Problem

题目如下:

程序随机生成 100 个 1-100 之间的整数, 找出 1-100 在这些整数中缺失的数;

## Solution

最粗暴的方法是将随机生成的数组进行排序, 然后遍历一遍判断缺失的数; 考虑到数字的范围比较小, 此处将借用 "计数排序算法" 的思想, 对 1-100 之间的数进行计数, 最终把出现次数为 0 的打印出来即可:

```java MissingNumber.java
public class MissingNumber {
    public static void main(String[] args) {
        final Random random = new Random();

        int[] numbers = new int[100];
        for (int i = 0; i < 100; i++) {
            numbers[i] = random.nextInt(100) + 1;
        }

        int[] presence = new int[101];
        for (int number : numbers) {
            presence[number]++;
        }

        for (int i = 1; i < presence.length; i++) {
            if (presence[i] == 0) {
                System.out.println(i);
            }
        }
    }
}
```

其中 `presence` 数组用于存放对应下标的数字的出现次数, 对于本题目, 我们只需要知道对应下标数字是否出现过, 并不关心其出现的次数, 对于 "是否出现" 这样的问题, 我们本可以使用 1 Bit 就能表示, 但此处却使用了一个 `int` 表示, 整整浪费了 31 Bits; 我们可以自己使用位运算来解决这样的问题, 但 Java 类库中已经提供了一个解决方案, 那就是 `BitSet`;

## Solution with `BitSet`

`BitSet` 实现了一个位向量, 上面的每一个 "位" 都带有一个 `boolean` 值, 并且可以对位向量的各个位进行基本运算, 如:

- 翻转 `flip(int index)`: 即 "非运算", `true` 变 `false`, `false` 变 `true`;

- 清除 `clear(int index)`: 把该位设置为 `false`;

- 设置 `set(int index)`: 把该位设置为 `true`;

还可以将两个位向量进行 "与/或/异或" 等操作;

以下是该问题使用 `BitSet` 的一种解决方法:

```java MissingNumber.java
public class MissingNumber {
    public static void main(String[] args) {
        final Random random = new Random();

        int[] numbers = new int[100];
        for (int i = 0; i < 100; i++) {
            numbers[i] = random.nextInt(100) + 1;
        }

        final BitSet presence = new BitSet(101);
        for (int number : numbers) {
            presence.set(number);
        }

        for (int i = 1; i <= 100; i++) {
            if (!presence.get(i)) {
                System.out.println(i);
            }
        }
    }
}
```

## How `BitSet` Works

`BitSet` 内部维护了一个 `long` 类型的数组 `words`, 将位向量的每一个 "位" 的 `boolean` 值映射为 `words` 数组中一个元素的一个 Bit; 

举个例子: 

- 位向量下标为 34 的 `boolean` 对应 `words[0]` 的第 34 个 Bit; 

- 位向量下标为 64 的 `boolean` 对应 `words[1]` 的第 0 个 Bit; 

> `long` 类型占用 64 Bits
