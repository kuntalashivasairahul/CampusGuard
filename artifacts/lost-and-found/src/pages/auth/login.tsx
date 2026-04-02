import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLoginUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, Lock } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid college email"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: (data: any) => {
        // Store JWT in localStorage for cross-origin auth on Render
        if (data?.token) {
          localStorage.setItem("jwt_token", data.token);
        }
        queryClient.invalidateQueries({ queryKey: ["getCurrentUser"] });
        toast({ title: "Welcome back!" });
        setLocation("/feed");
      },
      onError: (err: any) => {
        toast({
          title: "Login failed",
          description: err?.error || "Invalid email or password",
          variant: "destructive",
        });
      },
    },
  });

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data });
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

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">College Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    placeholder="student@college.edu"
                    className="pl-10 h-12 bg-secondary/50 border-transparent focus:bg-background rounded-xl"
                    {...form.register("email")}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
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
                    {...form.register("password")}
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg rounded-xl shadow-lg shadow-primary/20"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
              </Button>
            </form>

            <p className="text-center mt-8 text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-foreground font-semibold hover:underline">
                Sign up
              </Link>
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
