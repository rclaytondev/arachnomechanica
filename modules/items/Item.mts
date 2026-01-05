import { Drill } from "./Drill.mjs";
import { Flameturret } from "./Flameturret.mjs";
import { Teleporter } from "./Teleporter.mjs";
import { ThrowableTile } from "./ThrowableTile.mjs";

export type Item = Teleporter | Flameturret | ThrowableTile | Drill;
