import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useSendChatMessage } from "@workspace/api-client-react";
import type { ChatMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2 } from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi there! I'm your CampusFind support assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const chatMutation = useSendChatMessage();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const history = [...messages];
    
    setMessages([...history, userMsg]);
    setInput("");

    try {
      const res = await chatMutation.mutateAsync({
        data: {
          message: userMsg.content,
          history: history
        }
      });
      setMessages(prev => [...prev, { role: "assistant", content: res.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting to my brain right now. Please try again later." }]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-3xl mx-auto bg-card border border-border/50 rounded-3xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-secondary/50 border-b border-border/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg">Support Assistant</h2>
          <p className="text-xs text-green-600 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={`flex items-end gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div className={`w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center shadow-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground border border-border"}`}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm text-sm ${
              msg.role === "user" 
                ? "bg-primary text-primary-foreground rounded-br-sm" 
                : "bg-secondary text-foreground rounded-bl-sm"
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </motion.div>
        ))}
        {chatMutation.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
              <Bot className="w-4 h-4 text-foreground" />
            </div>
            <div className="bg-secondary rounded-2xl rounded-bl-sm p-4 text-sm flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-border/50">
        <form onSubmit={handleSend} className="flex items-center gap-2 relative">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 h-14 rounded-full pl-6 pr-14 bg-secondary/50 border-border/50 focus-visible:ring-primary/20"
            disabled={chatMutation.isPending}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-2 w-10 h-10 rounded-full shadow-md"
            disabled={!input.trim() || chatMutation.isPending}
          >
            <Send className="w-4 h-4 ml-0.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
