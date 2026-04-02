import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegisterUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, Lock, User } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid college email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "faculty", "admin"]),
});

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["getCurrentUser"] });
        toast({ title: "Account created successfully!" });
        setLocation("/feed");
      },
      onError: (err: any) => {
        toast({
          title: "Registration failed",
          description: err?.error || "Error creating account",
          variant: "destructive",
        });
      },
    },
  });

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "student" },
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data });
  };

  return (
    <div className="min-h-screen flex w-full bg-background flex-row-reverse">
      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <Link href="/" className="absolute top-8 right-8 p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="max-w-md w-full">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl font-display font-bold mb-2">Create Account</h2>
            <p className="text-muted-foreground mb-8">Join CampusFind and never lose your stuff again.</p>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Jane Doe"
                    className="pl-10 h-12 bg-secondary/50 border-transparent focus:bg-background rounded-xl"
                    {...form.register("name")}
                  />
                </div>
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

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

              <div className="space-y-3 pt-2">
                <Label>I am a...</Label>
                <RadioGroup
                  defaultValue="student"
                  onValueChange={(v) => form.setValue("role", v as any)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 bg-secondary/30 px-4 py-3 rounded-xl border border-border/50 flex-1">
                    <RadioGroupItem value="student" id="r1" />
                    <Label htmlFor="r1" className="cursor-pointer">Student</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-secondary/30 px-4 py-3 rounded-xl border border-border/50 flex-1">
                    <RadioGroupItem value="faculty" id="r2" />
                    <Label htmlFor="r2" className="cursor-pointer">Faculty</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg rounded-xl shadow-lg shadow-primary/20 mt-4"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
              </Button>
            </form>

            <p className="text-center mt-8 text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-foreground font-semibold hover:underline">
                Sign in
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
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
      </div>
    </div>
  );
}
