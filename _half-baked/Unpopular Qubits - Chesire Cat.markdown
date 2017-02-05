In this post: my attempts to understand the quantum chesire cat paper in terms of a quantum computer instead of an optical system.

A (few months?) ago, a paper about "quantum chesire cats" was released. The premise of the paper is that the researchers found a way to "separate" an atom from its angular momentum, in some useful way.

There's a sixty symbols video about it.

I'm more familiar with simple quantum circuits than I am with optical circuits, so I wanted to try to translate what the researchers were doing.

I have no idea how helpful this will be to other people, so I guess this post is more for me. Oh well.

This prompted me to update my quantum circuit inspector, last seen in the fourier transform post. I needed several gates and some ability to view probabilities.

**Optical Gates**

The paper uses the following diagram:

![Quantum Cheshire Cat Optical Diagram](http://i.imgur.com/Qo1uE8D.png)

If, like me, you're not familiar with optical systems... that's a lot to take in. Let's go over it bit by bit while building up an equivalent circuit.

First, let's go through the basics of how this system is represented quantumly.

There are two quantum values in play: path and polarization. A photon can be on the left path or on the right path, and a photon can be horizontally or vertically polarized. Since this a quantum system, a photon can also be put into linear combinations of those states.

The path can be all-left (represented as $\mathrm{path} = \left| L \right\rangle$), all-right ($\mathrm{path} = \left| R \right\rangle$), or a complex weighted combination of both like ($\mathrm{path} = \frac{1}{\sqrt{2}} \left| R \right\rangle + i \frac{1}{\sqrt{2}} \left| L \right\rangle$).

Analogously, the polarization can be all-horizontal like $\mathrm{polarization} = \left| H \right\rangle$, all-vertical like $\mathrm{polarization} = \left| V \right\rangle$, or in a combination. In particular, we will care about the combinations that correspond to [circular polarization](http://en.wikipedia.org/wiki/Circular_polarization). Clockwise polarization corresponds to $\mathrm{polarization} = \left| + \right\rangle = \frac{1}{\sqrt{2}} \left( \left| H \right\rangle + i \left| V \right\rangle \right)$, while counter-clockwise corresponds to $\mathrm{polarization} = \left| - \right\rangle = \frac{1}{\sqrt{2}} \left( \left| H \right\rangle + i \left| V \right\rangle \right)$.

The entire system $\psi$ is combination of the polarization and path. The system can be in classical-ish states like all-left-and-horizontal ($\psi = \left| L H \right\rangle$), or counter-intuitive entangled states like either-left-horizontal-or-right-vertical ($\psi = \frac{1}{\sqrt{2}} \left( \left| L H \right\rangle + \left| R V \right\rangle \right)$).

On a quantum computer, the path and polarization are both just single qubits. So our starting point is a circuit with just two qubits. We'll arbitrarily say that $\left| R \right\rangle = \left| 0 \right\rangle$, $\left| L \right\rangle = \left| 1 \right\rangle$, $\left| H \right\rangle = \left| 0 \right\rangle$, and $\left| V \right\rangle = \left| 1 \right\rangle$.

PICTURE

Great. Now that we have a state space to work with, lets start operating on it.

The input into the system is a horizontally polarized photon on the right path, or $\psi = \left| R H \right\rangle = \left| 00 \right\rangle$. (Maybe it would be more intuitive to rename "right" to "has reflected an even number of times path", since the initial segment is actually on the left of the diagram, but we're stuck now!)

The photon is then passed through a beam splitter. The beam splitter evenly distributes the photon onto both paths, but also adds a phase factor of $i$ for the reflected path. Beam splitters don't affect polarization. So the system transitions from $\psi = \left| R H \right\rangle = \left| 00 \right\rangle$ to $\psi = \frac{1}{\sqrt{2}} \left| (R + i L) H \right\rangle = \frac{1}{\sqrt{2}} \left| R H \right\rangle + i \left| L H \right\rangle$.

Last week I talked about turning rotations into nice qubit operations. It turns out that a beam splitter is like a 90 degree rotation around the X axis (i.e. it's a square root of NOT), with corresponding operation BLA. This has an extra global phase factor, but global phase factors never affect measured outcomes so we'll go with it. I represent this gate with an up-arrow, to indicate a quarter-turn upwards.

Next the left and right parts of the photon reflect off the respective mirrors. This has no effect on the quantum state. (Well, it adds a global phase factor, but recall that those don't matter to the outcome. Also I'm lazy.)

Now we get to the tricky stuff: the half wave plate and phase shifter on the right path. The purpose of these elements is to determine if the system is in a particular entangled state involving circular polarization, analogous to what the more-common-in-quantum-computer bell state measurement does.

I actually don't know exactly what half-wave plates do (I think they reflect the polarization through a specified axis?), but the paper is nice enough to say that they want it to swap $\left| H \right\rangle$ and $\left| V \right\rangle$. In other words: it's a NOT gate. A controlled-not gate, actually, since whether or not it is applied to the polarization-representing qubit is determined by the value of the path-representing qubit. The phase shifter also does work to the polarization: the paper says they want it to add a phase factor of $i$ to the vertical polarization and do nothing to the horizontal polarization. That's just half of a Z gate (which I am going to call a counter-clockwise gate instead of a phase gate because WHY WOULD YOU CALL ONE SPECIFIC PHASE GATE "THE" PHASE GATE?!) again controlled by the path qubit.

So the half-wave plate transitions us from $\psi = \frac{1}{\sqrt{2}} \left| R H \right\rangle + i \left| L H \right\rangle$ to $\psi = \frac{1}{\sqrt{2}} \left| R V \right\rangle + i \left| L H \right\rangle$. We represent them with controlled NOT and counter-clockwise gates:

PICTURE

The second beam splitter works like the first. Each part of the state is handled independently, half goes through and half gets reflected, and the half that gets reflected gains a factor of $i$. The state goes from $\psi = \frac{1}{\sqrt{2}} \left| R V \right\rangle + i \left| L H \right\rangle$ to $\psi = \frac{1}{2} \left( \left| R V \right\rangle + i \left| L V \right\rangle + i \left| L H \right\rangle - \left| R H \right\rangle \right)$.

Basically, we have a Mach-Zhender interferometer, but with the polarization shenanigans acting as a detector so the state hasn't interfered with itself. The circuit gains another up gate:

PICTURE

The last operation is the polarization-based beam splitter. It sends horizontally polarized photons one way and vertically polarized photons the other way. It kinds of doesn't make sense to talk about left-versus-right anymore because we're splitting the right path in two, so we'll relabel $L$ into $D\_2$ while $R$ gets split into $D\_1$ and $D\_3$ based on the associated polarization. This takes the state from $\psi = \frac{1}{2} \left( \left| R V \right\rangle + i \left| L V \right\rangle + i \left| L H \right\rangle - \left| R H \right\rangle \right)$ to the final state $\psi = \frac{1}{2} \left( \left| D\_3 V \right\rangle + i \left| D\_2 V \right\rangle + i \left| D\_2 H \right\rangle - \left| D\_1 H \right\rangle \right)$.

On the quantum computer the polarization-based beam splitter is not even necessary. Instead we just measure the qubits with the understanding that $D\_1$ would have clicked when we measure $00$, $D\_2$ would have clicked when we measure $10$ or $11$, and $D\_3$ would have clicked when we measure $01$. The circuit inspect lets me add peek gates to see the probabilities of each of those happening:

PICTURE

**Invariants**

Okay, what was the point of that? Well, the paper explains:

When you put a detector on the left path, it clicks *if and only if* $D\_1$ clicks. In a quantum computer a detector can be represented by adding a qubit and controlled-not-ing into that qubit at the point where you want to detect (you can avoid adding a qubit whenever the principle of deferred measurement applies). So our circuit now looks like this:

Notice that the probability of the detector qubit being set, given that the system ends up left-path-vertically-polarized, is 100%. This would seem to imply that when $D\_1$ clicks, the photon must have taken the left path.

*However*, if the photon took the left path then we should not be able to get any detectors on the right path to fire. But it turns out that we *can* put a detector on the right path that can click when $D\_1$ clicks. That detector? A circular polarization / angular momentum detector.

Detecting the circular polarization in the quantum circuit is basically just a basis transformation. We do a down gate, detect, then undo the change with an up gate.

PICTURE

Notice that, in the above picture, p|c is NOT zero percent. This shows that, although we intuitively think of the photon as must-have-taken-the-left-path, we still get polarization shenanigans on the right path. That's the sense in which the angular momentum has been separated from the photon.

**Uses**

How can this be used, besides as an informative paradox?

Well, the interesting thing here is how it affects operations applied to the polarization on each branch.

If you apply X rotations to the right branch (and don't have the angular detector on the left branch), p|c stays fixed at 100%. If you apply X rotations to the left branch, p|c moves around.

If you apply Y rotations to the left branch (and don't have the incidence detector on the right branch), p|c stays fixed at ~10%. But apply it on the right branch, and p|c varies.

This means that, if you have some operation that has both X and Y effects, you can pull out just one of them (by putting it on the right branch) then measuring how p|c changes.

Also there's a whole thing about weak measurement that allows you to kind of statistically counter-factually have detectors on both paths at once while still separating the effects, but I don't understand counter-factual computation well enough to explain it.

**Summary**

The quantum cheshire cat thing is a paradox where you infer a photon took one path of an interferometer based on a detector firing, but can still pick up circular polarization shenanigans in the other leg.

It's useful for filtering out some types of effects.

I'm pretty sure quantum computers already had known and easier ways to do this sort of thing, but on the other hand the optical system has actually been implemented so take that quantum computers.
