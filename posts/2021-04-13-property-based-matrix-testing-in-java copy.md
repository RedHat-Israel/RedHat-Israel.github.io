---
title: Property-Based Matrix Testing in Java
description: Learn how to use PBT (property-based testing) leveraged with a properties matrix.
canonical: https://dev.to/tomerfi/property-based-matrix-testing-in-java-47p4
date: 2021-04-13
dir: ltr
lang: en
author:
  name: Tomer Figenblat
  jobTitle: Senior Software Engineer
tags:
- java
- test
- pbt
- junit
eleventyComputed:
  coverImage: https://source.unsplash.com/EWLHA4T-mso/640x426
  coverImageAlt: an image of some js code
---

I've been using the same technique to accomplish property-based matrix testing in *Java* for a long time.</br>
It's not very pretty, or clean, but it gets the job done. :sunglasses:</br>

Using *JUnit's* [ParameterizedTest][1] and a [MethodSource][2] annotations to point to a method as an argument supplier that spits out a stream representing my matrix.</br>
It's pretty straightforward, but the more parameter types I have in my matrix, the harder it is to read or write the method supplying them. :dizzy_face:</br>

Let's take a look.</br>
First, these are the two types for our matrix, these should spit out 6 test cases:

```java
  enum Direction {
    INCOMING,
    OUTGOING
  }

  enum Status {
    SUCCESS,
    FAILURE,
    WAITING
  }
```

Implementing a matrix from these *Enums* with [JUnit's ParameterizedTest][1] and a [MethodSource][2]:

```java
  @ParameterizedTest
  @MethodSource("getArguments")
  void using_junit_parameterized_test_with_method_source(
      final Direction direction, final Status status) {
    assertTrue(true);
  }

  static Stream<Arguments> getArguments() {
    return Stream.of(Direction.values())
        .flatMap(d -> Stream.of(Status.values()).map(s -> arguments(d, s)));
  }
```

As you can see, adding members to the existing *Enums* will dynamically increase the matrix,</br>
and therefore the number of tests performed, there's no need to modify the test code.</br>

But, adding a third type to the matrix, and the `getArguments` method, will start losing its readability.

Lately, I discovered [JUnit Pioneer][3], which is a *JUnit 5 Extension Pack*.</br>
Using its [CartesianProductTest][4] and [CartesianEnumSource][5] annotations we can implement the same exact matrix simply and elegantly: :smiley:

```java
  @CartesianProductTest
  @CartesianEnumSource(Direction.class)
  @CartesianEnumSource(Status.class)
  void using_junit_pioneer_cartesian_product_test_with_enum_source(
      final Direction direction, final Status status) {
    assertTrue(true);
  }
```

This will spit out the same matrix, only now, adding a third element is quite simple, just add another [CartesianEnumSource][5] annotation.</br>
You can find other types of sources beside *Enums*, in *JUnit Pioneer*'s [Documentation][6].

As demonstrated in [this repository][0], executing both matrix tests will print out:

```text
[INFO] '-- JUnit Jupiter [OK]
[INFO]   '-- Property Based Matrix Test [OK]
[INFO]     +-- using junit pioneer cartesian product test with enum source (Direction, Status) [OK]
[INFO]     | +-- [1] INCOMING, SUCCESS [OK]
[INFO]     | +-- [2] INCOMING, FAILURE [OK]
[INFO]     | +-- [3] INCOMING, WAITING [OK]
[INFO]     | +-- [4] OUTGOING, SUCCESS [OK]
[INFO]     | +-- [5] OUTGOING, FAILURE [OK]
[INFO]     | '-- [6] OUTGOING, WAITING [OK]
[INFO]     '-- using junit parameterized test with method source (Direction, Status) [OK]
[INFO]       +-- [1] INCOMING, SUCCESS [OK]
[INFO]       +-- [2] INCOMING, FAILURE [OK]
[INFO]       +-- [3] INCOMING, WAITING [OK]
[INFO]       +-- [4] OUTGOING, SUCCESS [OK]
[INFO]       +-- [5] OUTGOING, FAILURE [OK]
[INFO]       '-- [6] OUTGOING, WAITING [OK]
```

You can check out the code for this tutorial in [Github][0].

**:wave: See you in the next tutorial :wave:**

[0]: https://github.com/TomerFi/property-based-matrix-testing-tutorial
[1]: https://junit.org/junit5/docs/current/user-guide/#writing-tests-parameterized-tests
[2]: https://junit.org/junit5/docs/current/user-guide/#writing-tests-parameterized-tests-sources-MethodSource
[3]: https://junit-pioneer.org/
[4]: https://junit-pioneer.org/docs/cartesian-product/
[5]: https://junit-pioneer.org/docs/cartesian-product/#cartesianenumsource
[6]: https://junit-pioneer.org/docs/cartesian-product/#annotating-your-test-method
