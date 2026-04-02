package com.collegeconnect.backend.dto;

import com.collegeconnect.backend.model.Item;
import lombok.Data;

import java.time.LocalDateTime;

public class ItemDto {

    @Data
    public static class ImageUploadRequest {
        private String imageData;
        private String mimeType;
    }

    @Data
    public static class ImageUploadResponse {
        private String imageUrl;
        public ImageUploadResponse(String imageUrl) { this.imageUrl = imageUrl; }
    }

    @Data
    public static class CreateItemRequest {
        private String type;
        private String title;
        private String description;
        private String category;
        private String location;
        private String imageUrl;
    }

    @Data
    public static class ItemResponse {
        private Integer id;
        private String type;
        private String title;
        private String description;
        private String category;
        private String location;
        private String imageUrl;
        private String status;
        private Integer reportedBy;
        private String reporterName;
        private String reporterEmail;
        private LocalDateTime createdAt;
        private long claimCount;

        public static ItemResponse fromEntity(Item item, long claimCount) {
            ItemResponse res = new ItemResponse();
            res.setId(item.getId());
            res.setType(item.getType());
            res.setTitle(item.getTitle());
            res.setDescription(item.getDescription());
            res.setCategory(item.getCategory());
            res.setLocation(item.getLocation());
            res.setImageUrl(item.getImageUrl());
            res.setStatus(item.getStatus());
            if (item.getReportedBy() != null) {
                res.setReportedBy(item.getReportedBy().getId());
                res.setReporterName(item.getReportedBy().getName());
                res.setReporterEmail(item.getReportedBy().getEmail());
            }
            res.setCreatedAt(item.getCreatedAt());
            res.setClaimCount(claimCount);
            return res;
        }
    }

    @Data
    public static class PaginatedItemResponse {
        private java.util.List<ItemResponse> items;
        private long total;
        private int page;
        private int limit;

        public PaginatedItemResponse(java.util.List<ItemResponse> items, long total, int page, int limit) {
            this.items = items;
            this.total = total;
            this.page = page;
            this.limit = limit;
        }
    }
}
