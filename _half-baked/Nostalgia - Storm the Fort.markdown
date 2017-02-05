---
layout: post
title: "Reminiscing about Storm the Fort"
date: 2014-12-25 11:30:00 EST
categories: quantum
---

When I was younger, I spent a lot of time making custom maps in Starcraft and for Warcraft 3. A few of them were even played somewhat widely. Storm the Fort was one of those rare partial successes. In this post I'm going to mind-dump the design decisions I made in the map.

It's been a long time, so I might get some of the timeline wrong.

Nowadays, Storm the Fort would be called a [MOBA](http://en.wikipedia.org/wiki/Multiplayer_online_battle_arena), but when I started the map there was basically just DOTA. I wanted to simplify and streamline DOTA, with different ideas mixed in, so that it worked in Starcraft.

One of the challenges of making a map in Starcraft, instead of Warcraft 3, is how many more limitations you're operating under. Making the starcraft map editor do anything useful always felt like cheating the system. There was no way to declare a variable, but you could condition on how many times a unit had died and adjust those counts by fixed amounts. You couldn't add one death count to another, but you could make a chain of "when X has died at least 2 times: reduce X deaths by 2 and increase Y deaths by 2". You couldn't adjust kill counts, but you could adjust "kill score".

Starcraft triggers were very simple: every 2 seconds, every trigger was run. Triggers had players, conditions, and actions. A trigger ran once for each of its players, and all of its conditions were true then all of its actions were run. In Warcraft 3 you could give triggers events, like "run when this unit dies", but in Starcraft you had to do things like "condition: unit death count >= 1" to emulate that.

If triggers only running every two seconds sounds laggy to you... it was. Fortunately someone discovered that they *also* ran whenever a wait action finished, and so every single starcraft map you find has a big block of "wait small amount of time" triggers in order to make them run at the maximum rate.

**Early Versions**

My initial idea for Storm the Fort was relatively simple. There'd be periodic spawns, you could buy upgrades, and the interesting mechanic would be the ability to enter vehicles (including the scv, for making defenses).

The most technically complicated thing was spawners. The scv could build buildings that spawned extra units. The *reason* this was technically complicated is that there's no way to iterate over all units of a particular type. What you *could* do was center a location on the top-left-most unit of a particular type owned by a particular player. So I'd do that, then change the owner of the spawner to the base, repeat until the player had no more spawners, then given them all back. I also needed tricks for determining if a spawner was half-built, and had to workaround players leaving in the middle of a spawn cycle (triggers would run once for each player).

In these early versions the game was generally won by being more efficient at killing minions.

Whoever was better at getting enough alone time to kill a bunch of stuff and get ahead in money had an advantage. Common strategies included using the SCV to make a ton of spawners, which was a double-edged sword since it increased opponent income.

Although I enjoyed the game, it did have problems. There were ux issues like the fact that entering a vehicle required moving an observer onto a beacon, requiring a screen move and careful mouse click. There were also design issues, like too little incentive to fight the other heroes. You mostly wanted to go off into a corner and farm minions, because the reward for holding terrain or killing enemy heroes was minimal. Better to be better at killing them later, since you had to do it five times before it mattered.

I fixed the entering a vehicle issue by switching from moving an observer to a beacon to a different system: putting a siege tank in and out of siege mode. This let you hotkey the vehicle action, although it had quite a lot of delay for entering the vehicle. Later on I switched to a mutalisk transforming, which made things much faster (and was controversial, what with people starting to like any limitations you put on them).

Fixing the interaction issue almost happened by accident, and was very controversial: I added base mining. I placed a few mineral patches in the center of the map, and vespene refineries off to the sides. These effectively acted as terrain you wanted to control. Denying control of the center was particularly important, because the base was periodically spawning SCVs to mine. Unless those SCVs were being killed, they'd build up and create quite a large income for your opponent. The refineries didn't have that same build-up effect, just generating periodic income at a steady rate.

Adding mining made the game a lot more intense. You were constantly trying to kill enemy refineries, protect your own, and control the mineral patches. Controlling the mineral patches was actually almost *too* good: people would just race to build dozens of bunkers and leave siege tanks. I had to add a bit of rubber-banding to the base AIs, where they'd send in tanks for you if the middle was too far gone.


The map grew from there, as I added ideas and made things work smoothly.

**Minor Things**

When I made maps, I tended to care a lot about particular little details. Storm the fort was no exception to that rule.

For example, I always thought that hero selection was clunky. Initially it was done identically to other maps: you got a picked unit, there were a bunch of beacons, and you pathed the picker onto the beacon corresponding to the hero you wanted. The problem with this system is that it was slow, it telegraphed your hero choice to the enemy, and starcraft's pathing was so terrible that your picker would sometimes pick the adjacent hero.

A common solution to the "telegraphing your choice" problem was to have one picking area for each time. This had one huge downside though: invisible player drops. It's very common for players to get dropped, or perhaps just leave, while the game started. There was no message to indicate anything was amiss... you just eventually realized there were only 5 players in the game instead of 6. Having a centralized picking area meant that you saw immediately that there were only 5 pickers.

The solution I came up with was mind control. I changed the pickers into dark archons, and players picked their hero by mind controlling that unit. To make it harder to tell what heroes the enemy was picking, I put one group of heroes on the left and the same group on the right but with walls in between. The left team could see the left hero area, and the right team could see the right area. But everyone could see everyone else's picker. So it was easy to tell when someone was missing, since there was one fewer giant red balls, but it was also fast and accurate to pick a hero.

Another example of a clunky UX getting better was the vehicle entering ux. At first it was also a picker-beacon system. This required moving you screen away from the battle and making a precise click. Eventually I realized I could instead do it with unit transformations. Players would siege a tank to indicate they wanted to enter vehicles, and unsiege it to exit. This allowed them to use hotkeys. Even later I realized I could do it with mutalisk morphing, which was like 10x faster than the tank animation.

More minor examples were things like... you didn't hog all of the upgrade buildings. Many maps had upgrade areas where the first person to enter would get control of all the buildings until they left. I did the same, except you only got the buildings you could use. This let multiple players upgrade at the same time, as long as they had different races.

The map would say when a player left, using the color of that player in the message. Starcraft would say the name of who left, but always gave the message in yellow so you didn't know who it was *in terms of the game*. Did my ally or my enemy just leave? STF cleared that up.

The briefing section was short. Basically it said "Use your hero to kill units. Press Start.". Anything more complicated was a waste of time: it's too hard to explain mechanics when players can't experiment. People just taught each other. No reason to bog things down.



The most controversial change I made to storm the fort was the introduction of mining. I put geysers on the sides and mineral patches in the center. The bases spawned SCVs and sent them to the center. If your team could hold the center, the SCVs would accumulate and you'd start getting extra income. The side geysers didn't require SCVS (they were "automatic"), but had lesser income.

Mining completely changed the dynamic of the game. Before mining, my strategy was generally to head off into a corner and kill minions while avoiding heroes. Kill more minions, get more money, pull ahead. It had its charm, but it encouraged you to avoid conflict. Actually, letting outposts die off was good because it made heal cycles faster.

With mining, you suddenly cared about controlling terrain. If the enemy is building bunkers in the middle, that is a *big deal* and had better go kick those bunkers down. (Actually, bunkering the middle was so tempting I had to introduce a tank-spawning mechanic to give it a downside.)

Another later-on change was reinforcements. When there were a lot of enemy units around you (15 I think?), the base would spawn a dropship that would fly to your position and drop a bunch of units. Mostly I just thought it was cool functionality, but it had the nice effect of making breaking defended positions a little easier.

I had to make the command center and upgrade buildings invincible because people learned to snipe them.

There was a bug where the engineering bay would fly away while still being inside the region.

Splitting the upgrade buildings by race.

Choosing units with mind control, while still being able to see if a player dropped, without getting in each others' way.

Entering vehicles with an observer, then a tank, then a mutalisk.

Buildings in the bottom left burning down if you moved them.

Getting units into bunkers was a giant pain.

Preventing team kills by diplomacy toggling and tricky kill detection.

Accidental scvs would repair things sometimes. I was always disappointed it wasn't reliable, so a bit of noise.

Minions. Terran minions were probably the best, with the ability to snipe at enemy heroes and heal. Protoss minions had flicker shields and splash damage that made them amazing at holding off minions once you got your shield upgrades high enough. But if they came up against a defended position, tank and goliath fire would just incinerate them. Zerg minions were just beefy.

Armor thresholds. At first you have to heal often because everything hurts you. Then your armor gets over the marine and firebat damage, then ghost damage, then bunker damage, then (if the game drags on) goliath damage, then (if you're just srewing around) tank damage. In reverse, once a unit does more than 255 damage they start doing hurt to buildings. This made slow firing heroes better at base assault, and fast firing heroes better at minion control.

Later on in the game, hero confrontations starting getting *fast*. Fights at the start of the game take tens of seconds of shooting at each other. At the end of the game the fight is over in a second or two. The sniper hero can take you down in three shots and if they've had time to charge they can cloak when you run at them, so you need map awareness to stay alive. The zergling hero can also kill you in a second or two, but they have to get up close before you start shooting at them. When you failed to do so, you were left with the harrowing experience of running from a zergling. A deficiency in starcraft's pathing prevents zerglings from auto-chasing you while attacking much, so it was a harrowing mess of feints and dodges.

A surprising amount of the skill in storm the fort was in knowing where to move and how to make the terrible pathing do that. Never run upstream, because the pathing will get stuck on allied units coming the other way. The dragoon hero had to be particularly aware of not having their escape blocked by allies. The ability to enter vehicles also had the side effect of people trying to have a getaway car nearby.

Heroes had different damage types, which introduced a bit of a rock-paper-scissors factor. (That's part of why you would often want to change heroes when you died.)

Dying was the fastest way to warp home. This came up in games sometimes, when an opponent was trying to snipe buildings in your base.

Supply depots were double-edged. People often complained that they were overpowered, but I always felt that the truth was the opposite. When your opponent made depots, your income went up. You had the funds to buy minions, which had plenty to shoot at for even more income. You might end up stuck holed up in your base, but you are going to become *deadly*. At best I would say that the supply depots put the game into a bad state, where it see-sawed too slowly.

One deficiency of the map is that the best strategy at the start required knowing that you could enter vehicles. This was a hurdle for new players, and I really dislike it when maps require new players to know something right off the bat. It is counter to the medium in which the map is played, where it's very common for one or two of the people to have never played before.

The map was open source. I never tried to protect it. I explicitly included messages saying that it was fine to modify it, with the caveat that would you please give it a distinctive name like "Storm the Fort *Dark*" or something. I even said "Author *Chain*: Dragoon-elf, " as a way to show the next author should just put their name in line and grow the list. This worked reasonably well. There are several variants, and in fact when I came back to make more changes to the map I started from a tweaked version instead of my last version. The main changes were that the terrain was more symmetric, fairer, and that a lot of the minions were made stronger. But it was funner! Him and his team were also really good at the game. The only time I ever beat them was when testing a new version (in particular, I was seeing if spider mines would work out; they didn't, because the cpu loved COVERING your base in them and it made the end-game tedious. I was also trying out allowing you to enter and control the dropship, which made it too easy to get places. I ended up allowing you to enter it, to be dragged along as a reinforcement, but preventing you from controlling it.).

New versions have appeared since I stopped working on it. Ones with things like upgrades for the minions, with damage when your vehicle explodes (I avoided that with a text joke, saying you popped out "miraculously unharmed").

Colored text required per-player specific triggers. Starcraft somehow failed at coloring player names when they left, so you never knew who it was. Storm the fort gave a colored name.

The most effective thing a trolling player could do was hog the upgrade buildings. It was very hard to damage you because the alliance toggling. They'd could force you to switch heroes, and suck up some income, but that was about it.

People described it as a 3-lane game, but really it was more like 5 lanes because the middle lane split into 3 lanes and center minions were randomly sent down one of those center legs. This kept things active, moving the frontier back and forth.

**Odd Design Decisions that I like**

Storm the fort has an unusual punishment for dying: you lose a life, and if you're out of lives you're out of the game. This contrasts with DOTA, and other modern MOBAs, which mostly use timeouts.

I like the life system better, and the reason is that your death is the moment where you are the *most* frustrated; when you want to do *do* something about it. Why would I make you **wait** at that moment, of all things? To give you time to curse out your opponents and your team?

Storm the fort doesn't punish you for dying, not until you run out of lives anyways, it *rewards* you. You not only get a free warp back to home base, saving time, you get to repick your hero (although you have to stick within the same race if you want to keep upgrades).

Having lives run out has a few other nice side effects:

Bad players die off! It's hard to be angry at someone who can't affect the game anymore. Income gets tweaked in a way that makes 2v3 competitive (I never could decide if the 2 had an advantage over the 3). 1v2 was a lot harder if the 2 were competent, and I never could get 1v3 to work reasonably if the 3 just spread out, but for the most part I saw a lot less anger about bad players than I did in dota. )Or maybe that's just because people were less invested...)

Entering vehicles.

No spells (beyond built-in SC ones). In hindsight I think this was a mistake (a map called temple siege came out later and, among other things, did have abilities and people seem to really like them).

There was not a lot of money given for killing an enemy hero.

**Summary**

I really enjoyed making and playing storm the fort. It wasn't amazingly popular, but it was popular enough that for a long time I could start up a game and play it.

If I were to do it again, I would change a few things:

- Try more things to make 1v3 work. Maybe to the point of forcing one of the players to switch teams.
- Speed up the tipping. There was a general tendency to extend the game, but I think it was lasting too long.
- Triggered abilities

The ideas that worked out fantastically:

- Mining
- Entering vehicles
- 2v3 being reasonably viable


