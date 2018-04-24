---
layout: post
title: "My Preprints #1: Dirty Period Finding"
date: 2017-06-28 12:10:10 pm PST
permalink: post/1712
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

A couple years ago, I was stuck on a question from [Mike & Ike](https://www.amazon.com/Quantum-Computation-Information-10th-Anniversary/dp/1107002176).
This was partially because I knew nothing about how to make circuits, and partially because as soon as I had the question figured out I made it harder:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/stuck-problem.png"/>

I was stuck on the initial problem long enough that I asked about it [on the computer science stack exchange](https://cs.stackexchange.com/questions/40933/creating-bigger-controlled-nots-from-single-qubit-toffoli-and-cnot-gates-with).
No one answered, I kept thinking about the problem, realized several things about breaking down CNOTs and incrementers, found a solution, and [wrote](/circuits/2015/06/05/Constructing-Large-Controlled-Nots.html) [some](/circuits/2015/06/12/Constructing-Large-Increment-Gates.html) [posts](/circuits/2015/06/22/Using-Quantum-Gates-instead-of-Ancilla-Bits.html) about it.
I also answered my own stack exchange question.

Fast-forward to a few months ago.
One of my co-workers was at a conference and contacted me to let me know I'd been [cited by one of the presentations](/assets/{{ loc }}/martin-slides.pdf).
I've never published a paper, so this was pretty surprising news.
Turns out they'd cited my stackexchange post!

The specific thing they cited was an incrementer, and a few related facts, that I had come up with as part of solving the textbook problem.
Previous incrementers either had a super-linear numbers of operations, or a linear number of ancilla.
My incrementer was linear-sized and used a single ancilla.
The ancilla didn't even need to be in a known state.

Usually the stuff I stumble onto on my own is decades old.
If my life was scripted, that would be one of the running jokes: Craig gets excited about something, bangs his head against it, figures out how to solve it, then finds out Dijkstra did it better back in the 1970s.
So I was pretty happy about having finally found something novel, and went to read the paper that cited me.

The paper associated with the presentation is ["Factoring using 2n+2 qubits with Toffoli based modular multiplication" by Häner et al.](https://arxiv.org/abs/1611.07995).
After reading it, I had a few nits.
For example, they said their constant-adder circuit needed n/2 dirty ancilla when really it only needed 1.
I contacted the authors to ask if they knew about this, and a few other improvements I had explained years ago in the blog posts.
After some back and forth with the authors, I realized that there was a way to cut the *total* number of qubits used by their circuits from 2n+2 to 2n+1.
I pointed that out, and they said... why not write a paper about it?
So, with some helpful co-workers to lean on for advice, I did!

On Monday, the preprint of my paper ["Factoring with n+2 clean qubits and n-1 dirty qubits"](https://arxiv.org/abs/1706.07884) went up on the arXiv.
Basically all I do in the paper is explain constructions that work when their ancilla are dirty (in an unknown state that must be restored), some techniques for finding these constructions, and how they fit together with Shor's algorithm to save a qubit and allow several more to be dirty.
Because I like to explain circuits visually, the paper is easily 30% diagrams.
There's even a meta-diagram describing all the diagrams.

I used [Quirk](/quirk) pretty extensively as an exploratory tool for coming up with and verifying constructions from the paper.
But Quirk is not really suited to gigantic circuits so, in order to test the whole thing from top to bottom, I created [a github repository with code that implements and tests the constructions using ProjectQ](https://github.com/Strilanc/PaperImpl-2017-DirtyPeriodFinding).
There were some hiccups using ProjectQ (e.g. they register atexit handlers that drown your test failures in a sea of useless text) but, with the power of excessive eggregious monkey-patching, I managed to work around most of the things that annoyed me.

Keep in mind that reducing the total number of qubits needed to perform Shor's algorithm from 2n+2 to 2n+1 is not the most important thing in the world.
Obviously.
But I do think the way I did it is interesting, and that those concepts are useful for making other actually-practical circuits.
So, if that sounds interesting to you, [give the paper a read](https://arxiv.org/abs/1706.07884).

[Discuss on reddit](https://www.reddit.com/r/algassert/comments/6k9csj/comment_thread_dirty_period_finding_my_first_paper/)
