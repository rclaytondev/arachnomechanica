# List of Items
New system: all items will be powerful but single-use, in order to prevent power creep and incentivize the player to actually engage with the enemies.

Items for the new system:
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
- **Freeze**: after throwing it, all enemies and traps on screen are frozen.
- **Duplicator** (stationary): the player places an item in the duplicator and the duplicator outputs two copies of the original item.
	- Possible idea: if the duplicator is destroyed, the original item can be retrieved, resulting in three copies total.

# Notes About Items
- I now don't think I actually need a starting item that lets you break blocks: if the lizards softlock you, you should always be able to get out of it since that means there will be a lizard in the room and you can use them to break the walls and escape.
- I think I will limit the player to 2 items that activate on a key press, because they can only conveniently press so many keys on their keyboard. (For example, Dead Cells has too many buttons to press conveniently, which is annoying, so I should avoid that).
- I really like the Tinkerer's Workshop system in Terraria, where you can combine items to get an item that has the combined effects but only takes up one slot.
	- Idea: I could have items combine automatically if you have the right ones.
	- Idea: I could have single-use item combining devices that can be found, either randomly or at specific points.
	- Idea: it would be epic if you could eventually combine every item in the game into 1 super-powerful item that does everything, kind of like the Ankh Shield in Terraria except this would be an active ability, not a passive ability.
		- Problem: this doesn't really make sense. For example, would it really be useful or logical to have an item that teleports you, breaks blocks, and shields you, and does all of these things every time you press the button?