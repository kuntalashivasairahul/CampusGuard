import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetMyClaims, useVerifyClaim } from "@workspace/api-client-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KeyRound, CheckCircle2, Copy, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function ClaimVerifyPage() {
  const [, params] = useRoute("/claim/:id");
  const [, setLocation] = useLocation();
  const claimId = Number(params?.id);
  const { user } = useAuth();
  
  const { data: activityData, isLoading } = useGetMyClaims();
  const verifyMutation = useVerifyClaim();

  const [otpInput, setOtpInput] = useState("");
  const [copied, setCopied] = useState(false);

  // Find the specific claim from user's activity
  const claim = activityData?.claims.find(c => c.id === claimId);
  const reportedItem = activityData?.reportedItems.find(i => i.id === claim?.itemId);

  const isClaimant = claim?.claimerId === user?.id;
  
  // Actually, the API doesn't expose the OTP in the standard `Claim` model returned by `getMyClaims`.
  // Wait, the API schema `ClaimResponse` from `/api/claims` POST returns the OTP. 
  // If the user navigates away, they might lose it unless the backend stores it.
  // For the sake of the demo, if they are the claimant, they should see a message to check email or we'd need an endpoint to fetch OTP.
  // Assuming the claimant sees it immediately after creation, but if they reload, it's not in `getMyClaims`. 
  // We will handle the Finder's perspective here primarily, where they input the OTP.

  const handleVerify = async () => {
    if (otpInput.length < 6) return;
    try {
      await verifyMutation.mutateAsync({
        id: claimId,
        data: { otp: otpInput }
      });
      toast({ title: "Item verified and returned successfully!" });
      setLocation("/activity");
    } catch (error: any) {
      toast({ 
        title: "Verification failed", 
        description: error?.error || "Invalid OTP",
        variant: "destructive"
      });
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-primary"/></div>;
  if (!claim) return <div className="text-center py-20">Claim not found or you don't have access.</div>;

  return (
    <div className="max-w-md mx-auto pt-10">
      <button 
        onClick={() => setLocation("/activity")} 
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Activity
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/50 shadow-lg rounded-3xl overflow-hidden">
          <div className="bg-primary/5 p-6 border-b border-border/50 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <KeyRound className="w-8 h-8" />
            </div>
            <CardTitle className="font-display text-2xl">Secure Handover</CardTitle>
            <CardDescription className="mt-2 text-base">
              Item: <span className="font-bold text-foreground">{claim.itemTitle}</span>
            </CardDescription>
          </div>

          <CardContent className="p-6">
            {claim.status === "returned" ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Item Returned</h3>
                <p className="text-muted-foreground">This handover has been successfully verified.</p>
              </div>
            ) : isClaimant ? (
              <div className="text-center py-4 space-y-6">
                <p className="text-muted-foreground">
                  You claimed this item. The system generated a secure OTP. 
                  <br/><br/>
                  <strong className="text-foreground">Meet with the finder and provide them the OTP sent to your email to complete the handover.</strong>
                </p>
                <div className="p-4 bg-secondary rounded-xl">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                  <p className="text-lg font-bold text-primary capitalize">{claim.status}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-center text-muted-foreground">
                  You are returning this item to <strong className="text-foreground">{claim.claimerName}</strong>. 
                  Ask them for the 6-digit verification code to confirm the handover.
                </p>
                
                <div className="space-y-3">
                  <Input 
                    placeholder="Enter 6-digit OTP" 
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.toUpperCase())}
                    className="h-14 text-center tracking-[0.5em] font-mono text-2xl bg-secondary/50 border-border rounded-xl"
                    maxLength={6}
                  />
                  <Button 
                    className="w-full h-12 text-lg rounded-xl shadow-md shadow-primary/20"
                    onClick={handleVerify}
                    disabled={otpInput.length < 6 || verifyMutation.isPending}
                  >
                    {verifyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Handover"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
