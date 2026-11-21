import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Repeat, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { Logo } from "@/components/shared";
import { useStore } from "@/data/store";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Enter your full name"),
  organisation: z.string().min(2, "Enter your organisation"),
  role: z.string().min(2, "Enter your role"),
});
type RegisterValues = z.infer<typeof registerSchema>;

export default function Auth({ mode }: { mode: "login" | "register" }) {
  const { signIn } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/app";
  const isRegister = mode === "register";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(isRegister ? registerSchema : (loginSchema as unknown as typeof registerSchema)),
  });

  // Simulated Amazon Cognito auth. Replace with Amplify Auth / Cognito SDK when VITE_COGNITO_* is set.
  const onSubmit = async (v: RegisterValues) => {
    await new Promise((r) => setTimeout(r, 600));
    const name = isRegister ? v.name : v.email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    signIn({ name, email: v.email, organisation: isRegister ? v.organisation : "Demo Housing Group", role: isRegister ? v.role : "Operations Lead" });
    toast.success(isRegister ? "Workspace created — welcome to DwellMender" : "Signed in to demo workspace");
    navigate(from, { replace: true });
  };

  const demo = () => {
    signIn({ name: "Jordan Ellis", email: "jordan.ellis@demo-housing.example.com", organisation: "Demo Housing Group", role: "Head of Property Operations" });
    toast.success("Signed in to demo workspace");
    navigate(from, { replace: true });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/">
          <Logo />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold text-navy-900">{isRegister ? "Create your workspace" : "Welcome back"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isRegister ? "Start a 14-day trial with a preloaded demo portfolio." : "Sign in to your DwellMender workspace."}
          </p>

          <Button variant="accent" className="mt-6 w-full" onClick={demo}>
            <Sparkles /> Continue with demo account
          </Button>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or {isRegister ? "register" : "sign in"} with email <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {isRegister && (
              <>
                <F label="Full name" error={errors.name?.message}>
                  <Input {...register("name")} autoComplete="name" />
                </F>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Organisation" error={errors.organisation?.message}>
                    <Input {...register("organisation")} autoComplete="organization" />
                  </F>
                  <F label="Role" error={errors.role?.message}>
                    <Input {...register("role")} placeholder="Property manager" />
                  </F>
                </div>
              </>
            )}
            <F label="Work email" error={errors.email?.message}>
              <Input type="email" {...register("email")} autoComplete="email" />
            </F>
            <F label="Password" error={errors.password?.message}>
              <Input type="password" {...register("password")} autoComplete={isRegister ? "new-password" : "current-password"} />
            </F>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Please wait…" : isRegister ? "Create workspace" : "Sign in"} <ArrowRight />
            </Button>
          </form>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">Demo authentication — any email and 8+ character password works. Production uses Amazon Cognito.</p>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isRegister ? "Already have an account? " : "New to DwellMender? "}
            <Link to={isRegister ? "/login" : "/register"} className="font-medium text-sage-700 hover:underline">
              {isRegister ? "Sign in" : "Create a workspace"}
            </Link>
          </p>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-navy-950 lg:block">
        <div className="absolute inset-0 bg-grid opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="absolute -right-24 top-20 h-96 w-96 rounded-full bg-sage-500/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-center p-16 text-white">
          <h2 className="max-w-md text-4xl font-bold leading-tight">Find recurring property problems sooner.</h2>
          <div className="mt-10 space-y-4">
            {[
              { icon: Repeat, t: "7 recurring issues detected", d: "across 6 demo properties in the last 12 months" },
              { icon: Sparkles, t: "AI classification with human review", d: "every suggestion clearly labelled and correctable" },
              { icon: ShieldCheck, t: "No automatic merges", d: "duplicate groupings always need approval" },
            ].map((x) => (
              <div key={x.t} className="flex max-w-md gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <x.icon className="h-5 w-5 text-amber-400" />
                <div>
                  <div className="font-semibold">{x.t}</div>
                  <div className="text-sm text-navy-200">{x.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{label}</span>
        {children}
      </label>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
