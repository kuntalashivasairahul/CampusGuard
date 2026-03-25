import { useState } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLoginUser, useVerifyLogin, useGetCurrentUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, Lock, KeyRound } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid college email"),
  password: z.string().min(1, "Password is required"),
});

const otpSchema = z.object({
  otp: z.string().min(6, "OTP must be at least 6 characters"),
});

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");

  const loginMutation = useLoginUser();
  const verifyMutation = useVerifyLogin({
    mutation: {
      onSuccess: () => {
        // Invalidate user query to trigger re-auth check
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        toast({ title: "Welcome back!" });
        setLocation("/feed");
      },
      onError: (err: any) => {
        toast({ 
          title: "Verification failed", 
          description: err?.error || "Invalid OTP",
          variant: "destructive"
        });
      }
    }
  });

  const credentialsForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
  });

  const onCredentialsSubmit = (data: z.infer<typeof loginSchema>) => {
    setEmail(data.email);
    loginMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "OTP sent to your email" });
        setStep("otp");
      },
      onError: (err: any) => {
        toast({ 
          title: "Login failed", 
          description: err?.error || "Invalid credentials",
          variant: "destructive"
        });
      }
    });
  };

  const onOtpSubmit = (data: z.infer<typeof otpSchema>) => {
    verifyMutation.mutate({ data: { email, otp: data.otp } });
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <Link href="/" className="absolute top-8 left-8 p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="max-w-md w-full">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl font-display font-bold mb-2">Welcome Back</h2>
            <p className="text-muted-foreground mb-8">Securely access your CampusFind account.</p>

            {step === "credentials" ? (
              <form onSubmit={credentialsForm.handleSubmit(onCredentialsSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">College Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="email" 
                      placeholder="student@college.edu" 
                      className="pl-10 h-12 bg-secondary/50 border-transparent focus:bg-background rounded-xl"
                      {...credentialsForm.register("email")}
                    />
                  </div>
                  {credentialsForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{credentialsForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-10 h-12 bg-secondary/50 border-transparent focus:bg-background rounded-xl"
                      {...credentialsForm.register("password")}
                    />
                  </div>
                  {credentialsForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{credentialsForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg rounded-xl shadow-lg shadow-primary/20"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
                </Button>
              </form>
            ) : (
              <motion.form 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                onSubmit={otpForm.handleSubmit(onOtpSubmit)} 
                className="space-y-6"
              >
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-sm text-primary font-medium text-center">
                    We sent a verification code to <br/><span className="font-bold">{email}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="otp" 
                      placeholder="e.g. 123456" 
                      className="pl-10 h-14 text-center tracking-[0.5em] font-mono text-xl bg-secondary/50 border-transparent focus:bg-background rounded-xl"
                      {...otpForm.register("otp")}
                    />
                  </div>
                  {otpForm.formState.errors.otp && (
                    <p className="text-sm text-destructive">{otpForm.formState.errors.otp.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg rounded-xl shadow-lg shadow-primary/20"
                  disabled={verifyMutation.isPending}
                >
                  {verifyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Login"}
                </Button>
                
                <p className="text-center text-sm text-muted-foreground">
                  Didn't receive it? <button type="button" onClick={() => setStep("credentials")} className="text-primary font-semibold hover:underline">Go back</button>
                </p>
              </motion.form>
            )}

            <p className="text-center mt-8 text-sm text-muted-foreground">
              Don't have an account? <Link href="/register" className="text-foreground font-semibold hover:underline">Sign up</Link>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Image Side */}
      <div className="hidden lg:block w-1/2 relative bg-muted overflow-hidden">
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-side.png`} 
          alt="Campus architecture" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <blockquote className="text-2xl font-display font-medium leading-relaxed drop-shadow-lg">
            "CampusFind helped me recover my lost laptop within 2 hours. The OTP verification made me feel safe about the exchange."
          </blockquote>
          <p className="mt-4 text-white/80 font-medium">— Alex M., CS Student</p>
        </div>
      </div>
    </div>
  );
}
