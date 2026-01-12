import "Initializer.mts";
import { Debug } from "./game-utilities/Debug.mjs";
import { Main } from "./Main.mjs";
import { RoomEditor } from "./RoomEditor.mjs";

Main.screen = new RoomEditor();
Debug.initializeEditor();
