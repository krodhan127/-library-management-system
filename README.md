# Library Management System

A beginner-friendly, secure Library Management System (LMS) built with **React.js**, **Spring Boot**, **Java**, and **MySQL/MariaDB**.

The application uses **Role-Based Access Control (RBAC)** to distinguish between **ADMIN** and **STUDENT** accounts, with simple credentials authentication and custom header-based authorization.

---

## Features

### 🔑 Authentication & Role Access
* **Simple Authentication**: Login and Registration form without advanced Spring Security or JWT configurations, keeping the codebase transparent and accessible for beginners.
* **Role-Based Views**: Automatically renders the correct layout based on user role (Administrator dashboard vs. Student portal).
* **API Protection**: Backend REST endpoints enforce security by checking `X-User-Role` and `X-User-Id` request headers.

### 👑 Admin Features (Librarian)
* **Book Management**: Add, update details, or delete books.
* **Loan Ledger**: Monitor all active and returned checkouts across the library.
* **Stock Checks**: Deleting books is blocked if copies are currently issued to students. Adjusting total copies is safeguarded against active loans.

### 🎓 Student Features (Reader)
* **Search Catalog**: Search for titles, authors, or genres with real-time query matching.
* **Direct Issuing**: Check out available books (limited to 1 active loan per title to prevent hoarding).
* **Return System**: Return checked-out books from the student dashboard, automatically updating inventory.

---

## Tech Stack

* **Frontend**: React.js (Vite compiler), Vanilla CSS, Lucide React Icons.
* **Backend**: Spring Boot 3.3.4, Java 21/24, Spring Data JPA.
* **Database**: MySQL/MariaDB (configured for XAMPP's default setup).

---

## Directory Structure

```text
library-management-system/
├── backend/                  # Spring Boot Maven Project
│   ├── src/main/java/        # Java source code
│   └── src/main/resources/   # Config properties (db URL, credentials)
│   └── pom.xml               # Maven configuration
├── frontend/                 # Vite React Project
│   ├── src/context/          # Auth Context & API callers
│   ├── src/pages/            # Dashboard views (Auth, Admin, Student)
│   ├── src/index.css         # UI design stylesheet
│   └── package.json          # Node dependencies
└── README.md                 # Project Documentation
```

---

## Getting Started

### 1. Database Setup (using XAMPP)
1. Start the **MySQL** module inside your XAMPP Control Panel.
2. Open a database administration tool (like phpMyAdmin or a terminal client) and create a database named `library_db`:
   ```sql
   CREATE DATABASE library_db;
   ```
3. The Spring Boot backend is configured to connect to `localhost:3306` with user `root` and an empty password by default. If your credentials differ, update them in:
   [backend/src/main/resources/application.properties](file:///C:/LB/backend/src/main/resources/application.properties).

### 2. Running the Backend (Spring Boot)
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Compile and run the server using Maven:
   ```bash
   mvn spring-boot:run
   ```
3. The REST API will be running on `http://localhost:8080/`. JPA will automatically generate the required database tables.

### 3. Running the Frontend (React)
1. Open another terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173/`.

---

## Testing Guide

### Admin Flow
1. Register a new user with the selector set to **Administrator**.
2. Add a couple of books with different genres and quantity totals.
3. Observe the catalog counts update.

### Student Flow
1. Open a new window/logout and register a new user with the selector set to **Student**.
2. Browse the books or search by keyword (e.g. typing a genre).
3. Click **Issue Book** on a title. The quantity badge decrements immediately.
4. Navigate to **My Borrowed Books** to see your loan.
5. Click **Return** to checkout the book back in.


