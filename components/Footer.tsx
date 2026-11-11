import { Brain } from "lucide-react";

export default function Footer() {
  return (
    <footer className="no-print mt-24 border-t border-white/10 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-cyan-300" />
          <span>NeuroVitals AI · DSH Hacks V2 prototype</span>
        </div>
        <p className="max-w-xl text-center sm:text-right">
          Research prototype using simulated multimodal telemetry. Not a medical device. Not a substitute for professional medical
          advice, diagnosis or treatment.
        </p>
      </div>
    </footer>
  );
}
