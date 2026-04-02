package com.collegeconnect.backend.controller;

import com.collegeconnect.backend.dto.ItemDto;
import com.collegeconnect.backend.model.Item;
import com.collegeconnect.backend.model.User;
import com.collegeconnect.backend.repository.ClaimRepository;
import com.collegeconnect.backend.repository.ItemRepository;
import com.collegeconnect.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClaimRepository claimRepository;

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User) {
            return (User) auth.getPrincipal();
        }
        return null;
    }

    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(@RequestBody ItemDto.ImageUploadRequest request) {
        if (request.getImageData() == null || request.getMimeType() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "imageData and mimeType are required"));
        }
        String imageUrl = "data:" + request.getMimeType() + ";base64," + request.getImageData();
        return ResponseEntity.ok(new ItemDto.ImageUploadResponse(imageUrl));
    }

    @GetMapping
    public ResponseEntity<?> getItems(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        int pageNum = Math.max(1, page);
        int limitNum = Math.min(Math.max(1, limit), 50);

        // Simple filtering (ideally with Specifications for complex filters)
        List<Item> allItems = itemRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        
        if (type != null && !type.equals("all")) {
            allItems = allItems.stream().filter(i -> i.getType().equals(type)).collect(Collectors.toList());
        }
        if (category != null) {
            allItems = allItems.stream().filter(i -> i.getCategory().equals(category)).collect(Collectors.toList());
        }

        long total = allItems.size();
        
        int start = (pageNum - 1) * limitNum;
        int end = Math.min(start + limitNum, allItems.size());
        
        List<Item> pagedItems = start <= end ? allItems.subList(start, end) : List.of();

        List<ItemDto.ItemResponse> responses = pagedItems.stream().map(item -> {
            long claimCount = claimRepository.findByItemId(item.getId()).size();
            return ItemDto.ItemResponse.fromEntity(item, claimCount);
        }).collect(Collectors.toList());

        return ResponseEntity.ok(new ItemDto.PaginatedItemResponse(responses, total, pageNum, limitNum));
    }

    @PostMapping
    public ResponseEntity<?> createItem(@RequestBody ItemDto.CreateItemRequest request) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        if (request.getType() == null || request.getTitle() == null ||
            request.getDescription() == null || request.getCategory() == null || request.getLocation() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "All fields are required"));
        }

        Item item = new Item();
        item.setType(request.getType());
        item.setTitle(request.getTitle());
        item.setDescription(request.getDescription());
        item.setCategory(request.getCategory());
        item.setLocation(request.getLocation());
        item.setImageUrl(request.getImageUrl());
        item.setStatus("active");
        item.setReportedBy(user);

        item = itemRepository.save(item);

        return ResponseEntity.status(HttpStatus.CREATED).body(ItemDto.ItemResponse.fromEntity(item, 0));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getItem(@PathVariable Integer id) {
        Item item = itemRepository.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Item not found"));
        }

        long claimCount = claimRepository.findByItemId(item.getId()).size();
        return ResponseEntity.ok(ItemDto.ItemResponse.fromEntity(item, claimCount));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteItem(@PathVariable Integer id) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        Item item = itemRepository.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Item not found"));
        }

        if (!item.getReportedBy().getId().equals(user.getId()) && !user.getIsAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Forbidden"));
        }

        // Delete associated claims first
        claimRepository.findByItemId(id).forEach(claim -> claimRepository.delete(claim));
        
        itemRepository.delete(item);

        return ResponseEntity.ok(Map.of("message", "Item deleted successfully"));
    }
}
