---
title: Decompose Conditionals and its tradeoffs
canonical: https://dev.to/tbrisker/decompose-conditionals-and-its-tradeoffs-36ba
description: >
  When used correctly, decomposing conditionals is a useful refactoring method that can make our code easier to
  understand, easier to test, and more reusable. But it has its costs.
date: 2022-12-18
dir: ltr
lang: en
author:
  name: Tomer Brisker
  jobTitle: Principal Software Engineer
tags:
- refactoring
- cleancode
- go
- codequality
---

# Decompose Conditionals and its tradeoffs

Decomposing conditionals is a common refactoring strategy.
The main idea is that a complex `if... else...` statement is difficult to follow and understand, and can be decomposed into smaller pieces. But it does not come without a cost.

---
Instead of having multi-line conditions, the decompose conditional pattern states that conditional logic should be extracted to 3 separate methods, one for each part of the statement: one for the condition itself, one for the "true" branch and one for the "false" branch.

For example, if your code looks like this:

```go
....
if baby.IsAwake() && baby.State == "Crying" && baby.TimeSinceLastMeal > 3 * time.Hour {
    if baby.Diaper.IsDirty() {
        baby.ChangeDiaper()
    }
    bottle := NewBabyBottle()
    bottle.FillWater()
    bottle.AddMilkFormula()
    bottle.Shake()
    baby.Feed(bottle)
    baby.Burp()
} else {
    baby.Cuddle()
    baby.Play()
}
....
```

Decomposing the conditional would mean refactoring your code to look something like this:

```go
....
if baby.IsHungry() {
    baby.ChangeAndFeed()
} else {
    baby.FunTime()
}
....
func (baby *Baby) IsHungry() {
    return baby.IsAwake() && baby.State == "Crying" && baby.TimeSinceLastMeal > 3 * time.Hour
}

func (baby *Baby) ChangeAndFeed() {
    if baby.Diaper.IsDirty() {
        baby.ChangeDiaper()
    }
    bottle := NewBabyBottle()
    bottle.FillWater()
    bottle.AddMilkFormula()
    bottle.Shake()
    baby.Feed(bottle)
    baby.Burp()
}

func (baby *Baby) FunTime() {
    baby.Cuddle()
    baby.Play()
}
```

This change makes the main method flow much simpler to understand and follow, by abstracting away the complex logic that might not always be relevant for the reader.

Extracting the logic to separate methods also allows us to more easily reuse or refactor our code in the future, as the logic is better encapsulated. For example, once our baby starts eating solid foods, we can modify the `ChangeAndFeed` method to reflect that easily, without needing to touch any code that is not directly related to this change, and the same is true if the logic for checking if the baby is hungry ever changes - for example, once our baby starts eating at 4 hour intervals.

Another benefit from decomposing the conditional is that we can now write unit tests for the decomposed methods, ensuring that our logic is correct, and that it will not break due to future changes.

---

If decomposing conditionals is so great, than why don't we always do it?
Like everything in software engineering, there is a tradeoff.

When extracting logic to a separate method, there is additional overhead. While the overhead of a function call in most languages is minimal (except in very extreme cases, such as deep recursion or tightly resource-constrained environments), the overhead for the code reader is not. Software engineers spend much more time reading code than they do writing code, and we should always think about how we can make our code more readable. Jumping back and forth between method definitions and calls adds complexity for the reader who is interested in understanding what the code does, for example when reviewing or debugging it.

Take the following code for example. Which version is easier to understand and follow, this one:

```go
if len(orgIDs) > maxItems || len(userIDs) > maxItems {
   return errors.BadRequest("Too Many Items")
}
```

or this one?
```go
if validateIDsSize(orgIDs, userIDs) {
    return tooManyItems()
}
....
func validateIDsSize(ids ...[]string) bool {
	for _, idGroup := range ids {
		if len(idGroup) > maxItems {
			return true
		}
	}
	return false
}

func tooManyItems() error {
    return errors.BadRequest("Too Many Items")
}
```

The keyword here is *Complexity*. The question we should be asking is: "Is this piece of code complex enough that extracting it to a separate method will make it more readable or not?"
If the answer is that the code is clear enough to understand inline, we should avoid decomposing it to a separate function unless there is a very good reason to do so - such as a need for re-usability or testing.

---

The second example also shows another common risk we face when extracting logic to separate methods: a premature attempt at generalization. While the first version only checks two specific values, the second one tries to create a generic function that can accept any number of values.

The generic version of the check creates additional complexity to handle all possible cases, instead of a simpler check to handle the specific case we are facing.
If we have many similar cases with different values being checked, it could make sense to create a generic function that handles all cases.
However, we often find a generic function being only used in one or two places, in which case - the added complexity usually doesn't pay off when compared to a non-generic version.

We also don't yet know that all potential future cases will behave the same. For example, what if in the future different values will have different limits? The generic implementation assumes all values are limited by `maxItems` - meaning if this assumption ever changes, this method will become even more complex. A non-generic implementation is easier to change as we discover new requirements.

---
When used correctly, decomposing conditionals is a useful refactoring method that can make our code easier to understand, easier to test, and more reusable. However, before we approach refactoring our code, we must always keep in mind our end goals and consider the possible tradeoffs in each approach.
