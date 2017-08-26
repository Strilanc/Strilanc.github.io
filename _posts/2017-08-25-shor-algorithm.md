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
First, I was just learning all this quantum computing stuff.
I didn't have to guess at what people would find confusing, I was experiencing it first hand.
Secondly, I *actually grappled with the problem*.
I didn't try to explain Grover search with [terrible analogies](https://scifundchallenge.org/firesidescience/2014/03/16/dont-blink-the-quantum-zeno-effect-and-the-weeping-angels/).
I didn't just state some [ridiculous overhyped nonsense](http://www.dailymail.co.uk/sciencetech/article-3409392/Forget-Schrodingers-cat-researchers-reveal-quantum-pigeonhole-principle-say-tests-basic-notion-physics.html),
And I didn't use oversimplified factoids (e.g. "0 and 1 at the same time" or "does every computation simultaneously") that couldn't possibly communicate anything but confusion.
I started from the basics, explained the pieces, put them together, and kept doing that until a search algorithm emerged.

I may not be able to write an explanation from the perspective of a first-time-learner anymore, but I can still help readers actually grapple with the problem to be understood.
And that's what I intend to do in this post.
I want to explain Shor's algorithm, and I want to do it in a way where at least readers who know a bit about coding come away thinking "THAT's how it works?!", instead of being left with nothing but a general sense of confusion.

I'll do my best to keep things simple and approachable, but I *will* be digging into the mathematical details.
There have been [valiant attempts at explaining Shor without math](http://www.scottaaronson.com/blog/?p=208) (though frankly Scott does use quite a bit of math in that post), but I think real understanding requires knowing the details.


# The Plan

To understand Shor's quantum factoring algorithm, we'll work on first understand several smaller things.
Then it's just matter of seeing how they fit together into a story that cuts numbers into pieces.
Each of those smaller things takes some work to understand, but I'll do my best to get the core ideas across.

Here are the rough parts, or rather the questions, that I'll be breaking my explanation into:

1. Why is sampling the frequencies of a signal useful for finding its period?
2. How does a quantum computer make a periodic signal, relevant to factoring a number $R$, and then sample from its frequencies?
3. How does finding the period of a modular-multiplication operation tell us 'extra square roots' modulo $R$? (E.g. a $u$ that isn't 1 or -1 yet satisfies $u^2 = 1$.)
4. Why does knowing an extra square root modulo $R$ reveal factors of $R$?

I realize that these questions used a bunch of terms and concepts I haven't explained yet.
For example, what the heck are the "frequencies of a signal"?
Well, I guess that's a good a place as any to start.


# Warm up: Speakers, Frequencies, and Spectrograms

For a long time, historically, sound was a bit of a mystery.
People knew that striking a bell would make a ringing noise, but they didn't really have a solid idea of what was going on physically.
A lot of work and thought went into figuring out the underlying mechanism and how that relates back to what we actually experience.

The *mechanism* of sound is just a single variable (vibrations in the air / pressure in your ear) going up and down over time.
For example, loudspeakers produce sound by moving a diaphragm back and forth very quickly.
The specific pattern of the back-and-forth movement determines what sound is being produced.
Everything you've ever heard can be reduced to a series of speaker diaphragm positions.
In fact, that's exactly how early audio formats such as WAV files stored music: a raw uncompressed list of numbers telling the speaker where to be from moment to moment.

Sound may be a single varying variable, but the way we experience sound doesn't seem at all like that.
We hear a whole *spectrum* of frequencies, all coming and going independently.
I think of this as one of the big mysteries of sound: how does a single up-and-down signal translate into a rich spectrum of many variables going up and down?
Of course, this is one of those mysteries that we actually know the answer to.
If you take raw audio, chunk it into pieces, and [Fourier transform](https://en.wikipedia.org/wiki/Fourier_transform) each of the pieces, what comes out is (much closer to) what we hear: a spectrum of frequencies coming and going.

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

The files have different sample rates, and their spectrograms aren't *exactly* identical, but they all look basically the same: four strong and evenly-spaced peaks that stay constant over time.
Actually, there's a fifth peak hiding at 0, and Audacity is hiding a [mirrored half of the frequency spectrum](https://dsp.stackexchange.com/questions/4825/why-is-the-fft-mirrored).
So really there are *ten* peaks.
It is **not** a coincidence that the number of implied peaks is equal to the period of our input signal.

Keep in mind that each spectrogram in the above diagram has a different frequency scale.
Varying the sample rate is having an effect on the frequency peaks: when the sample rate is twice as high, the frequencies are twice as high.
But *proportionally speaking* the spectrograms have peaks in the same places, and that's what we care about.

(Fun fact: if you actually generate and play those audio files, they sound like *complete awful garbage*. I expected them to sound like something akin to the spectrograms: four (or nine) overlapping tones. This probably says something interesting about my speakers or how I perceive sound.)

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
The answer to that question is: because quantum computers can switch their own state into the frequency domain.
We can then sample the quantum computer's state and find out what the dominant frequencies are (if any).

The frequency spectrum of a single state is just a [sine wave](https://en.wikipedia.org/wiki/Sine_wave), smoothly oscillating up and down.
By contrast, the frequency spectrum of a periodic signal is not smooth.
Like the spectrograms from earlier, it has sharp evenly-spaced peaks.
Furthermore, the number of frequency peaks isn't a property of some individual state: it's equal to the spacing between states.
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
First, keep in mind that the green displays in the diagrams are not available in real life.
We don't get to see the distribution, we only get to sample from it.
This can tell us *where* a peak is (if it's big enough), but not how many peaks there are.

Still, why don't we just look at the initial signal and see how far apart the blips are?
Why can't we figure out the period by sampling the input signal and noticing "Gee, there sure are a lot of multiples of 5 in here."?

The reason we can't just look at how far apart blips in the input signal are is because, in the problem we care about (i.e. factoring), the blips are going to be *really damn far apart*.
Like "the sun has plenty of time to burn down while you vanely go from slot to slot, hoping that maybe this next one will finally have the second blip in it" levels of far apart.

Even worse than that, the signal we're sampling from might have an offset.
If we sample the number 213, that could be "50*4" with an offset of 13 or "10*21" with an offset of 3 or any other combination of offset and multiple.
*Every time we sample, there will be a different hidden offset.*
This prevents us from figuring out the underlying pattern; it just looks like random noise (in fact it's *exactly* random noise).

Here's the key thing that makes frequency space useful: *frequency peaks aren't affected by offsets*.
When you shift a signal, its Fourier transform may apply a phase a factor to each output value, but the magnitudes of those outputs all stay the same.

To demonstrate this, I made yet another circuit in Quirk.
This time I'm using an operation that adds larger and larger offsets into the target register, with Quirk simulating what happens for each offset, creating an animation.
Notice that the input state is cycling, but the output peaks are staying perfectly still:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/quirk-spectrogram-5-moving.gif"/>

The phases of the output (not shown) are changing, but the magnitudes are staying the same.
And, when doing a quantum computation, the magnitudes are what matter at the end.
The magnitudes determine the probability of measuring each state.
The phases matter if you're going to do more follow-up operations... but we aren't.

Another thing you should notice in the above diagram is that the frequency peaks are resilient to little imperfections.
Because the number of states ($2^7 = 128$) is not a multiple of the period (5), there's a little kink where the spacing between blips is 3 instead of 5.
Despite that kink, the peaks are extremely close to 0/5'ths, 1/5'ths, 2/5'ths, 3/5'ths, and 4/5'ths of the way down the output space.


# Preparing Periodic Quantum States

I've explained that, if we had a periodic quantum state with unknown period, we could sample from the peaks in its frequency space in order to learn something about the period.
But how do we prepare that periodic state in the first place?

First, an easy case.
If the period we want is a power of 2, let's say $2^3$, then preparing a periodic state is simple.
Start with an $n$-qubit quantum register initialized to 0, do nothing to the first 3 qubits, and hit the rest of the qubits with a Hadamard gate.
Each qubit you hit with the Hadamard gate will transition from the $|0\rangle$ state to the $\frac{1}{\sqrt{2}} |0\rangle + \frac{1}{\sqrt{2}} |1\rangle$ state, putting the overall qureg into the state $\frac{1}{\sqrt{2^{n-3}}} \sum\_{k=0}^{2^{n-3}} |k\rangle$.
That's a periodic state with period $2^3$.

We can simulate this preparation in Quirk:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/simple-prepare-period-8.png"/>

An alternative way to create a quantum state that has period 8 is to hit every qubit with a Hadamard gate, add the register we want to prepare into a register of size 3, then measure the other register and try again if the result isn't 0.
[Here's how that looks](http://algassert.com/quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Chance7%22%5D%2C%5B%22inputA7%22%2C1%2C1%2C1%2C1%2C1%2C1%2C%22%2B%3DA3%22%5D%2C%5B%22Chance7%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%5D%2C%5B%22Chance7%22%5D%5D%7D):

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/prepare-period-8-postselect.png"/>

Note that this is a case where the green chance display is a bit misleading.
It looks like the addition didn't change to the state of the register we're preparing.
Actually, its state was affected in a very important way.

One way to make the change caused by the addition more apparent is to [use Quirk's density matrix display](http://algassert.com/quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Density7%22%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%22inputA7%22%2C1%2C1%2C1%2C1%2C1%2C1%2C%22%2B%3DA3%22%5D%2C%5B%22Density7%22%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%5D%2C%5B%22Density7%22%5D%5D%7D):

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/prepare-period-8-postdensity.png"/>

I don't expect readers to know how to read density matrices.
The important thing to notice is that the addition turned the grid pattern in the left display into a bunch of diagonal lines in the middle display.
The diagonal lines are actually made up of a bunch of offset copies of more spaced out grids, like the one shown in the display on the right.
Each of those offset copies represents a part of the superposition that can no longer interact with the other parts.
By copying the input register's value into the second register, modulo 8, we separated its superposition into parts.
There's one part for the values whose remainder is 0, one part for values whose remainder is 1, one for remainder 2, and so forth up to the part for remainder 7.

Basically, the second register is acting like a partial measurement of the first register.
This is what is preventing the parts from interacting.
Regardless of the value we get after measuring the second register, the input register will contain a quantum state with period 8.
The various cases just have different offsets.

Hey, remember when I mentioned that the frequency peaks don't move when you offset the input signal?
And notice how we have an input signal with an unknown offset?
[That means... if we apply a Fourier transform...](http://algassert.com/quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22inputA7%22%2C1%2C1%2C1%2C1%2C1%2C1%2C%22%2B%3DA3%22%5D%2C%5B%22Density7%22%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%22QFT%E2%80%A07%22%5D%2C%5B%22Chance7%22%5D%5D%7D)

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/prepare-period-8-qft.png"/>

We get an output that has 8 peaks in it!
(The peaks are perfectly sharp spikes because both the period and the size of the QFT are powers of 2.)

I hope this really drives home how superpositions and a probability distributions are different from each other, and combine in interesting ways.
The top register contains a superposition with period 8, but we don't know which one.
If we find out which one, the top register will still contain a superposition with period 8 and the frequency spectrum will still have 8 peaks in it.
But if we sampled the input superposition and collapse it to a single state, the frequency spectrum would switch to a raw sine wave.
We have a probability distribution of different offsets, and a superposition of a given period for each offset.

Now, instead of doing addition modulo 8, we can do addition modulo some other number.
This allows us to prepare a periodic quantum state with any period we want.
The state we prepare will still have an unknown offset, but that's okay: the frequency peaks don't care.

For example, here is a [circuit in Quirk](http://algassert.com/quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C1%2C%7B%22id%22%3A%22setR%22%2C%22arg%22%3A7%7D%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22inputA7%22%2C1%2C1%2C1%2C1%2C1%2C1%2C%22%2BAmodR3%22%5D%2C%5B%22QFT%E2%80%A07%22%5D%2C%5B%22Chance7%22%5D%5D%7D): that prepares a periodic quantum state with period 7, then applies a Fourier transform to check that there are 7 peaks in the output state

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/prepare-period-7.png"/>

Yup, 7 peaks.

Now we have a general procedure for making periodic states with any period we want.
We'll come back to this theme later, but first I want to explain how knowing the location of just one peak can tell you the period of the input.
(As opposed to having to count the peaks, which would require quite a lot of sampling.)


# Figuring out Periods from Frequency Samples

Here's a bit of a puzzle for you.
I'm going to show you a circuit that prepares a periodic state using a modular addition like in the last section, but I'm going to hide which modulus I'm using.
Your job is to figure out the secret modulus.

Here's the circuit:

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/prepare-secret-period.png"/>

Do you know what $R$ has been set to?

It should be obvious: there's three peaks, so $R=3$.

But remember: when running an actual computation, *we don't get to see the whole output state*.
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
This clever-er strategy comes in the form of the [continued fractions algorithm for the best rational approximation](https://en.wikipedia.org/wiki/Continued_fraction#Best_rational_approximations).

I would explain exactly how that algorithm works, but python conveniently has it built into the `fractions` module.
We don't have to know how it works, we can just use it:

```python
from fractions import Fraction
print(Fraction(340, 1024).limit_denominator(6))
# prints '1/3'
```

With `limit_denominator` in hand, it's easy to write a "sampled frequency to period" function:

```python
from fractions import Fraction
def sampled_freq_to_period(sampled_freq, num_freqs, max_period):
    f = Fraction(sampled_freq, num_freqs)
	r = f.limit_denominator(max_period)
    return r.denominator
```

One pain point here is that our sample might be from the peak near 0.
In that case we learn nothing, because every period has a peak near 0.
That's fine, because getting 0 is really really unlikely for states that have a large period (which is the case we care about).
And if we do get really unlucky... well, we can just try again.
And if we never getting values near 0 again and again and again forever, then I guess we win a Nobel prize because we found a repeatable experiment demonstrating that quantum mechanics is wrong.

The other thing to keep in mind, for quantum states that have potentially huge periods, is that the possible fractions start getting quite close together.
If our maximum period is $p$, then the closest fractions are a distance of $1/p^2$ apart.
So we need to make sure the frequency space we are sampling from is large enough to tell those fractions apart.
Practically speaking, that means our register must have at least $\lg p^{2} = 2 \lg p$ qubits.
Actually, because the peaks get proportionally sharper as you increase the size of the space, it's probably good to throw in some extras.
The point is that we can get sufficiently accurate with $O(p)$ qubits.


# Preparing States with an Unknown Period

Modular addition isn't the only way to prepare periodic states.
I mean, if it was, the ability to figure out the modulus by sampling the frequency space of the state would be an esoteric but ultimately pointless bit of trivia.
Whoever put together the circuit obviously know the modulus; they could have just *told it to you*.
In order to do something interesting, we have to be able to make a periodic-state-producing circuit from start to finish *and still not know what period its state will have.

It turns out that this is not very hard to do.
Any periodic function $f$ will do.
As long as $f(x) = f(x + p)$ and we can make a circuit that computes $f$, we can produce a periodic state that we can then sample in order to figure out $p$.
The key point here is that *knowing $f$ doesn't mean you know $p$.

For example, suppose we use $f(x) = 2^x \pmod{23}$.
What's the period of this function?
In other words, if you start at 1 and being multiplying by 2 again and again, how long will it be until you reach another number that's 1 more than a multiple of 23?
Let's see... 1, 2, 4, 8, 16, 32→9, 18, 36→13, 26→3, 6, 12, 24→1; there it is!
It took us... 11 doublings to get back to 1.
So the period of $2^x \pmod{23}$ is 11.

You know what, let's try this in Quirk.
Create a uniform superposition for $x$, initialize the ancilla register to 1, multiply it by $2^x \pmod{23}$, and...

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/quirk-prepare-period-11-mul.png"/>

Eleven peaks!

Okay okay, let's try something a bit harder.
This time we're going to be multiplying by 7 modulo 58, and I'm not going to show you the impossible-in-reality probability display.
[All you get is a sample](http://algassert.com/quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C1%2C1%2C1%2C1%2C1%2C%7B%22id%22%3A%22setB%22%2C%22arg%22%3A7%7D%2C1%2C%7B%22id%22%3A%22setR%22%2C%22arg%22%3A58%7D%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22X%22%5D%2C%5B%22inputA10%22%2C1%2C1%2C1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22*BToAmodR6%22%5D%2C%5B%22QFT%E2%80%A010%22%5D%2C%5B%22Sample10%22%5D%5D%7D):

<img style="max-width:100%; border:1px solid gray; padding: 5px;" src="/assets/{{ loc }}/quirk-secret-mul-period.png"/>

I promise I didn't cherry-pick this output; I took a random sample.
There were $2^10 = 1024$ possible frequency samples, we got a sample of 732, and we know the period can't be more than our modulus of 58.
Can you figure out the period *without* doing a bunch of multiplications by 7?

...

...

Hey, remember that `sampled_freq_to_period` python function we defined earlier?
Let's try that:

```python
guess = sampled_freq_to_period(sampled_freq=732,
                               num_freqs=1024,
                               max_period=58)
print(guess)
# prints '7'
```

Feel free to check that $7^7 \pmod{58} = 1$.

At this point you should be convinced that, assuming we can actually implement this $\times B^A \pmod{R}$ operation, we can recover its period by sampling from a frequency spectrum and using our handy-dandy python function.
Explaining how to implement that operation is way more detail than I want to go into (but, if you're really interested, [I wrote a whole paper about it](/post/1712)).

The only real missing piece now is... why the heck are we computing this period?!
What do we even do with it??

Answer: We're going to use it to find extra square roots.

Follow-up question: What? How does that help us factor numbers? What even is that?! Why are there so many steps! Why is this so hard!? Auuuurrrrgh!!

Answer: Uh... okay. Look, just hold on, we're getting there. I promise.


# Turning an extra square root into a factor

An "extra square root" $u$ is a number that squares to give 1, but $u$ isn't 1 or -1.
In the numbers you're probably used to, this never happens.
But, in modular arithmetic, it does.
For example, when working modulo 100, the number 49 is an extra square root.
49 isn't 1, and it isn't 99 (which is -1 mod 100), but $49^2 = 2401 \equiv 1 \pmod{100}$.

The thing about knowing $u^2 = 1$ is that we can rewrite this equation into $u^2 - 1 = 0$.
That equation *factors*.
It's equivalent to saying that $(u-1)(u+1) = 0$.

Now, if $u$ was 1, the fact that $(u-1)(u+1) = (1-1)(1+1) = 0 \cdot 2$ was zero would not be very suprising.
Similarly, if $u$ was -1, then $(u-1)(u+1) = (-1-1)(-1+1) = -2 \cdot 0$ vanishing is not very surprising.
But if $u$ isn't either... now we have an interesting equation.

If we're working modulo $R$, then knowing $(u-1)(u+1) = 0 \pmod{R}$ tells us that $(u-1)(u+1)$ is a multiple of $R$.
In other words, we know two non-zero values $a$ and a $b$ such that $a \cdot b = k \cdot R$, for some $k$.
Now suppose we factorized $a$, $b$, $k$, and $R$ into their prime factors.
Then our equation becomes $(a\_1 \cdot a\_2 \cdot ... \cdot a\_{n\_a}) \cdot (b\_1 \cdot ... \cdot b\_{n\_b}) = (k\_1 \cdot ... \cdot k\_{n\_k}) \cdot (R\_1 \cdot ... \cdot R\_{n\_R})$.

Every prime factor that appears on the right hand side of this equation must have partner on the left hand side.
But here's the thing: the partners to the prime factors in $R$ *have to be spread over $a$ and $b$ both*.
If all of $R$'s prime factors were in $a$, then $a$ would be a multiple of $R$ which would mean $u-1$ was zero the whole time (modulo $R$) which would violate our assertion that $u$ isn't equal to 1.
The same logic applies to $b$.

If we filter out the gross $k$ factors out of $a$, we'll be left with just the $R$ factors.
Just *some* of the $R$ factors.
We can do this filtering with the greatest-common-divisor function: $r\_1 = gcd(a, R)$ gives us a factor of $R$!

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


# Turning a period into an extra square root

So, we know how to take an extra square root $u$ modulo $R$, and turn that into a factor of $R$.
We also know how to use a quantum computer to tell us the period of the function $f(x) = b^x \pmod{R}$ for any $b$ and $R$.
How do we put these two pieces together?

Well... the period $p$ is the smallest solution to the equation $b^p = 1 \pmod{R}$.
The key idea is that, if we raise $b$ to *half* of the period, then the result will be a square root of $1$.
After all, $b^{p/2} * b^{p/2} = b^p$ and we already know that $b^p = 1 \pmod{R}$.

Sometimes the period will be odd, so we can't divide it by half.
Sometimes the square root we get will be -1, instead of an extra square root.
But, sometimes, the period will be even and $b^{p/2}$ won't be congruent to -1.
(The good case is not rare, by the way.
As far as I know, it's like winning two coin flips.)

We might have to try a few random $b$'s before landing on one that works, but when we do... bingo.


# Putting it all together

We've now discussed all the key parts of Shor's algorithm:

1. Using a quantum computer and frequency space sampling to perform period finding.
2. Using period finding to find extra square roots.
3. Using extra square roots to get factors.

With all of this information internalized, we can finally write some pseudo-code to simulate Shor's algorithm.

```python
from math import log2
from fractions import Fraction, gcd

def factor_attempt(n):

    base = random.randint(2, n-2)
    period = sample_period(base, n)
    
	# Try to extract an extra square root.
	half_period = period // 2
    y = pow(base, half_period, modulus)
    if y == 1 or y == n-1 or y**2 % n != 1:
        return None  # Failed attempt.
	
	# Use strange square root to pull out a factor.
	return gcd(y + 1, n)

	
def sample_period(base, modulus):
    modulus_bit_count = int(ceil(log2(modulus)))
	precision = modulus_bit_count * 2

	# Prepare a uniform superposition of possible exponents.
	exponent_qureg = Qureg(size=precision, initial_value=0)
	for q in exponent_qureg:
	    apply Hadamard to q

    # Create distinguishing information that separates the exponents
	# into equivalence classes modulo the unknown period.
	ancilla_qureg = Qureg(size=modulus_bit_count, initial_value=1)
	ancilla_qureg *= pow(base, exponent_qureg, modulus)
	
	# Convert to frequency space.
	apply QFTinv to exponent_qureg

	# Sample from the frequency spectrum.
	s = measure exponent_qureg

	# Figure out the fraction closest to the proportional sample.
	frac = Fraction(numerator=s, denominator=1 << precision)
	nearby_bounded_frac = frac.limit_denominator(modulus - 1)
	
	# The denominator should be the period.
	return nearby_bounded_frac.denominator
```

The above code is in many ways naive, but I hope it gives the general idea.

A real algorithm would break down the exponentiation into basic quantum gates.
It would also check several fractions and periods near to the sampled value, in case the sampled result was close instead of exact.
It would deal with special cases like "Oops, I'm an extremely lucky person. The base I chose at random is not co-prime to the modulus.".
It would check for various classically-easy cases like small factors, square numbers, etc.
And so on and so on.


# Summary

Shor's algorithm mixes together frequency space, fractions, extra square roots, periods, and a bit of luck until a factor pops out.
