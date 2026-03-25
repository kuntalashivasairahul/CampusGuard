import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateItem, useUploadItemImage } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePlus, X, Loader2, Send } from "lucide-react";

const CATEGORIES = ["Electronics", "Bags", "Clothing", "Books", "Keys", "ID Cards", "Jewelry", "Sports Equipment", "Other"];

const reportSchema = z.object({
  type: z.enum(["lost", "found"]),
  title: z.string().min(3, "Title must be at least 3 characters").max(50),
  description: z.string().min(10, "Please provide more details").max(500),
  category: z.string().min(1, "Please select a category"),
  location: z.string().min(3, "Please specify the location"),
});

export default function ReportPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);

  const createMutation = useCreateItem();
  const uploadMutation = useUploadItemImage();

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: { type: "found", category: "" }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max size is 5MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      
      // Extract base64 part
      const base64 = result.split(',')[1];
      setBase64Data(base64);
      setMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: z.infer<typeof reportSchema>) => {
    try {
      let imageUrl = undefined;

      if (base64Data && mimeType) {
        const uploadRes = await uploadMutation.mutateAsync({
          data: { imageData: base64Data, mimeType }
        });
        imageUrl = uploadRes.imageUrl;
      }

      await createMutation.mutateAsync({
        data: { ...data, imageUrl }
      });

      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/claims/my"] });
      
      toast({ title: "Item reported successfully!" });
      setLocation("/feed");

    } catch (error: any) {
      toast({ 
        title: "Failed to submit report", 
        description: error?.error || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const isPending = createMutation.isPending || uploadMutation.isPending;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Report an Item</h1>
        <p className="text-muted-foreground mt-2">Help the community by providing accurate details.</p>
      </div>

      <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Type Selection */}
          <div className="space-y-3">
            <Label className="text-base">What are you reporting?</Label>
            <RadioGroup 
              defaultValue="found" 
              onValueChange={(v) => form.setValue("type", v as any)}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="found" id="found" className="peer sr-only" />
                <Label
                  htmlFor="found"
                  className="flex flex-col items-center justify-center p-4 border-2 border-border rounded-xl cursor-pointer hover:bg-secondary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                >
                  <span className="text-lg font-bold">I Found Something</span>
                  <span className="text-xs text-muted-foreground mt-1 font-normal">Help return it</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="lost" id="lost" className="peer sr-only" />
                <Label
                  htmlFor="lost"
                  className="flex flex-col items-center justify-center p-4 border-2 border-border rounded-xl cursor-pointer hover:bg-secondary peer-data-[state=checked]:border-destructive peer-data-[state=checked]:bg-destructive/5 transition-all"
                >
                  <span className="text-lg font-bold">I Lost Something</span>
                  <span className="text-xs text-muted-foreground mt-1 font-normal">Ask for help</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input 
                id="title" 
                placeholder="e.g. Blue Hydroflask Water Bottle" 
                className="bg-secondary/50 h-12 rounded-xl"
                {...form.register("title")}
              />
              {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Category <span className="text-destructive">*</span></Label>
              <Select onValueChange={(v) => form.setValue("category", v)}>
                <SelectTrigger className="bg-secondary/50 h-12 rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {form.formState.errors.category && <p className="text-xs text-destructive">{form.formState.errors.category.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location <span className="text-destructive">*</span></Label>
            <Input 
              id="location" 
              placeholder="e.g. Main Library, 2nd floor near stairs" 
              className="bg-secondary/50 h-12 rounded-xl"
              {...form.register("location")}
            />
            {form.formState.errors.location && <p className="text-xs text-destructive">{form.formState.errors.location.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
            <Textarea 
              id="description" 
              placeholder="Provide any identifying details, color, brand, condition..." 
              className="bg-secondary/50 min-h-[120px] rounded-xl resize-none"
              {...form.register("description")}
            />
            {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
          </div>

          <div className="space-y-3">
            <Label>Photo (Optional but highly recommended)</Label>
            {imagePreview ? (
              <div className="relative w-full sm:w-64 aspect-square rounded-xl overflow-hidden border border-border group">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => { setImagePreview(null); setBase64Data(null); setMimeType(null); }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Label 
                htmlFor="image-upload" 
                className="flex flex-col items-center justify-center w-full sm:w-64 aspect-square border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl cursor-pointer transition-colors"
              >
                <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-foreground">Upload Image</span>
                <span className="text-xs text-muted-foreground mt-1">JPEG, PNG up to 5MB</span>
                <input 
                  id="image-upload" 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </Label>
            )}
          </div>

          <div className="pt-4 border-t border-border/50">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full sm:w-auto h-14 px-8 rounded-xl text-base shadow-lg shadow-primary/20"
              disabled={isPending}
            >
              {isPending ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="w-5 h-5 mr-2" /> Submit Report</>
              )}
            </Button>
          </div>

        </form>
      </div>
    </motion.div>
  );
}
