Have you ever thought about how strange it is that, in school, the letter scale maxes out at 95% (with local variation, of course)? We give students top marks despite an abysmal two 9s of reliability! Twitter got a lot of flack for being unreliable, but in a university they'd be a consistent A+ student.

Why are our expectations for humans so low? Because, generally speaking, humans *suck* at consistency. Richard Feynman would be *awesome* at physics exams, but even he made sign errors.

Donald Knuth wrote down his errors.

A common sentiment, whenever a debate about C's safety-vs-performance trade-off for undefined behavior comes up, is that triggering undefined behavior is done by bad programmers. This is simply not true. Go ask Donald Knuth or John Carmack or Linus Torvalds if they've ever written and released something with an accidental null deref in it. [I bet the answer won't be no](http://www.altdev.co/2011/12/24/static-code-analysis/). They probably write fewer null derefs per line, but ultimately every human makes these dumb oversights. You might as well try to find a mathematician that doesn't make sign errors.

The airline industry learned this decades ago. Even if humans are at fault in an accident, *you can't fix humans*. Punishing pilots can motivate them, but even pilots with good intentions and good training make mistakes. Weeding out the pilots who've made a mistake doesn't get you to X nines of reliability, making it hard for them to make that mistake does.

Pilots pulling the wrong lever and ejecting instead of braking.

Blameless post-mortems.

A typical response to some trivial mistake is to think the authors have no idea what they're doing. They must be brain-dead to overlook something so simple. The problem is that they didn't just overlook it. They caught it 99 times out of 100, they scored an A+, you're just seeing the one that's left over. Cherry picking the errors is not enough to judge how good people are.

Companies that make reliable code don't do it by hiring the best of the best programmers. They do it by making mistakes hard. They have all work, **everything**, reviewed by multiple people. They test and test and test, inside out and upside down. That gets you to two nines. Then you don't just replace malloc/free with garbage collection, you require that there be no dynamic memory allocation at all. You ban recursion and while-loops. You *have a meeting for every change*. You have multiple teams write multiple implementations, verify there's no overlap between the implementations, and have the implementations vote. And don't forget to [go into maintenance mode around leap seconds](http://queue.acm.org/detail.cfm?id=1967009), because seriously: fuck leap seconds. Then, if you're lucky, you'll hit five 9s.


