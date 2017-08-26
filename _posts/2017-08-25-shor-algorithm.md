---
layout: post
title: "Shor's Quantum Factoring Algorithm"
date: 2017-08-25 12:10:20 pm PST
permalink: post/1718
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

A few years ago, I wrote a post on [how Grover's quantum search algorithm works](http://twistedoakstudios.com/blog/Post2644_grovers-quantum-search-algorithm).
I think it went over quite well; I've heard from several people that it was the first time they "got" anything about quantum computing.
Today I want to do the same thing, but with [Shor's quantum factoring algorithm](https://en.wikipedia.org/wiki/Shor%27s_algorithm).

My guess is that there are two reasons that certain people found my post on Grover search helpful.
First, the post ended up being relatively clear is because I was just learning all this stuff.
I didn't have to guess at what people would find confusing, I was experiencing it first hand.
The second reason I think certain people found that post useful has more to do with the kind of explanation I gave, namely *actually grappling with the problem*.
I didn't try to explain Grover search with [terrible analogies](https://scifundchallenge.org/firesidescience/2014/03/16/dont-blink-the-quantum-zeno-effect-and-the-weeping-angels/).
I didn't just state some [ridiculous overhyped nonsense](http://www.dailymail.co.uk/sciencetech/article-3409392/Forget-Schrodingers-cat-researchers-reveal-quantum-pigeonhole-principle-say-tests-basic-notion-physics.html),
And I didn't use oversimplified factoids (e.g. "0 and 1 at the same time" or "does every computation simultaneously") that couldn't possibly communicate anything but confusion.

I may not be able to write an explanation from the perspective of a first-time-learner anymore, but I can still help readers actually grapple with the problem to be understood.
And that's what I intend to do in this post.
I want to explain Shor's algorithm, and I want to do it in a way where at least readers who know a bit about coding come away thinking "THAT's how it works?!", instead of being left with nothing but a general sense of confusion.

I'll do my best to keep things simple and approachable, but I will be digging into the mathematical details.
[Scott Aaronson made an excellent attempt at explaining Shor's algorithm without math in "Shor, I'll do it"](http://www.scottaaronson.com/blog/?p=208)...
but I think you'll agree that although that explanation is easy to follow, it really doesn't give any concrete sense of what's going on.
Sometimes understanding requires knowing the details.


# The Plan

To understand Shor's quantum factoring algorithm, you must first understand several smaller things.
Then it's just matter of seeing how they fit together into a story that cuts numbers into pieces.
Each of those smaller things takes some work to understand, but I'll do my best to get the core ideas across.

Here are the parts, or rather the questions, that I'll be breaking my explanation into:

1. Why is sampling the frequencies of a signal useful for finding its period?
2. How does a quantum computer make a periodic signal, relevant to factoring a number $R$, and them sample from its frequencies?
3. Why can knowing how many times I have to modular-muliply by some number $b$, before returning a total product of 1, help find a "strange square roots of unity" $u$ (i.e. a $u$ such that $u^2 = 1$ but $u \neq 1$ and $u \neq -1$)?
4. How does knowing a strange square root of unity modulo $R$ reveal factors of $R$?

I realize that these questions used a bunch of terms and concepts I haven't explained yet.
For example, what the heck are the "frequencies of a signal"?
Well, I guess that's a good a place as any to start.


# Warm up: Speakers, Frequencies, and Spectrograms

For a long time, sound was a bit of a mystery.
People knew that striking a bell would make a ringing noise, but they didn't really have a solid idea of what was going on physically.
A lot of work and thought went into figuring out the underlying mechanism and how that relates back to what we actually experience.

The *mechanism* of sound is just a single variable (vibrations in the air / pressure in your ear) going up and down over time.
For example, loudspeakers produce sound by moving a diaphragm back and forth very quickly.
The specific pattern of the back-and-forth movement determines what sound is being produced.
In this sense, everything you've ever heard can be reduced to a series of speaker diaphragm positions.
In fact, that's exactly how early audio formats such as WAV files stored music: a raw uncompressed list of numbers telling the speaker where to be from moment to moment.

Sound may be a single varying variable, but the way we experience sound doesn't seem at all like that.
We hear a whole *spectrum* of frequencies, all coming and going independently.
I think of this as one of the big mysteries of sound: how does a single up-and-down signal translate into a rich spectrum of many variables going up and down?
Of course, this is one of those mysteries that we actually know the answer to.
Specifically: if you take raw audio, chunk it into pieces, and [Fourier transform](https://en.wikipedia.org/wiki/Fourier_transform) each of the pieces, what comes out is (much closer to) what we hear; a spectrum of frequencies coming and going.

For example, when using sound editing software such as Audacity, the default view of the audio is essentially a plot of the speaker diaphragm positions over time:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/code-monkey-time.png"/>

This view is nice and simple, and makes it easy to see where there's silence and where something loud is happening.
But this view is not very informative when you're trying to figure out *what* is loud.
To pick out fine details, you want something closer to our experience of sound: a [spectrogram](https://en.wikipedia.org/wiki/Spectrogram).

Spectrograms show frequency information over time.
In the following diagram the vertical axis is frequency, the horizontal axis is time, and the brightness of each pixel represents how strong a particular frequency is at a particular point in time:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/code-monkey-spectrogram.png"/>

[With some practice reading spectrograms](http://home.cc.umanitoba.ca/~robh/howto.html), you can recognize notes, instruments, and even words.
Interestingly, you can think of modern musical notation as basically just an extremely simplified spectrogram:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/code-monkey-notes.png"/>

Anyways, the general point I want to get across here is a) what a frequency is, b) that we know how to turn a raw signal into frequencies, and c) even though frequency information is technically redundant with the raw signal, it can be easier to work with.
If you want to learn more about sound and frequency, you can start with the Wikipedia page on [digital signal processing](https://en.wikipedia.org/wiki/Digital_signal_processing).

Now that we're a bit more familiar with frequencies, let's get into a specific relevant case where information that's spread out in a raw signal is concentrated in a useful way in frequency space.


# The Weird Frequencies of Repeating Blips

Suppose I make a "song" where the list of speaker-diaphragm positions is almost entirely "stay as far back as possible", but every tenth entry is "as far forward as possible".
That is to say, I make a song with periodic blips: a wav file with the data [0, 0, 0, 0, 0, 0, 0, 0, 0, 255] repeated over and over again.
What will the "song"'s spectrogram look like?

If you're familiar with signal processing, the above question probably sounds... not even wrong?
In order to talk about frequencies, you need more information.
For example, what's the sample rate? and the bandwidth? and the windowing function?
But the fun thing about periodic blip signals is that the spectrum *basically looks the same regardless of all these options*.

To demonstrate, I wrote some python code to generate wav files storing the periodic signal I described, with a few different sample rates:

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

After running the code to produce the files, I opened the files in Audacity and switched to the spectrogram view.
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

If you have a computer that can store 5 classical bits, there are 32 possible states that your computer can be in.
There's `00000`, `00001`, `00010`, `00011`, `00100`, and so forth up to `11111`.
One state for each way you can assign a 0 or a 1 to each bit.

The thing that separates a quantum computer from a classical computer is that a quantum computer's state can be in a weighted combination of the classical states (called a "[superposition](https://en.wikipedia.org/wiki/Quantum_superposition)").
You can create possible states of a 5-qubit quantum computer by adding together various proportions of the 32 classical states achievable with 5 bits, as long as the squared magnitudes of the weights add up to 1.
So a 5 qubit quantum computer could be in the state $|00000\rangle$, or in the state $\frac{1}{\sqrt{2}}|00000\rangle + \frac{1}{\sqrt{2}}|11111\rangle$, or in the state $\frac{3}{5}|00000\rangle - \frac{4}{5}|10101\rangle$, or in the state $\frac{1}{\sqrt{3}}|00001\rangle - \frac{1}{\sqrt{3}}|00100\rangle + \frac{1}{\sqrt{5}}|10000\rangle$, or all kinds of other fun combinations.

In this post when I say "periodic state", I mean a quantum computer state where the weights assigned to the underlying classical states are mostly zero, except for some non-zero ones spaced in a periodic way.
For example, the state $\frac{1}{\sqrt{7}} \sum\_{k=0}^{6}|5k\rangle = \frac{1}{\sqrt{7}} |00000\rangle + \frac{1}{\sqrt{7}} |00101\rangle + \frac{1}{\sqrt{7}} |01010\rangle + \frac{1}{\sqrt{7}} |01111\rangle + \frac{1}{\sqrt{7}} |10100\rangle + \frac{1}{\sqrt{5}}|11001\rangle + \frac{1}{\sqrt{5}}|11110\rangle$ is a periodic state (with period five).
The state $\frac{1}{\sqrt{7}} \sum\_{k=0}^{6}|5k+1\rangle$ is another, different, periodic state with period 5.

At this point a lot of readers are probably thinking something along the lines "How do we know the quantum computer isn't just secretly in one of those states with non-zero-weight but we don't know which? How is this any different from a probability distribution?".
The answer to that question is: because we can switch to frequency space.
If the quantum computer was really in one state, instead of in a weighted combination of states, we'd be able to tell by sampling from its frequency spectrum.

The frequency spectrum of a single state is just a [sine wave](https://en.wikipedia.org/wiki/Sine_wave), smoothly oscillating up and down.
By contrast, the frequency spectrum of a periodic signal is not smooth.
It has sharp evenly-spaced peaks.
Furthermore, the number of peaks is equal to the spacing between states (instead of a property of some individual state).
If the quantum computer was really in just one of the classical states, how is a property about the *spacing __between__ the possible states* getting into the output?
The frequency spectrums tell a very clear story about what's really going on.

As an example, I prepared a periodic quantum state in my quantum circuit simulator Quirk.
Then I used a [Quantum fourier transform operation](https://en.wikipedia.org/wiki/Quantum_Fourier_transform) to switch the state into its own frequency space.
This is the result:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/quirk-spectrogram-10.png"/>

The green rectangle on the left is showing a view of the input state.
Each horizontal bar represents the weight assigned to one of the classical states.
You can tell the state is periodic because the bars are evenly spaced.

The white box in the middle that says $\text{QFT}^\dagger$ is the (inverse) quantum Fourier transform operation.
I'm not going to go into exactly how the QFT is implemented.
For the purposes of this post, all that matters is that it can be done.
If you want more information, see [the Wikipedia article](https://en.wikipedia.org/wiki/Quantum_Fourier_transform).

The green rectangle on the right is showing a view of the output state.
It has ten evenly-spaced peaks.
Why ten?
Because the number of frequency peaks is behaving just like it did with the periodic blip songs.
The input state's period is ten, so the frequency space output has ten peaks.

Just to check that this is actually working, let's reduce the input state's period from ten to five.
We should get half as many peaks:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/quirk-spectrogram-5.png"/>

Yup, the output has a number of peaks equal to the period of the input.

Now I want to address why we're bothering with frequency space at all.
In particular, why don't we look at the input signal and see how far apart the blips are and why can't we figure out the period by samping the input signal and noticing "Gee, there sure are a lot of multiples of 5 in here."?

The reason we can't just look at how far apart blips in the input signal are is because, in the problem we care about (i.e. factoring), the blips are going to be *really damn far apart*.
Like "the sun has plenty of time to burn down while you vanely go from slot to slot, hoping that maybe this next one will finally have the second blip in it" levels of far apart.

And the reason we can't simply compute the common divisor of all the blips is that the first blip might not be in the first state.
The signal might be offset.
Actually, it's even worse than that: *every time we sample there will be a different hidden offset*.

The unknown offset is the reason we care about frequency space.
*Frequency peaks aren't affected by offsets.*
To demonstrate that, I made yet another circuit in Quirk.
This time I'm using an operation that adds larger and larger offsets into the target register, with Quirk simulating what happens for each offset, creating an animation.

Notice that the input state is cycling, but the output peaks are staying perfectly still:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/quirk-spectrogram-5-moving.gif"/>

The phases of the output (not shown) are changing, but the magnitudes are staying the same.
And, when doing a quantum computation, the magnitudes are what matter at the end, because they determine the probability of measuring each state.
The phases matter if you're going to do more follow-up operations... but we aren't.

Another thing you should notice in the above diagram is that the frequency peaks are resilient to little imperfections.
Because the number of states ($2^7 = 128$) is not a multiple of the period (5), there's a little kink where the spacing between blips is 3 instead of 5.
Despite that kink, the peaks are extremely close to 0/5'ths, 1/5'ths, 2/5'ths, 3/5'ths, and 4/5'ths of the way down the output space.


# Preparing Periodic Quantum States

I've explained that, if we had a periodic quantum state with unknown period, we could sample from the peaks in its frequency space in order to learn something about the period.
But how do we prepare that periodic state in the first place?

First, an easy case.
If the period we want is a power of 2, let's say $2^3$, then preparing a periodic state is simple.
Start with an $n$-qubit quantum register initializer to 0, do nothing to the first 3 qubits, and hit the rest of the qubits with a Hadamard gate.
Each qubit you hit with the Hadamard gate will transition from the $|0\rangle$ state to the $\frac{1}{\sqrt{2}} |0\rangle + \frac{1}{\sqrt{2}} |1\rangle$ state, putting the overall qureg into the state $\frac{1}{\sqrt{2^{n-3}}\sum\_{k=0}^{2^{n-3}} |k\rangle$.

We can simulate this preparation in Quirk:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/simple-prepare-period-8.png"/>

An alternative way to create a quantum state that has period 8 is to hit every qubit with a Hadamard gate, add the register we want to prepare into a register of size 3, then measure the other register and try again if the result isn't 0.
[Here's how that looks](http://algassert.com/quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Chance7%22%5D%2C%5B%22inputA7%22%2C1%2C1%2C1%2C1%2C1%2C1%2C%22%2B%3DA3%22%5D%2C%5B%22Chance7%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%5D%2C%5B%22Chance7%22%5D%5D%7D):

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/prepare-period-8-postselect.png"/>

Note that this is a case where the chance display I've been using so far in circuits in this post is a bit misleading.
It looks like the addition didn't change to the state of the register we're preparing.
Actually, its state was affected in a very important way.

One way to make the change caused by the addition more apparant is to [use Quirk's density matrix display](http://algassert.com/quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Density7%22%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%22inputA7%22%2C1%2C1%2C1%2C1%2C1%2C1%2C%22%2B%3DA3%22%5D%2C%5B%22Density7%22%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%5D%2C%5B%22Density7%22%5D%5D%7D):

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/prepare-period-8-postdensity.png"/>

I don't expect readers to know how to read density matrices.
The important thing to notice is that the addition turned the evenly-black box into a diagonal-lines box.
The diagonal lines are actually made up of a bunch of copes of the thing shown on the right, but offset.
Each of those parts is a part of the superposition that can no longer interact with the other parts.
By copying the input register's value into the second register, modulo 8, we separated its superposition into parts; one for the values whose remainder is 0, one for remainder 1, one for remainder 2, and so forth up to the part for remainder 7.

A key thing to understand here is that the second register is acting like a partial measurement of the first register.
This is what is preventing the parts from interacting.
Regardless of the value we get after measuring the second register, the input register will contain a quantum state with period 8.
The various cases just have different offsets...

Hey, remember when I mentioned that the frequency peaks don't move when you offset the input signal.
And notice how we have an input signal with an unknown offset?
[That means... if we apply a Fourier transform...](http://algassert.com/quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22inputA7%22%2C1%2C1%2C1%2C1%2C1%2C1%2C%22%2B%3DA3%22%5D%2C%5B%22Density7%22%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%22QFT%E2%80%A07%22%5D%2C%5B%22Chance7%22%5D%5D%7D)

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/prepare-period-8-qft.png"/>

Yeah, we get an output that has 8 peaks in it.
(The peaks are perfectly sharp because both the period and the size of the QFT are powers of 2.)

This is another example of the difference between a superposition and a probability distribution.
We have a probability distribution of different offsets, and a superposition of a given period for each offset.

Instead of doing addition modulo 8, we can do addition modulo some other number.
This allows us to prepare a periodic quantum state with any period we want.
The state we prepare will have an unknown offset, but that's okay: the frequency peaks don't care.

For example, [here is a circuit in Quirk that prepares a periodic quantum state with period 7, then applies a Fourier transform to check that there are 7 peaks in the output state](http://algassert.com/quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C1%2C%7B%22id%22%3A%22setR%22%2C%22arg%22%3A7%7D%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22inputA7%22%2C1%2C1%2C1%2C1%2C1%2C1%2C%22%2BAmodR3%22%5D%2C%5B%22QFT%E2%80%A07%22%5D%2C%5B%22Chance7%22%5D%5D%7D):

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/prepare-period-7.png"/>

Yup, 7 peaks.


# Figuring out Periods from Frequency Samples

Here's a bit of a puzzle for you.
I'm going to show you a circuit that prepares a periodic state using a modular addition like in the last section, but I'm going to hide which modulus I'm using.
Your job is to figure out the secret modulus.

Here's the circuit:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/prepare-secret-period.png"/>

Do you know what $R$ has been set to?

It should be obvious: there's three peaks, so $R=3$.

But so far we've been overlooking a very important detail: when running an actual computation, *we don't get to see the whole output state*.
We only get to see one measurement outcome at a time.
If we ran the circuit enough times, we would get some rough idea of the number of peaks... but the amount of times we would have to run the circuit would scale with the number of peaks.
If there were $P$ peaks, we'd need to do $O(\sqrt{P})$ runs before we had a reasonable idea of what $P$ was.
This is a problem, because the input states we will be dealing with when factoring numbers will have *huge* periods.
We need a faster way to do this, that works with fewer samples.

Suppose we were sampling from a frequency space of size $N=1024$, and that we didn't know the period of the input signal, but we got a frequency sample $s=340$.
What do you think the secret period might be?

...

...

What if I told you the period was less than 6?

...

Okay, let me give you a hand by going over each case.
If the period was 2, there should be two frequency peaks: one at 0, and one half-way across the space near 512.
If the period was 3, there should be three frequency peaks: one at 0, one a third of the way across the space near 343, and another two thirds of the way across near 687.
If the period was 4, there should be peaks near 0, 256, 512, and 768.
If the period was 5, there'd be peaks near 0, 205, 410, 614, 819.

Did you see it?
__Only one of the periods has a frequency peak near our sampled frequency.__
If the period was 3 then there's a peak around 343.
Our sampled value of $s=340$ is near 343.
This means the input state's period was almost definitely equal to 3.

When the range of possible periods is huge, we can't simply go over all of the cases like we did here and see what's closest.
We need a more clever strategy to find fractions near the point we sampled.
This clever-er strategy comes in the form of a [[[continued fractions algorithm]]].

I would explain exactly how that algorithm works, but python conveniently has it built-in to the `fractions` module:

```python
from fractions import Fraction
print(Fraction(340, 1024).limit_denominator(6))
# prints '1/3'
```

So it's very easy to write a "sampled frequency to period" function:

```python
from fractions import Fraction
def sampled_freq_to_period(sampled_freq, num_freqs, max_period):
    return Fraction(sampled_freq, num_freqs).limit_denominator(max_period).denominator
```

One pain point here is that our sample might be from the peak near 0.
In that case we learn nothing, because every period has a peak near 0.
It tells us nothing.
That's fine, this is really really unlikely for states that have a large period (which is the case we care about).
And if we get really unlucky... well, we can just try again.
And if we never getting values near 0, then I guess we win a Nobel prize because we found a repeatable experiement demonstrating that quantum mechanics is wrong.

The other thing to keep in mind, for quantum states that have potentially huge periods, is that the possible fractions start getting quite close together.
If our maximum period is $p$, then the closest fractions are a distance of $\frac{1}{p^{-2}}$ apart.
So we need to make sure the frequency space we are sampling from is large enough to tell those fractions apart.
That means we need at least $\lg p^{2} = 2 \lg p$ qubits.
Actually, because the peaks get proportionally sharper as you increase the size of the space, it's probably good to through in some extras.
But we can get sufficiently accurate with $O(p)$ qubits.


# Preparing States with an Unknown Period



The thing to


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
