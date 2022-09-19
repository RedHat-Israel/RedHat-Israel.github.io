---
title: Ways to replace apache.commons.configuration in your project
description: |
  In this post I describe solutions to replace the usage of apache.commons.configuration and
  describe my implementation of it.
date: 2022-09-15
dir: ltr
author:
  name: Dana Elfassy
  jobTitle: Software Engineer
tags:
  - properties
  - apache
  - apache commons
  - apache.commons.configuration
layout: layouts/post.njk
---
If you’re using *apache.commons.configuration* to manage *.properties* files in your project, you’re probably facing the following problem:
*Apache.commons.configuration* depends on *apache.common.logging* which is included in *maven:3.5*, but was removed from *maven:3.6*.
Thus, if you want to upgrade you will need to find a different way to parse your properties.

Java offers the *java.util.Properties* class (see https://docs.oracle.com/javase/tutorial/essential/environment/properties.html), which is a subclass of *java.util.Hashtable*.
It maintains a list of keys and values, both are of type String, and provides methods for the following operations:
Loading and saving the properties, getting a value by key, listing the keys and values, enumerating over the keys, and the methods inherited from the *Hashtable* class.

## But what if our data is complex?
If we have nested properties *(i.e `food.apple=red`, `food.icecream=vanilla`, `drink.milk=soy`, `drink.soft=coke`)* how will we find all of the information about the main key (*food*, in this example)?
In order to retrieve the complete value we will need to iterate over the entire *Hashtable*, searching for all of the keys that contain `food.`.

Here comes the biggest advantage of using *apache.commons.configuration*-
It offers a generic configuration interface to read data from a variety of sources, and access to single and multi-valued configuration parameters.

When I started working on removing the dependency on *apache.commons.configuration*, I figured that since the properties we use are nested, I should see which methods of *apache.commons.configuration* we are actually using, and then I tried to mimic the original implementation. It was very tricky as I faced a whole chain of inheritance and interfaces to implement.
After already putting some work into it, I decided to drop it all and go with a different approach. The main thing I had to handle was being able to set the nested properties properly.
I decided to save the properties into a *HashMap* that stores *String* for the key, and *JsonNode* for the value.
That way I could set and get each property by its main key easily, and get the specific data of a specific secondary key if needed. For other operations I used the *HashMap’s* builtin methods.

Here’s a snippet of my implementation for storing the data from the .properties file, where I used `com.fasterxml.jackson` for handling the JsonNode:

```java
private void populateProperties(File file) throws IOException {
    ObjectMapper mapper = new ObjectMapper();
    List lines = Files.readAllLines(file.toPath());
    Map<String, String> allProps = new HashMap<>();
    for (String line: lines) {
        if (line.contains("=")) {
            allProps.put(line.split("=")[0], line.split("=")[1]);
        }
    }
    allProps.forEach((k, v) -> {
        String[] mainKey = k.split("\\.");
        if (this.props.get(mainKey[0]) != null) {
            JsonNode oldNode = this.props.get(mainKey[0]);
            ((ObjectNode) oldNode).put(mainKey[1], v);
            this.props.put(mainKey[0], oldNode);
        } else {
            ObjectNode node = mapper.createObjectNode();
            node.put(mainKey[1], v);
            this.props.put(mainKey[0], node);
        }
    });
}
```

When choosing to use this implementation, we need to handle the case of an IO Exception. That is a small price compared to the convenience of maintaining the nested properties in a simple format.

To conclude, if you need to replace *apache.commons.configuration*, you can either use Java’s *Properties* class, or decide on your own implementation — preferably use a data structure to handle your *.properties* file.  
Each method has its own drawbacks.  
Using the *Properties* class will be most suitable for simple key-value pairs, while for nested data I’d recommend using a data structure where the key stores the main key, and the value will hold a *JsonNode* that will store the secondary keys and their values.

