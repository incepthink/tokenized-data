import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { useAuth } from "@/context/AuthContext";
import { WalletGate } from "@/components/WalletGate";
import { NexVaultLogo } from "@/components/NexVaultLogo";
import { Persona } from "@/mock/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function AuthPage() {
  const { persona } = useParams<{ persona: string }>();
  const { isConnected } = useAccount();
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validPersona = persona as Persona;
  const personaLabel = persona
    ? persona.charAt(0).toUpperCase() + persona.slice(1)
    : "";

  if (!isConnected) return <WalletGate />;

  const validate = (fields: Record<string, string>) => {
    const errs: Record<string, string> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (!val.trim())
        errs[key] = `${key.replace(/([A-Z])/g, " $1")} is required`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate({ email: loginEmail, password: loginPassword })) return;
    login(validPersona, loginEmail, loginPassword);
    toast.success(`Welcome back!`);
    navigate(`/${validPersona}/dashboard`);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !validate({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
      })
    )
      return;
    signup(validPersona, signupName, signupEmail, signupPassword);
    toast.success(`Account created!`);
    navigate(`/${validPersona}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <NexVaultLogo />
        </div>
        <h2 className="text-xl font-bold text-foreground text-center mb-1">
          {personaLabel} Portal
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Sign in or create your account
        </p>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card-elevated border border-border mb-6">
            <TabsTrigger
              value="login"
              className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground rounded-lg"
            >
              Login
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground rounded-lg"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label className="text-foreground">Email</Label>
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-card-elevated border-border text-foreground mt-1"
                />
                {errors.email && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.email}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-foreground">Password</Label>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-card-elevated border-border text-foreground mt-1"
                />
                {errors.password && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.password}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground font-semibold rounded-xl glow-primary hover:glow-primary-strong"
              >
                Login
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label className="text-foreground">Full Name</Label>
                <Input
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Your full name"
                  className="bg-card-elevated border-border text-foreground mt-1"
                />
                {errors.name && (
                  <p className="text-destructive text-xs mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <Label className="text-foreground">Email</Label>
                <Input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-card-elevated border-border text-foreground mt-1"
                />
                {errors.email && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.email}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-foreground">Password</Label>
                <Input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-card-elevated border-border text-foreground mt-1"
                />
                {errors.password && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.password}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground font-semibold rounded-xl glow-primary hover:glow-primary-strong"
              >
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
