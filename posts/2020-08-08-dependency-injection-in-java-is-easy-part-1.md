---
title: Dependency Injection in Java is easy - Part 1 - Merely a design pattern
description: Learn about dependency injection in Java and how can we use it to achieve Inversion of Control.
canonical: https://dev.to/tomerfi/dependency-injection-in-java-is-easy-part-1-a-mear-design-pattern-2l8
date: 2020-08-08
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
  coverImage: https://source.unsplash.com/_SgRNwAVNKw/640x426
  coverImageAlt: an image of some js code
series: Dependency Injection in Java is easy
seriesDescription: A series of articles for making Dependency Injection in Java easy.
---

*Dependency Injection* is a development concept that sounds terrifying at first. :fearful:</br>
Well... not just at first...</br>
At a second look, it's even more confusing, when you realize *Dependency Injection* is an *Inversion of Control* technique.</br>
:confused:

Well... I'm here to tell you (and show you):</br>
*Dependency Injection* is not terrifying nor confusing.</br>
On the contrary, it's quite simple and easy, it can make your code *more modular and robust, and less error-prone*.

This will be a multiple parts tutorial,</br>
This part, as the heading suggests will focus on *Dependency Injection* as a design pattern.</br>
The next parts will exemplify how to leverage *Dependency Injection* with the various frameworks and techniques within those frameworks.

You can check out the code for this part of the tutorial in [Github][0].

The next parts of this tutorial series:

- [Part 2 - Leveraging with Google Guice][1]
- [Part 3 - Leveraging with Spring Context][2]

## 1. What is Inversion of Control

Let's visit the *wiki* definition,</br>
[Inversion of Control](https://en.wikipedia.org/wiki/Inversion_of_control) - "IoC inverts the flow of control as compared to traditional control flow".

So what is a *traditional control flow* :question:</br>
It's simple: :a: :arrow_right: :b: :arrow_right: :o2:,</br>

:a: is the *customer* invoking :b:, the *provider* that uses :o2:, the *service* for performing some kind of action.

As you can see:

- :b: **controls** :o2:
- :b: **depends-on** :o2:
- :b: **is tightly-coupled with** :o2:.</br>

Why would we want that :question:</br>
The only thing :b: requiers from :o2: is performing some kind of action,</br>
there is no reason for :b: to even know about :o2: :grey_exclamation:</br>

So, How do we *invert the flow of control* here, how can we make :a: control :o2: for us :question:</br>

Basically we need to do: :a: (:o2:) :arrow_right: :b: :arrow_right: :grey_question:</br>

Now, :a: is the customer, describing :o2:, the service and invoking :b:, the provider for performing some kind of action with the given service.

As you can see:

- :b: **has no control of** :o2:
- :b: **does not depends-on** :o2:
- :b: **is loosely-coupled with** :o2:.</br>

:b: doesn't care who :o2: is as long as it binds to the contracts needed for performing the necessary action (hint: abstractions :wink:).

So... how do we achieve that :question:</br>
How do we get :a: to **inject the dependency** :o2: into :b: :question:

This is, of course, addressed using the *technique* **Dependency Injection** :grey_exclamation:

## 2. What is Dependency Injection

Again, let's visit the *wiki* definition,</br>
[Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection) - "dependency injection is a technique in which an object receives other objects that it depends on."

So..., **Dependency Injection** is a **Design Pattern**, doesn't sound that scary now right :question:</br>
:smiley:

Finally, let's code...

## 3. Mail Collector App

Let's build an app that collects mail from both *Gmail* and *Microsoft*.

### 3.1. Contracts

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

### 3.2. Implementations

#### 3.2.1. Mail

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

#### 3.2.2. Mail Services

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

#### 3.2.3. Mail Engine

Now comes the fun part...</br>
:grinning:

First let's build the concrete `MailEngine` in a *tightly-coupled* manner:

```java
public final class TightMailEngine implements MailEngine {
  private final MailService gmailService;
  private final MailService microsoftService;

  public TightMailEngine() {
    gmailService = new GmailService();
    microsoftService = new MicrosoftService();
  }

  @Override
  public List<Mail> getAllMail() {
    return concat(
            gmailService.getMail().stream(),
            microsoftService.getMail().stream())
        .collect(toList());
  }
}
```

Do you see why this is called *tightly-coupled* :question:</br>
The `TightMailEngine` is tightly depends on both `GmailService` and `MicrosoftService` :grey_exclamation:</br>

This is actually :poop: code for two main reasons:

1. Testing this code is very hard, invoking the *getAllMail* method will invoke the **real** *Gmail* and *Microsoft*'s services.</br>
   Of course, you can probably work your way around it, maybe you can test inside an isolated environment and intercept the outgoing communication or something...</br>
   But this is tedious and error-prone work that will in no way be worth the time you'll spend on it.

2. Adding another service will require modifications to `TightMailEngine`.</br>
   You'll have to add another `MailService` field, instantiate it inside the constructor and add to the concatenation in *getAllMails*.</br>
   It is never a good practice to modify a working class, it's a path for breaking the working code.

First thing's first, let's get rid of the first reason by rewriting the engine in a more *loosely-coupled* manner and fit it into the *dependency injection design pattern*.</br>
It's easy:

```java
public final class LooseMailEngine implements MailEngine {
  private final MailService gmailService;
  private final MailService microsoftService;

  public LooseMailEngine(final MailService setGmailService, final MailService setMicrosoftService) {
    gmailService = setGmailService;
    microsoftService = setMicrosoftService;
  }

  @Override
  public List<Mail> getAllMail() {
    return concat(
            gmailService.getMail().stream(),
            microsoftService.getMail().stream())
        .collect(toList());
  }
}
```

Do you see why this is called *loosely-coupled* :question:</br>
The `LooseMailEngine` doesn't know, nor is it depends on, neither `GmailService` or `MicrosoftService` :grey_exclamation:</br>
In this manner, you allow for your dependencies to be injected by whoever instantiated the engine, hence **Dependency Injection**.

Note that you've also achieved **Inversion of control**, the control of your dependencies relies upon your invoker.</br>
You can replace either `GmailService` or `MicrosoftService` with another implementation,</br>
as long as it binds to the contract abstracted by `MailService`, `LooseMailEngine` won't know the difference.

From a testing perspective, you can now easily inject mocks for both `GmailService` and `MicrosoftService`,</br>
and not only **prevent the real services from being invoked**, but you can also verify the expected behavior.

Now, let's rewrite `LooseMailEngine` and make it more robust so we can also get rid of the second reason for this code being :poop: :

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

Now, the invoker of the engine, not only controls the services themselves, but it can also add or remove services and with no modifications required in the `RobustMailEngine`.</br>
:sunglasses:

### 3.3. The Main App

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
    var engine = new RobustMailEngine(List.of(new GmailService(), new MicrosoftService()));

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

Now, Let's test the code...

## 4. Unit Tests

Testing this code is easy, although normally I would recommend testing smaller units,</br>
in this case, to get my point across, I'm testing the *engine* and the *app* combined while mocking the *services*:

```java
public final class MailCollectorAppTest {
  private MailService gmailServiceMock;
  private MailService microsoftServiceMock;
  private MailService thirdServiceMock;

  private RobustMailEngine robustEngine;
  private MailCollectorApp sut;

  private Faker faker;

  @BeforeEach
  public void initialize() {
    faker = new Faker();

    gmailServiceMock = mock(MailService.class);
    microsoftServiceMock = mock(MailService.class);
    thirdServiceMock = mock(MailService.class);

    robustEngine =
        new RobustMailEngine(Set.of(gmailServiceMock, microsoftServiceMock, thirdServiceMock));
    sut = new MailCollectorApp(robustEngine);
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

You can check out the code for this part of the tutorial in [Github][0].

The next parts of this tutorial series are [Part 2 - Leveraging with Google Guice](https://dev.to/tomerfi/dependency-injection-in-java-is-easy-part-2-leveraging-with-google-guice-6i4) and [Part 3 - Leveraging with Spring Context](https://dev.to/tomerfi/dependency-injection-in-java-is-easy-part-3-leveraging-with-spring-context-gcc).</br>
Both accomplish the same with a different *di framework*.

**:wave: See you in the next part of this tutorial :wave:**

[0]: https://github.com/TomerFi/dependency-injection-java-part1-tutorial
[1]: {{ '../2020-08-10-dependency-injection-in-java-is-easy-part-2' | url }}
[2]: {{ '../2020-08-14-dependency-injection-in-java-is-easy-part-3' | url }}
