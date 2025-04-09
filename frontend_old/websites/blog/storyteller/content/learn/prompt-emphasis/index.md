+++
title = "Prompt Emphasis Guide"
slug = "prompt-emphasis"
date = "2024-08-08"
template= "blog_template/page.html" 
authors = ["Heart Ribbon"]

[taxonomies]
categories = ["tutorial"]

[extra]
cover_image = "/learn/prompt-emphasis/emphasiscover.png"
+++

# Prompt Emphasis
You can control how much attention is given to certain words in your prompts using parentheses and brackets.
To emphasize a word, use parentheses. For example, (red hair:1.5) makes 'red hair' more prominent. You can also use more parentheses for extra emphasis, like ((((red hair)))).

To de-emphasize a word, use brackets. For example, [red hair:-1.5] makes 'red hair' less noticeable. You can also use more brackets for extra de-emphasis, like [[[[red hair]]]].

Recommended values are 1.1-1.5 for emphasis and -1.1 to -1.5 for de-emphasis. 
When using the Negative Prompt Field use positive weights to emphasize the negative effect instead of brackets.



