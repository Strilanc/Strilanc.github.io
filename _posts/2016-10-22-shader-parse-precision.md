---
layout: post
title: "Unfathomable Bugs #9: Lossy Shader Packing"
date: 2016-10-22 12:10:10 am EST
permalink: post/1625
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

I've been doing work to get [Quirk](/2016/05/22/quirk.html) working smoothly on phones.
The big problem is floating-point textures: Quirk's intermediate state has lots of floating point values stored in textures, but WebGL doesn't guarantee that you can render to, read out, or even create floating point textures.

Actually, according to [webglstats.com](http://webglstats.com/), the support for rendering to float textures is a lot worse than I thought:

<img style="max-width:100%;" src="/assets/{{ loc }}/web-gl-float-support-charts.png"/>

So apparently it's pretty important to have a workaround for when float texture support isn't present.

The standard workaround for lack of float texture support is to just use byte textures, pack your floats into bytes at the end of every shader, and unpack them at the start of every shader.
So that's what I did.
And that's how the nightmare started.

*(Side note: see [this graphics.stackexchange question](http://computergraphics.stackexchange.com/questions/4151/webgl-packing-unpacking-functions-that-can-roundtrip-all-typical-32-bit-floats) for the packing/unpacking code, which is still not perfect.)*

# Symptoms

To be honest, it almost feels like cheating to use WebGL as the topic of an "unfathomable bug" post.
WebGL combines *browsers*, known for having varied features and incompatible behaviors barely held together by standards, with *GPUs*, also known for having varied features and incompatible behaviors barely held together by standards, into an eldritch clusterstorm of inconsistency and uncertainty.

*(Example: Chrome/Firefox/IE assign WebGL constants directly to `WebGLRenderingContext`, but Safari only puts the constants on __instances__ of `WebGLRenderingContext`.)*

*(Example: I still can't figure out if the endianness of `vec4` byte outputs is guaranteed to match the endianness of `Float32Array`.)*

Knowing about all that inconsistency and uncertainty, I wrote a lot of tests for the float-into-byte-into-float behavior.
Actually, I tried to test the float-into-byte behavior separately from the byte-into-float behavior, since otherwise it's hard to know which is causing a fault.
However, to test the float-into-byte behavior on the devices I cared about, I needed a way besides float textures to get test floats into a shader.

The *correct* way to get floats into a shader is uniforms.
But the idea I went with was to just directly embed the floats within the generated source of a shader.
Like this:

```javascript
suite.testUsingWebGL('encodeEmbeddedFloats', () => {
    let inFloats = randomFloats(16);

    let shader = new WglShader(
        PACK_FLOAT_INTO_BYTES_CODE + `
        void main() {
            vec2 xy = gl_FragCoord.xy - vec2(0.5, 0.5);
            float k = xy.y * 4.0 + xy.x;
            float f = 0.0;
            ${seq(inFloats).
                mapWithIndex((e, i) => `if (k == ${i}.0) f = float(${e});`).
                join('\n            ')}
            gl_FragColor = packFloatIntoBytes(f);
        }`);

    let outBytes = shader.withArgs().readRawByteOutputs(4); //2^4 = 16 pixel outputs
    let outFloats = bytesAsFloats(outBytes); // Just creates a Float32Array view over the bytes
    assertThat(outFloats).isEqualTo(inFloats);
});
```

It's a bit awkward, compared to using uniforms, but not the *worst* idea.
And soon enough the test did stumble over a float that wasn't packed correctly:

<pre><span style="color: red;">Error: Got &lt;
    Float32Array[16211.896484375, [...]
&gt; but expected it to equal &lt;
    Float32Array[16211.8955078125, [...]
&gt;. (assertThat #1)
</span></pre>

Encoding the input `16211.8955078125` increased it by one ulp to `16211.896484375`.
Exactly the kind of bug I was hoping to catch.

So I started fiddling with the encoding code, trying to fix or at least affect the bug, but to no avail.
No matter what I did, I couldn't get the right output.
Eventually, as I was starting to suspect that maybe gremlins were a real thing, I made a desperate move: special-case the two involved values.

```javascript
if (val == 16211.896484375) return vec4(150.0, 79.0, 125.0, 70.0);
if (val == 16211.8955078125) return vec4(149.0, 79.0, 125.0, 70.0);
```

**This still didn't work.**
Despite *literally hard-coding the answer*, `16211.8955078125` was still being bumped up by an ulp.

... until I switched the order of the two `if` statements.

`val` was comparing as equal to both of the floats I was testing against!
This is very strange, because the two values really are distinct floats.
A fact you can confirm very easily:

```javascript
bool alwaysTrue() {
    return 16211.896484375 != 16211.8955078125;
}
```


The above function really does return true.
Even in GLSL.
Even on the machine affected by the bug we've been discussing.

So... clearly something seems to be inconsistent here.
We have one value equal to two unequal values.
Our next step is clear: turn it into a dead simple test case that can't possibly fail.
Here it is:

```javascript
suite.test("mySanity", () => {
    let shader = new WglShader(`
        bool neverTrue(float val) {
            return 16211.8955 == val &&
                   16211.8955 != 16211.896 &&
                          val == 16211.896;
        }
        void main() {
            float a = float(neverTrue(16211.8955));
            gl_FragColor = vec4(a, a, a, a);
        }`);
    let out = shader.withArgs().readRawByteOutputs(0); // 2^0 pixels, 4 vals
    assertThat(out).isEqualTo(new Uint8Array([0, 0, 0, 0]));
});
```

Basically the above code checks that equality is transitive.
It can't possibly fail.

...

...


Yeah, it fails:

<pre><span style="color: red;">[...] mySanity FAILED
    Error: Got &lt;
        Uint8Array[255, 255, 255, 255]
    &gt; but expected it to equal &lt;
        Uint8Array[0, 0, 0, 0]
    &gt;. (assertThat #1)
</span></pre>

This kind of problem would be typical of floats *if we were doing any arithmetic*.
But we're just comparing against constants!

Still, this was a promising lead and so I kept experimenting.
I found that the inconsistency goes away if you store the constants into variables before comparing them.
I also found that the inconsistency goes away if you use a uniform or a texture to input the test float, instead of embedding it directly into the source code.
Finally, and most strikingly, I found that a uniform set to `16211.8955` was not equal to the constant literal `16211.8955`.

With that information, I finally figured it out.

# Cause

My explanation uses two mechanisms to cause all the weird I've been describing:

1. A constant-folding pass with correct precision.
2. A float parser with a precision-loss bug.

I think that, when the browser or the drivers or the GPU or *whatever* on my machine sees the comparison `16211.8955 != 16211.896` it does a special-case constant-folding optimization that correctly replaces the comparison with just `false`.
But, for comparisons that aren't between two constants, the literals survive until a later stage where they are parsed into binary data usable by the GPU.
I think this final parsing stage has a precision bug that rounds `16211.8955` into `16211.896` (apparently the constant-folding process uses a different parser).

To test this idea, I did the obvious thing: just use the two constant literals as outputs (thankfully, the machine this was all happening on supports float textures).
If it's a parsing bug, the output should have two `16211.896`s instead of a `16211.8955` and a `16211.896`.

And that's exactly what happens:

<img style="max-width:100%; border: 1px solid gray;" src="/assets/{{ loc }}/repro.png"/>

As you can see in the test output near the bottom of the screenshot, the `16211.8955` output has been rounded up to `16211.896`.

My workaround for this problem is simple: avoid the parser.
Pass the floats in as uniforms instead of embedding them directly into the GLSL code.

# Further Work

This parsing precision issue isn't the only cross-machine WebGL oddity I've been running into.
There's like three more weird things to figure out before doing the October release of Quirk.
For example, the Nexus tablet on my desk is still adding ulps all over the place compared to the HP laptop and the iPhone.
More seriously, on both the Nexus tablet and the iPhone, something wacky happens when applying a Hadamard gate to all 16 qubits of a circuit:

<img style="max-height: 250px; max-width:100%; border: 1px solid gray;" src="/assets/{{ loc }}/iphone-bad-qubits.png"/>

... Okay... those indicators should never ever be reaching outside of their spheres.
And the probabilities should be 50%, not 33%.
Moreover, the difference between 50% and 33% is *huge* and yet appears very suddenly: Hadamard transforming 15 qubits doesn't cause the issue.
Given what I know about the structure of the code, that sudden appearance of error just seems *impossible*.
More experimentation is required.
No doubt it'll be a head slapper.

Hopefully it'll all be done and tested before Halloween, since I'll be travelling to visit the Santa Barbara office and would rather not have it in the back of my mind the whole time.

# Summary

Intel HD Graphics 5500s may lose a bit of precision when parsing floating point literals.

WebGL feeds my nightmares.
