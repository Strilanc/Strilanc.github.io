On a very parallel machine you might be limited by ram-seconds instead of ram or seconds. For example, if you have a stream of serial programs coming in and some spike memory for a small amount of time while others run for a long time then you can pack spikers amongst streamers but it's harder to do spiky streamers...

For example, consider an n log n algorithm that uses n space, versus a quadratic algorithm that uses constant space. Like, bubble sort versus a not-inplace merge sort. Although the bubble sorts are *massively* slower, you can fit so many more into memory that it doesn't matter?

Space complexity is often done with additional space required, but with ram-seconds it makes sense to count the input because it also has to stay in memory for as long as our algorithm runs. A binary search has spacetime complexity n log n instead of just log n.

Or maybe it makes sense to work on the margin...?

Because the input size matters, you basically get no advantage unless an algorithm uses super-linear space. For example, a skip-list takes n log n space in the worst case and so your worst-case spacetime complexity takes a log(n) hit by switching from a balanced tree to a skip-list.


