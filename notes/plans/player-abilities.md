# Inherent (Non-Upgrade) Player Abilities
- [ ] Lasers that break blocks but consume a resource
- [ ] Some kind of movement ability:
	- [x] Double jump
	- [ ] Grappling hook?
	- [ ] Teleport ability? The player would press it while holding a direction and teleport until the next wall in that direction. But there are a few ways I could do it:
		- Idea 1: the player can always use the ability, for free. (Sounds fun but is it too OP?)
		- Idea 2: the player can use the ability, but it consumes a resource. (So they'll only choose to use it to get past really unfair generation).
		- Idea 3: the player can use it any time, but only to teleport to specific "teleport target" blocks. (A good balance but now they can't use it to get past softlocks).
		- Idea 4: the player can teleport to "teleport target" blocks for free, or any block but it consumes a resource.
	- [ ] Dash ability? (originally inspired by Ori)

Thoughts on movement abilities:
- A built-in movement ability has 3 functions: to allow the player to traverse the world normally (since the levels are designed assuming the player can travel 5 blocks upwards), to allow the player to mitigate RNG, and to allow the player to have fun.
- Requiring it to consume a resource is generally good for the second function (mitigating RNG) but bad for the third function (having fun).
- Requiring it to consume a resource also has the drawback that it can still feel like the random generation is forcing you to spend it. This is especially apparent if I make it this resource the same as the player's health, which I have been considering.

# To Have Abilities or Not To Have Abilities
## Player Block-Breaking Abilities
Idea 1: no block-breaking abilities.
- Benefits:
	- This allows me to easily control progression.
- Drawbacks:
	- Allowing the player to break blocks increases player agency and allows me to hide more secrets.

Idea 2: some block-breaking abilities (perhaps of various strengths) but none at the start.
- Benefits:
	- This allows me to easily control progression.
	- Allowing the player to break blocks increases player agency and allows me to hide more secrets.
- Problems:
	- None?

## Enemy Block-Breaking Abilities
Idea 1: every enemy that breaks blocks can break every block.
- Benefits:
	- It's a consistent rule: the player will never be surprised when it doesn't work, because it always works.
- Problems:
	- This makes the world too easy to cheese.

Idea 2: lizards can only break blocks inside the tower.
- Benefits:
	- This makes it easy to control progression by using solid blocks to restrict the player.
- Problems:
	- If the player tries to cheese something using a lizard, they could be disappointed when it doesn't work.

Idea 3: same as idea 2, but lizards generally stop working when they leave the tower: they move in a straight line until they hit a wall and then die.
## Energy Cost for Moving?
Idea: whenever the player moves, it uses energy. When the player runs out of energy they die, but it can be replenished at various points along the main path. Also the player can find devices that increase their maximum energy.
- Benefits:
	- When a player discovers a secret, this makes them revisit it over multiple runs because on the first run, they'll run out of energy before exploring it all.
	- This incentivizes the player to only go for secrets once they have a good enough run, since faraway secrets can only be reached if you have enough energy for the journey.
- Problems:
	- It's very gimmicky.
	- It might be stressful to feel like you're always on a timer.
	- I'm not sure how to communicate it visually, since I don't like the idea of plugging a charger into the wall.


# Perk-Like Upgrades?
- List of upgrade ideas:
	- [ ] "Invisibility": the enemies do not see you (i.e. they behave like they did before I added player detection)
	- [ ] "Statue Enemies": enemies only move if you move.
	- [ ] "Statue Traps": traps only move if you move.
	- [ ] "Unlimited Teleporting": teleporting doesn't cost energy. (Too overpowered?)
	- [ ] "Fire Immunity": lizard fire doesn't damage you.
	- [ ] "Laser Immunity": lasers don't damage you.
	- [ ] "Gate Toggler": gates toggle every time you jump.
- Benefits of upgrades:
	- Progression
	- Incentivizes exploration
- Drawbacks of upgrades:
	- The gates already do a pretty good job of incentivizing exploration.
	- If I don't add some form of increasing difficulty, this means the game gets easier over time, which is weird.
	- Many of the upgrades above essentially trivialize some mechanic, which negates all the work I put into developing that mechanic.

# List of Items

| **Item**                                 | **Requires limiting** | **Can be found randomly**                 | **Upgradable**                                           |
| ---------------------------------------- | --------------------- | ----------------------------------------- | -------------------------------------------------------- |
| Teleporter                               | No                    | Yes                                       | Yes? - it could prevent you from teleporting into danger |
| Grappling Hook                           | No                    | Yes                                       | Yes? - increase length                                   |
| Tractor Beam (moves blocks)              | No                    | Yes                                       | Yes - it could select more blocks at once                |
| Wave of Force (pushes enemies away)      | Yes                   | Yes                                       | Yes - it could destroy enemies that hit a wall           |
| Spike Shoes ability (like from Spelunky) | No                    | Yes                                       | No?                                                      |
| Temporary Invisibility                   | Yes                   | Yes                                       | Yes - extend duration / decrease cost                    |
| Temporary Time Slow                      | Yes                   | Yes                                       | Yes - extend duration / decrease cost                    |
| Temporary Invulnerability                | Yes                   | Yes                                       | Yes - extend duration / decrease cost                    |
| Time Travel Device                       | Yes                   | Maybe                                     | Yes - works after death (is it too OP though?)           |
| Shield (like in dead cells)              | No                    | Probably not                              | Yes? - damage enemies                                    |
| Ranged Weapon                            | Maybe                 | Probably not                              | No                                                       |
| Drill (breaks blocks)                    | Maybe                 | Probably not; definitely not if unlimited | Yes? - decrease cost                                     |

## Notes About Items
- I now don't think I actually need a starting item that lets you break blocks: if the lizards softlock you, you should always be able to get out of it since that means there will be a lizard in the room and you can use them to break the walls and escape.
- I think I will limit the player to 2 items that activate on a key press, because they can only conveniently press so many keys on their keyboard. (For example, Dead Cells has too many buttons to press conveniently, which is annoying, so I should avoid that).
- I really like the Tinkerer's Workshop system in Terraria, where you can combine items to get an item that has the combined effects but only takes up one slot.
	- Idea: I could have items combine automatically if you have the right ones.
	- Idea: I could have single-use item combining devices that can be found, either randomly or at specific points.
	- Idea: it would be epic if you could eventually combine every item in the game into 1 super-powerful item that does everything, kind of like the Ankh Shield in Terraria except this would be an active ability, not a passive ability.
		- Problem: this doesn't really make sense. For example, would it really be useful or logical to have an item that teleports you, breaks blocks, and shields you, and does all of these things every time you press the button?
- Problem: some items would be too strong if you could use them all the time.
	- Solution: some items could use energy, which can be refilled at various points throughout the game.
	- Solution: some items could use energy, which slowly regenerates but only if you are exploring new areas.
		- Benefit: this allows for an upgrade that increases the rate at which it regenerates, letting you use your abilities more often.
	- Solution: some items could have a finite amount of uses, like in Noita.
	- Solution: some items could have a time-based cooldown.
		- Problem: this incentivizes the player to play very slowly and just wait for the cooldown, in order to maximize safety.
- Problem: some of the stronger items are absolutely essential (e.g. drill, ranged weapon, shield, time travel device) and so you'll never use the less important items since your 2 item slots will always be full using the essential items.
	- Solution: make the essential items really hard to get, so you won't have them for most of the game.
	- Solution: make it so certain items can only go in certain slots (like how in Dead Cells you get 2 melee/ranged/shield slots and 2 ability/trap slots).
- Problem: 2 item slots isn't really enough since there are more than 2 essential items (e.g. drill, ranged weapon, shield).
	- Solution: make it so the player can carry as many items as they want but can only equip 2 at a time, and can change which one they have equipped at various safe points (e.g. fast travel points).
	- Solution: make it so that there are more than 2 item slots, like maybe 4 with the controls X/C/A/S/D. (The only reason this is annoying in Dead Cells is that you have to use the abilities in combat, so it's hard to quickly change which button your finger is on).
	- Solution: make it so there are more item slots, and you can switch between them using the number keys.

## Dilemma 1: Block-Breaking
The problem is that I want to let the player break blocks, both for mitigating RNG and also for exploration. But I don't want to let them explore just anywhere, because then they can bypass all the clever progression ideas I have and just discover everything in one run. Here are my thoughts on how other games approach this:
- In Spelunky, there are locked background doors that can't be bypassed by breaking blocks: for example, no amount of blasting with a Plasma Cannon will get you into the Eggplant World or the Cosmic Ocean. There are also indestructible blocks.
- In Spelunky, many of the chain steps can be skipped, and this is in fact a good thing, precisely because the skips are harder than the intended route, but are still worth it if you are greedy (e.g. Ankh Skip) or already messed up but want to get back on track (e.g. Qilin Skip, Drill Skip).
- In Noita, almost the whole world becomes theoretically accessible once you have a good enough digger, but this is ok because the world is huge and very dangerous, so you will only be able to explore a tiny fraction before dying. (Even so, I did eventually run out of low-hanging fruit, so maybe this isn't a perfect solution).
- In Terraria, almost the whole world is theoretically accessible immediately, but the player doesn't run out of things to explore quickly because the world is so big.

After some thinking, I've decided that the player will sometimes be able to find not-very-effective block-breaking tools randomly (e.g. the Tractor Beam) but will only be able to get the general-purpose block-breaking tool after a particular point in the game (e.g. after a boss fight).

## Dilemma 2: Health and Combat
Right now the game is balanced around the fact that the player dies in one hit. A health system could improve the game by giving the player another way to improve their character. Also combat allows for more item types.

Note: Dead Cells does health really well! Health is pretty much the only thing in that game that determines how good your run is; I could try to emulate this.
- If I am going to take inspiration from another game's combat, Dead Cells is the one to take it from.
- Maybe try to make it even more skill-based by adding a parry / iframe?