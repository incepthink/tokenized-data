import { Link } from "react-router-dom";
import { NexVaultLogo } from "@/components/NexVaultLogo";
import {
  FilePlus,
  FolderOpen,
  Eye,
  Shield,
  FileCheck,
  Globe,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    num: "01",
    title: "Creator Mints",
    desc: "Creator mints a document as an NFT and assigns it to an Owner's wallet on Base Sepolia.",
  },
  {
    num: "02",
    title: "Owner Controls",
    desc: "Owner views their documents and chooses which Viewers to share them with.",
  },
  {
    num: "03",
    title: "Viewer Verifies",
    desc: "Viewer signs a wallet message to access the document — the event is logged and visible to the Owner.",
  },
];

const PERSONAS = [
  {
    icon: FilePlus,
    name: "Creator",
    desc: "Mint verifiable documents and assign them to owners on-chain",
    path: "/auth/creator",
  },
  {
    icon: FolderOpen,
    name: "Owner",
    desc: "Access documents issued to your wallet and control who can view them",
    path: "/auth/owner",
  },
  {
    icon: Eye,
    name: "Viewer",
    desc: "Access shared documents with cryptographic proof of identity",
    path: "/auth/viewer",
  },
];

const BADGES = [
  { icon: Shield, label: "On-Chain Verified" },
  { icon: FileCheck, label: "Auditable Access Logs" },
  { icon: Globe, label: "Base Sepolia Network" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <NexVaultLogo />
          <div className="hidden sm:flex items-center gap-6">
            <a
              href="#personas"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              For Creators
            </a>
            <a
              href="#personas"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              For Owners
            </a>
            <a
              href="#personas"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              For Viewers
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        </div>
        <div className="relative text-center max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-6">
            Blockchain-Powered Document Exchange
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            Verifiable data exchange built for{" "}
            <span className="gradient-text">organizations.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            NexVault lets you tokenize documents as NFTs, assign ownership to
            any wallet, and enable auditable, permissioned access — all on Base.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link to="/auth/creator">
              <Button className="gradient-primary text-primary-foreground font-semibold px-8 py-6 text-base rounded-xl glow-primary hover:glow-primary-strong transition-shadow">
                Start as Creator
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button
                variant="outline"
                className="border-border text-muted-foreground hover:text-foreground px-8 py-6 text-base rounded-xl bg-transparent"
              >
                Learn More
              </Button>
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {BADGES.map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <b.icon size={14} className="text-primary" />
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <span className="text-3xl font-bold gradient-text">
                  {step.num}
                </span>
                <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Persona cards */}
      <section id="personas" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-16">
            Choose Your Role
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {PERSONAS.map((p) => (
              <div
                key={p.name}
                className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center hover:border-primary/50 transition-colors"
              >
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-6 glow-primary">
                  <p.icon size={28} className="text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {p.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">{p.desc}</p>
                <Link to={p.path}>
                  <Button className="gradient-primary text-primary-foreground rounded-xl glow-primary hover:glow-primary-strong">
                    Get Started <ArrowRight size={16} className="ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          © 2026 NexVault — Built on Base
        </p>
      </footer>
    </div>
  );
}
