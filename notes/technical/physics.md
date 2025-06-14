How will physics work?
- The player should be able to collide with walls.
- Lizards count as a wall, and can move.
- Lizards should be able to collide with other lizards.

For the player, use a Celeste-like moving platform system.
If done right, this guarantees that the player will never occupy the same space as a wall.

What about the lizards though?
Initially, they start out non-overlapping.
If one is about to overlap another, it will breathe fire on it, and the second one will die.
So they should never overlap.
This isn't as provable as in the other case though.

# OnGround
Approach 1: reset it to false every frame, and if the player collides with a block while moving downwards, set it to true.
Problem: the player won't move down 1 pixel every frame, so sometimes this will say they're not on the ground when they really are.

Approach 2: don't keep track of it, and instead recalculate it every time you want to know if the player's on the ground.
Problem: performance? maybe...

Approach 3: set it to true when the player touches the ground, and false when they leave the ground.
Problem: how do you tell when they "leave the ground"?
