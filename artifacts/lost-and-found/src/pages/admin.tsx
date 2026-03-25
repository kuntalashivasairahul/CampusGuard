import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useAdminGetStats, useAdminListItems, useAdminListTransactions, useAdminDeleteItem, useAdminFlagClaim } from "@workspace/api-client-react";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Flag, AlertTriangle, Users, Package, CheckCircle, Search, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "items" | "transactions">("overview");

  const { data: stats, isLoading: statsLoading } = useAdminGetStats();
  const { data: itemsData, isLoading: itemsLoading } = useAdminListItems({ limit: 50 });
  const { data: txData, isLoading: txLoading } = useAdminListTransactions();

  const deleteMutation = useAdminDeleteItem({
    mutation: {
      onSuccess: () => {
        toast({ title: "Item deleted" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/items"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      }
    }
  });

  const flagMutation = useAdminFlagClaim({
    mutation: {
      onSuccess: () => {
        toast({ title: "Claim flagged for review" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      }
    }
  });

  if (statsLoading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  const chartData = [
    { name: 'Lost', value: stats?.lostItems || 0, fill: 'hsl(var(--destructive))' },
    { name: 'Found', value: stats?.foundItems || 0, fill: 'hsl(var(--primary))' },
    { name: 'Returned', value: stats?.returnedItems || 0, fill: '#22c55e' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Admin Control Center</h1>
        <p className="text-muted-foreground mt-1">Platform overview and moderation tools.</p>
      </div>

      <div className="flex space-x-2 bg-secondary/50 p-1.5 rounded-xl w-full sm:w-auto overflow-x-auto mb-8">
        {(["overview", "items", "transactions"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg capitalize whitespace-nowrap transition-all ${
              activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/30"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-border/50 shadow-sm bg-card">
              <CardContent className="p-6">
                <Package className="w-8 h-8 text-primary mb-4" />
                <p className="text-3xl font-bold font-display">{stats?.totalItems}</p>
                <p className="text-sm text-muted-foreground font-medium mt-1">Total Items</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm bg-card">
              <CardContent className="p-6">
                <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
                <p className="text-3xl font-bold font-display">{stats?.returnedItems}</p>
                <p className="text-sm text-muted-foreground font-medium mt-1">Returned</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm bg-card">
              <CardContent className="p-6">
                <AlertTriangle className="w-8 h-8 text-amber-500 mb-4" />
                <p className="text-3xl font-bold font-display">{stats?.pendingClaims}</p>
                <p className="text-sm text-muted-foreground font-medium mt-1">Pending Claims</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm bg-card">
              <CardContent className="p-6">
                <Users className="w-8 h-8 text-blue-500 mb-4" />
                <p className="text-3xl font-bold font-display">{stats?.totalUsers}</p>
                <p className="text-sm text-muted-foreground font-medium mt-1">Users</p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-secondary/30 border-b border-border/50">
              <CardTitle className="font-display">Platform Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === "items" && (
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="p-4 font-medium">Title</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Reporter</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {itemsData?.items.map(item => (
                  <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4 font-medium text-foreground">{item.title}</td>
                    <td className="p-4"><Badge variant="outline" className="uppercase text-[10px]">{item.type}</Badge></td>
                    <td className="p-4 capitalize">{item.status}</td>
                    <td className="p-4 text-muted-foreground">{item.reporterEmail}</td>
                    <td className="p-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl"
                        onClick={() => {
                          if(confirm("Delete this item permanently?")) deleteMutation.mutate({ id: item.id });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="p-4 font-medium">Item</th>
                  <th className="p-4 font-medium">Claimant</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {txData?.transactions.map(tx => (
                  <tr key={tx.id} className={`transition-colors ${tx.flagged ? 'bg-destructive/5' : 'hover:bg-secondary/20'}`}>
                    <td className="p-4 font-medium text-foreground">{tx.itemTitle}</td>
                    <td className="p-4">
                      <div>
                        <p>{tx.claimerName}</p>
                        <p className="text-xs text-muted-foreground">{tx.claimerEmail}</p>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{format(new Date(tx.createdAt), "MMM d, yyyy")}</td>
                    <td className="p-4">
                      {tx.flagged ? (
                        <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3"/> Flagged</Badge>
                      ) : (
                        <Badge variant="outline" className="capitalize">{tx.status}</Badge>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {!tx.flagged && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-amber-600 hover:bg-amber-100 hover:text-amber-700 rounded-xl"
                          onClick={() => {
                            if(confirm("Flag this claim for manual review?")) flagMutation.mutate({ id: tx.id });
                          }}
                        >
                          <Flag className="w-4 h-4 mr-2" /> Flag
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
