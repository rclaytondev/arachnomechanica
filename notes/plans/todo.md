Things to do:
- Bug fixes / remaining unimplemented behavior:
	- [x] Fix lighting order
	- [x] Spider bugfixes:
		- [x] Add behavior for when the block under a spider gets destroyed
		- [x] Improve spider collision with entities (e.g. throwable tiles - they should be able to walk on them)
		- [x] Fix spider interaction with weird layouts (e.g. a common bug is when there's a  ceiling slope above platform)
		- [ ] Fix the performance issues
	- [x] Improve lizards (make them use the new collision engine)
	- [ ] Fix the bug with gates (sometimes they toggle randomly - very hard to reproduce)
	- [ ] Fix lizards being able to breathe fire at the player even when obstructed
- Small / medium-size features:
	- [ ] Non-flat walls outside the tower
- Small gameplay improvements:
	- [x] Telegraph for the spider attack (line showing shot trajectory)
	- [ ] Indicator for spikeball direction (a triangle on the spikeball)
	- [x] Higher friction for objects on ground
	- [x] Better tile spawn positions
- Graphical improvements:
	- [ ] Tile breaking animations
	- [ ] Fancier overlay text (add lines above and below where it says "Floor 01")
	- [ ] Chains
	- [ ] Teeth on the lizards

Future features:
- Make lots of rooms
	- [x] 10
	- [x] 20
	- [x] 30
	- [x] 40
	- [x] 50
	- [ ] 60
- Physics tweaks (some inspired by Celeste):
	- [x] Hold up to jump higher
	- [ ] Jumping gives a small amount of horizontal speed
	- [ ] Buffer inputs (so far only jump inputs make sense to buffer)
	- [ ] Coyote time
	- [ ] Slip past corners and preserve velocity?
	- [x] Leniency when throwing items (if the throw is obstructed, try nudging it a little)
- [ ] Player graphics!

Things to do for "1.0 release":
- [x] Player graphics
- [x] Health display
- [x] Items display
- [x] Death screen (stats + "press space to play again")
- [x] Support for re-entering portals
- [ ] Portal at the bottom of the tower
- [ ] World border
- [ ] Start screen

Less important things:
- [ ] Spider optimizations
- [ ] Pausing
- [ ] Custom controls
