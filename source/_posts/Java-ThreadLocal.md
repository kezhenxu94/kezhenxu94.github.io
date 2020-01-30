---
title: Java - ThreadLocal 详解
tags:
  - Java
  - Thread
  - Concurrent
date: 2016-03-03 12:18:42
updated: 2016-03-03 12:18:42
---



## Lifecycle of Variables

在 JDK 源代码中对类 `ThreadLocal` 的部分注释如下:

> This class provides thread-local variables. These variables differ from their normal counterparts in that each thread that accesses one (via its {@code get} or {@code set} method) has its own, independently initialized copy of the variable.  {@code ThreadLocal} instances are typically private static fields in classes that wish to associate state with a thread (e.g., a user ID or Transaction ID).

> 该类提供了线程局部变量. 这些变量与一般情况下它们所对应的变量不同, 不同之处在于每一个访问该变量 (通过 get 或 set 方法) 的线程都有自己对该变量的一份拷贝. ThreadLocal 类的实例典型地是 private static 字段, 这些字段是希望与一个线程相关联的状态 (如: 一个用户的 id 或一个事务的 id) .

正如作者所说, `ThreadLocal` 是提供 **线程局部变量** 的类. 在 Java 语言中, 关于变量的作用域/生命周期大概有以下几种:

### Static Variables

即静态变量或类变量, 也就是在类声明中使用 `static` 修饰的变量, 例如在 `java.lang.Double` 类中有如下类变量:

```java
public static final double POSITIVE_INFINITY = 1.0 / 0.0;
```

该类的所有实例共享该变量的同一份副本, 该变量的生命周期最长, 从该类被加载开始到该类被卸载 (如果有的话, 否则直到虚拟机关闭).

### Member Variables

即成员变量, 也就是在类声明中的普通变量. 该类的每个实例各自拥有该变量的一个副本, 该变量的生命周期从实例化该类的一个对象开始, 到该对象被垃圾回收为止.

### Local Variables

即局部变量, 通常所说的局部变量是指在方法中声明的变量, 如 `java.lang.Double` 类中有如下方法:

```java java.lang.Double.java
public static int hashCode(double value) {
	long bits = doubleToLongBits(value);
	return (int)(bits ^ (bits >>> 32));
}
```

其中 `bits` 即为局部变量, 超出该方法时 `bits` 变量便不可访问; 准确来说, 该变量是一个 "方法局部变量 (method-local Variable)".

"局部" 是一个相对的范围, 局部指的是相对于其外部的范围而言, 例如在如下代码中:

```java
public static void main (String[] args) {
	int outter = 1;
	{
		int inner = 100;
		System.out.println (inner);
	}
	/* 不可访问 inner */
	System.out.println (outter);
}
```

变量 `inner` 处在代码块中, 其生命周期仅在该代码块内部有效, 因此该变量也可以叫做一个 "代码块局部变量 (code-block-local Variable)".

## ThreadLocal

现在回到 `ThreadLocal` 中来, Java 文档说 `ThreadLocal` 类是为提供 `thread-local` 的变量而设计的, 可以联想到 **该变量的生命周期应该是在一个线程开始时到一个线程结束时**. 使用该 `ThreadLocal` 包装的变量可以保证同一个线程多次访问该变量访问的都是同一个副本, 而不同线程访问该变量访问的都是不同的副本. 由此可以很明显的看到线程与该变量的对应关系是一对一关系 (one-to-one) , 自然而然想到使用 `Map` 数据结构来存放这种关系, 使用线程作为 `Key` , 该线程对应的变量作为 `Value`;

接下来将编写一个简单 `ThreadLocal` 类, 编写该类的目的不是要取代 JDK 中的 `ThreadLocal` 类, 而是为了更好地理解该类的原理.

## MyThreadLocal

### MyThreadLocal V1

上面提到, `ThreadLocal` 类目的就是为了提供一个线程局部的变量, 因此该类本质上还是一个变量, 因此与其相关的操作是 **读和写**, 对应 **getter 和 setter** 方法. 第一个版本的 `MyThreadLocal` 非常简单, 如下:

```java MyThreadLocal.java
public class MyThreadLocal<T> { // !! DON'T DO THIS
	private T variable;

	public T get () {
		return variable;
	}

	public void set (T variable) {
		this.variable = variable;
	}
}
```

使用泛型语法, 让 `MyThreadLocal` 可以存放任何类型并且在使用 `get` 方法时不用强制类型转换.

### MyThreadLocal V2 using Map

为了让一个线程都可以拥有该变量的一份副本, 使用 `Map` 数据结构来存放这种对应关系, 第二个版本的代码如下:

```java MyThreadLocal.java
public class MyThreadLocal<T> { // !! DON'T DO THIS

	private static final Map<Thread, Object> threadLocalMap =
		Collections.synchronizedMap (new HashMap<Thread, Object> ());

	private T initialValue;

	public MyThreadLocal (T initialValue) {
		this.initialValue = initialValue;
	}

	public T get () {
		final Thread currentThread = Thread.currentThread ();
		return (T) threadLocalMap.getOrDefault (currentThread, initialValue);
	}

	public void set (T variable) {
		final Thread currentThread = Thread.currentThread ();
		threadLocalMap.put (currentThread, variable);
	}
}
```

其中:
- 定义一个类型为 `Map` 的变量 `threadLocalMap`, 为了所有线程都共享该变量, 将 `threadLocalMap` 变量用 `static` 修饰, 并且使用 `Collections.synchronizedMap` 方法进行包装, 使其成为线程安全的; 使用新版本的 JDK 可以使用 `java.util.concurrent.ConcurrentHashMap`;
- 由于将 `threadLocalMap` 使用 `static` 修饰, 因此泛型参数将无法使用, 使用 `Object` 来指定 `value` 类型, 并在返回时进行转换;
- 为了让所有线程在第一次获取该变量的副本时拥有相同的初始值, 定义了一个成员变量 `initialValue`, 并且在构造方法中传入;
- 为了获取与当前的线程相关的变量, 调用 `Thread.currentThread()` 获取当前的线程, 将其作为 `key` 调用 `threadLocalMap` 的 `getOrDefault` 方法, 当当前线程还没有设置过该变量的值时, 返回该变量的初始值, 否则返回该线程最近一次设置该变量的值;
- 当调用 `set` 方法时, 线程的 `Thread.currentThread()` 返回代表该线程的对象, 并且使用该值作为 `key` 设置其 `value` 的值.

需要注意的是: 以上的 `MyThreadLocal` 还不能保证在所有情况下都正常工作, 比如下面的代码将达不到预期效果:

```java Test.java
public static void main (String[] args) {
	final StringBuilder          initialValue = new StringBuilder ();
	MyThreadLocal<StringBuilder> builder      = new MyThreadLocal<StringBuilder> (initialValue);

	for (int i = 0; i < 10; i++) {
		new Thread () {
			@Override
			public void run () {
				final StringBuilder append = builder.get ().append (Thread.currentThread ().getName ()).append (" ");
				builder.set (append);
				System.out.println ("String in thread " + Thread.currentThread ().getName () + " is " + builder.get ().toString ());
			}
		}.start ();
	}
}
```

以上代码意图很明显, 在每个线程对应的局部变量 `builder` 中放入当前线程的名字, 然而最终代码运行其中一种输出却显示如下,  (根据你自己的运行结果可能不完全一样) :

```text output
String in thread Thread-0 is Thread-0 Thread-1
String in thread Thread-2 is Thread-0 Thread-1 Thread-2
String in thread Thread-1 is Thread-0 Thread-1
String in thread Thread-3 is Thread-0 Thread-1 Thread-2 Thread-3
String in thread Thread-4 is Thread-0 Thread-1 Thread-2 Thread-3 Thread-4
String in thread Thread-5 is Thread-0 Thread-1 Thread-2 Thread-3 Thread-4 Thread-5
String in thread Thread-6 is Thread-0 Thread-1 Thread-2 Thread-3 Thread-4 Thread-5 Thread-6
String in thread Thread-7 is Thread-0 Thread-1 Thread-2 Thread-3 Thread-4 Thread-5 Thread-6 Thread-7
String in thread Thread-8 is Thread-0 Thread-1 Thread-2 Thread-3 Thread-4 Thread-5 Thread-6 Thread-7 Thread-8
String in thread Thread-9 is Thread-0 Thread-1 Thread-2 Thread-3 Thread-4 Thread-5 Thread-6 Thread-7 Thread-8 Thread-9
```

很明显所有的线程都是共享同一个 `StringBuilder`, 因此该类并不能达到目的. 原因在于对初始值的获取方式错误:

```java
		private T initialValue;

		public MyThreadLocal (T initialValue) {
			this.initialValue = initialValue;
		}

		@SuppressWarnings ("unchecked")
		public T get () {
			final Thread currentThread = Thread.currentThread ();
			return (T) threadLocalMap.getOrDefault (currentThread, initialValue);
		}
```

从中可以看出, 当线程调用 `get` 方法之前没有调用过 `set` 方法时, 那么所有线程返回默认的初始对象, 该对象也就是构造方法中传入的那个, 都是同一个对象, 当调用完 `get` 方法后再次调用 `set` 方法时, 所有的线程就都使用同一个对象了. 因此应该修改初始值的获取方法, 第三个版本的 `MyThreadLocal` 类如下:

```java MyThreadLocal.java
public class MyThreadLocal<T> {

	private static final Map<Thread, Object> threadLocalMap = Collections.synchronizedMap (new HashMap<Thread, Object> ());

	public MyThreadLocal () {
	}

	protected T initialValue () {
		return null;
	}

	@SuppressWarnings ("unchecked")
	public T get () {
		Thread currentThread = Thread.currentThread ();
		T      value         = (T) threadLocalMap.get (currentThread);

		if (value == null) {
			value = initialValue ();
			threadLocalMap.put (currentThread, value);
		}
		return value;
	}

	public void set (T variable) {
		final Thread currentThread = Thread.currentThread ();
		threadLocalMap.put (currentThread, variable);
	}
}
```

其中:

- 去掉构造方法中的初始值参数, 使用一个 `protected` 的 `initialValue` 方法, 在 `get` 方法中如果当前线程没有设置过该变量的值, 就调用 `initialValue` 方法获取初始值, 并放到 `threadLocalMap` 中;
- 由于 `initialValue` 方法返回 **当前线程** 对应的该变量的初始值, 因此如果想不同线程都使用不同的对象时, 应该子类化 `MyThreadLocal` 类并且覆盖 `initialValue` 方法, 典型的用法是使用匿名内部类, 如下:
```java
MyThreadLocal<StringBuilder> builder = new MyThreadLocal<StringBuilder> (){
	@Override
	protected StringBuilder initialValue () {
		return new StringBuilder ();
	}
};
```
- 因此上一个版本的测试代码应该修改如下, 并且可以达到目的:
```java Main.java
public class Main {
	public static void main (String[] args) {
		MyThreadLocal<StringBuilder> builder = new MyThreadLocal<StringBuilder> (){
			@Override
			protected StringBuilder initialValue () {
				return new StringBuilder ();
			}
		};

		for (int i = 0; i < 10; i++) {
			new Thread () {
				@Override
				public void run () {
					final StringBuilder append = builder.get ().append (Thread.currentThread ().getName ()).append (" ");
					builder.set (append);
					System.out.println ("String in thread " + Thread.currentThread ().getName () + " is " + builder.get ().toString ());
				}
			}.start ();
		}
	}
}
```
	输出结果为:
```text output
String in thread Thread-1 is Thread-1
String in thread Thread-0 is Thread-0
String in thread Thread-2 is Thread-2
String in thread Thread-3 is Thread-3
String in thread Thread-4 is Thread-4
String in thread Thread-5 is Thread-5
String in thread Thread-6 is Thread-6
String in thread Thread-7 is Thread-7
String in thread Thread-8 is Thread-8
String in thread Thread-9 is Thread-9
```

## Using ThreadLocal

对于 `ThreadLocal` 的使用有一个很容易陷入的误区, 就是很多人会认为 `ThreadLocal` 是用来解决线程同步的, 也就是说如果一个类是线程不安全的, 那么使用 `ThreadLocal` 包装起来它就成了线程安全的. 这种想法实际上错的.

`ThreadLocal` 为每一个线程提供一个变量的副本, 因此 `ThreadLocal` 实际解决的是变量的隔离访问, 也就是说把多个线程对同一个变量的访问隔离开来, 这就是通过为每一个线程提供一个私有的变量副本达到的. 为了理解线程同步和 `ThreadLocal` 提供的隔离访问, 考虑以下代码 (你可能在搜索 `ThreadLocal` 用法时多次见到这个例子) :

```java
public class DateParser {

	public static void main (String[] args) {
		SimpleDateFormat parser = new SimpleDateFormat ("yyyy-MM-dd");
		System.out.println ("Today is " + parser.format (new Date ()));

		for (int i = 0; i < 10; i++) {
			final int finalI = i;
			new Thread (() -> {
				System.out.println ("Thread " + Thread.currentThread ()
													  .getName () + " parse result is " +
											parser.format (new Date (System.currentTimeMillis () + finalI * 24 * 60 * 60 * 1000)));
			}).start ();
		}
	}
}
```

代码的目的是创建 10 个线程, 线程 i 输出当前日期加 i 天后的日期并格式化输出, 但是其中一种输出结果是:

```text
Today is 2016-03-04
Thread Thread-0 parse result is 2016-03-04
Thread Thread-1 parse result is 2016-03-05
Thread Thread-2 parse result is 2016-03-07
Thread Thread-3 parse result is 2016-03-07
Thread Thread-4 parse result is 2016-03-08
Thread Thread-5 parse result is 2016-03-09
Thread Thread-6 parse result is 2016-03-10
Thread Thread-7 parse result is 2016-03-11
Thread Thread-8 parse result is 2016-03-12
Thread Thread-9 parse result is 2016-03-13
```

可见在线程 2 和线程 3 输出错误, 原因是 `SimpleDateFormat` 是线程不安全的, 因此解决办法就是让每一个线程都拥有 `parser` 变量的一个副本, 各不相关. 代码如下:

```java DateParser.java
public class DateParser {

	public static void main (String[] args) {
		ThreadLocal<SimpleDateFormat> parser = new ThreadLocal<SimpleDateFormat> () {
			@Override
			protected SimpleDateFormat initialValue () {
				return new SimpleDateFormat ("yyyy-MM-dd");
			}
		};
		System.out.println ("Today is " + parser.get ().format (new Date ()));

		for (int i = 0; i < 10; i++) {
			final int finalI = i;
			new Thread (() -> {
				System.out.println ("Thread " + Thread.currentThread ()
													  .getName () + " parse result is " +
											parser.get ().format (new Date (System.currentTimeMillis () + finalI * 24 * 60 * 60 * 1000)));
			}).start ();
		}
	}
}
```

从上面代码可以看出, 最终每一个线程所拥有的 `SimpleDateFormat` 对象都不相同, 而如果使用同步化机制的话每个线程使用的 `SimpleDateFormat` 应该都是相同的, 例如:

```java DateParser.java
public class DateParser {
	final SimpleDateFormat format = new SimpleDateFormat ("yyyy-MM-dd");

	public static void main (String[] args) {
		final DateParser parser = new DateParser ();
		System.out.println ("Today is " + parser.format (new Date ()));

		for (int i = 0; i < 10; i++) {
			final int finalI = i;
			new Thread (() -> {
				System.out.println ("Thread " + Thread.currentThread ()
													  .getName () + " parse result is " +
											parser.format (new Date (System.currentTimeMillis () + finalI * 24 * 60 * 60 * 1000)));
			}).start ();
		}
	}

	private synchronized String format (Date date) {
		return format.format (date);
	}
}
```

由于 `SimpleDateFormat` 消耗内存资源很多, 为了节约资源, 将其设置为成员变量, 让每一个线程都调用 `DateParser` 的 `format` 方法, 并且对该方法同步化 (使用 `synchronized` 关键字修饰) , 因此所有线程使用的都是同一个对象. 虽然该方法节约内存, 但是同步化却耗费了时间, 是一个典型的时空权衡问题 (space-time trade off) .

## Initializing in Java 8

在最新 JDK 中, 关于 `ThreadLocal` 类的初始化方法除了上面的写法之外, 还增加了 `withInitial` 静态方法, 可以使用 lambda 表达式和该静态方法简写上面匿名内部类的的写法. 如下:

```java
ThreadLocal<StringBuilder> threadLocal = ThreadLocal.withInitial (StringBuilder::new);
```
