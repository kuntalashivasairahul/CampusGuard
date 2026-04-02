package com.collegeconnect.backend.controller;

import com.collegeconnect.backend.dto.AuthDto;
import com.collegeconnect.backend.model.User;
import com.collegeconnect.backend.repository.UserRepository;
import com.collegeconnect.backend.security.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final List<String> COLLEGE_EMAIL_DOMAINS = Arrays.asList("edu", "ac.in", "edu.in", "college.edu");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private boolean isCollegeEmail(String email) {
        if (!email.contains("@")) return false;
        String domain = email.split("@")[1];
        return COLLEGE_EMAIL_DOMAINS.stream().anyMatch(domain::endsWith) ||
                domain.contains("college") || domain.contains("university") || domain.contains("edu");
    }

    private void setJwtCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("jwtToken", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true); // Enabled for Render HTTPS
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60);
        response.addCookie(cookie);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthDto.RegisterRequest request, HttpServletResponse response) {
        if (request.getName() == null || request.getEmail() == null || request.getPassword() == null || request.getRole() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "All fields are required"));
        }

        if (!isCollegeEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please use your official college email address"));
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered. Please login."));
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setIsAdmin("admin".equalsIgnoreCase(request.getRole()));
        user.setIsVerified(true);
        
        userRepository.save(user);

        String jwt = tokenProvider.generateToken(user.getId(), user.getEmail());
        setJwtCookie(response, jwt);

        return ResponseEntity.ok(new AuthDto.AuthResponse(AuthDto.UserDto.fromEntity(user), "Registration successful!", jwt));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthDto.LoginRequest request, HttpServletResponse response) {
        if (request.getEmail() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
        }

        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password"));
        }

        if (!user.getIsVerified()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Please verify your email first"));
        }

        String jwt = tokenProvider.generateToken(user.getId(), user.getEmail());
        setJwtCookie(response, jwt);

        return ResponseEntity.ok(new AuthDto.AuthResponse(AuthDto.UserDto.fromEntity(user), "Login successful!", jwt));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("jwtToken", null);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(AuthDto.UserDto.fromEntity(user));
    }
}
