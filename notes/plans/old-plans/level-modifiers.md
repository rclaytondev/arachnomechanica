## Random Components?
### Version 1: A Random Subset of the Components
- When a level is generated, a few (2 or 3) components would be chosen from the list (lizards / spiders / lasers / spikeballs).
- Apart from gates which always generate, these would be the only components that generate in the level.

Benefits of version 1:
- It adds variability: there would be at least ${4 \choose 2} = 6$ types of levels that generate.
- Since only 2 components generate, it prevents the level from feeling overcrowded and overcomplicated.

Drawbacks of version 1:
- There might be more variability if I just let every component generate, since that's more components.

### Version 2: Random Modifiers
- When a level is generated, a few components (lizards / spiders / lasers / spikeballs) are selected.
- For each component, a random behavior is selected from the following list:
	- Lizards:
		- Standard behavior: they move towards you if you're in the same row or column, and continue on their path otherwise.
		- "Gravity": lizards are affected by gravity (so they move like in Snakebird).
		- "Statue": lizards only move when you move.
		- "Passive": lizards move like normal, but don't actively move towards the player.
	- Spiders:
		- Standard behavior
		- "Statue": spiders only move when you move.
	- Lasers: no special behavior
	- Spikeballs:
		- No-gravity: they bounce off walls at 45-degree angles, ignoring gravity.
		- Gravity: they bounce along the ground.
		- Rolling: they roll along the ground.

Benefits of this approach:
- There are so many combinations! Every level would be different.
- Depending on what behaviors I add, it could be an interesting puzzle to deduce which modifiers are in effect by observing behavior.

Drawbacks of this approach:
- Many of the modifiers make the game significantly easier, and this shouldn't just happen randomly.
- Having identical-looking enemies with different behavior seems like bad design.