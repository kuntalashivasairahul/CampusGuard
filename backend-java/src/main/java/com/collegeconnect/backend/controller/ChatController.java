package com.collegeconnect.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    static class ChatRequest {
        public String message;
        public java.util.List<Map<String, String>> history;
    }

    @PostMapping("/message")
    public ResponseEntity<?> message(@RequestBody ChatRequest request) {
        if (request.message == null || request.message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message is required"));
        }

        // Mock response for now to avoid requiring OpenAI API key in development
        // Replace this with actual WebClient call to OpenAI API if needed
        String reply = "This is a mock response from the College Connect Java Backend. " +
                "To get real AI responses, integrate the OpenAI API in ChatController.java.";

        return ResponseEntity.ok(Map.of("reply", reply));
    }
}
