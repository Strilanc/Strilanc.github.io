---
layout: post
title: "Don't Use Github Pages' Jekyll Support"
date: 2016-02-25 11:30:00 EST
categories: meta
---

A few weeks ago, GitHub announced ["GitHub Pages now faster and simpler with Jekyll 3.0"](https://github.com/blog/2100-github-pages-now-faster-and-simpler-with-jekyll-3-0).
I would have titled the post... differently.
Something like "Notice: upcoming breaking changes to github pages" or "We don't understand [how important backwards compatibility is](http://www.joelonsoftware.com/articles/APIWar.html)".

# Simply Breaking Changes

The "simpler" in the title is bullshit marketing-speak for "removing features".
They dropped support for two Markdown engines:

> **Starting May 1st, 2016, GitHub Pages will only support [kramdown](http://kramdown.gettalong.org/), Jekyll's default Markdown engine.** If you are currently using [Rdiscount](https://github.com/davidfstr/rdiscount) or [Redcarpet](https://github.com/vmg/redcarpet) we've enabled kramdown's GitHub-flavored Markdown support by default, meaning kramdown should have all the features of the two deprecated Markdown engines, so the transition should be as simple as updating the Markdown setting to `kramdown` in your site's configuration (or removing it entirely) over the course of the next three months.

and also for a highlighter:

> GitHub Pages now *only* supports [Rouge](https://github.com/jneen/rouge), a pure-Ruby syntax highlighter, meaning you no longer need to install Python and Pygments to preview your site locally. If you were previously using Pygments for highlighting, the two libraries are feature compatible, so we'll swap Rouge in for Pygments when we build your site, to ensure a seamless transition.

Lying through their teeth in the title is pretty bad.
But the real laugh is their assertion (quoted above) that "*the transition should be as simple as updating the Markdown setting*".
I found out how accurate *that* was first-hand.
Half of my posts broke.
Literally *half*.
Sometimes it was broken LaTeX, sometimes it was broken code blocks, and sometimes the content just cut off mid-post.

You see, the devil is in the details when it comes to things like markdown engines.
They all have their own little quirks, and people have this funny way of [starting to rely on quirks](https://xkcd.com/1172/).
Switching to a different markdown engine, without creating a ton of work, requires more than just feature parity; it requires *quirk parity*.

For example, Redcarpet and Kramdown interact differently with underscores inside of LaTeX.
When I put equations with subscripts in old posts they looked like $A\_b$, but with the engine change they turned into $A\\\_b$.
I could list a dozen other stupid examples like that, but the minutia of what broke isn't the point of this post.

The point of this post is that backwards compatibility is a non-negotiable must-have feature for a blogging platform.
It's what keeps your content rendering correctly, long-term, without creating stupid busy work.

Github dropped support for markdown engines, and broke backwards compatibility.
And if they broke it once, why should you trust them not to break it again?
Therefore Github pages + Jekyll is not a reliable blogging platform.
If you want your content to render correctly, long-term, don't trust Github to do it.

# Workaround

I'll be continuing to use Jekyll (which is great!) and Github pages (which is great!), but from now on I'll be generating the pages on my machine instead of delegating that responsibility to Github.

This makes my blogging workflow more complicated, but it's not *too* bad.
Basically, the master branch of the blog's repository will now contain Jekyll's output (what ends up in the `_site` folder, [plus an empty `.nojekyll` file](https://github.com/blog/572-bypassing-jekyll-on-github-pages)) instead of Jekyll's input.
I'll have to keep the source on a separate branch, or in a separate repository.

If you're reading this, then it worked!

# Summary

If you don't enjoy periodically fixing years of content, don't use GitHub Pages + Jekyll.


# Comments

<div style="background-color: #EEE; border: 1px solid black; padding: 5px; font-size: 12px;">
  <div style="border: 1px solid gray; padding: 5px; margin: 5px;">
    <strong>Knarf</strong> - Feb 26, 2016
    <br/>

    I guess you could setup Travis CI to auto build your pages for you and keep the Jekyll version consistent?
  </div>
  <div style="border: 1px solid gray; padding: 5px; margin: 5px;">
    <strong>Andrej</strong> - Feb 23, 2016
    <br/>

    Had the same annoyance. I had to manually go through all my past posts and edit them so that Mathjax works properly. My syntax highlighting also needed fixing. Several hours of work, was not too happy.
  </div>
</div>
