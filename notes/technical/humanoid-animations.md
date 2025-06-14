
Ideas:
- Each part's position should be tracked using a `PhysicsObject`, because this is necessary when firing.
- The `PhysicsObject`'s hitbox will be very small (1 pixel) and will correspond to the tip of the triangle, again because this is necessary when firing.
- Animations should be tracked using a `Motion` class or type that represents a motion. There will be two kinds:
	- A linear motion from one point to another point.
	- A rotational motion about a central point, which may change over time.
- If the center of rotation changes, the objects affected by the rotational motion will also be translated by that same amount before applying the rotation.
	- Problem: what if an object is rotating about its center as it moves?
	- Solution: actually don't do this, and instead make it so that *all* objects that are 'connected' to the part that is rotating get rotated as well.
	- Example:
		- Suppose it's taking a step with it's right leg, so the left leg is rotating about the foot, and the body is rotating about the start of the left leg, and the right leg is also rotating about that point as well.
		- This would be accomplished with 3 rotational motions:
			- One rotation about the left foot, applied to all body parts.
			- One rotation about the start of the left leg in exactly the opposite direction, applied to all body parts except the left leg.
			- One rotation about the start of the right leg, to move the right leg.
- The humanoid's hitbox will be stored in a different `PhysicsObject`.