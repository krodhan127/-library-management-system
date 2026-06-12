package com.library.repository;

import com.library.model.IssuedBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IssuedBookRepository extends JpaRepository<IssuedBook, Long> {
    List<IssuedBook> findByUserId(Long userId);
    
    // Check if user has an active checkout (not returned) for a book
    Optional<IssuedBook> findByUserIdAndBookIdAndStatus(Long userId, Long bookId, String status);
}
