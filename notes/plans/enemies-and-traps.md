# List of Ideas
## Enemy Ideas
- [x] Lizard enemy that moves in a straight line and turns left or right when it hits a wall or sees the player, and breathes fire if you're in front of it
- [ ] Spider enemy that crawls along walls, floors, and ceilings, always moving in the same direction, and attacks you in some way.
	- Idea 1: when it sees you, it shoots a projectile, and then runs away (perhaps only until its attack recharges).
		- This idea is really good, but ideally the player should have a reason to chase after it, in order to make it running away more interesting.
		- Idea 1-A: maybe it could steal your stuff using a tractor beam, and then you'd have to chase it to get it back. (But what would it steal?)
		- Idea 1-B: if you corner it (i.e. it can't move in either direction along the perimeter wall without getting closer to you), it starts shaking/smoking and explodes, which can destroy tiles.
	- Idea 2: it shoots a fireball at you if you're in the same row or column. (Problem: very similar to lizard attacks).
	- Idea 3: it shoots a fireball at you if you're in the same diagonal line.
	- Idea 4: it has orbiting fireballs that it shoots at you if you're tangent to them.
	- Idea 5: if it gets close to you it pulls its legs in, curls up into a spikeball, and jumps at you (like the Watcher Knights in Hollow Knight).
- [x] Humanoid creature with a body made of long, thin triangles; when it sees you, it disassembles itself into triangles that all rotate so the pointy end is facing you, and the triangles launch themselves at you one at a time. When they're all there, they reassemble into a humanoid creature again.
	- [ ] Ideally it should also have some other attack that it can do while in human form. In order to be distinct, it should not be a ranged projectile attack or an attack involving damage upon touching its body.
		- Idea 1: it raises its hands and summons spikes from the ground that stab you.
		- Idea 2: it raises its hands and summons slow-moving flying enemies that seek out your position and deal contact damage.
		- Idea 3: it does some kind of shockwave on the floor (by stomping? I'm not sure I remember what my idea was here...)
		- Idea 4: it points its hand at you and blasts you back with a wave of force.
		- Idea 5: it raises its hands and deals damage on a circle centered about itself, either with an effect like Pure Vessel's attack, or with arcs of lightning. (I like this the best).
	- [ ] Boss idea:
		- If you have 4 of them in the same room, they could combine into a giant boss version of the humanoid creature (since 4 isoceles triangles can be combined into 1 similar isoceles triangle).
		- If necessary, there could be a secret room with a diagram showing 4 of the humanoids in a diamond shape, with lines between every pair of humanoids. (This would hint that something happens if all 4 are in the same room).
- [ ] Drone enemy that moves in a Hilbert curve pattern
	- It could be a 1x1 creature that is shaped like a TIE fighter from Star Wars.
	- It could activate a horizontal/vertical laser when it sees you (same row/column).

## Incomplete Enemy Ideas
- [ ] Some kind of creature that only moves when you move
	- It has to have really dangerous attacks or else it will be very easy.
	- Idea: this could be a trap instead of an enemy, and it could be merged with the extended-spinning-blade trap that I decided was too much like lizards.
	- This could work well with a trap that freezes you in place (like paincones), unless that makes it too easy.
- [ ] Almost-spherical humanoid creature that, if you're in the room below it, curls up into a ball and falls straight the floor, crushing anything in its way
	- Is this actually good for gameplay? It might be too out of the player's control.
- [ ] Four-legged wolf-like creature with an humanoid rider? (Ideally they would be able to function separately or together)
- [ ] Bird enemy that glides at a shallow angle back and forth (turning around when it hits a wall), and also maybe has an attack like the blue birds in Dead Cells
	- Idea 1: it launches a projectile downwards when you're below it (this works mechanically but it would seem like it's pooping on you which is weird).
	- Idea 2: when it sees you it swoops towards you, perhaps pulling its wings in so that it is very pointy.
	- Location: somewhere with lots of empty space
- [ ] Tall walker enemy with long legs (inspired by Rain Deer and those desert creatures in the Watcher): it keeps its head at a constant height regardless of the floor below it, so its legs change in length as the floor height varies.
	- Idea 1: it shoots a laser horizontally if you're in the same row. (Problem: too similar to existing lasers?)
	- Idea 2: it stomps on you (good because it uses the legs and isn't just focused on the head)
	- Idea 3: it swings a gigantic sword at you
	- Location: somewhere with open spaces and long platforms at multiple heights

## Trap Ideas
- [x] Spikeball trap that shoots spikeballs at 45 degrees; they bounce off floors, walls, and ceilings
- [x] Spinning lasers
- [ ] Device that emits toxic gas if you get close (the gas spreads to adjacent tiles and goes away after a certain length of time)
	- Problem: this could be really hard to avoid, especially since the doors can close behind you.
	- This would be better in an area with a moderately open layout and no toggle gates.
- [ ] Device that launches homing rockets at you if you're nearby
- [ ] Device that shoots a laser that moves in a straight line orthogonally and splits into two lasers in perpendicular directions when it hits a wall, up to 2 times
- [ ] Trapped floor (mulltiple tiles wide): if you stand on it, the ceiling collapses on you (and stays on the floor when collapsed, like falling tiles in Minecraft)

## Unfinished Trap Ideas
- [ ] Liquids? (Seems hard)
- [ ] Spikes? (not very exciting)
- [ ] Device that extends out a spinning blade that moves in a straight line towards you if you're in the same row or column, and extends another if you are in the same row or column as that, and so on. If it doesn't "see" you then it retracts back.
	- Mechanically this is the same as an infinitely-long lizard with contact damage, that retracts if it doesn't see you.
	- Problem: this is too similar to the lizard enemy. There would be too many hazards that activate if they see you in the same row or column; I would want a different pattern.

## Non-Trap Tile Ideas
- [x] Doors such that whenever you go through one, all the doors toggle whether they're open
- [x] One way platforms (a platformer game essential)
- [x] Slopes? (they might look cool on the corners and prevent it from looking like minecraft)
- [ ] Portals? (They're cool)
- [ ] Ladders? (not sure... too much like Spelunky) (ok, that's dumb, ladders are just a basic concept in games)
- [ ] Blocks such that when you step on one of them, all others extend/retract (kind of similar to gates so they should go in an area without gates)

# Combining Enemies, Traps, and Locations
Level design requirements for creatures:
- Lizards: indoors + few other enemies
- Spider: indoors + some space
- Bird: lots of space
- Walker: lots of horizontal platforms
- Four-legged creature: lots of horizontal platforms
- Triangle-person: lots of space + ideally indoors

Grouping idea 1:
- Tower: lizards + lasers
- Islands: birds + triangle humanoids
- Compound: walker + tetrapod
- Chasm: spider + spikeballs
- City: ???
- Cave: ???

Grouping idea 2:
- Tower: lizards + lasers
- Islands: birds + rocket launcher
- Compound: humanoid + spikeballs
- Chasm: spider

Ideas:
- They don't all have to have non-overlapping enemies / traps. It could be like when I considered making it randomly choose 2 when generating levels for the tower, except here I would only do the combinations that work well together.
- I could have more than 2 types of things per region. The only reason that didn't work well in the tower was because I already had 2 that were very complicated and very dangerous (lizards + lasers).