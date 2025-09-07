```
When attemping to move an object on a slope:
Get the slope offset ("main direction" + "cross direction")
Get the list of objects moved by the slope offset
If all are pushable and the slope offset's cross direction is nonzero:
	If all objects would be made non-intersecting by moving in the main direction:
		Push all colliding objects in the main direction (with a "crush-on-move-failure" handler)
		Translate the object by the slope offset
		Return (move succesful)
Get the list of objects it would push if moved in the original direction
If all are pushable:
	Push them (with a "crush-on-move-failure" handler)
	Translate the object
	Return (move successful)
Otherwise (at least one not pushable):
	Call the "on-move-failure" handler
	Return (move failed)
```

Advantage: there can be no chains of pushed objects with directional changes caused by slopes, which is good because that sounds very complicated and buggy.

Disadvantage: this can lead to objects being crushed in surprising situations (for example: if a player is being pushed up a hill with a player-pushable block on their head, they would get crushed, which is unintuitive). But this situation seems very contrived, and at least the surprising behavior will be consistent, so I think this is ok.