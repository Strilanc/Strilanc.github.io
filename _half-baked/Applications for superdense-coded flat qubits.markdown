Given that quantum states with no imaginary component can be transmitted at double-rate over super-dense coding... is that useful in some esoteric scenario?

I thought it might work for all-or-nothing cryptographic message delivery, where the last bit unlocks the top level of a tree which unlocks the next level and so forth down to the message level. But despite the nesting you can CNOT the dependencies away, except for one of the bits, so it's no better than just hiding that one bit. Would have been an interesting sidestep around the bandwidth restriction (pre-delivery of fixed message instead of pre-delivery of capacity for any message)...

Forwarding grover's algorithm state at double speed? Probably better to just run it all locally...

Sending prepared clone states at double speed *after* compression. After O(lg(n)/2) bits have been sent the other side can decompress and use the n qbits to get a O(1/sqrt(n)). Which matches the classical encode-a-float rate... with phase estimation it could jump up to O(1/n)... but that matches the superdense coded classical rate so no advantage I guess. Could compress the "m of n ON" state into O(lg n) bits then superdense-send it as O((lg n)/2) bits and other side definitely gets m with no statistical error after decompressing and measuring. But that's just the classical rate again (no doubt the compressed state would be just the bits of M set). Seems like superdense coding saves the loses we'd incur doing things in this dumb way, but doesn't do *better*.

Maybe it could be used to actually flatten the qubits? Superdense code them then measure on the other side? e.g. would measurement not occur if the relative phase was imaginary? Can we use it for oblivious transfer?

Quantum-teleportation of two flat qubits over a 1 qubit channel, instead of 1 qubit over a 2 bit channel, seems pretty neat. I guess technically it lets us do two qubits over a 2 bit channel, as long as the other side has two entangled parts ready to go. Send the 2 bits to quantum-teleport a qubit, use that to superdense-send 2 qubits, use those to superdense-send 4 qubits, etc... I think that's just the all-or-nothing idea again. Maybe I should double-check that that doesn't work. I might have accidentally used an operation on the last qubit when trying the without-it decoding... The fact that you have to use the partner to erase after encoding prevents before-message delivery, but it's still neat.


