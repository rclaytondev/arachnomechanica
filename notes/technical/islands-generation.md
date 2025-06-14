# Idea 1: Completely Freeform Generation
In this idea, I would generate the islands in a completely 'freeform' way:
1. Start by placing 1 island somewhere.
2. At each stage, choose a side of an existing island (left or right) and attempt to generate a connection.
	- Left and right connections can be done by just placing an island next to it, within jumping distance.
	- Up connections can be done by adding a pillar that can be raised.
3. Repeat until enough islands have been generated.

Problems:
- This will probably lead to a very tree-like structure; there will probably be no loops, and it will be very obvious which island was the start of the generation algorithm.
- A more complicated algorithm will be needed to make sure that the 

# Idea 2: Random Islands with Connections
1. First place a bunch of random islands of various sizes.
2. Then, choose nearby pairs of islands and connect them with smaller "stepping-stone" islands.