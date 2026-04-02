package com.collegeconnect.backend.repository;

import com.collegeconnect.backend.model.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Integer> {
    Optional<Otp> findByEmailAndCodeAndTypeAndUsedFalse(String email, String code, String type);
    Optional<Otp> findFirstByEmailAndTypeOrderByCreatedAtDesc(String email, String type);
}
