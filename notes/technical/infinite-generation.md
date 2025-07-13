# The Goal
The player should be able to explore in any direction, as far as they want; the world should keep going infinitely.
- There should be portals at various points that the player can use to fast-travel to any visited portal.
- The world should be divided into regions, each of which has a different combination of enemies and traps.
- All of the world should be connected, i.e. the reachable regions should be unbounded.
- The player should never be able to get themselves trapped, even with the gates that toggle whenever the player goes through.

# Algorithm Ideas
## Algorithm 1: Naive Generation
Algorithm: each time you have to generate a room, for each adjacent room that hasn't been generated yet, randomly either connect it or don't. Then pick a random room and put it there.

Problems:
- This doesn't at all guarantee that the world will be connected.
- This doesn't at all guarantee that the player can't softlock themself.

## Algorithm 2: Voronoi Diagram with Paths Between Portals
The world will be divided into a grid of very large chunks. When the player approaches an ungenerated chunk, the chunk will be generated according to the following algorithm:
1. **Generate portal positions**: Run Mitchell's Best-Candidate Algorithm to generate a bunch of random evenly-spaced points in the chunk.
2. **Compute regions and region boundaries**: For each room whose closest portal is in the currently generated chunk, find its closest portal and assign the room to that portal's region. (In order to avoid having to search infinitely many rooms, this can be done using a flood-fill algorithm). Furthermore, while doing this, keep track of any time you find two regions that share a boundary (meaning a room in the first region is adjacent to a room in the second region).
3. **Generate paths**: For each pair of regions that share a boundary such that at least one is within the chunk, generate a path (i.e. a sequence of room positions) between their portals according to the following process:
	1. Suppose without loss of generality that the x-distance between the portals is less than or equal to the y-distance.
	2. Let $R$ be the bounding box of the rooms containing the two portals.
	3. If the width of $R$ is below a certain threshold (probably 3 rooms wide is a good choice), enlarge its width to meet the threshold while keeping its center fixed.
	4. For each room in $R$, use a recurrence relation to compute the probability of ending at the lower of the two portals when starting at that room and randomly moving left/right/down.
	5. Start the path at the higher of the two portals.
	6. At each step, randomly move left/right/down, using the probabilities as weights for the randomness.
4. Other steps (TODO: write this down, if I choose this approach)

Problems:
- What should it do if the paths overlap?
- This will result in the level layout funneling you towards the portals, which is not what I want.

## Algorithm 3: Edge-Pruning in a Small Square
1. To place portals, use Mitchell's Best-Candidate Algorithm again.
2. To generate the world in a small-ish chunk (say, a 5x5 grid of rooms):
	1. Start with all rooms being control rooms connected on all four edges.
	2. At each step, choose a room and replace it with a room with fewer exits, as long as the rooms in the chunk are still connected.
	3. Repeat until you can't anymore (i.e. you've produced a spanning tree).
	4. Randomly re-add some connections between adjacent rooms (i.e. introducing some cycles so that it's not just a tree).
	5. At each step, choose a room and replace it with a room with a lower traversability number, as long as it is still "connected" afterwards.
	6. Repeat until you can't anymore, or until it's sufficiently disconnected.
3. To generate regions, use a Voronoi diagram like in the other algorithms.

### Connectedness Criterion 1
It is "connected" if you can get from any point in the boundary of the rectangle to any other point in the boundary of the rectangle.

Problem: this will probably result in a lot of control rooms near the borders, which is undesirable.

### Connectedness Criterion 2
Basic idea: it's connected if you can get from anywhere to any adjacent chunk and anywhere in the chunk.

It is connected if the following criteria are met:
- Regardless of starting gate state, you can get from the center of the chunk to any edge in the chunk or along the chunk boundary, and...
- Regardless of starting gate state, you can get from any edge in the chunk or along the chunk boundary to the center of the chunk.

This seems good?

One very small problem: the second and third requirements might be too strong; i.e. there's no (gameplay) reason to limit the path to staying in adjacent chunks. (Actually, there kind of is one: I don't want the player to have to go trekking all the way across the world to find a gate to toggle to let them go past).
