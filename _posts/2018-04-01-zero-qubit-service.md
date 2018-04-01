---
layout: post
title: "Announcement: My Quantum Cloud Service"
date: 2018-04-01 1:10:20 pm PST
permalink: post/1803
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}


In 2016, IBM launched the IBM Quantum Experience, a cloud service allowing anyone to run quantum programs on a 5 qubit chip.
The number of qubits has gone up since then, and other companies have launched their own services, but personally I've been generally disappointed with this whole thing.
You see, although quantum computing is <strike>being hyped</strike> exciting more people than ever before, the news cycle has been hyper-focused on *quantity* of qubits.
But what I want is high *quality* of qubits, and no service has met my exacting demands.

Until now, that is.
Here, on this very special day, I am proud to announce the **Algassert Zero Qubit Quantum Cloud Service (AZQQCS)**.

Every qubit available on AZQQCS is literally perfect.
Every.
Single.
One.
To be absolutely positive of this fact, I've done meticulous analysis of all possible errors.
Network hiccups, power outages, meteor strikes, dropping my sandwhich, you name it.
Thanks to this analysis, I can guarantee that no user of AZQQCS will ever observe an error due to decoherence, miscalibration, or any other qubit quality related issue.

Another major benefit of AZQQCS is that, unlike other services, we don't require registration or payment or technically even an internet connection.
Just use the editor right below this very paragraph to drag gates onto the available qubits, then hit "run circuit" to see the results of your simulation!

{% include /jQuery.dep %}
<canvas id="drawCanvas" width="325" height="400" style="border:1px solid #000000;"></canvas>

<input type="button" value="Run Circuit!" id="btnEval" style="width: 325px; height: 50px"></input>

<script src="/assets/{{ loc }}/editor.js"></script>

If you have any complaints, please call 555-555-QBIT for support.
We have one person on call 24/7 per available qubit.
