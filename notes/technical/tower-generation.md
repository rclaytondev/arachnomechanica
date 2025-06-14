# Original Plans
- There will be a grid.
- A path will be generated, Spelunky-style.
- However, in order to break up the grid, if there is a sequence of $n$ horizontally adjacent rooms, they might be replaced with $n-1$ rooms that are offset half a room, with half a room of empty space on either side.
- A similar thing can be done with vertical rooms.
- Furthermore, to reduce redundancy, rooms might have multiple connection types (e.g. a room might be a T-junction AND an L-connector, with exits that can be replaced with solid blocks if they are unused).


# Room Design Guidelines
- General guidelines:
	- The player can jump 5 blocks, so that's the maximum height you should have.
	- Each room should have as many exits as possible, for maximum variety.
	- Each room should be traversable from any exit to any exit, regardless of what state the doors are in upon entry.
	- If you add lots of exit tiles (e.g. if you have a whole region that gets blocked off if an exit doesn't generate), then you should be very careful about traversability and making sure the player doesn't get stuck.
- Horizontal exit guidelines:
	- Left/right exits should occupy at y=8 and y=9 (down from the top), and possibly more above that. (I.e. the standard floor height is to have the first solid tile at y=10).
- Vertical exit guidelines:
	- Exits going down should have a platform (or equivalent) on the lowest two tiles, and at least one should be in the middle 2 tiles or on the left or right edge of the exit.
	- At least one of the middle 2 tiles should be unobstructed 
	- Exits going up or down should occupy at least the middle 2 tiles horizontally, and possibly more, at most the middle 6 tiles.
	- Exits going up should have a platform on y=4 or higher.
- Half-room guidelines:
	- Top half rooms should use at most the top 6 y-levels.
	- Bottom half rooms should use at most the bottom 5 y-levels.

# The Gate Puzzle Generator Algorithm
## Problem Description
**The Problem**: I want to be able to make rooms with gates in setups that are not always traversable. But I still want the level as a whole to be traversable from any point to any point, no matter what. So the level generator needs to arrange these untraversable rooms in a smart way so that the level as a whole is traversable, even though the individual rooms aren't.

**Example**: Suppose we have a room with a hallway with a single gate in the middle. This isn't always traversable, because if the gate happens to be closed then there's no way through. To make the level traversable, we could use a "control room" with two gates in opposite states and no other obstacles, so that the player can freely switch the gates open and closed by going through. If we put a control room before and after the hallway, this makes it traversable, so a setup like this could be part of a valid level generated. (The control rooms don't need to be next to the hallway for this to work; there could be any number of rooms in between with no gates.)

## The Algorithm
First, for each room we need to store data about how it can be traversed. Each way of going through a room takes you from one exit to another, and either toggles the gates or not. So the traversability data for each room consists of a list of possible paths, each of which starts at some exit with the gates in some state, and ends at another exit (which could be the same exit) with the gates in some state.

When solving the puzzle, the only state you need to keep track of is where you are (room and exit) and the gate toggle state. So this is a graph traversal problem, where the nodes of the graph are tuples of the form `(room, exit, toggled)` and the edges are given by the traversability data of each room. Then the puzzle is solvable if and only if the graph is connected, so we need to make an algorithm that generates levels such that the traversability graph is always connected.

Of course, one way to solve this is to just not use any gates, or make each room a control room. While technically correct, this is an undesirable solution because then the puzzle is too easy, i.e. the graph is too connected. To fix this, we can require that the edges be minimal in the sense that replacing any room with a room with strictly fewer edges will disconnect the graph. The good news is that if we have a solvable level, it's easy to make a minimal solvable level: just replace rooms with rooms that have less connections until you can't anymore without disconnecting the graph. (The number of edges is strictly decreasing as you do this, so the algorithm is guaranteed to finish eventually).

Therefore we just need to find out how to generate rooms such that the graph is connected. But this is easy to do, provided you have at least one control room with four optional exits: just place that room everywhere, and then the graph will surely be connected.

Here's the complete algorithm:
1. Use the Spelunky-style algorithm to generate a main path connecting the top and bottom of the level.
2. Generate rooms off the main path like in the old algorithm:
	1. While there are rooms with an exit connected to a room that hasn't been generated yet:
	2. Find such a room, and generate the room next to it.
	3. For each possible exit of the newly generated room that faces towards an ungenerated square, randomly decide whether to put an exit or a solid wall there.
3. For each room in the level, assign it the maximal list of edges.
4. Choose a room $R$ and construct the list of rooms $S$ it can be replaced with such that $S$ has fewer edges than $R$ and the level is still connected after replacing $R$ with $S$.
5. Choose a random such room $S$ and replace $R$ with $S$.
6. Repeat steps 4-5 until for each $R$, no such room $S$ exists.

Alternatively, if you want to customize the connectivity of the graph, repeat steps 4-5 until the average number of edges per room is less than a certain amount. (The maximum is ${8 \choose 2} = 28$, attained when every room is a control room, and the minimum is $0$, attained when every room is an inescapable prison cell. If there were no gates the number of edges per room would be $\frac{28}{2} = 14$, but this is not much of a puzzle, so you'll probably want a value lower than that.)

## Complication: The Graph is Directed
The graph is actually directed, since you can go through a door and then it closes behind you and you can't go back. So we can't just check if the graph is connected. Instead, we should check if it satisfies the following properties:
1. The player can go from the start to the end.
2. For every state the player can reach, thew player can go back to the start from that state.

To verify the first property, do a DFS. To verify the second property, do a backwards DFS.
