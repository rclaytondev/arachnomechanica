Things to do:
- [x] Add a portal to the next level
- Make lots of rooms
	- [x] 10
	- [x] 20
	- [x] 30
	- [x] 40
	- [ ] 50
	- [ ] 60
- Tweaks:
	- [ ] Margins: if there are exits of different heights, pick the smaller (low priority, I haven't noticed this issue much)
	- [ ] Add tile breaking animations
	- [ ] Add lizard death animations
	- [ ] Possible lizard graphics improvements: pulsing eye color, teeth, gears, body of nonconstant width
- Physics tweaks (inspired by Celeste):
	- [x] Hold up to jump higher
	- [ ] Jumping gives a small amount of horizontal speed
	- [ ] Buffer inputs (so far only jump inputs make sense to buffer)
	- [ ] Coyote time
	- [ ] Slip past corners and preserve velocity?
- [x] Lasers can pass through blocks when facing left, it seems

Refactoring:
- [ ] `PhysicsObject.moveX` and `PhysicsObject.moveY` have lots of repeated code
- [ ] Glow effects could be managed automatically by `GameUtils` instead of having each object keep track of its gradient
