package com.collegeconnect.backend.dto;

import com.collegeconnect.backend.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class AuthDto {

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private String role;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserDto {
        private Integer id;
        private String name;
        private String email;
        private String role;
        private Boolean isAdmin;
        private LocalDateTime createdAt;

        public static UserDto fromEntity(User user) {
            return new UserDto(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole(),
                    user.getIsAdmin(),
                    user.getCreatedAt()
            );
        }
    }

    @Data
    @AllArgsConstructor
    public static class AuthResponse {
        private UserDto user;
        private String message;
        private String token; // JWT returned in body for cross-origin clients
    }
}
