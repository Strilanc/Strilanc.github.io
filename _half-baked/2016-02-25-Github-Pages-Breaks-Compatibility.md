---
layout: post
title: "Don't use Github Pages' Jekyll Support"
date: 2016-02-24 11:30:00 EST
categories: meta
comments: true
---

Last month, GitHub announced they were making [github pages "faster and simpler"](https://github.com/blog/2100-github-pages-now-faster-and-simpler-with-jekyll-3-0).

Here's my take on a more appropriate title for the announcement: "Simplifying Github Pages **By Breaking Your Content**".

They dropped support for two Markdown engines:

> **Starting May 1st, 2016, GitHub Pages will only support [kramdown](http://kramdown.gettalong.org/), Jekyll's default Markdown engine.** If you are currently using [Rdiscount](https://github.com/davidfstr/rdiscount) or [Redcarpet](https://github.com/vmg/redcarpet) we've enabled kramdown's GitHub-flavored Markdown support by default, meaning kramdown should have all the features of the two deprecated Markdown engines, so the transition should be as simple as updating the Markdown setting to `kramdown` in your site's configuration (or removing it entirely) over the course of the next three months.

and also dropped support for a highlighter:

> GitHub Pages now *only* supports [Rouge](https://github.com/jneen/rouge), a pure-Ruby syntax highlighter, meaning you no longer need to install Python and Pygments to preview your site locally. If you were previously using Pygments for highlighting, the two libraries are feature compatible, so we'll swap Rouge in for Pygments when we build your site, to ensure a seamless transition.

Notice their assertion that "the transition should be as simple as updating the Markdown setting".
I found out how accurate *that* was first-hand.
Half of my posts broke.
Literally *half*.
Sometimes it was broken LaTeX, sometimes it was broken code blocks, and sometimes the content just cut off mid-post.

You see, the devil is in the details when it comes to things like markdown engines.
They all have their own little quirks, and people have this funny way of [starting to rely on quirks](https://xkcd.com/1172/).
Switching to a different markdown engine, without creating a ton of work, requires more than just feature parity; it requires *quirk parity*.

For example, Redcarpet and Kramdown interact differently with underscores inside of LaTeX.
As a result, subscripted expressions like $A\_b$ turned into $A\\\_b$.
I could list a dozen other stupid examples like that, but that's not the point of this post.

The point of this post is that Github just demonstrated that you shouldn't use Github Pages + Jekyll as a blogging platform.

Dropping support for markdown engines breaks backwards compatibility.
Backwards compatibility is a non-negotiable must-have feature for a blogging platform.
If they broke it once, why should you trust them not to break it again?
If you want your content to render correctly, long-term, don't Github to do it.

# Workaround

I'll be continuing to use Jekyll (which is great!) and Github pages (which is great!), but from now on I'll be generating the pages on my machine instead of delegating that responsibility to Github.



# Summary

If you don't enjoy periodically fixing years of content, don't use GitHub Pages + Jekyll.
