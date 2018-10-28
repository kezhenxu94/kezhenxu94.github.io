---
title: 设计模式 - ASM 中的访问者模式
tags:
  - Java
  - Design Pattern
  - Visitor
  - ASM
date: 2018-10-28 09:56:25
updated: 2018-10-28 09:56:25
---


> [ASM](https://asm.ow2.io) 是一个 Java 字节码操作和分析框架, 可直接用二进制的方式(无需编译/反编译)修改已存在的类或动态生成新的类. 

## 问题

要开发像 ASM 这样的框架, 主要面临以下几个问题:

### 动态添加操作方法

既然是一个字节码的操作和分析框架, 那么就要提供对字节码进行各种各样的操作, 且允许用户自定义操作类型. 如在 ASM 中, 除了内置对字节码进行输出和转换等默认实现之外, 还要允许用户对字节码进行加/解密等各种自定义的操作, 对于公开的商业代码这可能是至关重要的.

### 何处安放操作方法

虽然构成一个类的字节码的各个元素有弱的层次关系: 代表类的字节码可能包含 N 个代表字段/方法/注解的字节码, 代表字段/方法的字节码又可能包含 N 个代表注解的字节码. 对这些元素所进行的操作, 应该如何安放. 一种直接的方法是在代表每种字节码元素的类中定义相应的方法, 如 `print()` 用于输出, `transform()` 用于转换, 但在字节码元素的类层次结构中加入这些毫无联系的操作方法, 会使代码变得难以理解和维护.

## 访问者模式

> 作用在多种类对象上的操作, 访问者可以在不修改其操作对象所属类的情况下, 增加对其操作方式.

ASM 源代码中主要使用了访问者模式来解决以上问题:

### 动态添加操作方法

以对类的字段的字节码进行操作为例, ASM 中定义了 `org.objectweb.asm.FieldVisitor` 用来表示对字段的操作:

```java FieldVisitor.java https://gitlab.ow2.org/asm/asm/blob/master/asm/src/main/java/org/objectweb/asm/FieldVisitor.java
package org.objectweb.asm;

public abstract class FieldVisitor {
  // ...

  public AnnotationVisitor visitAnnotation(final String descriptor, final boolean visible) {
    // ...
    return null;
  }

  public AnnotationVisitor visitTypeAnnotation(
      final int typeRef, final TypePath typePath, final String descriptor, final boolean visible) {
    // ...
    return null;
  }

  public void visitAttribute(final Attribute attribute) {
    // ...
  }

  public void visitEnd() {
    // ...
  }
}
```

这样一来, 当用户需要新增对字段进行操作的时候, 只需要继承 `FieldVisitor`, 实现相应的方法即可, 以 ASM 中打印字段字节码的类 `FieldWriter` 为例:

```java FieldWriter https://gitlab.ow2.org/asm/asm/blob/master/asm/src/main/java/org/objectweb/asm/FieldWriter.java
package org.objectweb.asm;

final class FieldWriter extends FieldVisitor {
  // ...

  @Override
  public void visitAttribute(final Attribute attribute) {
    // Store the attributes in the <i>reverse</i> order of their visit by this method.
    attribute.nextAttribute = firstAttribute;
    firstAttribute = attribute;
  }

  void putFieldInfo(final ByteVector output) {
    // ...
  }

  // ...
}
```

`FieldWriter` 每访问到一个字段, 就在内部保存该字段(按访问顺序逆序), 最终调用 `putFieldInfo` 将所有字段信息打印到 `ByteVector` 中.

其中 `org.objectweb.asm.FieldVisitor#visitAttribute` 方法是对类属性的操作, `Attribute` 本身的设计并没有加入如 `print`, `transform` 等方法, 而是将对 `Attribute` 的操作方法被抽离至 `FieldVisitor` 中, 否则就无法满足"动态添加操作方法"的要求了.

通过应用访问者模式, ASM 将对字节码操作的方法从封装了字节码的类中抽离, 避免无关的方法污染类的设计.

### 何处安放操作方法

从上面的代码可以看出, ASM 并没有对各种类元素的字节码定义相应的类, 并且将对这些元素的操作直接放置在对应的访问者 (Visitor) 中, 这正是访问者模式典型应用: 统一管理对类层级中各种类的操作方法.

## 何时使用访问者模式

### 对象层次结构对应类层次结构差异很大

一个类包含 N 个注解, 字段和方法, 用于表示注解, 字段和方法的类型差异比较大, 但是对这些类型的操作需要相互结合, 才能对一个完整的类字节码进行操作.

### 类中需要添加与类本身毫无关系的方法

代表字节码的类和对其进行的操作毫无关系, 换句话说, 一个类本身的字节码与别人如何操作它无关, 这些方法应该被抽离到访问对象中, 而不是强行定义在代表字节码的类中.
