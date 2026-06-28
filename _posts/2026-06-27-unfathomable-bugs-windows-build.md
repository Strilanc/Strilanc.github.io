---
layout: post
title: "Unfathomable bugs #10: The Broken Windows Build"
date: 2026-06-27 10:10:10 am PST
permalink: post/2603
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

It all started as I was showing one of our summer interns how to use `stimflow` to make a quantum circuit.
We noticed a stupid bug: adding a flow with `start="auto"` was failing if the flow was named.
Easy fix.
I wrote it up, created a pull request on stim's github repository, and the nightmare started.
The windows builds were failing.

The windows builds weren't just failing for this PR, but for *all* PRs.
Halfway through unit testing, continuous integration would crash with a vague but ominous message: "access violation".
Something had broken, and created an error that could plausibly lead to security exploits.


# Dependency Whinging

One of the frustrating things about modern software engineering is that things never just keep working.
You can get something *to* work, but nothing *keeps* working.
Eventually someone somewhere changes something, and you lose your day figuring out what the hell happened.

This "can't just keep working" problem gets worse if you have a lot of dependencies.
Fortunately, I took a principled stand on this when writing stim and use very few dependencies.
...Except in the build system.

In case you didn't know: building python packages is bullshit.
The process is known to be very brittle, and every year they [make things more complicated by trying to fix that it's complicated](https://xkcd.com/927/).
Currently, the recommended method for building a package is to use a docker container.
Otherwise too many details about the system doing the building can make their way into the package and cause problems.
But even this isn't enough; after doing the containerized build you still need to run a tool called [`auditwheel`](https://github.com/pypa/auditwheel) over the package to fix some remaining problems.

Of course, the bullshit of building a python package is layered on top of the usual bullshit of getting something to build cross-platform.
For example, did you know that on Windows it's so hard to find the location of the C++ compiler that they [ship a program called `vswhere.exe`](https://github.com/microsoft/vswhere) that specializes in solving this task?
(How do you find `vswhere.exe`? Well it should be at `%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe` of course.)
Even after you've used `vswhere.exe` to find the compiler, you're not done.
Compilation will fail due to the compiler complaining it can't find standard headers, like `<iostream>`.
Worry not; it's known that finding standard headers is also very hard on Windows.
There's *another* program, [`vcvarsall.bat`](https://learn.microsoft.com/en-us/cpp/build/building-on-the-command-line?view=msvc-170), which specializes in solving that task.

...Perhaps now you have a sense of why one might throw up their hands, shout "FINE! I'll let someone else solve it!", and take on a build dependency.

Because of how complicated it is to build cross-platform python packages, I use [`cibuildwheel`](https://github.com/pypa/cibuildwheel) to make stim's packages.
`cibuildwheel` solves my immediate problem, but it isn't a flawless library.
Libraries of this kind have a nasty tendency to solve 90% of your problem while making the remaining 10% ten times harder.
The simple cases work great, but as soon as you do something non-standard (like runtime detection of SIMD support) the abstraction buckles.
You inevitably end up needing to explain to tool A how to explain to tool B how to explain to tool C how to explain to tool D to please do this one simple thing, but unfortunately the layers of explanation turn that simple desire into some eldritch incantation that you write once and then try to never think of again.
Solving these buckled abstractions yields no enduring lessons and creates no sense of satisfaction; at best it kindles a latent fear of abstraction.

Anyways, all of this was to try to explain to you why "the windows builds are failing with an access violation" is such a nightmare.
It could be a bug in my code.
It could be a bug in `cibuildwheels`.
It could be a bug in github actions.
It could be a bug in visual studio.
It could be a bug in the *interaction* between these systems.
There's very little to go on, and it's invariably going to end in some unsatisfying way.

Adding salt to the wound, I can't reproduce the bug locally..
I don't have a windows machien, and Github actions doesn't support local execution.
The only environment I know the bug happens in is the Windows build within continuous integration triggered by pushing to github.
(I've never managed to explain to `cibuildwheel` to explain to `setup.py` to explain to `cl.exe` to please build things in parallel, so these builds take several minutes.)
Progress will be slow.


# Scorched Earth Debugging

When I'm stuck on a complicated debugging problem, I pull what I call the nuclear strategy.
I start deleting everything.
Find something irrelevant, delete it, check that the bug is still there, repeat.
Keep going until the bug is small enough that you can understand your own stupidity.

(I have a fond memory of demonstrating this to a coworker who'd been stuck debugging something for days.
I'd say "can you delete those lines?", they'd skeptically reply "they're not relevant, so we don't need to delete them", and I'd reiterate "if they're not relevant then we GET to delete them. Delete them!".
This repeated until we deleted the "obviously irrelevant" lines that were the source of the problem.)

Stim has around a hundred thousand lines of C++ code.
It's a lot to delete to solve just one bug.
But stim is my codebase, and I'm intimately familiar with what depends on what, so I had plenty of obviously irrelevant things to delete.
I knew the specific call causing the access exception was `stim.Circuit.reference_sample`, which could touch a decent chunk of the codebase, but not all of it.
And the more stuff I deleted the faster the Windows builds would be.
So I rolled up my sleeves, procrastinated for a week, and got started.

I deleted the code for generating diagrams.
I deleted the code for deriving detector error models.
Documentation?
Deleted.
Unit tests other than the failing test?
Deleted.
Parsing and serialization?
Deleted.
I cut and slashed and was generally having a great time.
A little creative destruction now and then is kind of satisfying.

In addition to deleting, I was also simplifying.
For example, the circuit that was being sampled contained the instruction `MPP X0*X1 Y0*Y1 Z0*Z1`.
This is a somewhat complex instruction, which the simulator implements by decomposing it into simpler ones.
With the goal of being able to delete code related to decomposition, I replaced the `MPP` with simpler instructions.
**The bug went away.**
Suspect identified: decomposition methods.

I restored the `MPP` instruction, and the bug came back.
Good.
I added some printf debugging.
**The bug went away.**
Wait, what?
Fuck!
It's a [heisenbug](https://en.wikipedia.org/wiki/Heisenbug)!

Heisenbugs are nasty, but I know where I added the print statements.
I don't understand what's going wrong yet, but I know where this bastard lives.
It lives right here:

```cpp
uint64_t CircuitInstruction::count_measurement_results() const {
    auto flags = GATE_DATA[gate_type].flags;
    if (!(flags & GATE_PRODUCES_RESULTS)) {
        return 0;
    }
    uint64_t n = (uint64_t)targets.size();
    if (flags & GATE_TARGETS_PAIRS) {
        return n >> 1;
    } else if (flags & GATE_TARGETS_COMBINERS) {
        for (auto e : targets) {
            if (e.is_combiner()) {
                n -= 2;
            }
        }
    }
    return n;
}
```

Taking stock: roughly 90% of the codebase was deleted, but this method was solidly entrenched amongst the remaining 10%.
I needed to isolate it.
You can't understand a heisenbug any other way.
For example, this `CircuitInstruction::count_measurement_results` method is called from a loop in `Circuit::count_measurements`.
If the bug is actually triggered here, I shouldn't need `Circuit::count_measurements`.
So I tweaked the test to call `CircuitInstruction::count_measurement_results` directly, bypassing `Circuit::count_measurements`.
That preserved the bug, as desired.
Then I tried deleting the `Circuit::count_measurements` method, which is no longer even being executed by the failing test.
**The bug disappeared.**
That's... ominous...

For nearly three hours, I was cutting the ties between `Circuit` and `CircuitInstruction`.
Random things would cause the bug to disappear.
I learned to fear the `Circuit::max_operation_property` template.
Because the Windows builds were slow, I often had sequences of 5+ changes being tested at any given time.
I learned empathy for CPU branch predictors.
But I snipped and I snipped, making small incisions when large ones failed.
Slowly, very slowly, it pulled apart.

Eventually, `Circuit::max_operation_property` fell.
Then `Circuit`, and `CircuitInstruction` soon after.
Until all that remained was this:

```
#include <cstdint>
#include <iostream>

uint64_t repro() {
    uint32_t targets[6]{0, 27, 0, 0, 27, 0};
    uint64_t t = 6;
    for (size_t k = 0; k < 6; k++) {
        if (targets[k] == 27) {
            t -= 2;
        }
    }
    return t;
}

int main() {
    std::cerr << "t=" << repro() << "\n";
    return 0;
}
```

It's a fucking compiler bug.

Go to [godbolt](https://godbolt.org/), paste the above code, set the compiler to `x64 msvc v19.51 VS18.6`, set the flags to `/O2`, and the execution will print `t=8589934594`:

> <img style="width:100%; border: 1px solid black" src="/assets/{{ loc }}/godbolt-screenshot.jpg"/>

Disable optimizations (flag `/Od`), or the change the compiler to `x86-64 gcc 15.1`, and it will print the correct answer (`t=2`). 

Glancing at the assembly reported by godbolt, the bug has something to do with [auto-vectorization](https://en.wikipedia.org/wiki/Automatic_vectorization).
The compiler is trying to pack the 32 bit words into an AVX register and then do the `== 27` checks and conditional `-= 2` accumulations in chunks of 8.
It's doing something wrong that ultimately results in an unwanted `0x2` being stored into the high half of the returned 64 bit word (`8589934594` is `0x200000002`).

I attempted to report this bug to Microsoft.
Based on searches, the correct place to do so was [their visual studio community website](https://developercommunity.visualstudio.com/VisualStudio/report?webReport=true).
Alas, like their compiler, their website is broken.
You can't submit a bug without logging in, and it refused to let me log in with my github account because I have a secondary `@google.com` email address associated with it (why?!):

> <img style="max-width:100%; border: 1px solid black; padding: 10px" src="/assets/{{ loc }}/login-fail.jpg"/>

No, the "Next" button didn't work.
Neither did creating a new account on the website, because their "press and hold" captcha just kept failing.
So I guess the compiler can stay broken and I'll just complain here.


# Looking Backwards, Looking Forwards

Looking over the [168 (!) commits](https://github.com/quantumlib/Stim/pull/1077) it took me to scorched-earth-debug this problem, I see various ways I could have done better.

First, I think I went scorched earth a bit too soon.
The unit test only failed on the *second* call to the reference sampling method in the unit test,
and the first call didn't use an `MPP` instruction,
so I suspected early on that `MPP` might be involved.
If I'd put dense printf debugging along that execution path sooner, it would have saved a decent chunk of time.

Second, I think I should have more strongly considered using an LLM for this task.
The iterative process being followed is very easy to describe, but tedious to execute.
Seems like a perfect fit for an LLM.
The problem is that (a) I don't have familiarity with using LLMs and
(b) there is no fucking way I'm giving an AI unsupervised push access to stim.
I could solve (a) by practicing with LLM tools.
I could help (b) by switching from github actions to a continuous integration system that allowed local execution.
I could also help (b) by removing dependencies from the build process.

(Some days I dream of just telling Windows users they have to use Linux.
They don't necessarily need to switch operating systems, but if they wanted to use stim they'd at least have to do it in [WSL](https://en.wikipedia.org/wiki/Windows_Subsystem_for_Linux).
There's even precedent for it: that's what [tensorflow did](https://www.tensorflow.org/install/pip#windows-native) at least for some features.)

As for actually fixing my failing builds, some people suggested adding `#pragma loop(no_vector)` to the relevant `for` loop.
The problem with that fix is that I don't know that this is the only affected loop.
Even if it is, that may become false a month from now.
This experience has fundamentally broken my trust in the visual studio compiler.
So I'm taking away their optimization privileges.
I explained to `cibuildwheel` to explain to `setup.py` to explain to `cl.exe` that it should stop doing compiler optimizations.
It'll make the windows version of stim worse, but at least it won't segfault.

