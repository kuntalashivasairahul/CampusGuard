package com.collegeconnect.backend.repository;

import com.collegeconnect.backend.model.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Integer> {
    List<Claim> findByItemId(Integer itemId);
    List<Claim> findByClaimerId(Integer claimerId);
}
