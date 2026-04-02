package com.collegeconnect.backend.controller;

import com.collegeconnect.backend.dto.ClaimDto;
import com.collegeconnect.backend.dto.ItemDto;
import com.collegeconnect.backend.model.Claim;
import com.collegeconnect.backend.model.Item;
import com.collegeconnect.backend.model.User;
import com.collegeconnect.backend.repository.ClaimRepository;
import com.collegeconnect.backend.repository.ItemRepository;
import com.collegeconnect.backend.repository.ClaimMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/claims")
public class ClaimController {

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private ClaimMessageRepository claimMessageRepository;

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User) {
            return (User) auth.getPrincipal();
        }
        return null;
    }

    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyClaims() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        List<Item> myItems = itemRepository.findAll().stream()
                .filter(i -> i.getReportedBy().getId().equals(user.getId()))
                .collect(Collectors.toList());

        List<ItemDto.ItemResponse> itemResponses = myItems.stream()
                .map(item -> ItemDto.ItemResponse.fromEntity(item, claimRepository.findByItemId(item.getId()).size()))
                .collect(Collectors.toList());

        List<Claim> myClaims = claimRepository.findByClaimerId(user.getId());
        // Also fetch claims where the user is the original reporter
        List<Claim> claimsOnMyItems = claimRepository.findAll().stream()
            .filter(c -> c.getItem().getReportedBy().getId().equals(user.getId()))
            .collect(Collectors.toList());
            
        java.util.Set<Claim> allMyClaims = new java.util.HashSet<>(myClaims);
        allMyClaims.addAll(claimsOnMyItems);

        List<ClaimDto.ClaimResponse> claimResponses = allMyClaims.stream()
                .map(c -> ClaimDto.ClaimResponse.fromEntity(c, user.getId()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(new ClaimDto.MyClaimsResponse(itemResponses, claimResponses));
    }

    @PostMapping
    public ResponseEntity<?> createClaim(@RequestBody ClaimDto.CreateClaimRequest request) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        if (request.getItemId() == null || request.getMessage() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "itemId and message are required"));
        }

        Item item = itemRepository.findById(request.getItemId()).orElse(null);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Item not found"));
        }

        if (item.getReportedBy().getId().equals(user.getId())) {
            return ResponseEntity.badRequest().body(Map.of("error", "You cannot claim your own item"));
        }

        if (!"active".equals(item.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This item is no longer available for claiming"));
        }

        Claim claim = new Claim();
        claim.setItem(item);
        claim.setClaimer(user);
        claim.setMessage(request.getMessage());
        claim.setOtp(null);
        claim.setStatus("pending");
        claim.setFlagged(false);

        claim = claimRepository.save(claim);

        item.setStatus("claimed");
        itemRepository.save(item);

        ClaimDto.CreateClaimResponse response = new ClaimDto.CreateClaimResponse();
        response.setId(claim.getId());
        response.setItemId(item.getId());
        response.setClaimerId(user.getId());
        response.setStatus(claim.getStatus());
        response.setOtp(claim.getOtp());
        response.setMessage("Claim submitted! Waiting for the reporter to accept your request.");
        response.setCreatedAt(claim.getCreatedAt());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<?> acceptClaim(@PathVariable Integer id) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        Claim claim = claimRepository.findById(id).orElse(null);
        if (claim == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Claim not found"));
        }

        // Only the original item reporter can accept
        if (!claim.getItem().getReportedBy().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only the item reporter can accept claims"));
        }

        if (!"pending".equals(claim.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only pending claims can be accepted"));
        }

        claim.setStatus("accepted");
        claimRepository.save(claim);

        return ResponseEntity.ok(Map.of("message", "Claim accepted! Chat is now open for both parties."));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectClaim(@PathVariable Integer id) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        Claim claim = claimRepository.findById(id).orElse(null);
        if (claim == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Claim not found"));
        }

        // Only the original item reporter can reject
        if (!claim.getItem().getReportedBy().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only the item reporter can reject claims"));
        }

        if (!"pending".equals(claim.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only pending claims can be rejected"));
        }

        claim.setStatus("rejected");
        claimRepository.save(claim);

        // Revert item back to active so other users can claim it
        Item item = claim.getItem();
        item.setStatus("active");
        itemRepository.save(item);

        return ResponseEntity.ok(Map.of("message", "Claim rejected. Item is now available again."));
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<?> verifyClaim(@PathVariable Integer id, @RequestBody ClaimDto.VerifyClaimRequest request) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        if (request.getOtp() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "OTP is required"));
        }

        Claim claim = claimRepository.findById(id).orElse(null);
        if (claim == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Claim not found"));
        }

        if (claim.getOtp() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "OTP has not been generated yet"));
        }

        if (!claim.getOtp().equals(request.getOtp())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid OTP. Please ask the owner to provide the correct code."));
        }

        if ("verified".equals(claim.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This claim has already been verified"));
        }

        claim.setStatus("verified");
        claim.setVerifiedAt(LocalDateTime.now());
        claimRepository.save(claim);

        Item item = claim.getItem();
        item.setStatus("returned");
        itemRepository.save(item);

        return ResponseEntity.ok(Map.of("message", "Item has been successfully returned! Transaction recorded."));
    }

    @PostMapping("/{id}/generate-otp")
    public ResponseEntity<?> generateOtpForClaim(@PathVariable Integer id) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        Claim claim = claimRepository.findById(id).orElse(null);
        if (claim == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Claim not found"));
        }

        // Only the original item reporter can generate the OTP
        if (!claim.getItem().getReportedBy().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only the original item reporter can generate the OTP"));
        }

        if (!"accepted".equals(claim.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Claim must be accepted before generating an OTP"));
        }

        if (claim.getOtp() != null && !claim.getOtp().isEmpty()) {
            return ResponseEntity.ok(Map.of(
                "message", "OTP already generated",
                "otp", claim.getOtp()
            ));
        }

        String otp = generateOtp();
        claim.setOtp(otp);
        claimRepository.save(claim);

        return ResponseEntity.ok(Map.of(
            "message", "OTP Generated successfully",
            "otp", otp
        ));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<?> getClaimMessages(@PathVariable Integer id) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        Claim claim = claimRepository.findById(id).orElse(null);
        if (claim == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Claim not found"));

        if (!claim.getClaimer().getId().equals(user.getId()) && !claim.getItem().getReportedBy().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Not authorized to view these messages"));
        }

        List<com.collegeconnect.backend.model.ClaimMessage> messages = claimMessageRepository.findByClaimIdOrderByCreatedAtAsc(id);
        List<ClaimDto.ClaimMessageResponse> dtos = messages.stream()
                .map(ClaimDto.ClaimMessageResponse::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<?> sendClaimMessage(@PathVariable Integer id, @RequestBody ClaimDto.SendClaimMessageRequest request) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        if (request.getText() == null || request.getText().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message text is required"));
        }

        Claim claim = claimRepository.findById(id).orElse(null);
        if (claim == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Claim not found"));

        if (!claim.getClaimer().getId().equals(user.getId()) && !claim.getItem().getReportedBy().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Not authorized"));
        }

        // Chat is only allowed for accepted or otp-having claims
        if ("pending".equals(claim.getStatus()) || "rejected".equals(claim.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Chat is only available after the claim is accepted"));
        }

        com.collegeconnect.backend.model.ClaimMessage msg = new com.collegeconnect.backend.model.ClaimMessage();
        msg.setClaim(claim);
        msg.setSender(user);
        msg.setText(request.getText());
        claimMessageRepository.save(msg);

        return ResponseEntity.status(HttpStatus.CREATED).body(ClaimDto.ClaimMessageResponse.fromEntity(msg));
    }
}
