---
layout: post
title: "Shor's Quantum Factoring Algorithm"
date: 2017-07-16 12:10:20 pm PST
permalink: post/1714
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

A few years ago, when I was just learning about quantum computing, I wrote a post on [how Grover's quantum search algorithm works](http://twistedoakstudios.com/blog/Post2644_grovers-quantum-search-algorithm).
I've heard from many that it was the first time they "got" anything about quantum computing.

Part of the reason that post ended up being relatively clear is *because* I was just learning.
I didn't have to guess at what people would find confusing, I was experiencing it first hand.
Nowadays I would have a lot more trouble writing that post.
There's too many little details about quantum that now feel like "common sense"... despite the objective fact that they are totally counter-intuitive to beginners.

But even more important than that, I think, is the kind of explanation I gave.
I didn't try to explain Grover search with [terrible analogies](https://scifundchallenge.org/firesidescience/2014/03/16/dont-blink-the-quantum-zeno-effect-and-the-weeping-angels/).
I didn't just state some [ridiculous overhyped nonsense](http://www.dailymail.co.uk/sciencetech/article-3409392/Forget-Schrodingers-cat-researchers-reveal-quantum-pigeonhole-principle-say-tests-basic-notion-physics.html),
And, most important of all, I didn't use endless empty sentences so oversimplified that they're literally wrong and couldn't possibly communicate anything but confusion (e.g. "0 and 1 at the same time" or "does every computation simultaneously").
If you want to explain something, if you want to understand something, you have to actually grapple with the problem.

In this post, I want to explain Shor's algorithm.
I want readers to come away thinking "THAT's how it works?!", instead of being left with nothing but a general sense of confusion.
I won't go into everything; it would far too boring to write out another explanation of complex numbers and amplitudes and matrices and on and on.
But whatever I don't explain I will link away.

I'll do my best to keep things simple and approachable, but ultimately this is a mathematical algorithm.
Without talking  about math, you really just can't explain it.
Though I must admit [Scott Aaronson does an excellent attempt at that in "Shor, I'll do it" post](http://www.scottaaronson.com/blog/?p=208).
I won't be thorough, but I will go over all the basic ideas and the story that links them together.


# The Plan

To understand Shor's quantum factoring algorithm, you have to understand several smaller things and how they fit together into a story that cuts numbers into pieces.
Each of those smaller things takes some work to understand, but I'll do my best to get the core ideas across.

Basically, my explanation is going to break down into four parts:

1. Why is sampling the frequencies of a signal useful for finding its period?
2. How does a quantum computer make a periodic signal, relevant to factoring a number $R$, and them sample from its frequencies?
3. Why can knowing how many times I have to modular-muliply by some $b$ before getting back to 1 help find a "strange square roots of unity" $u$, meaning $u^2 = 1$ but $u \neq 1$ and $u \neq -1$?
4. How does knowing a strange square root of unity modulo $R$ reveal factors of $R$?

But, before I can start talking about all that, we probably need to get a bit more familiar with what a frequency even is.


# Warm up: Speakers, Frequencies, and Spectrograms

For a long time, sound was a bit of a mystery.
You strike a bell, and it rings, but what exactly is going on?
A lot of work and thought went into figuring out the underlying mechanism and how that relates back to what we actually experience.

The *mechanism* is just a single variable (vibrations in the air / pressure in your ear) going up and down over time.
For example, loudspeakers produce sound by moving a diaphragm back and forth very quickly.
The specific pattern of the back-and-forth movement determines what sound is being produced.
In this sense, everything you've ever heard can be reduced to a series of speaker diaphragm positions.
In fact, that's exactly how early audio formats such as WAV files stored music: a raw uncompressed list of numbers telling the speaker where to be from moment to moment.

But the way we experience sound doesn't seem at all like a single-dimensional variable changing over time.
We hear a whole spectrum of frequencies, all coming and going independently.
Our experience is not the raw up-and-down signal, it's the [Fourier transform](https://en.wikipedia.org/wiki/Fourier_transform) of small chunks of that signal.

For example, when using sound editing software such as Audacity, the default view of the audio is like a plot of the speaker diaphragm positions over time:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/code-monkey-time.png"/>

This view is nice and simple, and makes it easy to see loudness.
But it's definitely hard to tell *what* is loud.

To pick out fine details, you want something closer to our experience of sound: a [spectrogram](https://en.wikipedia.org/wiki/Spectrogram).
The spectrogram shows frequency information over time:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/code-monkey-spectrogram.png"/>

[With some practice reading spectrograms](http://home.cc.umanitoba.ca/~robh/howto.html), you can recognize notes, instruments, and even words.
And, Interestingly, you can think of modern musical notation as basically just an extremely simplified spectrogram:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/code-monkey-notes.png"/>

Anyways, the general point I want to get across here is that a) we know how to turn a raw signal into frequencies, and b) even though frequency information is technically redundant with the raw signal, it can be easier to work with.
Now we'll go into a specific relevant case where information that's spread out in a raw signal is concentrated in a useful way in frequency space.


# The Weird Frequencies of Repeating Blips

Suppose I make a "song" where the list of speaker-diaphragm positions is almost entirely "stay as far back as possible", but every tenth entry is "as far forward as possible".
That is to say, I make a song with periodic blips; a wav file with the data [0, 0, 0, 0, 0, 0, 0, 0, 0, 255] repeated over and over again.
What will the "song"'s spectrogram look like?

If you're familiar with signal processing, the above question probably sounds... not even wrong?
In order to talk about frequencies, you need more information.
For example, what's the sample rate? and the bandwidth? and the windowing function?
But the fun thing about periodic signals is that the spectrum *basically looks the same regardless of all these options*.

To demonstrate, I wrote some python code to generate wav files storing the periodic signal I described.
I used a few different sample rates:

```python
import wave
dat_period = 10
for sample_rate in [8000, 16000, 44100, 192000]:
    path = 'dit{}dat{}.wav'.format(dat_period - 1, sample_rate)
    cycle = bytearray.fromhex('00' * (dat_period - 1) + 'FF')
    num_cycles_10sec = 10 * sample_rate // len(cycle)
    with wave.open(path, 'wb') as f:
        f.setparams((1, 1, sample_rate, 0, 'NONE', 'not compressed'))
        f.writeframes(cycle * num_cycles_10sec)
```

After running the code, I opened the files in Audacity and switched to the spectrogram view.
Here are the spectrograms for each file (with adjusted contrast for clarity):

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/wav-spectrograms.png"/>

The files have different sample rates, and their spectrogramss aren't *exactly* identical, but they all look basically the same: four strong and evenly-spaced peaks that stay constant over time.
Actually, there's a fifth peak hiding at 0, and Audacity is hiding a [mirrored half of the frequency spectrum](https://dsp.stackexchange.com/questions/4825/why-is-the-fft-mirrored).
So really there are *ten* peaks.
It is **not** a coincidence that the number of implied peaks is equal to the period of our input signal.

Keep in mind that each spectrogram in the above diagram has a different frequency scale.
Varying the sample rate is having an effect on the frequency peaks: when the sample rate is twice as high, the frequencies are twice as high.
But *proportionally speaking* the spectrograms have peaks in the same places, and that's what we care about.

Now let's switch from periodic audio signals to periodic states on a quantum computer.


# Periodic States and their Frequencies

If you have 5 classical bits, there are 32 possible states they can be in.
There's `00000`, `00001`, `00010`, `00011`, `00100`, and so forth up to `11111`.
One state for each way you can assign a 0 or a 1 to each bit.

The state of a quantum computer is a weighted combination of the classical states.
Given 5 qubits, you can add together various proportions of the 32 classical states achievable with 5 bits.
THe main constraint is that the squared magnitudes of the weights must add up to 1.
So a 5 qubit quantum computer could be in the state $|00000\rangle$, or in the state $\frac{1}{\sqrt{2}}|00000\rangle + \frac{1}{\sqrt{2}}|11111\rangle$, or in the state $\frac{3}{5}|00000\rangle - \frac{4}{5}|10101\rangle$, or in the state $\frac{1}{\sqrt{3}}|00001\rangle - \frac{1}{\sqrt{3}}|00100\rangle + \frac{1}{\sqrt{5}}|10000\rangle$, or all kinds of other fun combinations.

In this post when I say "periodic state", I mean a state where the states that have non-zero weight are spaced out in a uniform periodic way.
For example, the state $\frac{1}{\sqrt{7}} \sum\_{k=0}^{6}|5k\rangle = \frac{1}{\sqrt{7}} |00000\rangle + \frac{1}{\sqrt{7}} |00101\rangle + \frac{1}{\sqrt{7}} |01010\rangle + \frac{1}{\sqrt{7}} |01111\rangle + \frac{1}{\sqrt{7}} |10100\rangle + \frac{1}{\sqrt{5}}|11001\rangle + \frac{1}{\sqrt{5}}|11110\rangle$ is a periodic state with period 5.
The state $\frac{1}{\sqrt{7}} \sum\_{k=0}^{6}|5k+1\rangle$ is another, different, periodic state with period 5.

At this point a lot of readers are probably thinking "How is a periodic quantum state any different from a periodic probability distribution? How do we know the quantum computer isn't just secretly in one of those states with non-zero-weight?".
The answer to that question is: because we can switch to frequency space.
If the quantum computer was really in one state, instead of in a weighted combination of states, we'd be able to tell by sampling from its frequency spectrum.

The frequency spectrum of a single state is just a sine wave, smoothly oscillating up and down.
By contrast, the frequency spectrum of a periodic signal is not smooth.
It has sharp evenly-spaced peaks.
Furthermore, the number of peaks is equal to the spacing between states (instead of a property of some individual state).
The two cases behave completely differently.

I think this ability to switch to the frequency really gets to the heart of how quantum computers are different from classical computers.
This really is *the* difference between quantum superpositions and classical probability distributions: the ability to interfere the weights.

For example, if I prepare a periodic state in my quantum circuit simulator Quirk, and switch to frequency space by applying a quantum Fourier transform operation, this is the result:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/quirk-spectrogram-10.png"/>

The green rectangle on the left is showing a view of the input state.
Each horizontal bar represents the weight assigned to one of the classical states.
You can tell the state is periodic because the bars are evenly spaced.

The white box in the middle that says $\text{QFT}^\dagger$ is an inverse quantum Fourier transform operation.
I'm not going to go into exactly how that's implemented; for the purposes of this post, all that matters is that it can be done.

The green rectangle on the right is showing a view of the output state.
It has 10 evenly-spaced peaks.
Why 10?
Because the input state's period is 10.

If we reduce the input state's period from 10 to 5, we get half as many peaks:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/quirk-spectrogram-5.png"/>

Now here comes the *really useful property* that will make it worth our while to deal with frequency space.
When you shift the input signal around, *nothing happens to the frequency magnitudes*.
The peaks stay in exactly the same place:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/quirk-spectrogram-5-moving.gif"/>

The phases of the output (not shown) are changing all over the place, but the magnitudes are staying the same.
And the magnitudes are what matters in the end; they determine the probability of measuring each state.

(I should also mention that the peaks are resilient to little imperfections, like that little kink where the spacing is 3 instead of 5.
The kink can't be avoided because the number of states $2^7 = 128$ is not a multiple of five.)

[[[mention how we still need to worry about sampling from these peaks]]]


# Preparing Periodic Quantum States

I've explained that, if we had a periodic quantum state with unknown period, we could sample from the peaks in its frequency space in order to learn something about the period.
But how do we prepare that periodic state in the first place?

First, an easy case.
If the period we want is a power of 2, let's say $2^k$, then preparing a periodic state is as easy preparing $k$ qubits in the $|0\rangle$ state and the rest of the qubits in the $\frac{1}{\sqrt{2}} |0\rangle + \frac{1}{\sqrt{2}} |1\rangle$ state.
In Quirk, I can do that with Hadamard gates:

[[[[diagram]]]]

For periods that don't perfectly line up with a qubit boundary like that, it's a bit trickier to prepare the periodic state.
Basically what we want to do is prepare a uniform superposition, quantum-compute the remainder of dividing that input by the period. then measure the remainder.

To prepare a uniform superposition, we apply a Hadamard operation to every qubit:

[[[[[]]]]]

Then we add that register into a second ancilla register, modulo the period:

[[[[[[]]]]]]

I don't want to get side tracked into explaining the details of how the modular addition operation is broken down into simpler circuit operations.
If you want that, you can read my recent paper that covers exactly this kind of thing.

Once we have the remainder stored in the second register, we measure that register.

[[[[[[[]]]]]]]

If the result is say 3, we have elimited every input register state whose remainder mod $k$ isn't 3.
This leaves behind the state $\sum\_k |pk + 3\rangle$:

[[[[[[]]]]]]

If we had measured 2 instead, then the state would be $\sum\_k |pk + 2\rangle$:

[[[[[[]]]]]]

Now we could fix the fact that these states are not always coming out the same by subtracting the second register out of the first register.
But, remember how the frequency peaks didn't move when we shifted the input signal?
We really don't care that the offset is changing, so there's no need to fix it.
In fact, because we're not going to *do* anything with the measurement result, we don't need to measure at all!
We can just throw the second register away, there's no need to measure it.

Looking at the magnitudes of each state, this looks like we failed to prepare a periodic state:

[[[[[[]]]]]]

But this is a case where the probabilities don't tell the whole story.
We need to pay attention to the entanglements between the states.
For that, we can look at the density matrix:

[[[[[[]]]]]]

For our purposes here it doesn't really matter if you understand what a density matrix is.
All that matters is that you can see that a whole lot of black turned into green; this indicates that many states are no longer entangled.
Our measurement has divided the superposition into separate compartments, one for each equivalence class of remainders modulo the period.
Only values within the same equivalence class can interfere with each other now.

The density matrix also looks pretty cool after Fourier-transforming:

[[[[[[[]]]]]]]





If you keep doing the same thing again and again, how long will it be until you end up back where you started?
This is a kind of problem that classical computers struggle with but, in some cases, quantum computers are pretty good at it.

The first thing you have to understand is that measurements are more general than you might expect.
Sure you can measure whether a qubit is on or off, but by doing some computation first you can measure more general properties.

The power of only measuring a little bit.

For example, instead of measuring the exact value of a register, we can measure its remainder modulo a constant.
So we would know, for example, that if we divided the value in the register by 15 then there would be a remainder of 7.
The register could contain 7, or 22, or 37, and so forth, but also superpositions of those such as |7> - |22> + |37>.

Of course, measuring modulo a constant is not a basic action available to a quantum computer.
You have to do some computing to get things into the right shape, keeping in mind that we aren't allowed to do anything irreversible, then do the measurement.
A simple way to do it is with a modular addition into a zero'd register, then measuring that register.
The modular addition in turn is made out of simpler parts, such as comparisons and non-modular additions, which are in turn made up of actually-basic gates like NOTs, CSWAPS, and CCNOTs.
The whole thing can be understood in terms of classical ingredients.

The upshot here is that, after you do your modular addition and measure the result, you know that the allowed input register states follow a nice periodic pattern.

Now I want to ask a sort of odd question: if you took those probabilities, and *played them through a speaker*, what would it sound like?
Each probability determines the position of the speaker for a tiny fraction of time, etc.

Well good news, because I actually generated a file that does this!

[[[ audio ]]]

Now if your ears are *really* good, try to count the number of distinct frequencies in the audio.
It so happens that there are 5 clumps of them, which is pretty nice since that's the period we fed in.
But even more interesting than that, and even harder to hear except in a general sense of 'that sounds pleasant' [[[link]]], is that the frequencies are *evenly spaced*.

No, really! Look at the spectrogram:


I opened the wav files produced by the above code in Audacity, and looked at the spectrograms.
They looked like this:


(Note: I enhanced the colors in the above images, and the exact specifics of what you see depend on several settings within the program such as the windowing function.)

We can see the same thing in Quirk:


Changing from period-10 to period-5 halves the number of spikes:


And shifting the samples around has no effect on where the spikes are:


And because all of these offsets add incoherent when we distinguish between them, and they all have spikes in the same place, the aggregate has spikes in those places:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/period-5-circuit-spikes.png"/>

Also, increasing the number of samples increases accuracy.
The spikes get proportionally narrower.

Okay now here's the *really* bonkers part.
When you make a spectrogram you have to make a tradeoff between resolution in frequency space and resolution in time.
If you made the spectrogram taller, you can tell more frequencies apart.
But you also need to use bigger chunks of time.
The bonkers thing is *no matter how tall we make the spectrogram, we always see five evenly spaced frequencies*.

[[[]]]
[[[[]]]]
[[[]]]

And if we pulse every 13 steps instead of every 5, we always see 13 evenly spaced frequencies.

[[[]]]

Now suppose I challenged you to tell whether you were in the 5 case or the 13 case.
Okay, that's really easy with a spectrogram.
But suppose I picked only only one of the frequencies, and gave that to you.
Could you figure out if it was the 5 case or the 13 case?

Well, as long as it's not the 0 frequency, you can!
In fact, it's easy!
Just look at the spectrograms side by side: the frequencies are in different places, so if I give you a frequency you just have to check if it lines up with a 5 spike or a 13 spike.

In fact, as long as you have enough resolution, you can tell apart *all kinds* of periods by being told *just one* of the dominant frequencies.

And that is the key insight you need, in order to realize quantum computers can crack period finding.
Because one of the operations quantum computers are good at is sampling strong frequencies present in superpositions.

# Sampling Frequencies

The technical name of the operation we use to transform between speaker-position-space and frequency-space is "Fourier transform".
I can not do justice to how useful the Fourier transform is.
It's used *everywhere* in engineering.

Appropriately, one of the better explanations I've seen is the same site I linked last time in the Grover post in order to explain complex numbers.
aiko.net
Maybe also link fish tutorial or whatever.

But you don't have to understand the Fourier transform in detail to understand this post, so I won't go into detail.
All you need to know is that the Fourier transform behaves in the way I explained in the previous section, and also that quantum computers can apply a Fourier transform *to their own state*.
If a quantum computer's state is $|0\rangle + |5\rangle + |10\rangle + |15\rangle + ...$ up to some $n$, it can do a thing that will transform its state into "clumps" close to $0$, $n/5$, $2n/5$, $3n/5$, and $4n/5$.
And the larger $n$ is, the tighter those clumps are.
Well, actually the clumps get wider in an absolute sense but the growth is not linear so proportionally-speaking they get smaller as $n$ gets larger.
It's just like how, if you flip $k$ coins, exact-number estimates get worse and worse as $k$ increases but *percentage* estimates get better and better.

Now up until now we had a very simple way of splitting our space into pieces modulo a period: we just computed the remainder and measured that.
But *any periodic function will do*.
Instead of asking how many times you need to +1 before getting back to 0 working modulo 27 (hint: it's 27), we could ask... how many times do I have to multiply by 2 before I get back to 1?
Let's see.

2, 4, 8, 16, 32

Ah, that 32 just went 27 so we have to subtract off 27. 32=32-27=5.
Lets keep that in mind and start over.

2, 4, 8, 16, 32=5, 10, 20, 40=13, 26=-1, -2, -4, -8, -16, -32=-5, -10, -20, -40=-13, -26=1

That's... 18 steps.
So the period of $2^A \pmod{27}$ is 18.

Now let's find that 18 with a quantum computer instead of by hand.

We start by initializing an $n$-qubit register into the state $|0\rangle + |1\rangle + |2\rangle + ... + $|2^n\rangle$.
Then we introduce a second register in the state $|1\rangle$.
Now the tricky part: we have to multiply the second register by $2$ to the power of the first register.
Again, all we need to do is to find a classical reversible circuit to do this and it will work fine in the quantum case even under superposition.
I won't go into the gory details of how this is done; it's tedious and doesn't really add clarity.
I'm working on a paper that reduces the number of qubits required to do this at great cost to the constant factors.
Trust me, the details really don't matter.

The main thing you need to know is that there's a trick to do it fast called *repeated squaring*.
To raise 2 to the power $n$, it doesn't take $n$ steps; instead the number of steps is proportional to the number of digits in $n$; much much faster.

Now, after doing that, we measure the second register.
(We don't *have* to measure the second register.
Honestly we can just throw it away; it just helps the explanation to pretend we bother to measure it.)
Suppose the result is $13$, which if you were really attentive is the $8$'th power of 2 (mod 27).
Or it could be the 26'th power of two, because 26=8+18 and 2^18=1 mod 27.
Or any other number congruent to 8, modulo 18.

So we have a state $|8\rangle + |26\rangle + ... + ?$.
But keep in mind that in practical situations we won't actually know the exact state, since we don't know the period (that's what we're trying to find!).

Now you might think at this point that we should just sample the first register, and try to somehow cleverly figure out the period by some pattern in the numbers of by how many times we see distinct things.
But that kind of stuff doesn't work.
Instead, we use the Fourier transform.

After the QFT, we have a much more useful situation.
We know that, for *some* number $p$, there will be clumps of amplitude at $0$, at $n \cdot 2/p$, at $n \cdot 3/p$, at $n \cdot 4/p$, and so forth up to $n \cdot (p-1)/p$.
All we really know is that $p$ must be less than 27, since that's the size of the space.
So now our job is, given a sample of $|k\rangle$, we need to figure out which fraction is most likely.

In other words, given $k/n$, we want to find the closet fraction with denominator at most 27.
And there is in fact an efficient algorithm to do this, based on continued fractions.
Again, the details don't really matter.
All that matters is that it can be done; it's even built into python.

```
from fractions import Fraction

f = Fraction(numerator=100, denominator=1024)
g = f.limit(max_denom=5)
print(g)  # 2/3
```

And that closes the loop.
If we don't have enough resolution, we just make $A$ bigger.
In general, for an $n$-bit number, the $A$ register can be $2n$ bits.

So that's how you do period finding.
Now how does that help us with factoring>

# Factoring

Great, we can do period finding.
And specifically we can do it on functions like $f(x) = B^x$.
How does that help us factor a number?

Before we can talk about that, let's talk about quadratic residues.
Suppose you had a number $y$ that was an "extra" square root of 1.
That is to say, $y^2 = 1$ but $y \neq \pm 1$.
For example, when working modulo $100$, $y$ could be $49$ because $49^2 = 2401 \equiv 1$.

So we have a $y$ such that $y^2 - 1 = 0$.
We can factor this equation into $(y+1) \cdot (y-1) = 0$.
Normally the only way to satisfy this kind of equation is to make one of the factors by 0, i.e. by setting $y$ to either 1 or -1, but in the context of modular arithmetic there can be additional solutions.
Going back to our example working modulo 100 with $y=49$, we find that $(y+1) \cdot (y-1) = (49-1) \cdot (49+1) = 48 \cdot 50 = 2400 \equiv 0 \pmod{100}$.

In other words, we found a solution to the equation $a \cdot b = R \cdot k$.
We can also think in terms of the factors: $\Pi a\_i \Pi b\_i = \Pi R\_i \cdot 2 \Pi k\_i$.
Notice that the factors must be matched on either side of the equation.
If there's a factor of 2 on the left, there had better also be a factor of 2 on the right, or the equation couldn't possibly be correct.
But now consider how the factors $R\_i$ must be split apart.
They can't all be in $a$, because then $a$ would be a multiple of $R$, but that would imply $y = 1$ or $y = -1$ which we required not to be the case.
And, for the same reason, the factors can't all be in $b$.
So some factors of $r$ must be in $a$, and some others be in $b$.
But we can remove the $k$ parts by dividing out $gcd(a, k)$.
And that gives us a factor of $R$!

# Getting a weird square root from the period

So, if we knew a strange square root $y$ such that $y^2 = 1$ but $y \neq \pm$, then we could pull out a factor of $R$.
How do we use period finding to find such a $y$.

Easy!
First, keep trying different bases $b$ until you find an even period $l = 2w$.
That means ${b^w}^2 = 1$.
So that gives us a square root of 1, and it's definitely not 1 since otherwise the period would be smaller.
It *could* still be -1 though.
If that happens... just try again some more!
Soon enough you will stumble onto a base $b$ with an even period $l=2w$ such that $b^w$ is a strange square root of 1.
They're common. [[[[REF>>?????] WHY?]]]



# Putting it all together

So now we've discussed the three[four?] parts of Shor's algorithm:

1. Using a quantum computer and frequency space sampling to perform period finding.
2. Using period finding to find strange square roots.
3. Using strange square roots to get factors.

With all of this information internalized, we can findally write some pseudo-code to simulate Shor's algorithm.

```python
from math import log2
from fractions import Fraction, gcd

def factor_attempt(n):
    base = random.randint(2, n-2)
    period = sample_period(base, n)
    
	# Try to extract strange square root.
	half_period = period // 2
    y = pow(base, half_period, modulus)
    if y == 1 or y == n-1 or y**2 % n != 1:
        return None  # Failed attempt.
	
	# Use strange square root to pull out a factor.
	return gcd(y + 1, n)

	
def sample_period(base, modulus):
    modulus_bit_count = int(ceil(log2(modulus)))
	exponent_bit_count = modulus_bit_count * 2  # higher increases accuracy but decreases speed. This is the minimum needed to distinguish all the fractions.

	# Prepare a uniform superposition of possible exponents.
	exponent_qureg = Qureg(size=exponent_bit_count, initial_value=0)
	for q in exponent_qureg:
	    apply Hadamard to q

    # Create distinguishing information that separates the exponents
	# into equivalence classes modulo the unknown period.
	measure pow(base, exponent_qureg, modulus)
	
	# Sample from the frequency spectrum.
	apply QFTinv to exponent_qureg
	s = measure exponent_qureg

	# Figure out the closest possible fraction.
	frac = Fraction(numerator=s, denominator=1 << exponent_bit_count)
	nearby_bounded_frac = frac.limit_denominator(modulus - 1)
	
	# Its denominator should be the period.
	return nearby_bounded_frac.denominator
```

The above code is in many ways naive, but it gives the general idea.
A real algorithm would break down the exponentiation into [[[repeated squaring and multiplication]]].
It would also look at several nearby fractions and periods, in case the sampled result was close instead of exact.
It would deal with special cases like "Oops, my base is not co-prime to the modulus".
It would check for various classically-easy cases like small factors, square numbers, etc.
And so on and so on.

If you want to see all the details of how to implement Shor's algorithm as a circuit, see my paper.
But here's the general flow of operations that I used:

[[[diagram]]]






is made up of two parts: the quantum part and the classical part.

The quantum part is "period finding", where you're given some function $f$ and have to find out how long it takes for $f$ to start repeating.
Given an $f$, we'll be looking for some offset $a$ such that $f(x+a)$ is equal to $f(x)$ for any starting point $x$.

For example, suppose I have a clock but each day when I wake up I advance it by 10 hours for no reason.
How many days will it be before the clock is showing the right time again?
This is a period-finding problem.
The function is $f(x) = 10 \cdot x \pmod{12}$, and in this case the smallest $a$ that satisfies $f(x+a) = f(x)$ is $a=6$.

The classical part of Shor's algorithm is translating the ability to find periods into the ability to find factors.
In my opinion this is the harder part, so let's do period finding first.
