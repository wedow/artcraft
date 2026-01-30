---
title: World Models for Consistent AI Filmmaking
abstract: How to use World Models and 3D Rendering to Get Consistent AI Film Locations
date: 2026-01-30
---

# "AI Slop" 

You've seen a lot of these: 

@youtube(QMtGiLJJVd0)

For the past year, it been relatively easy to make "clip shows", trailers, 
and montages like this. 

But characters need space to live, breathe, and interact. They don't just journey from point 
A to B and that's the end of the story. They spend time in places. They deal with 
problems, they explore interpersonal relationships, they think, they overcome.

In *"film language"*, even the camera's relationship to the characters conveys meaning.

# Location

We're all filmmakers at ArtCraft. The old school, photons-on-glass kind.

One of the biggest problems we've had over the past few years with AI video is precisely controlling what's 
on screen and maintaining consistency of location. 
The majority of AI video right now looks like a series of disconnected clips, which results in 
AI film having a sort of "film trailer" feel to it. Lots of jumping around, very little 
continuity.

We've figured out how to overcome this problem. Let me show (don't tell) you what we've discovered. 
You'll intuit what's up immediately:

@youtube(wJCJYdGdpHg)

# Text is Coarse Grained

Let me try a single, rather elaborate prompt for Nano Banana Pro:

![Example gif](./images/blog/sam4.png)

> Sam Altman in a room. He sits at a desk, looking towards a desktop computer on the left. 
> The room is dimly lit. The glow of a computer terminal, sitting in front of him bathes the room in blue light. 
> Behind him, there is a wall with posters. There’s an AC/DC poster on the left, and a window on the right. 
> Through the window, there’s a view of moonlit trees. 

What happened to the location here? Why are none of these the same? Why do the locations of the poster, 
computer, window, and so forth keep changing?

You already know the answer: text is a poor serialization of the physical world. Text-to-Image is coarse 
grained. It lacks the ability to convey precise physical attributes and spatial relationships.

This isn't an accident. Most Image-to-Video (I2V) inputs have been created from text sources. 
Outside of proper nouns, text has limited ability to convey notions of location. It doesn't 
store any physical attributes, it can't track relative positions between objects, and it's 
obtuse to describe spatial relationships and appearance.

- Example image

Most people have been stuck using this.

Even a thousand words couldn't make these two images match.

-----
They need pauses. 
They need to occupy spaces, have relationships to other characters, walk around, 
sit and think. You can't do that with disconnected clips in series.

It's hard to tell a story like this if we can't even understand where the characters are.

But that's not telling a story. That's not having your actors live, breathe, 
and occupy a space.

-----

# Images are Incomplete

Even image references and I2V struggle with location consistency. Images convey no information about what's just outside the frame,
so moving the camera results in hallucinations and inconsistencies.

- Example image

--- 

@youtube(pGn-1BKo3nY)


# 3D to the Rescue

One of the best tools for consistency is 3D. You can position your characters and props in a "3D set", and then move the "camera" to any angle, maintaining strong consistency throughout.

# 3D Kit Bashing

... 

# World Models Make This Easy

...

# Object Generation for Props

...

# Putting it all Together

...

# ArtCraft: Free and Open 3D Filmmaking

ArtCraft in its entirety is available on [Github (please star us!)](https://github.com/storytold/artcraft), 
and we have [downloads for Windows and Mac](/download), with Linux support coming soon.

You can pay us for image and video compute, or you can bring your own keys and subscriptions
without needing to pay us a dime. We offer the ability to log in with MidJourney, Grok, 
OpenAI/Sora, and other providers. We'll be adding FAL, Replicate, and Google Gemini shortly,
and local GPU support is coming soon (subscribe to stay updated).

p.s. did you catch the typo(s)? The pixels may be generated, but the text was artisinally hand-crafted.

&mdash; Brandon Thomas, that one silly engineer in your drama club making you Meisner to Tolkien.
