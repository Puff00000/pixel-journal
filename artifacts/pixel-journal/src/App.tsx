import { useState } from "react";
import WelcomePage from "@/pages/WelcomePage";
import JournalPage from "@/pages/JournalPage";
import GardenPage from "@/pages/GardenPage";

export type Screen = "welcome" | "journal" | "garden";
export type GardenChoice = "plant";

function loadPlantCount(): number {
  try { return parseInt(localStorage.getItem("pj_plantCount") ?? "0") || 0; } catch { return 0; }
}
function savePlantCount(n: number) {
  try { localStorage.setItem("pj_plantCount", String(n)); } catch { /* noop */ }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [plantCount, setPlantCount] = useState<number>(loadPlantCount);

  const goToJournal = () => setScreen("journal");

  const handlePlant = (text: string) => {
    const next = plantCount + 1;
    setPlantCount(next);
    savePlantCount(next);
    setScreen("garden");
  };

  const goToWelcome = () => setScreen("welcome");

  if (screen === "welcome") return <WelcomePage onBegin={goToJournal} />;
  if (screen === "journal") return (
    <JournalPage onPlant={handlePlant} onBack={goToWelcome} />
  );
  return <GardenPage plantCount={plantCount} onBack={() => setScreen("journal")} />;
}
