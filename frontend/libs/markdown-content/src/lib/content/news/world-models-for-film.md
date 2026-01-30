---
title: World Models for Consistent AI Filmmaking
abstract: How to use World Models and 3D Rendering to Get Consistent AI Film Locations
date: 2026-01-30
---

# The "AI Film Trailer" Era

You've seen a lot of these: 

@youtube(pGn-1BKo3nY)

For the past year, it been relatively easy to make montages, "clip shows", and trailers
like this. 

Good stories have characters that occupy real spaces. They have room to live, breathe, and interact. 

You don't just fast track everyone through a journey from point A to B and have that be the end of things [1]. 
Characters need to spend time in places, to explore interpersonal relationships, to overcome challenges. 
They need places to think, talk, fight and argue, process emotions, grow, and sometimes do absolutely nothing 
at all.

Stories need locations. They're a first class citizen in storytelling.

# Location and Blocking

We're all filmmakers at ArtCraft. The old school, photons-on-glass kind.

One of the biggest problems we've had over the past few years with AI video is giving our characters room to occupy. 
Setting them up on set, precisely controlling what's on screen, and maintaining consistency with their location. 
The majority of AI video right now looks like a series of disconnected clips, which results in 
AI film having that "film trailer" montage feel to it. Lots of jumping around, very little 
continuity.

We've figured out how to overcome this problem. And in the spirit of "Show, Don't Tell", 
let me show you what we've discovered. You'll intuit how this technique works immediately:

@youtube(wJCJYdGdpHg)

# Moving the Camera is Important

In *"film language"*, the camera's relationship to the characters conveys meaning. Sometimes we want to give the 
viewer a warm and friendly perspective, or perhaps frame the relationship between two different characters and 
imply a certain power dynamic.

Sometimes it's just important to show the location so the viewer can settle in. So the setting feels lived in and 
the viewer is immersed in it alongside our characters.

# Text is a Coarse Grained Representation

Here's a simple Nano Banana Pro prompt:

> Sam Altman in a room. He sits at a desk, looking towards a desktop computer on the left. 
> The room is dimly lit. The glow of a computer terminal, sitting in front of him bathes the room in blue light. 
> Behind him, there is a wall with a poster. There’s an AC/DC poster on the left, and a window on the right. 
> Through the window, there’s a view of moonlit trees. 

And the results: 

![Hi Sam!](./images/blog/sam4.png)

What happened to the location here? Why are none of these the same? Why are the locations of the poster, 
computer, window, and so forth so imprecise? 

Moreover, how do we adjust this? Iteratively prompting?

You already know the answer: text is a poor serialization of the physical world. Text-to-Image is coarse 
grained. It lacks the ability to precisely convey physical attributes and spatial relationships. You can try, 
but you'll only get so much precision, and it'll never match the vision in your head.

# Images are Incomplete

There are multiple ways to move a camera in an image-to-image workflow. You can use a ControlNet, a LoRA, or even 
ask an instructive model nicely:

> Rotate the camera behind Sam Altman to show him from behind. Show the desk, computer screen, 
> and wall behind the desk. Show the door to the room. 

![Hi Sam!](./images/blog/sam4.2.png)

While the lighting and scene elements remain somewhat consistent, we're still ultimately left with the same 
issues we had with text-to-image. We can iterate on editing with words, but it's slow, tedious, and still 
imprecise.

(Why does the desk block the door? What is it even trying to do with that poster?)

# 3D to the Rescue

One of the best tools for consistency is 3D. You can position your characters and props in a "3D set", and then move the "camera" to any angle, maintaining strong consistency throughout.

![Hi Sam!](./images/blog/sam_previz.png)

Pick a "smart" model like GPT Image 1.5 or Nano Banana Pro to convert this previz into a photorealistic render (or any style - anime, sci-fi, whatever): 

![Hi Sam!](./images/blog/sam_gpt_image_1.png)

And after Nano Banana Pro lighting adjustments and upscaling (and showing it the previz again to restore the missing desk pad), we get this:

![Hi Sam!](./images/blog/sam_nbp2.png)

It's a great starting composition before calling "action" with a video model. (I'd adjust the framing, but I wanted to show under the desk as well as bookcase features.)


# 3D Kit Bashing and Greyboxing

You can use 3D kits to provide blocking and layout. You can also use 3D primitive shapes to create a "greybox" of your scene.

# Object Generation for Props

You can turn images into 3D prop objects using models such as Hunyuan 3D.

# World Models Make This Easy

The real star of this workflow is image-to-Gaussian Splat models, such as World Labs' Marble or Apple's Sharp. You can very quickly create a pleasing image of an intracate set in MidJourney, edit it in Nano Banana, then turn it into a fully navigable 3D scene.


# ArtCraft: Free and Open 3D Filmmaking

ArtCraft in its entirety is available on [Github (please star us!)](https://github.com/storytold/artcraft)

We have [downloads for Windows and Mac](/download), with Linux support coming soon.

You can pay us for image and video compute, or you can bring your own keys and subscriptions
without needing to pay us a dime. We offer the ability to log in with MidJourney, Grok, 
OpenAI/Sora, and several other providers. We'll be adding FAL, Replicate, and Google Gemini 
shortly, and local GPU support is coming soon (subscribe to stay updated).

&mdash; Brandon Thomas

[1] Unless you're Game of Thrones...
