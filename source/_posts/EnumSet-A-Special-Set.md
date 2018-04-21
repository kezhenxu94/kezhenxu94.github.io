---
title: EnumSet - A Special Set
tags:
  - Java
  - Java Collection
  - Enum
date: 2018-04-12 16:15:00
updated: 2018-04-12 16:15:00
---


## Problem

`EnumSet` is a specialized implementation of `java.util.Set`, as its name implies, it is designed for use with `Enum`s; so what's the difference between `EnumSet` and a regular `Set` (say `HashSet`)? And why should we use `EnumSet` whenever possible instead of a regular `Set`?

## Prerequisites

Here are the environments used in this post:

- OS: macOS High Sierra

- JDK: 1.8.0_151

## How `EnumSet` Works

If you look up the source code of `EnumSet`, it is easy to find out that `EnumSet` doesn't store all the elements in a table (like `HashMap` does), instead, it stores the elements as some bits of a `long` type field; 

Here is how `EnumSet` works:

The only way to create a `EnumSet` is by calling its static methods:
- `noneOf(Class<E> elementType)`: create a empty `EnumSet` associated to the enum type `elementType`;
- `allOf(Class<E> elementType)`: create a `EnumSet` associated to the enum type `elementType`, containing all values of Enum `E`;
- `copyOf(EnumSet<E> s)`: create a `EnumSet` by copying from another `EnumSet` s;

Once created, the `EnumSet` is associated to a `Enum` type, whose values are limited and known, and `EnumSet` maps each of the values to a bit of a `long` type field, if the value is present in this set, the corresponding bit is set to 1, otherwise 0; in this case:
- Adding an (known) element to this set means setting the corresponding bit to 1;
- Removing an element from this set means setting the corresponding bit to 0;
- Determining whether an element appears in this set (the `contains` method) means determining the corresponding bit is 1 or 0;

Depending on how many values of the associated `Enum` type, `EnumSet` may store the elements in a single `long` type field, or a `long[]` type one because of the fact that a `long` type in Java occupies 64 bits; 

There are two implementations in `EnumSet` according to the number of the values of the associated `Enum` type: `RegularEnumSet` and `JumboEnumSet`; `RegularEnumSet` uses a single `long` type field to hold the elements' corresponding bits while `JumboEnumSet` uses a `long[]` type field;

```java java.util.EnumSet 
public static <E extends Enum<E>> EnumSet<E> noneOf(Class<E> elementType) {
	Enum<?>[] universe = getUniverse(elementType);
	if (universe == null)
		throw new ClassCastException(elementType + " not an enum");

	if (universe.length <= 64)
		return new RegularEnumSet<>(elementType, universe);
	else
		return new JumboEnumSet<>(elementType, universe);
}
```

## Differences

### Performance

Since `EnumSet` is implemented with bitwise operations, all basic operations execute in constant time and thus, are likely to be much faster then their `HashSet` counterparts;

### Nullability

Attempts to insert `null` into `EnumSet` will cause a `NullPointerException`, while testing for the presence of `null` or removing `null` will function properly, and `HashSet` permits `null` element;

### Consistency

`EnumSet` will never throw `ConcurrentModificationException` even if you remove some elements simultaneously while iterating it, and if you do this, whether the modifications are visible during the iteration is not defined;
