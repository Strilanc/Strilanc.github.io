---
layout: post
title: "Wrapping Structure Around Batched Methods"
date: 2016-03-16 10:10:10 EST
categories: programming
---

In this post: working around WebGL's slow `readPixels` method by using batching, and a simple trick for avoiding error-prone concatenation and slicing by wrapping some structure around the resulting batched method.

# Motivation

One of the side projects I work on is [an HTML5 quantum circuit simulator](https://github.com/Strilanc/Quantum-Circuit-Inspector).
It lets you drag gates around, and shows details about what a quantum circuit is doing.

Originally, the simulator did all the number-crunching in javascript.
However, since javascript isn't exactly fast and applying a gate to an $n$ qubit system takes $O(2^n)$ operations behind the scenes, the code wasn't scaling.
To keep things snappy, I decided to try doing the heavy work on the GPU via WebGL.

The main problem I ran into, when trying to use WebGL, besides the fact that shader compiler errors are totally useless, is that getting at the results of operations is very expensive.
Pulling data into javascript-land from GPU-land requires calling [`WebGLRenderingContext.readPixels`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels), and `readPixels` is *slooooow*.
Every call takes a solid ten milliseconds.
When you're pulling dozens of different pieces of data off of the GPU, that adds up fast.

However, `readPixels` is basically the same speed regardless of how much data you read.
The slowness is not a bandwidth problem, it's a latency problem.
So a simple workaround is to batch the reads: instead of calling `readPixels` on ten individual textures, tack on some more shaders to merge all the data onto a single large texture then call `readPixels` just once on that.

Doing a single giant read fixed my WebGL performance problems, but introduced coding problems.
For example, having to split the code into a pixel-producing/processing phase followed by a pixel-consuming phase creates code duplication.
More importantly, it's difficult to abstract away the fact that results are textures under the hood when the centerpiece of the code is everyone putting their desired textures into a bucket.
The code has to collect all of those textures, concatenate them into a single array, run that array through the merged-read process, then carefully slice out the individual results.

Basically the code ended up looking like this:

```javascript
// === PRODUCE ===
let textures = [];
let state = ...
for (let col of circuit.cols) {
    ...
    textures.push(state.wireProbabilities()); // Intermediate wire probabilities.
}
textures.push(state.amplitudes()); // Final state.
for (let i = 0; i < circuit.numWires; i++) {
    textures.push(state.densityMatrixForWires([i])); // Single-wire density matrices.
}
for (let i = 0; i + 1 < circuit.numWires; i += 2) {
    textures.push(state.densityMatrixForWires([i, i+1]); // Paired-wire density matrices.
}

// === ACQUIRE ===
let pixelDatas = mergedReadPixels(textures);

// === CONSUME ===
let probabilityDatas = pixelDatas.slice(0, circuit.cols.length);
let finalStateData = pixelDatas[circuit.cols.length];
let singleWireDensities = pixelDatas.slice(circuit.cols.length + 1, circuit.cols.length + 1 + circuit.numWires);
let pairedWireDensities = pixelDatas.slice(circuit.cols.length + 1 + circuit.numWires); // URGH.
```

The big problem with the above code is those last four statements.
They are *very finnicky*.
Every time you change what's being computed, all those slice indices need to be updated.
Updating the indices is boring error-prone boilerplate work, and only gets worse as you think of more things to compute.

After making a slice mistake for the unpteen'th time when touching this code, I decided something needed to be done about it.
I realized that, instead of taking an array, the method could take something with a bit more structure.
Even better, I realized that this structuring process could be done without touching the `mergedReadPixels` method.

# Batched to Structured

Javascript makes it very easy to explore the fields of an object.
Just iterate over `Object.keys(obj)`, making sure to [do it in the same order each time](http://stackoverflow.com/questions/35878015/does-javascript-guarantee-that-enumerating-the-same-object-twice-will-go-over-th), and peek at `obj[key]` for each key.

By iterating over the fields of an object, and potentially exploring further inside each field, we can build up a mapping between those fields and the indices of an array.
Then, later, we can run that mapping in reverse to create a modified version of the object using values from a new array.
A caller can then use this process to wrap object-like structure around an array-like method.

Let's implement that.

First, we need a method to pull the values out of an object.
I arbitrarily decided to call it `decomp`.

*(There's a lot of arbitrary design choices we can make in terms of the exact behavior of `decomp`. 
For example: should we only explore the top-level fields, or should we explore the whole tree looking for objects of a specified leaf type?
For simplicity, we'll limit `decomp`'s exploration of the object to just top-level fields and arrays.)*

Here's some code for `decomp`, in ES6 javascript.
We just iterate over the keys, and the items of array fields, while appending values into the result:

```javascript
function decomp(object) {
    let result = [];
    for (let key of Object.keys(object).sort()) {
        let val = object[key];
        if (Array.isArray(val)) {
            // Array fields represent batches of work.
            for (let item of val) {
                result.push(item);
            }
        } else {
            result.push(val);
        }
    }
    return result;
}
```

Second, we need an inverse method.
I called this method `recomp`.
It takes the original object, to guarantee the same field-index mapping happens, and the array of updated values.
It then creates a modified version of the object, with field keys defined by the given object and field values defined by the given array:

```javascript
function recomp(originalObject, updatedValsArray) {
    let result = {};
    let i = 0;
    for (let key of Object.keys(originalObject).sort()) {
        let originalVal = originalObject[key]
        if (Array.isArray(originalVal)) {
            let arr = [];
            for (let item of originalVal) {
                arr.push(updatedValsArray[i++]);
            }
            result[key] = arr;
        } else {
            result[key] = updatedValsArray[i++];
        }
    }
    return result;
}
```

Finally, we want a convenience method for wrapping `decomp` and `recomp` around arbitrary batched functions:

```javascript
function structure(batchedFunc) {
    return obj => recomp(obj, batchedFunc(decomp(obj)));
}
```

That's it!
Code that looked like this:

```javascript
let in_a = [3];
let in_b = [3, 6, 7];
let in_c = [22];

let out = batchSquare(in_a.concat(in_b, in_c));
let out_a = out.slice(0, 1);
let out_b = out.slice(1, 4);
let out_c = out.slice(4, 5); // BLERGH
```

Can now look like this:

```javascript
let inputs = {
  a: 3,
  b: [3, 6, 5],
  c: 22
};

let f = structure(batchSquare);
let out = f(inputs);

console.log(out);
>>> {a:9, b:[9,36,25], c:484}
```

You can confirm the code works for yourself by running [the code on jsfiddle](https://jsfiddle.net/sug6tj69/).
(As long as your browser supports the basics of ES6.
I had to replace the `let`s with `var`s to make it work when I tested in firefox.)

# Summary

Calling `readPixels` is expensive, but you can workaround the problem by batching many calls into one.

Concatenating and slicing data to/from batchable pieces is error-prone when done manually, but can be automated in a nice way without any help from the batched method.

*(I'm not sure if a simple trick like this "deserves" a post.
But as programmers we solve little problems like this every day; sometimes it's nice to write down the re-usable solutions.)*