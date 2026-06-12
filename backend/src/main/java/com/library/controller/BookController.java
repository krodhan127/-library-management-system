package com.library.controller;

import com.library.model.Book;
import com.library.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/books")
public class BookController {

    @Autowired
    private BookRepository bookRepository;

    @GetMapping
    public ResponseEntity<List<Book>> getBooks(@RequestParam(value = "search", required = false) String search) {
        if (search != null && !search.trim().isEmpty()) {
            String keyword = search.trim();
            return ResponseEntity.ok(bookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCaseOrGenreContainingIgnoreCase(
                    keyword, keyword, keyword));
        }
        return ResponseEntity.ok(bookRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBookById(@PathVariable Long id) {
        Optional<Book> bookOpt = bookRepository.findById(id);
        if (bookOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Book not found");
        }
        return ResponseEntity.ok(bookOpt.get());
    }

    @PostMapping
    public ResponseEntity<?> addBook(@RequestBody Book book, @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (!"ADMIN".equals(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Only ADMINs can add books");
        }

        if (book.getTitle() == null || book.getTitle().trim().isEmpty() ||
            book.getAuthor() == null || book.getAuthor().trim().isEmpty() ||
            book.getIsbn() == null || book.getIsbn().trim().isEmpty() ||
            book.getGenre() == null || book.getGenre().trim().isEmpty() ||
            book.getQuantity() == null || book.getQuantity() < 0) {
            return ResponseEntity.badRequest().body("Invalid book data");
        }

        if (bookRepository.findByIsbn(book.getIsbn().trim()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Book with this ISBN already exists");
        }

        book.setTitle(book.getTitle().trim());
        book.setAuthor(book.getAuthor().trim());
        book.setIsbn(book.getIsbn().trim());
        book.setGenre(book.getGenre().trim());
        
        // For new books, available quantity is equal to total quantity
        book.setAvailableQuantity(book.getQuantity());

        Book savedBook = bookRepository.save(book);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedBook);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBook(@PathVariable Long id, @RequestBody Book updatedBook, @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (!"ADMIN".equals(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Only ADMINs can update books");
        }

        Optional<Book> bookOpt = bookRepository.findById(id);
        if (bookOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Book not found");
        }

        Book existingBook = bookOpt.get();

        // Check unique ISBN constraint if updated
        if (updatedBook.getIsbn() != null && !updatedBook.getIsbn().trim().equals(existingBook.getIsbn())) {
            if (bookRepository.findByIsbn(updatedBook.getIsbn().trim()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Book with this ISBN already exists");
            }
            existingBook.setIsbn(updatedBook.getIsbn().trim());
        }

        if (updatedBook.getTitle() != null && !updatedBook.getTitle().trim().isEmpty()) {
            existingBook.setTitle(updatedBook.getTitle().trim());
        }
        if (updatedBook.getAuthor() != null && !updatedBook.getAuthor().trim().isEmpty()) {
            existingBook.setAuthor(updatedBook.getAuthor().trim());
        }
        if (updatedBook.getGenre() != null && !updatedBook.getGenre().trim().isEmpty()) {
            existingBook.setGenre(updatedBook.getGenre().trim());
        }

        if (updatedBook.getQuantity() != null) {
            if (updatedBook.getQuantity() < 0) {
                return ResponseEntity.badRequest().body("Quantity cannot be negative");
            }
            // Adjust available quantity based on change in total quantity
            int checkedOut = existingBook.getQuantity() - existingBook.getAvailableQuantity();
            if (updatedBook.getQuantity() < checkedOut) {
                return ResponseEntity.badRequest().body("New total quantity cannot be less than current checked-out copies (" + checkedOut + ")");
            }
            existingBook.setQuantity(updatedBook.getQuantity());
            existingBook.setAvailableQuantity(updatedBook.getQuantity() - checkedOut);
        }

        Book savedBook = bookRepository.save(existingBook);
        return ResponseEntity.ok(savedBook);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBook(@PathVariable Long id, @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (!"ADMIN".equals(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Only ADMINs can delete books");
        }

        Optional<Book> bookOpt = bookRepository.findById(id);
        if (bookOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Book not found");
        }

        Book book = bookOpt.get();
        // Prevent deletion if there are active checked-out copies
        int checkedOut = book.getQuantity() - book.getAvailableQuantity();
        if (checkedOut > 0) {
            return ResponseEntity.badRequest().body("Cannot delete book: " + checkedOut + " copies are currently issued to students");
        }

        bookRepository.delete(book);
        return ResponseEntity.ok("Book deleted successfully");
    }
}
