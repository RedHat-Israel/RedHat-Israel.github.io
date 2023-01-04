---
title: Dependency Injection in Java is easy - Part 3 - Leveraging with Spring Context
description: Learn how to leverage Spring Context as a dependency injection framework in Java.
canonical: https://dev.to/tomerfi/dependency-injection-in-java-is-easy-part-3-leveraging-with-spring-context-gcc
date: 2020-08-14
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
  coverImage: https://source.unsplash.com/AaEQmoufHLk/640x426
  coverImageAlt: an image of some js code
series: Dependency Injection in Java is easy
seriesDescription: A series of articles for making Dependency Injection in Java easy.
---

This post is part of a multiple parts tutorial,</br>
This part, as the heading suggests will focus on leveraging *Dependency Injection* with [Spring Context](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/core.html).

> Note, *Spring* so much more than "just" a *di framework*, but this post touches *Spring frameworks IoC container*, also known as *Spring context*.</br>
> *Spring Boot* and any other *Spring* related is outside the scope of this post.

It's advised to start with [Part 1 - Merely a design pattern][1], to have a sufficient understanding of *the dependency injection design pattern* required for this part of the tutorial.

But, in you wanna start here instead, I'll recap in a sentence:
*[Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection) is merely a design pattern, a technique, for achieving [Inversion of Control](https://en.wikipedia.org/wiki/Inversion_of_control) by writing loosely-coupled code.*

That's it, you're all caught up.</br>
:grin:

Between [Part 1][1] and this part, you can go through [Part 2 - Leveraging with Google Guice][2]. It's not at all mandatory for the understanding of this part of this tutorial. Both parts are pretty similar, leveraging different *di frameworks*.

If you have read [Part 2][2], you can skip to the [incorporating spring section](#2-incorporating-spring-context), as this next part is copied from [Part 2][2] for those who aren't interested in *Goole Guice.*

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

At the base level, there are 3 common scopes for dependencies living in the *di framework context*:

- *Eager Singleton*: **one instance** of the dependency will be created in the framework's context **immediately upon the framework's instantiation**, the same instance will be used by any objects living in the context.
- *Lazy Singleton*: **one instance** of the dependency will be created in the framework's context **only after the dependency is declared by an object**, upon its instantiation, the same instance will be used by any objects living in the context.
- *Non-Singleton*: **an instance** of the dependency will be created **per declaration upon every declaration**, meaning, every object declaring will get his instance of the dependency.

There are more scopes, but these are the most commonly used three.</br>
You'll probably bump into dependencies *per-session*, *per-request*, *per-dependency*, and so on...</br>
Some frameworks offer different scopes than others, as features.

So...</br>
Let's code.

Heads up, the example application is the same as the one in [Part 1 - Merely a design pattern][1] minus the parts before incorporating the *dependency injection design pattern*.</br>
If you got the app section from *Part 1*, you can skip to the [incorporating spring section](#2-incorporating-spring-context).

You can check out the code for this part of the tutorial in [Github][0].

## 1. Mail Collector App

Let's build an app that collects mail from both *Gmail* and *Microsoft* leveraging the *Dependency Injection* pattern with `Spring Context`.

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

As you may have noticed, this application uses the *dependency injection design pattern*.</br>
The dependencies are currently controlled by the `main` method, so it should be easy to incorporate [Spring Context](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/core.html).

## 2. Incorporating Spring Context

### 2.1. Include maven dependency

First off, add this to your *pom.xml* in the *dependencies* section:</br>
Please note the version, this version was the latest at the time this tutorial was written.

```xml
<dependency>
  <groupId>org.springframework</groupId>
  <artifactId>spring-context</artifactId>
  <version>5.2.8.RELEASE</version>
</dependency>
```

### 2.2. Mark autowired

We need to tell *Spring* about the dependencies we want to be injected.</br>
But it's only mandatory for *property* and *method* based injections, in our example we're using *constructor* based injection, so there's no need to annotate with *@Autowierd*.

So basically... if you're using *constructor* based injection, which is always the *best practice* if possible, then there's nothing to do in this section.

But for this tutorial's sake, I'll use the *@Autowierd* to show you what dependencies we need to be injected.</br>
Let's do this for the concrete engine class:

```java
public final class RobustMailEngine implements MailEngine {
  private final Set<MailService> mailServices;

  @Autowired
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

  @Autowired
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

Now, we need to instruct *Spring* on how to instantiate those dependencies, which are called *beans* in *spring*'s world.

### 2.3. Create Beans

Let's create a *Spring Configuration Class* for creating beans, there are a couple of ways for achiving that.</br>
For instance, using [Spring's Annotation Based Configuration](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/core.html#beans-annotation-config):

```java
@Configuration
public class DIConfiguration {
  @Bean
  @Scope(BeanDefinition.SCOPE_PROTOTYPE)
  public Set<MailService> getServices() {
    return Set.of(new GmailService(), new MicrosoftService());
  }

  @Lazy
  @Bean
  public MailEngine getEngine(final Set<MailService> services) {
    return new RobustMailEngine(services);
  }
}
```

Another way for creating *beans* in *Spring* is marking classes as *@Component*, which is the way of telling *Spring* we want this class as a bean.</br>
For instance, let's mark our *app* class as a *Component* so we can later ask *Spring* to instantiate it:

```java
@Lazy
@Component
public final class MailCollectorApp {
  // ...
}
```

This will of course be a *Lazy Singleton*.

Another option configuring *Spring* is using [Spring's XML Based Configuration](https://docs.spring.io/spring/docs/4.2.x/spring-framework-reference/html/xsd-configuration.html):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="
        http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean id="gmailService" class="info.tomfi.tutorials.mailapp.core.service.GmailService" scope="prototype"/>

    <bean id="microsoftService" class="info.tomfi.tutorials.mailapp.core.service.MicrosoftService" scope="prototype"/>

    <bean id="getEngine" class="info.tomfi.tutorials.mailapp.engine.RobustMailEngine" lazy-init="true">
      <constructor-arg>
        <set>
          <ref bean="gmailService"/>
          <ref bean="microsoftService"/>
        </set>
      </constructor-arg>
    </bean>

    <bean id="getMailApp" class="info.tomfi.tutorials.mailapp.MailCollectorApp" lazy-init="true">
      <constructor-arg>
        <ref bean="getEngine"/>
      </constructor-arg>
    </bean>

</beans>
```

Both options will produce the same dependencies.</br>
From a [Scopes](https://docs.spring.io/spring-framework/docs/current/spring-framework-reference/core.html#beans-factory-scopes) point-of-view...</br>
*Spring*'s default scope is *Singleton*,</br>
meaning the *RobustMailEngine*, combined with the *Lazy* annotation, will be a *Lazy Singleton*, meaning our app will have only one instance of *RobustMailEngine*.</br>

The *Set* of *GmailService* and *MicrosoftService*, on the other end, will be created as new instances for every object who needs them, as we explicitly configured them as *Prototype*, which is *Non-Singleton* of course.</br>

> Please note, *RobustMailEngine* is a dependency, it will be injected to whoever needs it, but as we configured earlier, it also needs dependencies for itself (the *Set* of *MailService*).</br>
> *Spring* will catch that and inject the set of mail services while instantiating the engine.

### 2.4 Update the app to use Spring

Let's get back to the to our app and update it to work with *Spring*:

```java
@Lazy
@Component
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
    // try (var container = new ClassPathXmlApplicationContext("spring-beans.xml")) {
    try (var container = new AnnotationConfigApplicationContext(MailCollectorApp.class, DIConfiguration.class)) {
      var app = container.getBean(MailCollectorApp.class);

      System.out.println(app.getMail());
    }
  }
}
```

Let's analyze what's going on here...

Running the *main* method will create a *Spring's container*, which is the context for all dependencies to live in.</br>
As we create it with an instance of both *MailCollectorApp* and *DIConfiguration* classes, the container will have the following dependencies, beans, configured in it:

- A *Set* of two *MailService* objects (*GmailService* and *Microsoft Service*).
- A *Singleton* instance of *MailEngine* (*RobustMailEngine*).
- A *Singleton* instance of *MailCollectorApp*.

As configured, both *MailCollectorApp* and *MainEngine* are *Lazy Singletons*, plus, we configured the *Set* of *MailService* as *Prototype*. That means that at this point, there's nothing instantiated in spring's context. All it has is instructions on how to instantiate.

The next step, asking the container for an instance of *MailCollectorApp* will accomplish the following:

- *Spring* will pick up the constructor in *MailCollectorApp*, as it's the only constructor.
- *Spring* will look in its context for a dependency of type *MailEngine*.
- It will find the *RobustMailEngine* configured, which is a *Lazy Singleton*.
- While trying to instantiate it, it will pick up its constructor and look for a suitable dependency with the type *Set* of *MailService*.
- It will find the *Set* of *GoogleService* and *MicrosoftService*, which is a *Prototype*.

After preparing the groundwork, *Spring* will:

- Create the set after instantiating both *GmailService* and *MicrosoftService*.
- Instantiate the *RobustMailEngine* injecting the *Set*.
- Instantiate the *MailCollectorApp* injecting the *RobustMailEngine*.

We then get our instance *MailCollectorApp* with everything we need in it, from which we invoke getMail to get all of our mail.

That's it, *Spring Context* in a nutshell.</br>
:satisfied:

Now, Let's test the code...

## 3. Unit Tests

I'm gonna start by saying, in regards to unit tests, if possible, always prefer **not to use** *di frameworks* in unit tests.

Unit tests are about testing small parts, units, of your application. You don't need the overhead of creating the *di context*, it will probably serve no purpose for you. You would probably be better off just instantiating the subject under test manually.

On the other end, if you writing integration, or acceptance tests, or any other situation when you might need to test your application end-to-end, well, in that case, a good *di framework* could be your best friend.

That being said, for demonstration purposes only, let's move on to unit tests **with** *di framework*.</br>

Please note, as far as I can tell, there isn't a way, not a friendly way, to instantiate an object outside of spring's context lifecycle, and then register it to the context.

*Spring* creates its instances and doesn't allow any outside interference, I guess there's a good reason for that.</br>
Nonetheless, I needed to inject mocks instead of the real mail services maintaining the ability to access them so I can verify their behavior, and the cleanest way I was able to accomplish that, is by having *Spring* create them for me.

There are other ways to accomplish that, some of them are relevant to *Spring Boot* and not necessarily to *Spring Context*, as I mentioned at the start of this post.

My solution was to create a sperate configuration class for testing *spring context*, having it instantiate the mocks for me, and then just ask for them.

If that's not a testament to how *di frameworks* are not always the best idea for unit tests, then I don't know what is. Nevertheless, here the *work-around* configuration class (Don't try this at home :wink:):

```java
@Configuration
public class DITestConfiguration {
  private MailService gmailServiceMock;
  private MailService microsoftServiceMock;
  private MailService thirdServiceMock;

  public DITestConfiguration() {
    gmailServiceMock = mock(MailService.class);
    microsoftServiceMock = mock(MailService.class);
    thirdServiceMock = mock(MailService.class);
  }

  @Lazy
  @Bean
  public MailEngine getEngine(final Set<MailService> services) {
    return new RobustMailEngine(Set.of(gmailServiceMock, microsoftServiceMock, thirdServiceMock));
  }

  public MailService getGmailServiceMock() {
    return gmailServiceMock;
  }

  public MailService getMicrosoftServiceMock() {
    return microsoftServiceMock;
  }

  public MailService getThirdServiceMock() {
    return thirdServiceMock;
  }
}
```

Please note the instantiation of the mocks that will be grabbed by the test class:

```java
public final class MailCollectorAppTest {
  private MailService gmailServiceMock;
  private MailService microsoftServiceMock;
  private MailService thirdServiceMock;

  private MailCollectorApp sut;

  private ConfigurableApplicationContext context;
  private Faker faker;

  @BeforeEach
  public void initialize() {
    faker = new Faker();

    context =
        new AnnotationConfigApplicationContext(MailCollectorApp.class, DITestConfiguration.class);

    var confWorkAround = context.getBean(DITestConfiguration.class);

    gmailServiceMock = confWorkAround.getGmailServiceMock();
    microsoftServiceMock = confWorkAround.getMicrosoftServiceMock();
    thirdServiceMock = confWorkAround.getThirdServiceMock();

    sut = context.getBean(MailCollectorApp.class);
  }

  @AfterEach
  public void cleanup() {
    context.close();
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

I want to emphasize, this is *poor practice*, I was better off just testing without *Spring*, but I wanted this tutorial to show how to do so, for rare cases where there's no better way.

As you can see, all I did was create the container with a *DITestConfiguration* instance instead of a *DIConfiguration* instance, exposing three *getters* to help me workaround the mock injecting issue.</br>
Note that's I've added a third mail service, demonstrating how easy it is. :grin:

The *RobustMailEngine* was not mocked, because there was no real reason to do so, but it could have been easily replaced with a mock or a spy.

My test class behaved exactly like my main app, except for the services being mocks instead of real objects.

You can check out the code for this part of the tutorial in [Github][0].

**:wave: See you in the next part of this tutorial :wave:**

[0]: https://github.com/TomerFi/dependency-injection-java-part3-tutorial
[1]: {{ '../2020-08-08-dependency-injection-in-java-is-easy-part-1.md' | url }}
[2]: {{ '../2020-08-10-dependency-injection-in-java-is-easy-part-2.md' | url }}
