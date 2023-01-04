---
title: Dependency Injection in Java is easy - Part 2 - Leveraging with Google Guice
description: Learn how to leverage Google Guice as a dependency injection framework in Java.
canonical: https://dev.to/tomerfi/dependency-injection-in-java-is-easy-part-2-leveraging-with-google-guice-6i4
date: 2020-08-10
dir: ltr
lang: en
author:
  name: Tomer Figenblat
  jobTitle: Senior Software Engineer
tags:
- java
- programming
- tutorial
- code
eleventyComputed:
  coverImage: https://source.unsplash.com/ieic5Tq8YMk/640x426
  coverImageAlt: an image of some js code
series: Dependency Injection in Java is easy
seriesDescription: A series of articles for making Dependency Injection in Java easy.
---

This post is part of a multiple parts tutorial,</br>
This part, as the heading suggests will focus on leveraging *Dependency Injection* with [Google Guice](https://github.com/google/guice/wiki).

It's advised to start with [Part 1 - Merely a design pattern][1], to have a sufficient understanding of *the dependency injection design pattern* required for this part of the tutorial.

But, in you wanna start here instead, I'll recap in a sentence:
*[Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection) is merely a design pattern, a technique, for achieving [Inversion of Control](https://en.wikipedia.org/wiki/Inversion_of_control) by writing loosely-coupled code.*

That's it, you're all caught up.</br>
:grin:

The next part of this tutorial is quite similar to this one using a different *di framework*: [Part 3 - Leveraging with Spring Context][2]. You can opt to read it instead of this one, in case you prefer *Spring*.

If you're still here, let's dive in...

So...</br>
You're probably asking yourselves, what is there to leverage in a base code that follows the [dependency injection design pattern][1] :grey_question:

The answer is simple, **Everything**... :grey_exclamation:</br>

I promise you, by the time you'll get through this post, you'll understand the benefits and the necessity of incorporating a *di framework* in your app.

First, let's touch base about how does *dependency injection frameworks* work...</br>
It's pretty straight forward, the *framework* creates dependencies for you!

On one end, you give the *framework* specific instructions on how to create your dependencies,</br>
on the other end, your objects can either declare the dependencies they need or ask the *framework* directly for them.</br>
Either way, the framework will comply and return the dependencies as you instructed it.

That's *di frameworks* in a nutshell, every DI framework, and I mean **Every DI Framework**, I came across, basically works the same.

Sure, there may be different features, different component names, different default behaviors, and most probably different implementation under the hood.

But, to us, *the users of those frameworks*, there are so many similarities, that I can safely say, If you know one well enough, catching up to another one, should be a piece of :cake:.

For instance, you can find similarities between:

- [Spring's Autowired](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-autowired-annotation) and [Guice's Inject](https://github.com/google/guice/wiki/GettingStarted#inject-constructor), both mark a dependency for injection.

- [Spring's Bean](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-java-bean-annotation) and [Guice's Provides](https://github.com/google/guice/wiki/ProvidesMethods), both incorporate logic for creating a dependency.

Not a believer yet :grey_question: Alright, let's throw `C#` in the mix :grey_exclamation:

- [Spring's Configuration](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#beans-annotation-config), [Guice's Modules](https://github.com/google/guice/wiki/GettingStarted#guice-modules), and [Autofac's Modules](https://autofaccn.readthedocs.io/en/latest/configuration/modules.html), can be used to configure dependencies.

- [Guice's Binding](https://github.com/google/guice/wiki/Bindings) and [Autofac's Registration](https://autofaccn.readthedocs.io/en/latest/register/registration.html), are used to configure dependencies with the framework's DSL.

I can go on...</br>
But I believe my point is made.</br>
:sunglasses:

Under the hood, the *framework* builds factories that can provide the dependencies to objects based on multiple criteria, such as type and name.

At the base level, there are three common lifecycle scopes for dependencies living in the *di framework context*:

- *Eager Singleton*: **one instance** of the dependency will be created in the framework's context **immediately upon the framework's instantiation**, the same instance will be used by any objects living in the context.

- *Lazy Singleton*: **one instance** of the dependency will be created in the framework's context **only after the dependency is declared by an object**, upon its instantiation, the same instance will be used by any objects living in the context.

- *Non-Singleton*: **an instance** of the dependency will be created **per declaration upon every declaration**, meaning, every object declaring will get his instance of the dependency.

There are more scopes, but these are the most commonly used three.</br>
You'll probably bump into dependencies *per-session*, *per-request*, *per-dependency*, and so on...</br>
Some frameworks offer different scopes than others, as features.

So...</br>
Let's code.

Heads up, the example application is the same as the one in [Part 1 - Merely a design pattern][1] minus the parts before incorporating the *dependency injection design pattern*.</br>
If you got the app section from *Part 1*, you can skip to the [incorporating guice section](#2-incorporating-google-guice).

You can check out the code for this part of the tutorial in [Github][0].

## 1. Mail Collector App

Let's build an app that collects mail from both *Gmail* and *Microsoft* leveraging the *Dependency Injection* pattern with `Google Guice`.

### 1.1. Contracts

An *Enum* called `MailSource` for categorizing the mail source:

```java
public enum MailSource {
  GMAIL,
  MICROSOFT;
}
```

An abstract class `Mail` for contracting mail objects.

```java
public abstract class Mail {
  public abstract String from();

  public abstract String subject();

  public abstract MailSource source();

  @Override
  public String toString() {
    return String.format("Got mail by %s, from %s, with the subject %s", source(), from(), subject());
  }
}
```

An interface for contracting services responsible for collecting mail from suppliers, the `MailService`.

```java
public interface MailService {
  List<Mail> getMail();
}
```

And last, an interface for contracting an engine responsible for collecting mail from multiple services, the `MailEngine`.

```java
public interface MailEngine {
  List<Mail> getAllMail();
}
```

### 1.2. Implementations

#### 1.2.1. Mail

For convinience and immutability, The concrete `Mail` implementaions were designed with a *builder pattern*.</br>
The *Gmail* `Mail` implementation, `GmailImpl`:

```java
public final class GmailImpl extends Mail {
  private final String setFrom;
  private final String setSubject;

  private GmailImpl(final String from, final String subject) {
    setFrom = from;
    setSubject = subject;
  }

  @Override
  public String from() {
    return setFrom;
  }

  @Override
  public String subject() {
    return setSubject;
  }

  @Override
  public MailSource source() {
    return MailSource.GMAIL;
  }

  public static GmailImpl.Builder builder() {
    return new GmailImpl.Builder();
  }

  public static final class Builder {
    private String prepFrom;
    private String prepSubject;

    public Builder from(final String setFrom) {
      prepFrom = setFrom;
      return this;
    }

    public Builder subject(final String setSubject) {
      prepSubject = setSubject;
      return this;
    }

    public GmailImpl build() {
      requireNonNull(emptyToNull(prepFrom), "from cannot be empty or null");
      requireNonNull(emptyToNull(prepSubject), "subject cannot be empty or null");

      return new GmailImpl(prepFrom, prepSubject);
    }
  }
}
```

The *Micsorosft* `Mail` implementation, `MicrosoftImpl`:

```java
public final class MicrosoftImpl extends Mail {
  private final String setFrom;
  private final String setSubject;

  private MicrosoftImpl(final String from, final String subject) {
    setFrom = from;
    setSubject = subject;
  }

  @Override
  public String from() {
    return setFrom;
  }

  @Override
  public String subject() {
    return setSubject;
  }

  @Override
  public MailSource source() {
    return MailSource.MICROSOFT;
  }

  public static MicrosoftImpl.Builder builder() {
    return new MicrosoftImpl.Builder();
  }

  public static final class Builder {
    private String prepFrom;
    private String prepSubject;

    public Builder from(final String setFrom) {
      prepFrom = setFrom;
      return this;
    }

    public Builder subject(final String setSubject) {
      prepSubject = setSubject;
      return this;
    }

    public MicrosoftImpl build() {
      requireNonNull(emptyToNull(prepFrom), "from cannot be empty or null");
      requireNonNull(emptyToNull(prepSubject), "subject cannot be empty or null");

      return new MicrosoftImpl(prepFrom, prepSubject);
    }
  }
}
```

#### 1.2.2. Mail Services

The *Gmail* `MailService` implementation:

```java
public final class GmailService implements MailService {
  @Override
  public List<Mail> getMail() {
    // this is where the actual Gmail api access goes.
    // we'll fake a couple of mails instead.
    var firstFakeMail =
        GmailImpl.builder()
            .from("a.cool.friend@gmail.com")
            .subject("wanna get together and write some code?")
            .build();

    var secondFakeMail =
        GmailImpl.builder()
            .from("an.annoying.salesman@some.company.com")
            .subject("wanna buy some stuff?")
            .build();

    return List.of(firstFakeMail, secondFakeMail);
  }
}
```

The *Microsoft* `MailService` implementation:

```java
public final class MicrosoftService implements MailService {
  @Override
  public List<Mail> getMail() {
    // this is where the actual Microsoft api access goes.
    // we'll fake a couple of mails instead.
    var firstFakeMail =
        MicrosoftImpl.builder()
            .from("my.boss@work.info")
            .subject("stop writing tutorials and get back to work!")
            .build();

    var secondFakeMail =
        MicrosoftImpl.builder()
            .from("next.door.neighbor@kibutz.org")
            .subject("do you have philips screwdriver?")
            .build();

    return List.of(firstFakeMail, secondFakeMail);
  }
}
```

#### 1.2.3. Mail Engine

The concrete implementation of `MailEngine` is `RobustMailEngine`, it collects the mail from the different services:

```java
public final class RobustMailEngine implements MailEngine {
  private final Set<MailService> mailServices;

  public RobustMailEngine(final Set<MailService> setMailSerices) {
    mailServices = setMailSerices;
  }

  @Override
  public List<Mail> getAllMail() {
    return mailServices.stream().map(MailService::getMail).flatMap(List::stream).collect(toList());
  }
}
```

### 1.3. The Main App

This is the app itself, the `MailCollectorApp`:

```java
public final class MailCollectorApp {
  private MailEngine engine;

  public MailCollectorApp(final MailEngine setEngine) {
    engine = setEngine;
  }

  public String getMail() {
    var ret = "No mail found.";
    if (!engine.getAllMail().isEmpty()) {
      ret = Joiner.on(System.lineSeparator()).join(engine.getAllMail());
    }
    return ret;
  }

  public static void main(final String... args) {
    var gmailService = new GmailService();
    var microsoftService = new MicrosoftService();

    var engine = new RobustMailEngine(Set.of(gmailService, microsoftService));

    var app = new MailCollectorApp(engine);

    System.out.println(app.getMail());
  }
}
```

Executing the *main method* will print:

```text
Got mail by GMAIL, from a.cool.friend@gmail.com, with the subject wanna get together and write some code?
Got mail by GMAIL, from an.annoying.salesman@some.company.com, with the subject wanna buy some stuff?
Got mail by MICROSOFT, from my.boss@work.info, with the subject stop writing tutorials and get back to work!
Got mail by MICROSOFT, from next.door.neighbor@kibutz.org, with the subject do you have a star screwdriver?
```

As you may have noticed, this application designed with the *dependency injection design pattern* in mind.</br>
The dependencies are currently controlled by the `main` method, so it should be easy to incorporate [Google Guice](https://github.com/google/guice/wiki).

## 2. Incorporating Google Guice

### 2.1. Include maven dependency

First off, add this to your *pom.xml* in the *dependencies* section:</br>
Please note the version, this version was the latest at the time this tutorial was written.

```xml
<dependency>
  <groupId>com.google.inject</groupId>
  <artifactId>guice</artifactId>
  <version>4.2.3</version>
</dependency>
```

### 2.2. Mark inject

We need to tell *Guice* about the dependencies we want to be injected.</br>
Let's do this for the concrete engine class:

```java
public final class RobustMailEngine implements MailEngine {
  private final Set<MailService> mailServices;

  @Inject
  public RobustMailEngine(final Set<MailService> setMailSerices) {
    mailServices = setMailSerices;
  }

  @Override
  public List<Mail> getAllMail() {
    return mailServices.stream().map(MailService::getMail).flatMap(List::stream).collect(toList());
  }
}
```

And for the app class:

```java
public final class MailCollectorApp {
  private MailEngine engine;

  @Inject
  public MailCollectorApp(final MailEngine setEngine) {
    engine = setEngine;
  }

  public String getMail() {
    var ret = "No mail found.";
    if (!engine.getAllMail().isEmpty()) {
      ret = Joiner.on(System.lineSeparator()).join(engine.getAllMail());
    }
    return ret;
  }

  //...
}
```

All we did by adding `@Inject` annotation on both classes constructor, is tell *Guice* we need it to provide the dependencies in those constructors for us.</br>
Now, we need to instruct *Guice* on how to provide those dependencies.

### 2.3. Provide depndencies

Let's create a *Guice Module* for configuring the bindings, there are a couple of ways for achiving that.</br>
For instance, using [Guice's Provides Methods](https://github.com/google/guice/wiki/ProvidesMethods):

```java
public final class DIModule extends AbstractModule {
  @Provides
  static Set<MailService> getServices() {
    return Set.of(new GmailService(), new MicrosoftService());
  }

  @Provides
  @Singleton
  static MailEngine getEngine(final Set<MailService> services) {
    return new RobustMailEngine(services);
  }
}
```

Another option is using [Guice's bind DSL](https://google.github.io/guice/api-docs/latest/javadoc/com/google/inject/Binder.html):

```java
public final class DIModule extends AbstractModule {
  @Override
  public void configure() {
    var listBinder = newSetBinder(binder(), MailService.class);
    listBinder.addBinding().toInstance(new GmailService());
    listBinder.addBinding().toInstance(new MicrosoftService());

    bind(MailEngine.class).to(RobustMailEngine.class).in(Scopes.SINGLETON);
  }
}
```

Both options will produce the same dependencies.</br>
From a [Scopes](https://github.com/google/guice/wiki/Scopes) point-of-view...</br>
*Guice*'s default scope is *Non-Singleton*,</br>
meaning the *Set* of *GmailService* and *MicrosoftService* will be created as new instances for every object who needs them.</br>

The *RobustMailEngine* on the other end is bound as a *Singelton*.</br>
Based on [Guice's docs](https://github.com/google/guice/wiki/Scopes#eager-singletons), that means that in *Production stage* it will be an *Eager Singleton*, and in *Development stage* it will be a *Lazy Singleton*.</br>
Either way, it's going to be a *Singleton*, meaning our app will have only one instance of *RobustMailEngine*.</br>

The default stage for *Guice* is *Development stage*, so we can expect a *Lazy Singleton*.

> Please note, *RobustMailEngine* is a dependency, it will be injected to whoever needs it, but as we configured earlier with *@Inject*, it also needs dependencies for itself (the *Set* of *MailService*).</br>
> *Guice* will catch that and inject the set of mail services while instantiating the engine.

### 2.4 Update the app to use Guice

Let's get back to the to our app and update it to work with *Guice*:

```java
public final class MailCollectorApp {
  private MailEngine engine;

  @Inject
  public MailCollectorApp(final MailEngine setEngine) {
    engine = setEngine;
  }

  public String getMail() {
    var ret = "No mail found.";
    if (!engine.getAllMail().isEmpty()) {
      ret = Joiner.on(System.lineSeparator()).join(engine.getAllMail());
    }
    return ret;
  }

  public static void main(final String... args) {
    var injector = Guice.createInjector(new DIModule());

    var app = injector.getInstance(MailCollectorApp.class);

    System.out.println(app.getMail());
  }
}
```

Let's analyze what's going on here...

Running the *main* method will create a *Guice's injector*, which is the context for all dependencies to live in.</br>
As we create it with an instance of our *DIModule* class, the injector's context will have the following dependencies configured in it:

- A *Set* of two *MailService* objects (*GmailService* and *Microsoft Service*).
- A *Singleton* instance of *MailEngine* (*RobustMailEngine*).

As stated, in *Development stage* the *MainEngine* is a *Lazy Singleton*, plus, we configured the *Set* of *MailService* as *Non-Singleton*. That means that at this point, there's nothing instantiated in the injector context. All it has is instructions on how to instantiate.

The next step, asking the injector for an instance of *MailCollectorApp* will accomplish the following:

- *Guice* will pick up the constructor in *MailCollectorApp*, as it's the only constructor.

- As the constructor is marked with *@Inject*, *Guice* will look in its context for a dependency of type *MailEngine*.

- It will find the *RobustMailEngine* configured, which is a *Lazy Singleton*.

- While trying to instantiate it, it will pick up its constructor which is also marked with *@Inject*.

- *Guice* will look for a suitable dependency with the type *Set* of *MailService*.

- It will find the *Set* of *GoogleService* and *MicrosoftService*, which is a *Non-Singleton*.

After preparing the *dependency graph*, *Guice* will:

- Create the set after instantiating both *GmailService* and *MicrosoftService*.

- Instantiate the *RobustMailEngine* injecting the *Set*.

- Instantiate the *MailCollectorApp* injecting the *RobustMailEngine*.

We then get our instance *MailCollectorApp* with everything we need in it, from which we invoke getMail to get all of our mail.

That's it, *Guice* in a nutshell.</br>
:satisfied:

Now, Let's test the code...

## 3. Unit Tests

I'm gonna start by saying, in regards to unit tests, if possible, always prefer **not to use** *di frameworks* in unit tests.

Unit tests are about testing small parts, units, of your application. You don't need the overhead of creating the *di context*, it will probably serve no purpose for you. You would probably be better off just instantiating the subject under test manually.

On the other end, if you talking about integration, or acceptance tests, or any other situation when you might need to test your application end-to-end, well, in that case, a good *di framework* could be your best friend.

That being said, for demonstration purposes only, let's move on to unit tests **with** *di framework*.

```java
public final class MailCollectorAppTest extends AbstractModule {
  private MailService gmailServiceMock;
  private MailService microsoftServiceMock;
  private MailService thirdServiceMock;

  private MailCollectorApp sut;

  private Faker faker;

  @Override
  public void configure() {
    var listBinder = newSetBinder(binder(), MailService.class);
    listBinder.addBinding().toInstance(gmailServiceMock);
    listBinder.addBinding().toInstance(microsoftServiceMock);
    listBinder.addBinding().toInstance(thirdServiceMock);

    bind(MailEngine.class).to(RobustMailEngine.class).in(Scopes.SINGLETON);
  }

  @BeforeEach
  public void initialize() {
    faker = new Faker();

    gmailServiceMock = mock(MailService.class);
    microsoftServiceMock = mock(MailService.class);
    thirdServiceMock = mock(MailService.class);

    var injector = Guice.createInjector(this);

    sut = injector.getInstance(MailCollectorApp.class);
  }

  @Test
  @DisplayName(
      "make the services mocks return no mail and validate the return string as 'No mail found'")
  public void getMail_noMailExists_returnsNoMailFound() {
    willReturn(emptyList()).given(gmailServiceMock).getMail();
    willReturn(emptyList()).given(microsoftServiceMock).getMail();
    willReturn(emptyList()).given(thirdServiceMock).getMail();

    then(sut.getMail()).isEqualTo("No mail found.");
  }

  @Test
  @DisplayName(
      "make the services return legitimate mail and validate the return string as expected")
  public void getMail_foundMail_returnsExpectedString() {
    var mail1 =
        GmailImpl.builder()
            .from(faker.internet().emailAddress())
            .subject(faker.lorem().sentence())
            .build();
    var mail2 =
        MicrosoftImpl.builder()
            .from(faker.internet().emailAddress())
            .subject(faker.lorem().sentence())
            .build();
    var mail3 =
        MicrosoftImpl.builder()
            .from(faker.internet().emailAddress())
            .subject(faker.lorem().sentence())
            .build();

    willReturn(List.of(mail1)).given(gmailServiceMock).getMail();
    willReturn(List.of(mail2, mail3)).given(microsoftServiceMock).getMail();
    willReturn(emptyList()).given(thirdServiceMock).getMail();

    then(sut.getMail().split(System.lineSeparator()))
        .containsOnly(mail1.toString(), mail2.toString(), mail3.toString());
  }
}
```

As you can see, all I did was create the injector with a different module than the one I've used for my app (*DIModule*).

In this case, I've extended the test class to be a module in itself and inject my mocks instead of the real *GmailService* and *MicrosoftService*, I've even added a third service, just for the kick of it. :grin:

The *RobustMailEngine* was not mocked, because there was no real reason to do so, but it could have been easily replaced with a mock or a spy.

My test class behaved exactly like my main app, except for the services being mocks instead of real objects.

You can check out the code for this part of the tutorial in [Github][0].

**:wave: See you in the next part of this tutorial :wave:**

[0]: https://github.com/TomerFi/dependency-injection-java-part2-tutorial
[1]: {{ '../2020-08-08-dependency-injection-in-java-is-easy-part-1.md' | url }}
[2]: {{ '../2020-08-14-dependency-injection-in-java-is-easy-part-3.md' | url }}
