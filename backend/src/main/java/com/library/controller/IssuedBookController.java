package com.library.controller;

import com.library.model.Book;
import com.library.model.IssuedBook;
import com.library.model.User;
import com.library.repository.BookRepository;
import com.library.repository.IssuedBookRepository;
import com.library.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/issues")
public class IssuedBookController {

    @Autowired
    private IssuedBookRepository issuedBookRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/issue")
    public ResponseEntity<?> issueBook(@RequestBody Map<String, Long> request, @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        // Enforce that only STUDENTS or ADMINs can request checkouts
        if (userRole == null || (!userRole.equals("STUDENT") && !userRole.equals("ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }

        Long userId = request.get("userId");
        Long bookId = request.get("bookId");

        if (userId == null || bookId == null) {
            return ResponseEntity.badRequest().body("userId and bookId are required");
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
        User user = userOpt.get();

        Optional<Book> bookOpt = bookRepository.findById(bookId);
        if (bookOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Book not found");
        }
        Book book = bookOpt.get();

        // Business rules:
        // 1. Check if the book has available copies
        if (book.getAvailableQuantity() <= 0) {
            return ResponseEntity.badRequest().body("No copies of '" + book.getTitle() + "' are currently available");
        }

        // 2. Check if this user already has an active issue of this book
        Optional<IssuedBook> activeIssue = issuedBookRepository.findByUserIdAndBookIdAndStatus(userId, bookId, "ISSUED");
        if (activeIssue.isPresent()) {
            return ResponseEntity.badRequest().body("You have already issued a copy of '" + book.getTitle() + "' and not returned it yet");
        }

        // Issue the book
        book.setAvailableQuantity(book.getAvailableQuantity() - 1);
        bookRepository.save(book);

        IssuedBook issuedBook = new IssuedBook(book, user, LocalDate.now(), "ISSUED");
        IssuedBook savedIssue = issuedBookRepository.save(issuedBook);

        // Hide passwords in returned JSON
        savedIssue.getUser().setPassword(null);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedIssue);
    }

    @PostMapping("/return/{issueId}")
    public ResponseEntity<?> returnBook(@PathVariable Long issueId, @RequestHeader(value = "X-User-Role", required = false) String userRole, @RequestHeader(value = "X-User-Id", required = false) Long currentUserId) {
        if (userRole == null || (!userRole.equals("STUDENT") && !userRole.equals("ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }

        Optional<IssuedBook> issueOpt = issuedBookRepository.findById(issueId);
        if (issueOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Issue record not found");
        }

        IssuedBook issuedBook = issueOpt.get();
        if (!"ISSUED".equals(issuedBook.getStatus())) {
            return ResponseEntity.badRequest().body("This book is already marked as returned");
        }

        // Enforce that a STUDENT can only return their own checked out books
        if ("STUDENT".equals(userRole) && !issuedBook.getUser().getId().equals(currentUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: You can only return your own issued books");
        }

        Book book = issuedBook.getBook();
        book.setAvailableQuantity(book.getAvailableQuantity() + 1);
        bookRepository.save(book);

        issuedBook.setStatus("RETURNED");
        issuedBook.setReturnDate(LocalDate.now());
        IssuedBook savedIssue = issuedBookRepository.save(issuedBook);

        savedIssue.getUser().setPassword(null);
        return ResponseEntity.ok(savedIssue);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserIssues(@PathVariable Long userId, @RequestHeader(value = "X-User-Role", required = false) String userRole, @RequestHeader(value = "X-User-Id", required = false) Long currentUserId) {
        // Enforce access control: Admin can view any student's history; Student can only view their own
        if (userRole == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }
        if ("STUDENT".equals(userRole) && !userId.equals(currentUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Cannot view other users' records");
        }

        List<IssuedBook> userHistory = issuedBookRepository.findByUserId(userId);
        for (IssuedBook ib : userHistory) {
            ib.getUser().setPassword(null);
        }
        return ResponseEntity.ok(userHistory);
    }

    @GetMapping
    public ResponseEntity<?> getAllIssues(@RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (!"ADMIN".equals(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Only ADMINs can view all issued books");
        }

        List<IssuedBook> allIssues = issuedBookRepository.findAll();
        for (IssuedBook ib : allIssues) {
            ib.getUser().setPassword(null);
        }
        return ResponseEntity.ok(allIssues);
    }
}
