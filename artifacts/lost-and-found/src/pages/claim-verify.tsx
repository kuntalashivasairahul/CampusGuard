import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetMyClaims, useVerifyClaim, useGetClaimMessages, useSendClaimMessage, useGenerateOtp } from "@workspace/api-client-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KeyRound, CheckCircle2, MessageSquare, Send, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export default function ClaimVerifyPage() {
  const [, params] = useRoute("/claim/:id");
  const [, setLocation] = useLocation();
  const claimId = Number(params?.id);
  const { user } = useAuth();
  
  const { data: activityData, refetch: refetchActivity } = useGetMyClaims();
  const { data: messages, refetch: refetchMessages } = useGetClaimMessages(claimId, {
    refetchInterval: 3000 // Poll every 3 seconds for chat
  });
  
  const verifyMutation = useVerifyClaim();
  const sendMsgMutation = useSendClaimMessage(claimId);
  const generateOtpMutation = useGenerateOtp(claimId);

  const [otpInput, setOtpInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Find the specific claim
  const claim = activityData?.claims.find(c => c.id === claimId) as any;
  const reportedItem = activityData?.reportedItems.find(i => i.id === claim?.itemId);

  const isClaimant = claim?.claimerId === user?.id;
  const isReporter = !!reportedItem;

  const handleVerify = async () => {
    if (otpInput.length < 6) return;
    try {
      await verifyMutation.mutateAsync({
        id: claimId,
        data: { otp: otpInput }
      });
      toast({ title: "Item verified and returned successfully!" });
      refetchActivity();
    } catch (error: any) {
      toast({ 
        title: "Verification failed", 
        description: error?.error || "Invalid OTP",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    try {
      await sendMsgMutation.mutateAsync({ text: chatInput });
      setChatInput("");
      refetchMessages();
    } catch (error: any) {
      toast({ title: "Failed to send message", variant: "destructive" });
    }
  };

  const handleGenerateOtp = async () => {
    try {
      await generateOtpMutation.mutateAsync();
      toast({ title: "OTP Generated successfully!" });
      refetchActivity();
    } catch (error: any) {
      toast({ title: "Error generating OTP", description: error?.error, variant: "destructive" });
    }
  };

  if (!activityData && !claim) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-primary"/></div>;
  if (!claim) return <div className="text-center py-20 font-bold text-destructive">Claim not found or you don't have access.</div>;

  return (
    <div className="max-w-4xl mx-auto pt-6 pb-12 lg:flex lg:gap-6">
      
      {/* LEFT COLUMN: CHAT INTERFACE */}
      <Card className="flex-1 flex flex-col border-border/50 shadow-lg rounded-3xl overflow-hidden mb-6 lg:mb-0 h-[600px]">
        <div className="bg-primary/5 p-4 border-b border-border/50 flex items-center gap-3">
          <button onClick={() => setLocation("/activity")} className="p-2 bg-background hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1">
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Handover Chat
            </h2>
            <p className="text-xs text-muted-foreground">Discuss details and coordinate meetup</p>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4 bg-secondary/10">
          <div className="space-y-4">
            <div className="text-center">
               <span className="text-xs font-semibold bg-secondary px-3 py-1 rounded-full text-muted-foreground">
                 Claim Initiated - {format(new Date(claim.createdAt), "MMM d, h:mm a")}
               </span>
            </div>
            
            <div className="flex justify-start">
               <div className="bg-secondary text-foreground p-3 rounded-2xl rounded-tl-sm max-w-[80%] text-sm shadow-sm border border-border/50">
                 <p className="font-semibold text-xs text-primary mb-1">{claim.claimerName} (Initial Request)</p>
                 {claim.message}
               </div>
            </div>

            {messages?.map(msg => {
              const isMine = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[80%] text-sm shadow-sm ${
                    isMine 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-secondary text-foreground rounded-tl-sm border border-border/50'
                  }`}>
                     <p className={`font-semibold text-[10px] mb-1 opacity-70 ${isMine ? 'text-primary-foreground text-right' : 'text-primary'}`}>
                       {msg.senderName} • {format(new Date(msg.createdAt), "h:mm a")}
                     </p>
                     {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {claim.status !== "returned" && (
          <form onSubmit={handleSendMessage} className="p-3 bg-background border-t border-border flex gap-2 items-center">
            <Input 
              placeholder="Type a message..." 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              className="flex-1 bg-secondary border-none rounded-full h-10 px-4"
              disabled={sendMsgMutation.isPending}
            />
            <Button type="submit" size="icon" className="rounded-full w-10 h-10 shrink-0" disabled={!chatInput.trim() || sendMsgMutation.isPending}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        )}
      </Card>

      {/* RIGHT COLUMN: ACTION / OTP VERIFICATION */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6">
        <Card className="border-border/50 shadow-lg rounded-3xl overflow-hidden shrink-0">
          <div className="bg-primary/5 p-6 border-b border-border/50 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <KeyRound className="w-7 h-7" />
            </div>
            <CardTitle className="font-display text-xl">Secure Handover</CardTitle>
            <CardDescription className="mt-1 text-sm font-bold text-foreground line-clamp-2">
              {claim.itemTitle}
            </CardDescription>
          </div>

          <CardContent className="p-6">
            {claim.status === "returned" ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-1">Item Returned</h3>
                <p className="text-sm text-muted-foreground">This handover has been successfully verified.</p>
              </div>
            ) : isReporter ? (
              <div className="text-center space-y-5">
                {claim.hasOtp ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      You have generated the secure Verification Code. When you physically meet {claim.claimerName}, give them this code to complete the handover.
                    </p>
                    <div className="py-4 px-6 bg-secondary/50 rounded-2xl border border-dashed border-border">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold">Your Secret Code</p>
                      <p className="text-4xl font-mono font-bold tracking-[0.2em] text-primary">{claim.otp || "****"}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-amber-500/10 text-amber-600 p-4 rounded-xl flex gap-3 text-left border border-amber-500/20">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-xs leading-relaxed">Once you are convinced this person is the rightful owner/finder, generate an OTP. They will need it to close this claim.</p>
                    </div>
                    <Button 
                      onClick={handleGenerateOtp} 
                      disabled={generateOtpMutation.isPending}
                      className="w-full h-12 rounded-xl text-base shadow-lg shadow-primary/20"
                    >
                      {generateOtpMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Generate Transfer OTP"}
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-5 text-center">
                {!claim.hasOtp ? (
                   <div className="py-8 space-y-4">
                     <Loader2 className="w-10 h-10 animate-spin text-muted-foreground/30 mx-auto" />
                     <p className="text-sm text-muted-foreground leading-relaxed px-4">
                       Waiting for the reporter to confirm details in chat and generate the transfer OTP.
                     </p>
                   </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      The transfer code has been generated! Meet with the reporter and ask them for the 6-digit code.
                    </p>
                    <div className="space-y-3 pt-2">
                      <Input 
                        placeholder="Enter 6-digit OTP" 
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.toUpperCase())}
                        className="h-14 text-center tracking-[0.4em] font-mono text-2xl bg-secondary/50 border-border rounded-xl"
                        maxLength={6}
                      />
                      <Button 
                        className="w-full h-12 text-base rounded-xl shadow-md shadow-primary/20"
                        onClick={handleVerify}
                        disabled={otpInput.length < 6 || verifyMutation.isPending}
                      >
                        {verifyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Handover"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
