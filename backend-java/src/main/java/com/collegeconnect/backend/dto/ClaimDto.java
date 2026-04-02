package com.collegeconnect.backend.dto;

import com.collegeconnect.backend.model.Claim;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class ClaimDto {

    @Data
    public static class MyClaimsResponse {
        private List<ItemDto.ItemResponse> reportedItems;
        private List<ClaimResponse> claims;

        public MyClaimsResponse(List<ItemDto.ItemResponse> reportedItems, List<ClaimResponse> claims) {
            this.reportedItems = reportedItems;
            this.claims = claims;
        }
    }

    @Data
    public static class ClaimResponse {
        private Integer id;
        private Integer itemId;
        private String itemTitle;
        private String itemType;
        private Integer claimerId;
        private String claimerName;
        private String claimerEmail;
        private Integer reporterId;
        private String reporterName;
        private String status;
        private String message;
        private Boolean flagged;
        private LocalDateTime createdAt;
        private LocalDateTime verifiedAt;
        private Boolean hasOtp;
        private String otp;

        public static ClaimResponse fromEntity(Claim claim, Integer currentUserId) {
            ClaimResponse res = new ClaimResponse();
            res.setId(claim.getId());
            res.setItemId(claim.getItem().getId());
            res.setItemTitle(claim.getItem().getTitle());
            res.setItemType(claim.getItem().getType());
            res.setClaimerId(claim.getClaimer().getId());
            res.setClaimerName(claim.getClaimer().getName());
            res.setClaimerEmail(claim.getClaimer().getEmail());
            res.setReporterId(claim.getItem().getReportedBy().getId());
            res.setReporterName(claim.getItem().getReportedBy().getName());
            res.setStatus(claim.getStatus());
            res.setMessage(claim.getMessage());
            res.setFlagged(claim.getFlagged());
            res.setCreatedAt(claim.getCreatedAt());
            res.setVerifiedAt(claim.getVerifiedAt());
            res.setHasOtp(claim.getOtp() != null);

            // Only reveal the OTP string to the original item reporter
            if (claim.getOtp() != null && claim.getItem().getReportedBy().getId().equals(currentUserId)) {
                res.setOtp(claim.getOtp());
            }
            return res;
        }
    }

    @Data
    public static class CreateClaimRequest {
        private Integer itemId;
        private String message;
    }

    @Data
    public static class SendClaimMessageRequest {
        private String text;
    }

    @Data
    public static class ClaimMessageResponse {
        private Integer id;
        private Integer claimId;
        private Integer senderId;
        private String senderName;
        private String text;
        private LocalDateTime createdAt;

        public static ClaimMessageResponse fromEntity(com.collegeconnect.backend.model.ClaimMessage msg) {
            ClaimMessageResponse res = new ClaimMessageResponse();
            res.setId(msg.getId());
            res.setClaimId(msg.getClaim().getId());
            res.setSenderId(msg.getSender().getId());
            res.setSenderName(msg.getSender().getName());
            res.setText(msg.getText());
            res.setCreatedAt(msg.getCreatedAt());
            return res;
        }
    }

    @Data
    public static class CreateClaimResponse {
        private Integer id;
        private Integer itemId;
        private Integer claimerId;
        private String status;
        private String otp;
        private String message;
        private LocalDateTime createdAt;
    }

    @Data
    public static class VerifyClaimRequest {
        private String otp;
    }
}
