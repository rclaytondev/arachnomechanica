# List of Items
New system: all items will be powerful but single-use, in order to prevent power creep and incentivize the player to actually engage with the enemies.

Items for the new system:
- **Debris** (basic item, much more common than the others): it can be thrown, but doesn't do much.
	- These could have a solid hitbox, which would cause lizards/spiders to turn around when hit.
		- This also might allow the player to perform crazy tricks by throwing a piece of debris and then jumping on it.
	- Problem: if item storage space is unlimited, the player will be incentivized to pick up every piece of debris that they see.
- **Flamethrower**: after being thrown, it emits fire on the left/right side when that side is obstructed by an entity or tile. Also it explodes if destroyed.
	- Problem: this might be too strong (the player could lure enemies to the flamethrower and farm items that way). So maybe it should stop working after a certain amount.
	- This could drop from fire-based enemies (lizards and spiders).
- **Drill**: after being thrown, it repeatedly destroys the block underneath it, digging downward until it stops after a certain length of time.
	- I could also make this work in all directions if that's a good idea.
	- This could drop from humanoid enemies and be triangle-shaped.
- **Rocket Launcher**: after being placed on the ground, it flies upward a few tiles and then shoots a homing rocket left and right once.
	- This is good because although it's very strong, the player is incentivized to only use it when encountering at least 2 enemies, in order to get the most use out of it.
- **Barrier**: after being thrown, it expands vertically, forming a wall that blocks off enemies from getting to you.
	- This can also be used to elevate yourself by throwing it underneath you, which is cool.
- **Decoy**: after being thrown, enemies seek/attack the decoy instead of the player.
- **Invisibility**: after drinking the potion (or equivalent), the enemies do not seek out the player until the effect wears off.
- **Freeze**: after throwing it, all enemies and traps on screen are frozen for a brief period of time.
- **Teleport**: when using the item, the player teleports as far as they can (in the direction of the held arrow keys) until they reach a wall.
	- This was originally planned to be a infinitely-reusable item (possibly with a energy cost or a cooldown to limit uses). However, infinitely-reusable items don't work well with single-use items, and I can still think of good uses for a single-use teleporter, so I now think this is the way to do it.
- **Tractor Beam**: when using the item, a block is selected (the first block in the direction of the held arrow keys). When the player moves, the block moves with them (so the player can drag the block around). When the player uses the tractor beam again, it is deactivated and the block is left where it is.
	- Like the teleport item, this was originally planned to be infinitely reusable but still works as a single-use item.
- **Shield**: when using the item, the player gains an enery shield and becomes immune to all damage for a brief period of time.
	- This could be very brief (e.g. half a second) or a longer effect (5-10 seconds).
	- The original intent was that the player would use it right before being hit (which is why I originally imagined it as being only around half a second), but even with a longer duration, the player is still incentivized to use it right before being hit if they want to maximize the item's usefulness.
	- A longer duration gives the player a choice between safety (using the shield before entering a dangerous room) and efficiency (waiting to use the shield until right before being hit). This indicates that a longer duration could be better.
	- On the other hand, a shorter duration adds more of a timing element, making it more like the shields in games like Dead Cells and Nine Sols.

# Notes About Items
- I now don't think I actually need a starting item that lets you break blocks: if the lizards softlock you, you should always be able to get out of it since that means there will be a lizard in the room and you can use them to break the walls and escape.
- I think I will limit the player to 2 items that activate on a key press, because they can only conveniently press so many keys on their keyboard. (For example, Dead Cells has too many buttons to press conveniently, which is annoying, so I should avoid that).
- I really like the Tinkerer's Workshop system in Terraria, where you can combine items to get an item that has the combined effects but only takes up one slot.
	- Idea: I could have items combine automatically if you have the right ones.
	- Idea: I could have single-use item combining devices that can be found, either randomly or at specific points.
	- Idea: it would be epic if you could eventually combine every item in the game into 1 super-powerful item that does everything, kind of like the Ankh Shield in Terraria except this would be an active ability, not a passive ability.
		- Problem: this doesn't really make sense. For example, would it really be useful or logical to have an item that teleports you, breaks blocks, and shields you, and does all of these things every time you press the button?

# Advanced Movement Techniques
It would be cool to have advanced movement techniques, like in Celeste or Rain World.

Ideas:
- Downward Smash Attack: when in the air, press down+jump to quickly fall to the ground.
- Roll: after doing a downward smash attack onto flat ground, hold a down-diagonal direction to quickly roll in that direction a fixed distance.
- Slide: after doing a downward smash attack onto a slope, hold down-diagonal in the direction of the slope to slide down it.
- Slide Jump: after sliding to the bottom of a hill, press jump to zoom through the air horizontally and upwards a bit.
- Reverse Slide Jump: after sliding to the bottom of a hill, quickly switch direction and press jump to launch yourself straight up, higher than a usual jump.