import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.post("/message", async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const systemPrompt = `You are a helpful support assistant for a College Lost & Found platform. 
You help students and faculty with:
- Reporting lost or found items
- Understanding how the claim and OTP verification process works
- Resolving disputes if someone falsely claims an item
- General guidance on using the platform

Be friendly, concise, and helpful. If someone reports a dispute about a false claim, guide them to contact the admin or use the Report Dispute option.`;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...history.map((h: any) => ({ role: h.role as "user" | "assistant", content: h.content })),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages,
      max_completion_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
    return res.json({ reply });
  } catch (err) {
    req.log.error({ err }, "Chat completion error");
    return res.status(500).json({ error: "Failed to get AI response" });
  }
});

export default router;
