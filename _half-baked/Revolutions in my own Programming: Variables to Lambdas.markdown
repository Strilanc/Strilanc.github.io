When I started programming, I had no idea what I was doing. I was poking around the ancient computer my father had bought, and stumbled onto QBasic. No one around me knew anything about programming, I had no books about programming, and I didn't even have internet access (at least when at my father's). I *literally* had no idea what I was doing.

My only saving grace was QBasic's help. It had a listing of all the things I could do. I could use `LINE (x1, y1) - (x2, y2), color` to draw a line, and `CIRCLE (x, y), radius, color` to draw a circle, and `PRINT` to draw text, and `INKEY$` to read input, and `CALL` to run code I put in other places...

So I made a game. Which is pretty hard to do when you *don't know variables exist*. Basically I turned every possible game state into a subroutine, because I knew about those. Each subroutine would draw its state, then called the next subroutine based on what `INKEY$` was. In my first game you were a circle that could jump and move to the left, center, or right of the screen. The enemy was a box that travelled from right to left, and whether you died when you touched it was determined by whether or not you had been in the air.


There were only 24 states, and because every subroutine always recursed the stack would eventually overflow and crash the game (but I didn't now about the stack, so I thought I'd added too many circles without clearing them or something).

I remember being very confused at the time. How could anyone make anything this way? I was obviously doing something horribly wrong, so I kept digging through the help.

**Variables**

The discovery of variables (and loops) changed everything. I didn't have to write down every state, I could write down one state and rules to tweak it! It's hard to overstate the massive time savings of this dumb discovery. With these new powers I made a space game where an enemy would fly down from above and you moved left and right to shoot it. To allow two bullets on the screen at the same time, I realized I could just repeat the code for bullet #1. I did the same thing to give the enemy boss the ability to fire multiple bullets at you. Everytime I wanted to add a feature, like boss bullets tracking towards you, I'd make that change once per bullet.

Again I was really confused by this. I'd played starcraft, and it allowed *thousands* of units. There was just no way they repeated all that stuff so many times.

**Arrays**

Sometimes I think you can't appreciate how *amazing* arrays are until you've wasted days unnecessarily repeating yourself and debugging dumb "fixed in one copy but not the other" bugs. Programming without arrays is like programming without variables. Arrays exponentially decrease the amount of work you have to do. They turn repeating yourself ninety more times into replacing a `10` with a `100`. They are *awesome*.

...???

Between arrays and the next big jump there's a lot of little things. Data structures and objects and inheritance and generics and so forth. But, although all these things are useful, there was never that same leap until...

**Higher-Order Functions**

I'd learned some scheme in university, but not enough for lambdas to click. Then LINQ was introduced in VB whatever. Suddenly I saw how ungainly for loops had been this whole time: the bloated lines, the interleaved logic, the repetition of functionality. I lost a week just going over code, cutting it in half by translating it to the functional style.

This continued with futures and most recently reactive.
