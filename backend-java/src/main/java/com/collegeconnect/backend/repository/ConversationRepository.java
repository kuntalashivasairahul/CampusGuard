package com.collegeconnect.backend.repository;

import com.collegeconnect.backend.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Integer> {
    // Custom query methods can go here if needed
}
