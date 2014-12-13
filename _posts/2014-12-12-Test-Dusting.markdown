---
layout: post
title: "Dust your Tests"
date: 2014-12-12 11:30:00 EST
categories: testing
---

In this extremely short post: check the code coverage of your tests *on themselves* to catch tests that aren't running.

**Oops**

Generally speaking, you're not supposed to include test code in code coverage metrics. Doing so slows down the tests (since they have to be instrumented), artificially inflates the coverage, and adds noise to the coverage report.

Recently, I noticed precisely that misconfiguration. One of my projects had tests in its coverage report. But, as I was fixing the issue, I glanced a little closer at the coverage and noticed a smidge of red... in the tests. My first instinct was that the coverage tool had failed to instrument that test, but in actuality what was happening was more subtle: the test had rotted.

The problem was that [JUnit4 changed how you specify tests](http://stackoverflow.com/questions/2635839/junit-confusion-use-extend-testcase-or-test). In JUnit3 you would create a class that extended `TestCase` and prefix the names of test methods with the word `test`, but in JUnit4 you're supposed to use `@RunWith` and `@Test` annotations. The test class I had stumbled on was written JUnit 3 style, but being run as a JUnit 4 test. Result: the test code in the class was no longer running.

I fixed the problem, the tests passed, and everything was back to good. Then I thought... maybe I have other code with this problem? So I opened another project, purposefully misconfigured the code coverage tool to instrument the tests, hit run, and... bingo! Two more tests that weren't running for a stupid reason. Tried one more project, and found *another* stupid mistake preventing a test from running.

Oh my. A simple solution to an easily-made-yet-hard-to-catch mistake? I am going to use this *everywhere* now.

Checking how well the tests cover themselves seems like a really good trick to have in the tool belt. So good that there's no way that I'm the first to stumble into it. Alas, searches like "code coverage on tests themselves" are clearly not very effective and so I can't tell you what it's normally called. (I've been calling it "dusting". When your tests get dusty from not running, you dust them and find out about it.)

**Summary**

Running code coverage on the test themselves is a useful trick that I didn't know about.

If your code coverage is under 50% that's not *too* big of a deal. If your tests are 10% dusty... that's a problem.
