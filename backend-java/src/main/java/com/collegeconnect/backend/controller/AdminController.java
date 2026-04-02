package com.collegeconnect.backend.controller;

import com.collegeconnect.backend.dto.AdminDto;
import com.collegeconnect.backend.dto.ClaimDto;
import com.collegeconnect.backend.dto.ItemDto;
import com.collegeconnect.backend.model.Claim;
import com.collegeconnect.backend.model.Item;
import com.collegeconnect.backend.repository.ClaimRepository;
import com.collegeconnect.backend.repository.ItemRepository;
import com.collegeconnect.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long totalItems = itemRepository.count();
        long lostItems = itemRepository.findByType("lost").size();
        long foundItems = itemRepository.findByType("found").size();
        long returnedItems = itemRepository.findByStatus("returned").size();
        long pendingClaims = claimRepository.findAll().stream().filter(c -> "pending".equals(c.getStatus())).count();
        long totalUsers = userRepository.count();

        return ResponseEntity.ok(new AdminDto.AdminStatsResponse(
                totalItems, lostItems, foundItems, returnedItems, pendingClaims, totalUsers
        ));
    }

    @GetMapping("/items")
    public ResponseEntity<?> getItems(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit
    ) {
        int pageNum = Math.max(1, page);
        int limitNum = Math.min(Math.max(1, limit), 50);

        List<Item> allItems = itemRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        long total = allItems.size();

        int start = (pageNum - 1) * limitNum;
        int end = Math.min(start + limitNum, allItems.size());
        
        List<Item> pagedItems = start <= end ? allItems.subList(start, end) : List.of();

        List<ItemDto.ItemResponse> responses = pagedItems.stream()
                .map(item -> ItemDto.ItemResponse.fromEntity(item, 0)) // Admin doesn't explicitly need claim count here based on original
                .collect(Collectors.toList());

        return ResponseEntity.ok(new ItemDto.PaginatedItemResponse(responses, total, pageNum, limitNum));
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions() {
        List<Claim> claims = claimRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        
        List<ClaimDto.ClaimResponse> dtos = claims.stream().map(claim -> ClaimDto.ClaimResponse.fromEntity(claim, 0)).collect(Collectors.toList());
        
        return ResponseEntity.ok(new AdminDto.TransactionsResponse(dtos, dtos.size()));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<?> deleteItem(@PathVariable Integer id) {
        Item item = itemRepository.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Item not found"));
        }

        claimRepository.findByItemId(id).forEach(c -> claimRepository.delete(c));
        itemRepository.delete(item);

        return ResponseEntity.ok(Map.of("message", "Item deleted by admin"));
    }

    @PostMapping("/claims/{id}/flag")
    public ResponseEntity<?> flagClaim(@PathVariable Integer id) {
        Claim claim = claimRepository.findById(id).orElse(null);
        if (claim == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Claim not found"));
        }

        claim.setFlagged(true);
        claimRepository.save(claim);

        return ResponseEntity.ok(Map.of("message", "Claim flagged for review"));
    }
}
