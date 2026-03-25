import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { useGetItem, useCreateClaim } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { 
  MapPin, Clock, User, Tag, ArrowLeft, AlertCircle, PackageOpen, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function ItemDetailPage() {
  const [, params] = useRoute("/item/:id");
  const [, setLocation] = useLocation();
  const itemId = Number(params?.id);
  const { user } = useAuth();

  const { data: item, isLoading, isError } = useGetItem(itemId);
  const claimMutation = useCreateClaim();

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (isError || !item) return <div className="text-center py-20 text-destructive font-bold">Item not found</div>;

  const isOwner = user?.id === item.reportedBy;
  const canClaim = !isOwner && item.type === "found" && item.status === "active";

  const handleClaimSubmit = async () => {
    try {
      const res = await claimMutation.mutateAsync({
        data: { itemId, message: claimMessage }
      });
      setIsClaimModalOpen(false);
      toast({ title: "Claim submitted!" });
      // Redirect to the claim success page to see OTP
      setLocation(`/claim/${res.id}`);
    } catch (error: any) {
      toast({ 
        title: "Claim failed", 
        description: error?.error || "Failed to submit claim",
        variant: "destructive" 
      });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto pb-10">
      <button 
        onClick={() => setLocation("/feed")} 
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Feed
      </button>

      <div className="bg-card rounded-3xl overflow-hidden border border-border/50 shadow-sm flex flex-col md:flex-row">
        
        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-secondary min-h-[300px] flex items-center justify-center relative">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover absolute inset-0" />
          ) : (
            <PackageOpen className="w-20 h-20 text-muted-foreground/20" />
          )}
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge variant={item.type === "lost" ? "destructive" : "default"} className="uppercase font-bold tracking-wider px-3 py-1 shadow-md text-xs">
              {item.type}
            </Badge>
            {item.status !== "active" && (
              <Badge variant="secondary" className="bg-amber-500/90 text-white border-transparent shadow-md uppercase font-bold tracking-wider px-3 py-1 text-xs backdrop-blur-sm">
                {item.status}
              </Badge>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
          <div className="mb-6 flex-1">
            <div className="flex items-center gap-2 text-sm text-primary font-medium mb-3">
              <Tag className="w-4 h-4" /> {item.category}
            </div>
            
            <h1 className="text-3xl font-display font-bold text-foreground mb-4 leading-tight">
              {item.title}
            </h1>
            
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {item.description}
            </p>
          </div>

          <div className="bg-secondary/30 rounded-2xl p-5 space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Location</p>
                <p className="text-sm text-muted-foreground">{item.location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Reported On</p>
                <p className="text-sm text-muted-foreground">{format(new Date(item.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Reported By</p>
                <p className="text-sm text-muted-foreground">{item.reporterName}</p>
              </div>
            </div>
          </div>

          {canClaim && (
            <Button 
              size="lg" 
              className="w-full h-14 text-lg rounded-xl shadow-xl shadow-primary/25 hover:-translate-y-1 transition-all"
              onClick={() => setIsClaimModalOpen(true)}
            >
              This is mine! Claim it
            </Button>
          )}

          {isOwner && item.status === "active" && item.type === "lost" && (
             <div className="flex items-center justify-center p-4 bg-primary/10 text-primary rounded-xl border border-primary/20 text-sm font-medium gap-2">
               <AlertCircle className="w-5 h-5" />
               Waiting for someone to find this item
             </div>
          )}

          {isOwner && item.status === "active" && item.type === "found" && (
             <div className="flex items-center justify-center p-4 bg-primary/10 text-primary rounded-xl border border-primary/20 text-sm font-medium gap-2 text-center">
               <AlertCircle className="w-5 h-5 shrink-0" />
               You have this item. Manage claims in Activity.
             </div>
          )}
        </div>
      </div>

      {/* Claim Dialog */}
      <Dialog open={isClaimModalOpen} onOpenChange={setIsClaimModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Claim Item</DialogTitle>
            <DialogDescription>
              Are you sure this is yours? Please provide specific details that only the owner would know (e.g. passwords, hidden marks, contents).
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea 
              placeholder="I know it's mine because..."
              className="min-h-[120px] resize-none"
              value={claimMessage}
              onChange={(e) => setClaimMessage(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsClaimModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleClaimSubmit} 
              disabled={claimMessage.length < 5 || claimMutation.isPending}
            >
              {claimMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
