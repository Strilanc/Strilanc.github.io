---
layout: post
title: "Don't Trust the DOM"
date: 2014-06-03 11:30:00 EST
categories: software
---

A [long-known](www.crockford.com/ec/lessons.html) maxim is "Don't trust the client". Web browsers, being clients, are no exception. *Usually* they'll run the javascript you provide, hide the hidden content you include, validate information you requested, and display the ads you piggy-backed along... but that's not *guaranteed*. Users may do anything to the content and functionality you expose.

Recently I've started noticing a problem analogous to, but less serious than, trusting the client: writing javascript that ends up in bad states because it relied on the browser doing or not doing certain things. I'm going to call this "trusting the DOM" as a shorthand. This *can* be a security issue, but it's more likely to create usability problems.

**The Damn DOM**

Suppose you want to show a dialog and stop users from interacting with the rest of your site while the dialog is showing (i.e. you want the dialog to be [modal](http://en.wikipedia.org/wiki/Modal_window)). You achieve this by adding a semi-transparent div, sized to cover the whole window, behind the dialog but overlaying everything else. Presumably this prevents the user from touching the background content while the dialog is showing.

Except that being *covered* is not the same as being *disabled*. For example, nothing is stopping the user from using their keyboard to tab into the background controls and interact with them. You might scoff at overlooking this but, of the [top](http://blog.raventools.com/create-a-modal-dialog-using-css-and-javascript/) [three](http://javascript.about.com/library/blmodald1.htm) [search](http://getbootstrap.com/javascript/) results for "modal dialog javascript", only the third stops me from tabbing around the background while the modal dialog is showing.

A more esoteric way the overlay can break is due to add-ons. A user may trim your site with [Remove-It-Permanently](https://addons.mozilla.org/en-US/firefox/addon/remove-it-permanently/), accidentally match your overlay with a too-broad rule, and not even realize the dialog was supposed to be modal. Worrying about all the ways add-ons can ruin your site is not practical, except maybe for the most popular ones (like adblock), but add-ons do make a nice counter-example to "there's no way for X to happen" for all X.

Another situation where trusting the DOM can bite you is reacting to input. For example, suppose you want to give dynamic is-it-valid hints as a user enters some text. You write a function to update the hint, and give it to the `onchange` handler. Then you realize that handler only triggers when the focus leaves text box, not dynamically while the user is typing. So you change the handler to `onkeyup`. Except users can avoid that event by holding a key and tabbing away before releasing it, so you add the `onchange` handler back in. Which works great until someone uses their mouse to paste text via the right-click context menu. You need an `onpaste` handler for that. Now you're finally- nope, [you forgot one](http://stackoverflow.com/a/2885716).

Imagine that the dynamic validation code is enabling/disabling a submit button based on whether the input is valid. Should the code that runs when the user taps the button redundantly run that validation, or should it implicitly assume the validation has ran based on the fact that the submit button is enabled? Doing a redundant check seems wasteful and needlessly complex, but if we missed an event handler then validation may *not* have run and we'll do wrong things.

Basically, omitting the validation means you're trusting the DOM, because you're relying on it to run the validation code at the right times. Explicitly running the validation before submitting makes the code a *little* more complex, but makes the background assumptions *way, WAY* simpler. For example, we're not catching "user talking into text box" events that don't exist yet. Can that bite us? An explicit check lets us fail gracefully in response to the DOM doing whatever the hell it wants.

**Summary**

When writing javascript, don't assume the DOM will enforce constraints for you. Explicitly check them.

Note that I don't consider myself experienced with the quirks of browsers. Maybe there's underlying patterns that you *can* actually rely on, but my experience so far has been the opposite. Anytime I write javascript that doesn't verify assumptions I made about how the DOM can behave, I later realize there's a way to break those assumptions.
