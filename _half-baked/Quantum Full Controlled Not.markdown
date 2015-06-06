Classically, a controlled-not is not universal for reversible computation.

But a toffoli gate is.

However, that universality assumes the presence of ancillary bits.

For example, suppose you have exactly 4 bits and want to build a triple-controlled-not out of toffoli gates (and controlled nots and nots, should they be needed).

It turns out this is impossible. Think about the operation as a permutation. Permutations have a parity: it either takes an even number of swaps, or an odd number of swaps. When we add a new bit, we're doubling the number of swaps an operation does. But an $N$ bit operation that does $S$ swaps on $N$ bits will do $2^D S$ swaps on $N+D$ bits, and $2^D S$ is even whenever $D > 0$. So *no* three bit operation is able to do a triple-controlled not, because the triple-controlled not has odd parity but the available operations all have even-parity swaps.

You can still implement a triple-controlled not out of toffoli gates on *five* bits, just no on four.

Quantum gates are more flexible than classical gates. Do they have this same problem?

Interestingly, no.

With a few basic quantum gates, you can make a Not with N controls on N+1 bits.

We will use three tricks to make this work:

- Halving. Break $2N$-controlled nots into four $N$-controlled nots, assuming the presence of a single uninvolved bit.

- Aggregating. Break an N-control not into $\Theta(N)$ toffoli gates, assuming the presence of N uninvolved bits.

- Spinning. Apply quantum magic to break an (N+1)-control not into four N-control nots and some single-qubit operations.

Note that an "uninvolved bit" is a bit in an unknown state that shouldn't be affected by the operation. The operation can fiddle with the bit, but must unfiddle the bit before finishing.

# Halving

We want to break a Not with $2N$ controls into four Nots with $N$ controls, without any quantum trickery. Without an uninvolved bit, this would be impossible. With the uninvolved bit, even though we don't know it's value and have to restore it afterwards, it is.

The "trick" is to do everything twice, using operations that are their own inverse, while toggling the uninvolved bit. If the uninvolved has the "wrong" value, operations that shouldn't happen will happen twice and undo themselves.

Here's a simple example:

       control ----   ---   -
               │ │    │     │
    uninvolved X-X- = --- = │
                │ │   │││   │
        target  X X   XXX   X

When the control bit is off, the uninvolved bit stays on or off. So the target is toggled either no times or twice, leaving it in the state it started it. When the control bit is on, then uninvolved bit will be on for exactly one of the operations and so the target gets toggled once.

For our $A+B$-to-$A,B$ case, we do something slightly more complicated:

    A1 ────•───•── A1
           │   │
    A2 ────•───•── A2
           │   │
    A3 ────•───•── A3
           │   │
    A4 ────•───•── A4
           │   │
           │   │
    B1 ──•─┼─•─┼── B1
         │ │ │ │
    B2 ──•─┼─•─┼── B2
         │ │ │ │ 
    B3 ──•─┼─•─┼── B3
         │ │ │ │
    B4 ──•─┼─•─┼── B4
         │ │ │ │
    B5 ──•─┼─•─┼── B5
         │ │ │ │
         │ │ │ │
     U ──X─•─X─•── U
           │   │
           │   │
     T ────X───X── T + A1*A2*A3*A4*B1*B2*B3*B4


Let's convince ourselves that the above words.

If any of the As is off, then the remaining two operations that can happen (controlled by the Bs) undo each other. The same is true for any of the Bs being off: the A operations would undo each other. Therefore it is necessary for all As and all Bs to be on for this circuit to do anything.

When the As and Bs are all on, U is always off for one of the operations controlled by it and on for the other. The circuit reduces to this:

     ──X─•─X─•──      ──◦─•──      ───
         │   │    ==    │ │    ==
     ────X───X──      ──X─X──      ─X─

Meaning all As and Bs being on causes T to toggle (and nothing happens otherwise). So we have successfully used to to break the controlled-not into four smaller pieces, using U.

We can put the split between the number of As and the number of Bs wherever we like, but generally you want to set them to be as close as possible. For example, if we applied this construction recursively to reduce a $CNOT(n)$ all the way down to Toffoli gates, then setting $A = \lfloor \frac{n}{2} \rfloor$ and $B = \lceil \frac{n}{2} \rceil$ gives us the recurrence relationship $T(n) \approx 4 T(\frac{n}{2}) \in \Theta(n^2)$. Contrast that with setting $A=1$ and $B=n-1$, which gives $T(n) = 2 T(n-1) + O(1) \in \Theta(2^n)$.

That being said, we don't actually want to apply this construction recursively. After the first iteration, the remaining operations involve significantly fewer bits. This allows us to switch to something better, so we end up with a linear number of gates instead of a quadratic number.

# Linear Aggregation

The previous construction turned a $CNOT(2n)$ gate into four $CNOT(n)$ gates (plus or minus one). Because each of the $CNOT(n)$s are guaranteed not to touch (almost) half of the bits in the circuit, there's a lot of work space available to exploit. In general, for each $CNOT(n)$, we are guaranteed access to $n-2$ uninvolved bits (or more).

What we're going to do is merge all the control inputs together using Toffoli gates. Each gate we apply can merge two of the inputs, meaning there will be $n-1$ merges since each merge reduces the number of pieces in play by 1. The last merge can go into the target bit, so we need $n-2$ uninvolved bits.

Here's the basic idea as a circuit:


    C1 ────────────•──────────── C1
                   │
    C2 ────────────•──────────── C2
                   │
    C3 ──────────•─┼─•────────── C3
                 │ │ │ 
    C4 ────────•─┼─┼─┼─•──────── C4
               │ │ │ │ │
    C5 ──────•─┼─┼─┼─┼─┼─•────── C5
             │ │ │ │ │ │ │
             │ │ │ │ │ │ │
    U1 ──────┼─┼─•─X─•─┼─┼────── U1 + C1*C2
             │ │ │   │ │ │
    U2 ──────┼─•─X───X─•─┼────── U2 + C1*C2*C3
             │ │       │ │
    U3 ──────•─X───────X─•────── U3 + C1*C2*C3*C4
             │           │
             │           │
     T ──────X───────────X────── T + C1*C2*C3*C4*C5

Note that we can probably rearrange the operations so that pieces are merged like a binary tree instead of like a linked list, and that would cut the circuit a depth from $O(n)$ to $O(lg(N))$. I'm not going to worry about that in this post.

Also note that, in (hypothetical) practice, it can be beneficial to place controls close to the targets. However, "close" depends on the architecture. For example, the surface code places qubits in a 2-d plane so a circuit diagram like the one above will do a poor job of representing those distances. This is another thing we're not worrying about.

To restore the uninvolved bits to their original values, we uncompute. We run the process backwards, without toggling the target bit:


    C1 ────────────•─────────────•──────── C1
                   │             │
    C2 ────────────•─────────────•──────── C2
                   │             │
    C3 ──────────•─┼─•─────────•─┼─•────── C3
                 │ │ │         │ │ │
    C4 ────────•─┼─┼─┼─•─────•─┼─┼─┼─•──── C4
               │ │ │ │ │     │ │ │ │ │
    C5 ──────•─┼─┼─┼─┼─┼─•───┼─┼─┼─┼─┼──── C5
             │ │ │ │ │ │ │   │ │ │ │ │
             │ │ │ │ │ │ │   │ │ │ │ │
    U1 ──────┼─┼─•─X─•─┼─┼───┼─•─X─•─┼──── U1
             │ │ │   │ │ │   │ │   │ │
    U2 ──────┼─•─X───X─•─┼───•─X───X─•──── U2
             │ │       │ │   │       │
    U3 ──────•─X───────X─•───X───────X──── U3
             │           │
             │           │
     T ──────X───────────X──────────────── T + C1*C2*C3*C4*C5

This construction, combined with the divide-and-conquer one, lets us use a single uninvolved bit to turn a $CNOT(n)$ into $\Theta(n)$ Toffoli gates.

But where does that uninvolved bit come from?

**Quantum Sprinkles**

To create an uninvolved qubit, we're going to use two standard constructions: one for replacing a double-controlled single-qubit operation with single-controlled single-qubit operations, and one for tweaking singly-controlled single-qubit operations so that you're only using controlled-Nots.

In quantum computing, every operation corresponds to a unitary matrix. This has many consequences. The one we care about at the moment is that it means *every operation has a square root and an inverse*. Given some operation U, there is always a √U such that applying √U twice is equivalent to applying U. Furthermore, there must be a √U† such that applying √U then √U† (or vice versa) is equivalent to doing nothing. With those two powers, we can do this:

    ─────•─────•──•──      ──•──
         │     │  │          │
    ──•──X──•──X──┼──  ==  ──•──
      │     │     │          │
    ─√U────√U†───√U──      ──U──

Let's see why this works by going over the cases:

- If A and B are off, nothing happens. Every operation depends on A or on B.

- If just A is on, then B will be temporarily turned on to apply √U†, but then the final √U undoes that effect and nothing happens overall.

- If just B is on, then the first √U is applied and then undone by the √U†.

- If both A and B are on, then both √Us are applied and B is temporarily turned off so the √U† is not applied so that the net effect is √U squared, or U.

Therefore the above construction does in fact emulate doubly-controlled U, despite only using singly-controlled operations.

We also can extend this to apply turn triply-controlled Us into doubly-or-singly-controlled Us. In general we can abuse square roots to turn operations with $n$ controls into operations with $n-1$ controls or a single control:

    ─────•─────•──•──      ──•──
         │     │  │          │
    ─────•─────•──•──      ──•──
         │     │  │          │
    ─────•─────•──•──      ──•──
         │     │  │          │
    ─────•─────•──•──      ──•──
         │     │  │          │
    ──•──X──•──X──┼──  ==  ──•──
      │     │     │          │
    ─√U────√U†───√U──      ──U──

(The toggling of the last control must be consistent. That's what forces us to split up the controls so asymmetrically.)

For our case, the NOT operation's matrix is $X = \begin{bmatrix} 0 & 1 \\\\ 1 & 0 \end{bmatrix}$. One of the square roots of that matrix is $\sqrt{X} = \frac{1-i}{2} \begin{bmatrix} 1 & i \\\\ i & 1 \end{bmatrix}$. The inverse of that matrix is $\sqrt{X}^{\dagger} = \frac{i-1}{2} \begin{bmatrix} i & 1 \\\\ 1 & i \end{bmatrix}$. Those are the operations we'd use, if we didn't have another problem to solve first.

Notice that the last operation in the circuit is not a not, but has a lot of controls. That's a problem, because our strategies for further breaking down controls are for NOT gates, not things that are not not gates.

There is a standard way to fix this. When you have some controlled operation $V$ and want the controls to be on $X$ gates (i.e. NOT gates), you find three matrices ($A$, $B$, and $C$) that satisfy $A \cdot B \cdot C = I$ and $A \cdot X \cdot B \cdot X \cdot C e^{i \theta} = V$. There's a standard procedure for doing so, which you can look up in bla because I am not going to explain it here. When you feed $V = \sqrt{X} = \frac{1-i}{2} \begin{bmatrix} 1 & i \\\\ i & 1 \end{bmatrix}$ into that process, you get:

$A = R\_z(-90 ^{\circ}) R\_y(45 ^{\circ}) \approx \begin{bmatrix} 0.85+0.35i & -0.35-0.15 i \\\\ 0.15 - 0.35i & 0.35 - 0.85i \end{bmatrix}$

$B = R\_y(-45 ^{\circ}) \approx \begin{bmatrix} 0.85 - 0.35i & 0.35 - 0.15 i \\\\ -0.35+0.15 i & 0.85 - 0.35 i \end{bmatrix}$

$C = R\_z(90 ^{\circ}) = \begin{bmatrix} 1 & 0 \\\\ 0 & i} \end{bmatrix}$

$\theta = 45^{\circ}$

It's easy to see that $A \cdot B \cdot C = I$, because $R\_z(90 ^{\circ}) \cdot R\_y(45 ^{\circ}) \cdot R\_y(-45 ^{\circ}) \cdot R\_z(-90 ^{\circ}) = R\_z(90 ^{\circ}) \cdot R\_z(-90 ^{\circ}) = I$. The $A \cdot X \cdot B \cdot X \cdot C = \sqrt{X}$ is a bit harder to see, but if you grab an object and rotate it by -90 degrees around the Z axis, then 45 around Y, then 180 around X, then -45 around Y, then 180 around X, then 90 around Z, you should find that the object has ended up in the "rotated 90 degrees around X" position w.r.t. the starting position.

So now we have

    ──•──      ───•───•─θ─    ────────────•────────•──Z45─
      │    ==     │   │    ==             │        │
    ─√X──      ─A─X─B─X─C─    ─Z90†──Y45──X──Y45†──X──Z90─

Which raises one last problem... when we add more controls we're going to get:

    ────────────•────────•───•──
                │        │   │
    ────────────•────────•───•──
                │        │   │
    ────────────•────────•───•──
                │        │   │
    ────────────•────────•──Z45─
                │        │
    ─Z90†──Y45──X──Y45†──X──Z90─

Our attempt to get rid of controls on non-X gates has created a phase gate that requires controls. We could apply the process again to remove one of the controls, and again to remove another, and so on... but every time we do that the newly leftover phase gate will be the square root of the previous one. Which means our construction is going to involve exponentially precise gates. If we actually tried to use those gates directly, in practice, we'd go past the noise floor of the computer and fail. Working around that would require building the exponentially-precise gates out of many other gates... and I don't want to deal with that.

So I had to find some other trick. Eventually I did:

    ──────•──────•──    ──•──
          │      │        │
    ──────•──────•──    ──•──
          │      │   ==   │
    ──────•──────•──    ──Z*─
          │      │
    ──Z*──X──Z*──X──    ─────

Where Z* could be a Z-rotation gate for any amount.

(Side note: this is an alternative way to do the halving from before. Put half of the controls on the Zs and the other half on the Xs. Put hadamard gates on the control wire that you want to be the target wire. It seems much more elegant to me.)

"Wait", I hear you saying. "That construction uses an X controlled by every wire. That's what we're trying to make!". Very observant. We do in fact now have something like:

    ──•──      ───•───•─•─•─────────•───────•──
      │           │   │ │ │         │       │
    ──•──      ───•───•─•─•─────────•───────•──
      │           │   │ │ │         │       │
    ──•──      ───•───•─•─•─────────•───────•──
      │    ==     │   │ │ │         │       │
    ──•──      ───•───•─•─•─────────•───────•──
      │           │   │ │ │         │       │
    ──•──      ──•X─•─X─┼─┼─────────•───────•──
      │          │  │   │ │         │       │
    ──X──      ─√X─√X†─AXBXC───Z45──X──Z45──X──

Which seems silly. But this is a kind of situation that comes up in math a lot: you work an expression, then find yourself in a situation like X = 2X + 2. Do you give up? No! You cancel X out of one side!

We can cancel out the cnot(n)'s on the right hand side by appending cnot(n), Z45†, and cnot(n) to both sides. This undoes out the last three operations on the right hand-side, and turns the left-hand side into a cnot(n) preceeded by Z45†. We get rid of that pesky Z45† by pre-pending Z45 to both sides. Leaving us with:

    ─•─      ───────────•─────•───────────────•────────•───────────
     │                  │     │               │        │
    ─•─      ───────────•─────•───────────────•────────•───────────
     │                  │     │               │        │
    ─•─      ───────────•─────•───────────────•────────•───────────
     │   ==             │     │               │        │
    ─•─      ───────────•─────•───────────────•────────•───────────
     │                  │     │               │        │
    ─•─      ────────•──X──•──X───────────────┼────────┼───────────
     │               │     │                  │        │
    ─X─      ──Z45──√X────√X†──────Z90†──Y45──X──Y45†──X─Z90──Z45──


Success! Now we just have to apply the other constructions.

**Putting it all together**

Start:

    ─•─
     │ 
    ─•─
     │ 
    ─•─
     │ 
    ─•─
     │ 
    ─•─
     │ 
    ─•─
     │ 
    ─•─
     │ 
    ─•─
     │ 
     X 

Apply square-root construction to free up a bit when controlling operations:


    ────•─────•──•─
        │     │  │ 
    ────•─────•──•─
        │     │  │ 
    ────•─────•──•─
        │     │  │ 
    ────•─────•──•─
        │     │  │ 
    ────•─────•──•─
        │     │  │ 
    ────•─────•──•─
        │     │  │ 
    ────•─────•──•─
        │     │  │ 
    ─•──X──•──X──┼─
     │     │     │ 
    √X    √X†   √X 

Apply ABC factorization so controls are only on NOTs. Some of the sub-operations actually cancel out here:

    ───────────•──────────•──•───•────
               │          │  │   │
    ───────────•──────────•──•───•────
               │          │  │   │
    ───────────•──────────•──•───•────
               │          │  │   │
    ───────────•──────────•──•───•────
               │          │  │   │
    ───────────•──────────•──•───•────
               │          │  │   │
    ───────────•──────────•──•───•────
               │          │  │   │
    ───────────•──────────•──•───•────
               │          │  │   │
    ────•───•──X──•────•──X──┼───┼────
        │   │     │    │     │   │
    ──C─X─B─X─────X─B†─X─────X─B─X─A──


Split controlled-not's in half, using the uninvolved bit we free'd earlier:

    ─────────────•───•────────────•───•────•───•─────•───•────
                 │   │            │   │    │   │     │   │
    ─────────────•───•────────────•───•────•───•─────•───•────
                 │   │            │   │    │   │     │   │
    ─────────────•───•────────────•───•────•───•─────•───•────
                 │   │            │   │    │   │     │   │
    ───────────•─┼─•─┼──────────•─┼─•─┼──•─┼─•─┼───•─┼─•─┼────
               │ │ │ │          │ │ │ │  │ │ │ │   │ │ │ │
    ───────────•─┼─•─┼──────────•─┼─•─┼──•─┼─•─┼───•─┼─•─┼────
               │ │ │ │          │ │ │ │  │ │ │ │   │ │ │ │
    ───────────•─┼─•─┼──────────•─┼─•─┼──•─┼─•─┼───•─┼─•─┼────
               │ │ │ │          │ │ │ │  │ │ │ │   │ │ │ │
    ───────────•─┼─•─┼──────────•─┼─•─┼──•─┼─•─┼───•─┼─•─┼────
               │ │ │ │          │ │ │ │  │ │ │ │   │ │ │ │
    ────•───•──┼─X─┼─X──•────•──┼─X─┼─X──X─•─X─•───X─•─X─•────
        │   │  │ │ │ │  │    │  │ │ │ │    │   │     │   │
    ──C─X─B─X──X─•─X─•──X─B†─X──X─•─X─•────X───X─B───X───X─A──


Split controlled-not's into toffoli gates, using the uninvolved bits free'd by cutting the per-operation number of controls in half, to do linear aggregation:



    ──────────────•───•──────────•───•────────────•───•──────────•───•──────────•───•──────────•───•──────────•───•──────────•───•─
                  │   │          │   │            │   │          │   │          │   │          │   │          │   │          │   │ 
    ──────────────•───•──────────•───•────────────•───•──────────•───•──────────•───•──────────•───•──────────•───•──────────•───•─
                  │   │          │   │            │   │          │   │          │   │          │   │          │   │          │   │ 
    ─────•X•─•X•─•┼•─•┼••X•─•X•─•┼•─•┼•──•X•─•X•─•┼•─•┼••X•─•X•─•┼•─•┼••X•─•X•─•┼•─•┼••X•─•X•─•┼•─•┼••X•─•X•─•┼•─•┼••X•─•X•─•┼•─•┼•
         │││ │││ │││ ││││││ │││ │││ │││  │││ │││ │││ ││││││ │││ │││ ││││││ │││ │││ ││││││ │││ │││ ││││││ │││ │││ ││││││ │││ │││ │││
    ─────┼•┼─┼•┼─•X•─•X•┼•┼─┼•┼─•X•─•X•──┼•┼─┼•┼─•X•─•X•┼•┼─┼•┼─•X•─•X•┼•┼─┼•┼─•X•─•X•┼•┼─┼•┼─•X•─•X•┼•┼─┼•┼─•X•─•X•┼•┼─┼•┼─•X•─•X•
         │││ │││ │ │ │ ││││ │││ │ │ │ │  │││ │││ │ │ │ ││││ │││ │ │ │ ││││ │││ │ │ │ ││││ │││ │ │ │ ││││ │││ │ │ │ ││││ │││ │ │ │ │
    ─────┼•┼─┼•┼•X─X•X─X┼•┼─┼•┼•X─X•X─X──┼•┼─┼•┼•X─X•X─X┼•┼─┼•┼•X─X•X─X┼•┼─┼•┼•X─X•X─X┼•┼─┼•┼•X─X•X─X┼•┼─┼•┼•X─X•X─X┼•┼─┼•┼•X─X•X─X
         │ │ │ ││   │   │ │ │ ││   │     │ │ │ ││   │   │ │ │ ││   │   │ │ │ ││   │   │ │ │ ││   │   │ │ │ ││   │   │ │ │ ││   │   
    ─────•─•─•─•┼───┼───•─•─•─•┼───┼─────•─•─•─•┼───┼───•─•─•─•┼───┼───•─•─•─•┼───┼───•─•─•─•┼───┼───•─•─•─•┼───┼───•─•─•─•┼───┼───
         │ │ │ ││   │   │ │ │ ││   │     │ │ │ ││   │   │ │ │ ││   │   │ │ │ ││   │   │ │ │ ││   │   │ │ │ ││   │   │ │ │ ││   │   
    ────•┼─┼•┼─┼┼───┼──•┼─┼•┼─┼┼───┼────•┼─┼•┼─┼┼───┼──•┼─┼•┼─┼┼───┼──•┼─┼•┼─┼┼───┼──•┼─┼•┼─┼┼───┼──•┼─┼•┼─┼┼───┼──•┼─┼•┼─┼┼───┼───
        ││ │││ ││   │  ││ │││ ││   │    ││ │││ ││   │  ││ │││ ││   │  ││ │││ ││   │  ││ │││ ││   │  ││ │││ ││   │  ││ │││ ││   │   
    ─•─••X─X•X─XX───X──•X─X•X─XX───X•──••X─X•X─XX───X──•X─X•X─XX───X──X┼─┼X┼─┼•───•──X┼─┼X┼─┼•───•──X┼─┼X┼─┼•───•──X┼─┼X┼─┼•───•───
     │ ││   │   │   │  │   │   │   ││  ││   │   │   │  │   │   │   │  ││ │││ ││   │  ││ │││ ││   │  ││ │││ ││   │  ││ │││ ││   │   
    CXBXX───X───•───•──X───X───•───•XB†XX───X───•───•──X───X───•───•──•X─X•X─XX───X──•X─X•X─XX───X─B•X─X•X─XX───X──•X─X•X─XX───X─A─


Well, I guess the actual final operations get quite complicated... it doesn't even fit! But the steps along the way aren't too bad.


**Conclusions and Notes**

A quantum computer doesn't need ancilla bits to do a not with many controls, even if every single bit is either a control or the target. Classical computers need one uninvolved bit.

It's significantly cheaper to just have the extra working space, instead of massaging involved bits into the role. Having an uninvolved bit to start with lets you avoid the square-root and ABC constructions, easily saving a factor of four on gate count. Having enough uninvolved bits at the start to do the linear aggregation lets you avoid the halving construction, saving another factor of 2. Knowing the uninvolved bits were guaranteed to be zero would save another factor of 2 on top of that (no more doing everything twice while toggling).

Simple operations don't always look so simple, after reducing them into the available gates. I didn't even apply the last step, where you build the Toffoli gate out of singly-controlled-nots, Hadamard (H), and eigth-of-a-turn phase gates (T, and its inverse ⊥):

    ─•─    ────────•───────•─•───•─T────
     │             │       │ │   │      
    ─•─ == ────•───┼───•───┼─X─⊥─X─T────
     │         │   │   │   │             
    ─X─    ──H─X─⊥─X─T─X─⊥─X───────T─H──


