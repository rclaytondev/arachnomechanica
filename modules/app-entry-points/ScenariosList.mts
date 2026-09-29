import { TestScenario } from "../dev/TestScenario.mjs";
import "../debug-scenarios/all-scenarios.mjs";

for(const scenario of TestScenario.all.sort((a, b) => a.name < b.name ? 1 : -1)) {
	const url = `/debug-scenario.html?scenario=${scenario.name}`;
	const link = document.createElement("a");
	link.href = url;
	link.innerHTML = scenario.name;
	const listItem = document.createElement("li");
	listItem.appendChild(link);
	document.getElementById("scenarios-list")?.appendChild(listItem);
}
