import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useGetMyClaims } from "@workspace/api-client-react";
import { Package, Inbox, CheckCircle2, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState<"reports" | "claims">("reports");
  const { data, isLoading } = useGetMyClaims();

  if (isLoading) return <div className="flex justify-center py-20"><span className="animate-spin text-primary">Loading...</span></div>;

  const reportedItems = data?.reportedItems || [];
  const claims = data?.claims || [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">My Activity</h1>
        <p className="text-muted-foreground mt-2">Track items you've reported or claimed.</p>
      </div>

      <div className="flex space-x-1 bg-secondary/50 p-1 rounded-xl w-full max-w-sm mb-8">
        <button
          onClick={() => setActiveTab("reports")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "reports" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          My Reports ({reportedItems.length})
        </button>
        <button
          onClick={() => setActiveTab("claims")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "claims" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          My Claims ({claims.length})
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === "reports" ? (
          reportedItems.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border/50 rounded-3xl">
              <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">No reports yet</h3>
              <p className="text-muted-foreground mb-6">You haven't reported any lost or found items.</p>
              <Link href="/report">
                <Button className="rounded-full">Report an Item</Button>
              </Link>
            </div>
          ) : (
            reportedItems.map(item => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                key={item.id} 
                className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-5 hover:border-primary/30 transition-colors"
              >
                <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-muted-foreground/50" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={item.type === "lost" ? "destructive" : "default"} className="text-[10px] uppercase">
                      {item.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(item.createdAt), "MMM d, yyyy")}</span>
                  </div>
                  <h4 className="font-bold text-lg leading-tight line-clamp-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    Status: <strong className="capitalize text-foreground">{item.status}</strong>
                    {item.claimCount > 0 && <span className="text-primary font-medium px-2 py-0.5 bg-primary/10 rounded-full text-xs">{item.claimCount} Claims</span>}
                  </p>
                </div>
                <Link href={`/item/${item.id}`}>
                  <Button variant="outline" className="w-full sm:w-auto rounded-xl">View Details</Button>
                </Link>
              </motion.div>
            ))
          )
        ) : (
          claims.length === 0 ? (
             <div className="text-center py-16 bg-card border border-border/50 rounded-3xl">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">No claims yet</h3>
              <p className="text-muted-foreground">You haven't claimed any items.</p>
            </div>
          ) : (
            claims.map(claim => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                key={claim.id} 
                className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-5 hover:border-primary/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {claim.status === "returned" ? (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white gap-1"><CheckCircle2 className="w-3 h-3"/> Returned</Badge>
                    ) : claim.status === "pending" ? (
                      <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"><Clock className="w-3 h-3"/> Pending</Badge>
                    ) : (
                      <Badge variant="outline" className="capitalize">{claim.status}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{format(new Date(claim.createdAt), "MMM d, yyyy")}</span>
                  </div>
                  <h4 className="font-bold text-lg leading-tight mb-1">{claim.itemTitle}</h4>
                  <p className="text-sm text-muted-foreground italic line-clamp-1 border-l-2 border-border pl-2 my-2">"{claim.message}"</p>
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <Link href={`/claim/${claim.id}`}>
                    <Button className="w-full sm:w-auto rounded-xl gap-2">View Handover <ArrowRight className="w-4 h-4"/></Button>
                  </Link>
                </div>
              </motion.div>
            ))
          )
        )}
      </div>
    </div>
  );
}
