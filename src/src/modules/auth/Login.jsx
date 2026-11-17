
import { HeartPulse, Leaf, Flower2 } from "lucide-react";
import { Logo, LotusMark } from "./components/Logo";
import LoginForm from "./components/LoginForm";

const highlights = [
  { icon: Leaf, title: "Natural Care", sub: "Holistic approach" },
  { icon: HeartPulse, title: "Better Health", sub: "For a brighter you" },
  { icon: Flower2, title: "Ancient Wisdom", sub: "Modern living" },
];

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-100/70">
      {/* Soft background shapes */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-brand-300/30 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-[1340px] items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_504px] lg:pl-0 lg:pr-[78px]">
        <section className="self-start lg:self-center">
          <Logo />

          <div className="mt-16 max-w-[640px]">
            <p className="text-sm font-semibold tracking-[0.35em] text-brand-600">
              WELCOME BACK
            </p>

            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-brand-900 sm:text-[54px]">
              Your Wellness Journey Continues Here
            </h1>

            <p className="mt-6 max-w-md text-xl leading-relaxed text-slate-600">
              Access the HMS portal, manage your progress, and stay connected with AYURAAURAA.
            </p>
          </div>

          <ul className="mt-12 hidden gap-9 sm:flex">
            {highlights.map(({ icon: Icon, title, sub }) => (
              <li key={title} className="text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <Icon className="h-6 w-6" strokeWidth={1.6} />
                </span>
                <p className="mt-2 text-sm font-bold text-brand-900">
                  {title}
                </p>
                <p className="text-xs text-slate-500">{sub}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-[504px] rounded-3xl border border-brand-100/60 bg-white/95 p-9 shadow-[0_20px_60px_-24px_rgba(10,61,42,.22)]">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-2 w-fit">
              <LotusMark size={48} />
            </div>

            <h2 className="text-[28px] font-extrabold tracking-tight text-brand-900">
              Login to HMS Portal
            </h2>

            <p className="mt-1 text-sm text-brand-600">
              Sign in to continue
            </p>
          </div>

          <LoginForm />

          <p className="mt-7 border-t border-slate-200/70 pt-5 text-center text-xs text-brand-700">
            Secure &nbsp;•&nbsp; Trusted &nbsp;•&nbsp; Care
          </p>
        </section>
      </div>
    </main>
  );
}
