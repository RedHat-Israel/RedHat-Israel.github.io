---
title: Groovying with Java
description: Learn how to leverage Groovy scripts in your Java code.
canonical: https://dev.to/tomerfi/groovying-with-java-59hp
date: 2020-08-06
dir: ltr
lang: en
author:
  name: Tomer Figenblat
  jobTitle: Senior Software Engineer
tags:
- java
- groovy
- tutorial
- code
coverImage: https://source.unsplash.com/WrYAR-yDwe8/640x426
coverImageAlt: a groovy image
---

Combining [Groovy](https://groovy-lang.org/) scripts in our [Java](https://www.java.com/)-based code, is easy with [Maven](https://maven.apache.org/).

You can check out the code for this tutorial in [Github][0].

Let's say we need to produce a text message for sending to customers registering to some sort of call queue for informing them that we got their registration request.</br>
The message should include the customer name, queue number, and an informational greeting of some sort.

We have a couple of ways to accomplish that in *Java*.

First, we can use a basic method that takes the *name* and *queue number* as arguments:

```java
private static String createMessage(final String name, final int queueNum) {
  return String.format(
      "Hello %s, you're number %d, please wait patiently, here is some info:\n" +
      "Anim incididunt deserunt ex ad do aliquip.\n" +
      "Ipsum voluptate laboris eiusmod sint ea do.", name, queueNum);
}

public String getMessage(final String name, final int queueNum) {
  return createMessage(name, queueNum);
}
```

Let's try this as a *BiFunction*:

```java
private static final BiFunction<String, Integer, String> createMessage =
    (name, queueNum) -> String.format(
      "Hello %s, you're number %d, please wait patiently, here is some info:\n" +
      "Anim incididunt deserunt ex ad do aliquip.\n" +
      "Ipsum voluptate laboris eiusmod sint ea do.", name, queueNum);

public String getMessage(final String name, final int queueNum) {
  return createMessage.apply(name, queueNum);
}
```

For the above implementations, adding an argument, i.e. an eta, will complicate our code.

So let's do *function currying*, it will make it easier to add arguments later on,</br>
and... well... it's fun invoking currying functions, am I right? :grin:

```java
private static final Function<String, Function<Integer, String>> createMessage =
    name -> queueNum -> String.format(
      "Hello %s, you're number %d, please wait patiently, here is some info:\n" +
      "Anim incididunt deserunt ex ad do aliquip.\n" +
      "Ipsum voluptate laboris eiusmod sint ea do.", name, queueNum);

public String getMessage(final String name, final int queueNum) {
  return createMessage.apply(name).apply(queueNum);
}
```

Now, Let's give [Groovy](https://groovy-lang.org/) a try.</br>
We'll create *Groovy Script* called *create_message.groovy*:

```groovy
def name = bindName
def queueNum = bindQueueNum

"""Hello ${name}, you're number ${queueNum}, please wait patiently, here is some info:
Anim incididunt deserunt ex ad do aliquip.
Ipsum voluptate laboris eiusmod sint ea do."""
```

- The `def` statements allow us to bind arguments from the shell.
- The `"""` marks the text as a `GString`, which allows us to leverage string interpolation and implied line breaks.
- In *Groovy* last statement **is** the return statement.

Now let's invoke the script from our *Java* code:

```java
public String getMessage(final String name, final int queueNum) {
  try {
    var shell = new GroovyShell();
    var scriptFile = new File(shell.getClassLoader().getResource("scripts/create_message.groovy").getFile());

    var script = shell.parse(scriptFile);

    var binding = new Binding();
    binding.setProperty("bindName", name);
    binding.setProperty("bindQueueNum", queueNum);

    script.setBinding(binding);

    return script.run().toString();
  } catch (IOException exc) {
    return exc.getMessage();
  }
}
```

Now, if we want to add an eta, it's as simple as editing the text and binding another property. :relieved:

To get our our script into our class path with *Maven*, let's say this is our project layout:

```text
- project
  - src
    - main
      - *.java
    - scripts
      - create_message.groovy
    - test
      - *Test.java
```

First, we need to include the [groovy dependency](https://mvnrepository.com/artifact/org.codehaus.groovy/groovy).</br>
This will give access to *Groovy*'s API, i.e. the *GroovyShell* and *Binding* classes.

```xml
<dependencies>
    <dependency>
        <groupId>org.codehaus.groovy</groupId>
        <artifactId>groovy</artifactId>
        <version>3.0.5</version>
    </dependency>
</dependencies>
```

We'll add the following to our `build` section in our `pom.xml`,</br>
This will add everything from our `src/scripts` to our project.

```xml
<build>
    <resources>
      <resource>
        <directory>src/scripts</directory>
        <targetPath>scripts</targetPath>
      </resource>
    </resources>
</build>
```

That's it, have fun and stay groovy!

You can check out the code for this tutorial in [Github][0].

**:wave: See you in the next tutorial :wave:**

[0]: https://github.com/TomerFi/groovy-script-java-project-tutorial
