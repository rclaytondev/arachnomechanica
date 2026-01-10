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
	- I could make it so the effect only dissipates when using a portal to the next level. As a consequence, the player could keep the effect if they find a way to get to the next level without using the portal, which is cool.
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
- **Gate Toggler**: when used, all the gates toggle whether they are open or closed.
	- This is a relatively weak item, but that's ok.
	- This was an idea from before I settled on single-use items. Back then it was problematic because it allowed the player to completely ignore the gate mechanic, but as a single-use (or just limited-use) item, there's no problem.
- **Block Collapser**: when thrown, it falls upward. After a few seconds, all blocks near it become affected by gravity and fall to the ground.

# Notes About Items
- I now don't think I actually need a starting item that lets you break blocks: if the lizards softlock you, you should always be able to get out of it since that means there will be a lizard in the room and you can use them to break the walls and escape.
- I think I will limit the player to 2 items that activate on a key press, because they can only conveniently press so many keys on their keyboard. (For example, Dead Cells has too many buttons to press conveniently, which is annoying, so I should avoid that).
- I really like the Tinkerer's Workshop system in Terraria, where you can combine items to get an item that has the combined effects but only takes up one slot.
	- Idea: I could have items combine automatically if you have the right ones.
	- Idea: I could have single-use item combining devices that can be found, either randomly or at specific points.
	- Idea: it would be epic if you could eventually combine every item in the game into 1 super-powerful item that does everything, kind of like the Ankh Shield in Terraria except this would be an active ability, not a passive ability.
		- Problem: this doesn't really make sense. For example, would it really be useful or logical to have an item that teleports you, breaks blocks, and shields you, and does all of these things every time you press the button?
- I really like the idea of having items that give you some effect or ability but only for a 1-level duration (i.e. only until you go through the next teleporter).
	- Benefit: if the player finds a way to skip the teleporter, they can keep the ability, which is cool.
	- Benefit: some items (e.g. Tractor Beam, Teleporter) seem much more fun to use if you can just use it willy-nilly without having to worry about wasting its uses, but are too strong if they are unlimited. This is a good compromise: the player can have fun teleporting all over the place without worrying about wasting its uses, but then they have to go back to playing the game normally.
	- Problem: some items (particularly the Tractor Beam) would be way too strong if they worked like this. If the player got a Tractor Beam item, they would always be able to break a hole into the next level, and therefore would always be able to keep its effects (and therefore the effects of all other items).
	- Problem: if you can use an item until you go through a portal, then it feels like the portal is taking away your items, which is weird.
- Some items appear much stronger than others (especially if I make them usable for a whole level). I could make the strong items all spawn in locations that are impossible to reach by default, to make the game more balanced and less random.
	- Item strength opinions:
		- Strong items: shield, tractor beam, teleport, freeze, invisibility
		- Weak items: flamethrower, drill, rocket launcher, decoy, barrier
	- Note: it's kind of weird that some items can potentially be used much more than others (e.g. the tractor beam is usable for a whole level, while the barrier can be thrown once and that's it). One could argue that this is a more fundamental difference than just "weak vs strong", and that this is therefore bad game design.
