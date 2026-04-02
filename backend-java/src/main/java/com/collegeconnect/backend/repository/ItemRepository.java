package com.collegeconnect.backend.repository;

import com.collegeconnect.backend.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Integer> {
    List<Item> findByType(String type);
    List<Item> findByStatus(String status);
}
