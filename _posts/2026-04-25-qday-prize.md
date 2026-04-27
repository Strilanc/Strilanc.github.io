---
layout: post
title: "The predictable failure of the QDay Prize"
date: 2026-04-25 10:10:10 am PST
permalink: post/2601
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

# Update (April 26)

The competition runners have taken my criticism and my advice [(1)](https://x.com/apruden08/status/2048455780811354298) [(2)](https://x.com/FinnMurphy12/status/2048168004710473897) [(3)](https://x.com/apruden08/status/2048495961450946654).
They're looking for other ideas on how to incentivize open benchmarking of quantum cryptanalysis.
I also want open benchmarking, and also generally agree with Project11's mission and advocacy when it's done well.
I don't have an idea for how to make open benchmarking a thing... for the near term, a blameless post-mortem of the competition could be a constructive next step.

---

---

On May 20th of last year, I received an email asking me to make a submission to the "[QDay Prize](https://www.qdayprize.com/)".
It was a competition where whoever managed to solve the biggest problem using Shor's algorithm on current quantum computers would receive a prize of 1 bitcoin (around 77 thousand USD as of this writing).
Despite the large prize, I declined to make a submission.
I thought it was a terrible idea for a competition, with two showstopping issues in the basic premise.

The first showstopper is that Shor's algorithm requires error correction.
Current quantum computers experience on the order of one error per thousand gates, but cryptographically relevant instances of Shor's algorithm require billions of gates.
The only known way to cross this chasm is [quantum error correction](https://en.wikipedia.org/wiki/Quantum_error_correction).
There are [promising quantum error correction experiments being done](https://arxiv.org/abs/2408.13687), but ultimately quantum error correction is still a work in progress.
Participants in the competition would inevitably end up using non-error-corrected circuits, which have completely different costs and challenges and scaling properties.
In other words, the competition would be measuring something irrelevant.

The second showstopper is that it's too easy for Shor's algorithm to solve small problems by accident.
On this point, I was somewhat assuaged by the email mentioning

> [...] We understand this is not totally representative of how larger keys get broken, as there's no error correction yet, and **we'll only award the prize if quantum computers are used legitimately - i.e. no Falling With Style-style tricks.**

The "Falling With Style-style tricks" thing is a reference to my [April Fools paper in Sigbovik 2025](https://sigbovik.org/2025/proceedings.pdf#page=146).
In that paper, I jokingly claimed that I factored all numbers up to 255 with a quantum computer.
The joke is that it worked just as quickly when I replaced the quantum computer with a random number generator.
Basically, for small problems, Shor's algorithm succeeds regardless of how well your quantum computer works.
The computer working well only matters for big problems.
This makes judging a Shor's-algorithm-applied-to-small-problems competition extremely difficult.
In fact, as part of declining to particpate, I emphasized that this was a key risk.
I said:

> For the near future, the contribution of luck is going to massively outweigh any legitimate contribution of the quantum computer. So I suspect the winner in 2026 will be whoever did the best job at obfuscating how they made themselves unavoidably lucky. You're going to find yourself in a philosophical debate, with 100K$ on the line, over where exactly the line for a quantum computer "really" breaking a key is.

Anyways, a year went by, the competition ended, [a winner was chosen](https://blog.projecteleven.com/posts/project-eleven-awards-1-btc-q-day-prize-for-largest-quantum-attack-on-elliptic-curve-cryptography-to-date), and... **[the winner's code is a Falling with Style-style trick](https://github.com/yuvadm/quantumslop/blob/25ad2e76ae58baa96f6219742459407db9dd17f5/URANDOM_DEMO.md)**.
Github user [@yuvadm](https://github.com/yuvadm) ("Yuval Adam") checked what happens when the quantum calls in the prize submission are replaced with random calls, and the random results are indistinguishable from the quantum results.

Something I want to note in this otherwise very negative post: I looked over the submission's code and the circuit construction looks fine.
They're implementing the ELDPC circuit described in [Roetteler et al 2017](https://arxiv.org/abs/1706.06752).
That's a weird choice because there's been [better papers since](https://arxiv.org/abs/2306.08585) and [better papers before](https://arxiv.org/abs/quant-ph/0301141), but it's a valid choice.
The choice to use [Draper-style phase adders](https://arxiv.org/abs/quant-ph/0008033) instead of cheaper [ripple-carry adders](https://arxiv.org/abs/quant-ph/0410184) is similarly weird but valid.

Anyways, the fact that the circuit construction looks correct speaks to the insidiousness of the falling-with-style issue.
You make a correct circuit, you get the expected result, you celebrate... but you got the right answer for the wrong reason.
This is a fear that every competent experimentalist knows in their bones.
It's why they don't just check that something works when it should work, they check that it breaks when it should break.
Failing to do that is arguably [the most common failure of reasoning in humans](https://www.youtube.com/watch?v=vKA4w2O61Xo), so if you're running a competition where this is a known possibility then _**YOU SHOULD BE CHECKING FOR IT**_.


# The Drama

On Twitter, [this is how Project11 summarized the outcome of the competition](https://x.com/projecteleven/status/2047661990605156796):

> Researcher breaks 15-bit ECC key on publicly accessible quantum hardware in a 512x jump from the previous public demonstration.

For reference, that "512x jump" is in comparison to a prior work by "Steve Tippeconnic" that had the *exact same problem* ([in addition to several others, such as using exponentially expensive circuit constructions](https://x.com/CraigGidney/status/1965091975063130387)).
~~The fact that Project11 is boosting these results instead of shunning them has hugely damaged my perception of their credibility~~ (update: they've acknowledged the problems so my faith is somewhat restored).

On Twitter, one of the competition runners [defended their decision](https://x.com/apruden08/status/2047914287205941622).
Summarizing, they make two points:

1. The submission followed the rules of the contest,

    > We had three independent physics experts judge submissions against a predefined rubric. [...] But the work followed the rules, pushed the boundary on public hardware, and deserves recognition.

2. This still shows progress in quantum attacks.

    >  Still, claims like "quantum can't break 16 bits" keep popping up. [...] [...] it was demonstrating the attack class (variant of Shor on ECDLP) on real quantum hardware, with public access, no custom silicon. A 512x jump from the prior public demo.
    
Here are my rebuttals to these two points:

1. If the rules accepted this submission, the rules were written wrong.
The quantum computer should actually be contributing something of value in order for a submission to be accepted.
You knew about this issue; you should have avoided it.

2. This submission would have yielded the same result if it were run in 1996 instead of 2026.
Therefore this submission is not a measure of quantum progress.
(In case it's not clear: quantum computers have progressed enormously since 1996.
They basically did not exist in 1996!
For scale, over the intervening time, gate error rates improved from being [on the order of 10%](https://arxiv.org/abs/1202.5707) to [being on the order of 0.1%](https://arxiv.org/abs/2408.13687v1).)

# Closing Remarks

There are [legitimate concerns](https://words.filippo.io/crqc-timeline/) that quantum computers could become cryptographically relevant before the end of the decade.
This is why companies like
[Google](https://blog.google/innovation-and-ai/technology/safety-security/cryptography-migration-timeline/) and
[CloudFlare](https://blog.cloudflare.com/post-quantum-roadmap/) are accelerating their post-quantum cryptography transitions.
The ostensible goal of the QDay Prize was to raise awareness about this.
Frustratingly, it has likely achieved the opposite result.
It will no doubt be quipped alongside other gotcha-style arguments, like "call me back after you've factored 21".

At the moment, the competition runners seem to be doubling down and trying to defend the utility of the competition.
I think that's a waste of time.
The competition failed in the way it was predictably going to fail.
Save what credibility you have left and call a duck a duck.
Take it on the chin, and be more careful next time.

