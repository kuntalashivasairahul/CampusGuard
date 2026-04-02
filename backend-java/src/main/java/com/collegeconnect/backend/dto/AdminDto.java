package com.collegeconnect.backend.dto;

import lombok.Data;
import java.util.List;

public class AdminDto {

    @Data
    public static class AdminStatsResponse {
        private long totalItems;
        private long lostItems;
        private long foundItems;
        private long returnedItems;
        private long pendingClaims;
        private long totalUsers;

        public AdminStatsResponse(long totalItems, long lostItems, long foundItems, long returnedItems, long pendingClaims, long totalUsers) {
            this.totalItems = totalItems;
            this.lostItems = lostItems;
            this.foundItems = foundItems;
            this.returnedItems = returnedItems;
            this.pendingClaims = pendingClaims;
            this.totalUsers = totalUsers;
        }
    }

    @Data
    public static class TransactionsResponse {
        private List<ClaimDto.ClaimResponse> transactions;
        private long total;

        public TransactionsResponse(List<ClaimDto.ClaimResponse> transactions, long total) {
            this.transactions = transactions;
            this.total = total;
        }
    }
}
