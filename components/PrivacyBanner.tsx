import { Lock, ShieldCheck, ServerOff } from "lucide-react";

export default function PrivacyBanner({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-label="Data privacy and compliance"
      className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-emerald-200">Local-first processing · privacy by design</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">
            All screening telemetry is processed in your browser. No video, audio or biometric values are uploaded to a server. Reports
            are stored only in this device&apos;s local storage and can be erased at any time. The architecture is designed to align with
            HIPAA Security Rule safeguards and GDPR principles of data minimisation, purpose limitation and the right to erasure.
          </p>
          {!compact && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {[
                { icon: Lock, label: "HIPAA-aligned safeguards" },
                { icon: ShieldCheck, label: "GDPR-aligned (Art. 5, 17, 25)" },
                { icon: ServerOff, label: "Zero server-side retention" },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-emerald-200">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] text-slate-500">
            Alignment describes design intent for this prototype; it is not a formal certification or legal compliance attestation.
          </p>
        </div>
      </div>
    </section>
  );
}
