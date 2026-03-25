import { useState } from "react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useListItems } from "@workspace/api-client-react";
import type { ListItemsType } from "@workspace/api-client-react";
import { 
  MapPin, Clock, Search, Filter, Plus, 
  Package, Inbox, Loader2, ArrowRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function FeedPage() {
  const [type, setType] = useState<ListItemsType>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useListItems({
    type: type !== "all" ? type : undefined,
  });

  // Client side search filter for simplicity, though API could handle it
  const items = data?.items?.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) || 
    item.description.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 pb-20 md:pb-0 relative min-h-full">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background/80 backdrop-blur-xl sticky top-0 z-10 py-2 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex bg-secondary/50 p-1 rounded-xl w-full md:w-auto">
          {(["all", "lost", "found"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t as ListItemsType)}
              className={`
                flex-1 md:w-24 px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200
                ${type === t 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }
              `}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search items..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50 border-none rounded-xl"
          />
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
          <p>Loading the feed...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-destructive">
          Failed to load items. Please try again later.
        </div>
      ) : items.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto"
        >
          <img 
            src={`${import.meta.env.BASE_URL}images/empty-state.png`} 
            alt="No items found" 
            className="w-48 h-48 mb-6 drop-shadow-xl"
          />
          <h3 className="text-2xl font-display font-bold text-foreground mb-2">Nothing found here</h3>
          <p className="text-muted-foreground mb-8">
            {search 
              ? "We couldn't find any items matching your search." 
              : "The feed is currently empty. Be the first to report an item!"}
          </p>
          <Link href="/report">
            <Button className="rounded-full shadow-lg shadow-primary/20">
              Report an Item
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link href={`/item/${item.id}`}>
                  <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group cursor-pointer h-full flex flex-col">
                    
                    {/* Image Area */}
                    <div className="aspect-[4/3] bg-secondary relative overflow-hidden flex items-center justify-center">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <Package className="w-12 h-12 text-muted-foreground/30" />
                      )}
                      
                      {/* Badges Overlay */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge variant={item.type === "lost" ? "destructive" : "default"} className="uppercase font-bold tracking-wider text-[10px] px-2 py-1 shadow-md">
                          {item.type}
                        </Badge>
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-foreground shadow-sm">
                          {item.category}
                        </Badge>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-display font-bold text-lg text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                        <div className="flex items-center gap-1.5 truncate max-w-[50%]">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Floating Action Button for Mobile */}
      <Link href="/report">
        <button className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/40 flex items-center justify-center z-40 active:scale-95 transition-transform">
          <Plus className="w-6 h-6" />
        </button>
      </Link>
    </div>
  );
}
