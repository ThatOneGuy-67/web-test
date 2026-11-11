import { useEffect, useState } from "react";
import { Link, Sparkles, Compass, Search, Gamepad2, MessageCircle, Settings, UserRound } from "lucide-react";

const VERSION = "1";
const KEY = "tog.website-tour";
const steps = [
  [Sparkles, "Welcome to TOG's Web", "A customizable hub for browsing, apps, games, entertainment, chat, and AI."],
  [Compass, "Find your way around", "Use the home controls and menu to open apps, bookmarks, history, downloads, and settings."],
  [Search, "Search and browse", "The address bar can search the web or open a URL. Browser controls and tabs stay available above."],
  [Gamepad2, "Explore your favorites", "Open the hub to find available games, movies, music, and other apps."],
  [MessageCircle, "Chat and AI", "Chat and AI are optional features. Their availability depends on the site's configured services."],
  [Settings, "Make it yours", "Settings includes themes, wallpapers, proxy preferences, privacy choices, and browser behavior."],
  [UserRound, "Your account", "Accounts are optional. Create one to use the account features available on this site, or continue as a guest."],
] as const;

export function restartWebsiteTour() { localStorage.removeItem(KEY); window.dispatchEvent(new Event("tog:restart-tour")); }

export default function WebsiteTour() {
  const [step, setStep] = useState<number | null>(null);
  const [accountPrompt, setAccountPrompt] = useState(false);
  useEffect(() => {
    const open = () => { if (localStorage.getItem(KEY) !== VERSION) { setStep(0); setAccountPrompt(false); } };
    open(); window.addEventListener("tog:restart-tour", open); return () => window.removeEventListener("tog:restart-tour", open);
  }, []);
  const finish = () => { localStorage.setItem(KEY, VERSION); setStep(null); };
  if (step === null) return null;
  const [Icon, title, description] = steps[step];
  const last = step === steps.length - 1;
  return <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/55 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Website tour">
    <section className="w-full max-w-lg rounded-2xl border border-white/20 bg-slate-950 p-5 shadow-2xl text-white motion-safe:animate-fade-in">
      <div className="mb-5 flex gap-2">{steps.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-white/15"}`} />)}</div>
      {accountPrompt ? <><div className="flex items-center gap-3"><UserRound className="h-7 w-7 text-primary" /><h2 className="text-xl font-bold">Want to make an account?</h2></div><p className="mt-3 text-sm text-white/70">An account lets you use the account and profile features supported by TOG's Web. You can keep using guest-friendly features without one.</p><div className="mt-7 flex items-center justify-between gap-3"><button onClick={finish} className="text-sm text-white/65 hover:text-white">Continue as guest</button><Link to="/account" onClick={finish} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Create an account</Link></div></> : <><div className="flex items-center gap-3"><Icon className="h-7 w-7 text-primary" /><div><p className="text-xs text-primary">Step {step + 1} of {steps.length}</p><h2 className="text-xl font-bold">{title}</h2></div></div><p className="mt-4 text-sm leading-6 text-white/70">{description}</p><div className="mt-7 flex items-center justify-between gap-3"><button onClick={finish} className="text-sm text-white/65 hover:text-white">Skip tour</button><div className="flex gap-2">{step > 0 && <button onClick={() => setStep(step - 1)} className="rounded-lg border border-white/20 px-3 py-2 text-sm">Back</button>}<button onClick={() => last ? setAccountPrompt(true) : setStep(step + 1)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{last ? "Finish" : "Next →"}</button></div></div></>}
      <button onClick={finish} className="absolute right-5 top-4 text-lg text-white/50 hover:text-white" aria-label="Close tour">×</button>
    </section>
  </div>;
}
