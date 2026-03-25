import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Hexagon, Search, Shield, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated) {
    setLocation("/feed");
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Decorative background blur */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/30 rounded-full blur-[120px] pointer-events-none" />

      <header className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg">
            <Hexagon className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-foreground">CampusFind</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Link href="/register">
            <Button className="rounded-full px-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 flex flex-col items-center justify-center text-center relative z-10 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-8 border border-primary/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Now live for all students
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-extrabold text-foreground tracking-tight leading-tight mb-6">
            The Smart Way to <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Find What You Lost</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Report lost items, discover found treasures, and securely claim what's yours with our trusted college platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto rounded-full px-8 h-14 text-lg font-semibold shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all group">
                Join the Network
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-8 h-14 text-lg font-semibold bg-background/50 backdrop-blur-sm border-2">
                I already have an account
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl w-full"
        >
          {[
            { icon: Search, title: "Smart Discovery", desc: "Easily filter through reported items with our intuitive feed." },
            { icon: Shield, title: "Secure Claims", desc: "OTP verification ensures items are returned to their rightful owners." },
            { icon: Zap, title: "Instant Alerts", desc: "Get notified immediately when a potential match is found." }
          ].map((feature, i) => (
            <div key={i} className="glass p-8 rounded-3xl text-left hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
