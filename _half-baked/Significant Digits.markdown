Something that's bothered me since I learned about significant digits, but haven't seen mentioned. (That being said, there is no way this has not been explained a thousand times before.)

[Significant digits](http://en.wikipedia.org/wiki/Significant_figures) is a rough tool for keeping track of precision.

It breaks down when you have a lot of measurements.

Suppose we're trying to decide if a pile of things will have some particular height. Each thing is between 75cm and 85cm and we measure accurate to a millimeter. We want it to line up within a centimeter. So we do the measurements:

<pre>791mm
785mm
779mm
825mm
813mm
817mm
792mm
815mm
848mm
750mm
833mm
817mm
762mm
815mm
807mm
755mm
769mm
834mm
809mm
766mm
765mm
815mm
806mm
821mm
825mm</pre>

and add them up:

<pre>20014mm</pre>

How often will things not line up within a centimeter?

The proper way to analyze this problem is *not* with significant digits. If you assume that because all the inputs have 3 significant digits, so should the output, then you should expect the line-up to be wrong about 1/5 of the time. If you think that the accumulating larger numbers don't count against the significant digits because they're not new measurements, then you expect it to always line up but that's also wrong. Really you'll be wrong about half the time, because the amount of error scales with the *square root* of the number of measurements. We can't quite get away with multiply $0.5$ mm by $sqrt{25}$ and seeing how much is over, because the distribution is going from uniform to bell curved, but it's pretty close.

Let's analyze it as significant digits. 
How precise is that sum? That is to say, how many significant digits does it have?


