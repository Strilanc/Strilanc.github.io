Create a probabilistic set (both false positives and false negatives) by hashing values into vectors of +1/-1.

Start the total at [0,0,0,0,...,0] = [0]*d
To add something to the set, add in its vector to the total.
To remove it (or anti-include it?), subtract it out.
Assume it's included if the dot product of the vector and the total is greater than d/2

If we have n vectors of length d and they are all random then the expected overlap between two vectors is +-sqrt(d)
The actual overlap may be worse due to the multiple chances for it to be worse, so a "really bad" pair might exist?

Expected noise of a vector dot product w.r.t. the total should be roughly sqrt(n*d)?
So as long as sqrt(n*d) < d/2 we expect false positives and negatives to be suppressed pretty well?
sqrt(n*d) < d/2
sqrt(n) < sqrt(d)/2
d > sqrt(2) n
d entries in the total
each entry has expected magnitude sqrt(n)
takes d lg(sqrt(n)) bits = n sqrt(2) lg(n)/2 bits = n lg(n) / sqrt(2) bits

for n = 2^10 that's ~7 bits per entry
for n = 2^20 that's ~14 bits per entry
for n = 2^30 that's ~21 bits per entry
Bloom filter, on the other hand, hits <10 bits per entry at 1% false positive rate for all n
Though technically the vector set allows associating a (small) integer instead of just a boolean... is it worth the triple overhead?
Also query time sucks; takes O(n) time to determine if something is probably in the set because of how poorly d scales

Maybe not such a great idea
Also the expected chance of failure needs to be worked out rigorously since it could go bad at a bunch of points

But kind of interesting.
