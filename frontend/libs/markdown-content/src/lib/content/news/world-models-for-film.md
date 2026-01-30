---
title: World Models for Consistent AI Filmmaking
abstract: How to use World Models and 3D Rendering to Get Consistent AI Film Locations
date: 2026-01-30
---

# The "AI Film Trailer" Era

You've seen a lot of these: 

@youtube(pGn-1BKo3nY)

For the past year, it been relatively easy to make montages, "clip shows", and trailers, 
like this. 

Real stories have characters that need space to live, breathe, and interact. You don't just fast track 
everyone through a journey from point A to B and have that be the end of things [1]. Characters need to spend 
time in places, explore interpersonal relationships. They need to take time to think, talk, fight and argue, 
process emotions, and sometimes do absolutely nothing at all.

# Location and Blocking

We're all filmmakers at ArtCraft. The old school, photons-on-glass kind.

One of the biggest problems we've had over the past few years with AI video is giving our characters room to occupy. 
Setting them up on set, precisely controlling what's on screen, and maintaining consistency with their location. 
The majority of AI video right now looks like a series of disconnected clips, which results in 
AI film having a sort of "film trailer" feel to it. Lots of jumping around, very little 
continuity.

We've figured out how to overcome this problem. And in the spirit of "Show, Don't Tell", 
let me show you what we've discovered. You'll intuit what's up immediately:

@youtube(wJCJYdGdpHg)

# Text is a Coarse Grained Medium

Here's a simple Nano Banana Pro prompt:

![Example gif](./images/blog/sam4.png)

> Sam Altman in a room. He sits at a desk, looking towards a desktop computer on the left. 
> The room is dimly lit. The glow of a computer terminal, sitting in front of him bathes the room in blue light. 
> Behind him, there is a wall with a poster. There’s an AC/DC poster on the left, and a window on the right. 
> Through the window, there’s a view of moonlit trees. 

What happened to the location here? Why are none of these the same? Why do the locations of the poster, 
computer, window, and so forth keep changing?

Moreover, how do we adjust this? Iteratively prompting?

You already know the answer: text is a poor serialization of the physical world. Text-to-Image is coarse 
grained. It lacks the ability to convey precise physical attributes and spatial relationships.

This isn't an accident. Most Image-to-Video (I2V) inputs have been created from text sources. 
Outside of proper nouns, text has limited ability to convey notions of location. It doesn't 
store any physical attributes, it can't track relative positions between objects, and it's 
obtuse to describe spatial relationships and appearance.

In *"film language"*, even the camera's relationship to the characters conveys meaning.

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

[1] Unless you're Game of Thrones...
