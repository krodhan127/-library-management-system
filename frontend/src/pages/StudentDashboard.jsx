import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { 
  BookOpen, LogOut, Search, BookMarked, History, BookText, 
  CheckCircle, AlertCircle, ShoppingCart, RefreshCw
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, logout, getAuthHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' or 'mybooks'
  const [books, setBooks] = useState([]);
  const [myIssues, setMyIssues] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (search = '') => {
    setLoading(true);
    setAlert(null);
    try {
      await Promise.all([fetchBooks(search), fetchMyIssues()]);
    } catch (err) {
      triggerAlert('error', 'Error loaded catalog: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async (search = '') => {
    const url = search.trim() 
      ? `${API_BASE_URL}/books?search=${encodeURIComponent(search.trim())}` 
      : `${API_BASE_URL}/books`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to load books');
    }
    const data = await response.json();
    setBooks(data);
  };

  const fetchMyIssues = async () => {
    const response = await fetch(`${API_BASE_URL}/issues/user/${user.id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to load borrowing history');
    }
    const data = await response.json();
    setMyIssues(data);
  };

  const triggerAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchData('');
  };

  const handleIssueBook = async (bookId) => {
    setAlert(null);
    try {
      const response = await fetch(`${API_BASE_URL}/issues/issue`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: user.id, bookId: bookId }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Checkout failed');
      }

      triggerAlert('success', 'Book issued successfully! Go to "My Checked Out Books" to view details.');
      fetchData(searchQuery); // Refresh book quantities & issues
    } catch (err) {
      triggerAlert('error', err.message);
    }
  };

  const handleReturnBook = async (issueId) => {
    setAlert(null);
    try {
      const response = await fetch(`${API_BASE_URL}/issues/return/${issueId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Return failed');
      }

      triggerAlert('success', 'Book returned successfully! Thank you.');
      fetchData(searchQuery); // Refresh book quantities & issues
    } catch (err) {
      triggerAlert('error', err.message);
    }
  };

  // Helper to check if student currently has a book active (not returned)
  const isBookCheckedOut = (bookId) => {
    return myIssues.some(issue => issue.book.id === bookId && issue.status === 'ISSUED');
  };

  // Stats calculation
  const activeBorrowedCount = myIssues.filter(issue => issue.status === 'ISSUED').length;
  const totalBorrowedCount = myIssues.length;
  const availableBooksCount = books.reduce((sum, b) => sum + b.availableQuantity, 0);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <BookOpen size={24} />
          <span>Student Portal</span>
        </div>

        <nav className="sidebar-menu">
          <button 
            className={`menu-item ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <Search size={18} />
            <span>Search Catalog</span>
          </button>
          
          <button 
            className={`menu-item ${activeTab === 'mybooks' ? 'active' : ''}`}
            onClick={() => setActiveTab('mybooks')}
          >
            <BookMarked size={18} />
            <span>My Borrowed Books</span>
          </button>
        </nav>

        <div className="sidebar-user">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button className="menu-item" onClick={logout} style={{ color: 'var(--error-color)' }}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-nav">
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Welcome, <strong style={{ color: 'var(--brand-color)' }}>{user.name}</strong> (Student)
          </span>
        </header>

        <div className="content-body">
          <div className="page-header">
            <h1 className="page-title">
              {activeTab === 'catalog' ? 'Browse Book Catalog' : 'My Checked Out Books'}
            </h1>
            <p className="page-subtitle">
              {activeTab === 'catalog' ? 'Search by title, author, or genre and borrow copies' : 'Return active checkouts and view your borrowing logs'}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="stats-row">
            <div className="stat-widget">
              <div className="stat-icon success">
                <BookText size={20} />
              </div>
              <div>
                <p className="stat-label">Available Library Copies</p>
                <h3 className="stat-value">{availableBooksCount}</h3>
              </div>
            </div>
            
            <div className="stat-widget">
              <div className="stat-icon warning">
                <ShoppingCart size={20} />
              </div>
              <div>
                <p className="stat-label">Current Borrowed</p>
                <h3 className="stat-value">{activeBorrowedCount}</h3>
              </div>
            </div>

            <div className="stat-widget">
              <div className="stat-icon">
                <History size={20} />
              </div>
              <div>
                <p className="stat-label font-sans">Total Borrow History</p>
                <h3 className="stat-value">{totalBorrowedCount}</h3>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {alert && (
            <div className={`alert alert-${alert.type}`}>
              {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span>{alert.text}</span>
            </div>
          )}

          {/* Tab Contents */}
          {loading ? (
            <div className="loader-container">
              <div className="spinner"></div>
              <span>Updating library directory...</span>
            </div>
          ) : activeTab === 'catalog' ? (
            <>
              {/* Search Bar Action */}
              <form onSubmit={handleSearchSubmit} className="catalog-actions" style={{ justifyContent: 'flex-start' }}>
                <div className="search-bar">
                  <Search size={18} />
                  <input 
                    type="text" 
                    placeholder="Search title, author, or genre..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary">Search</button>
                {searchQuery && (
                  <button type="button" className="btn btn-secondary" onClick={handleClearSearch}>Clear</button>
                )}
              </form>

              {books.length === 0 ? (
                <div className="card empty-state">
                  <BookText size={48} className="empty-state-icon" />
                  <h4>No books match your search</h4>
                  <p>Try searching for a different keyword or view the full catalog.</p>
                </div>
              ) : (
                <div className="dashboard-grid">
                  {books.map(book => {
                    const isIssued = isBookCheckedOut(book.id);
                    const isOutOfStock = book.availableQuantity <= 0;

                    return (
                      <div className="card card-hover" key={book.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span className="book-genre">{book.genre}</span>
                          <span className={`badge ${isOutOfStock ? 'badge-danger' : 'badge-success'}`}>
                            {isOutOfStock ? 'Out of stock' : `${book.availableQuantity} available`}
                          </span>
                        </div>
                        
                        <h3 className="book-title" style={{ marginTop: '1rem' }}>{book.title}</h3>
                        <p className="book-meta">by {book.author}</p>
                        <p className="book-meta" style={{ fontFamily: 'monospace', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                          ISBN: {book.isbn}
                        </p>
                        
                        <div className="book-card-actions" style={{ marginTop: '1.5rem' }}>
                          {isIssued ? (
                            <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                              Already Borrowed
                            </button>
                          ) : (
                            <button 
                              className="btn btn-primary" 
                              style={{ width: '100%' }}
                              onClick={() => handleIssueBook(book.id)}
                              disabled={isOutOfStock}
                            >
                              Issue Book
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="catalog-actions">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Checkout History</h3>
              </div>

              {myIssues.length === 0 ? (
                <div className="card empty-state">
                  <ShoppingCart size={48} className="empty-state-icon" />
                  <h4>No books borrowed yet</h4>
                  <p>Switch to "Search Catalog" to find and borrow books.</p>
                </div>
              ) : (
                <div className="table-container">
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Book Title</th>
                          <th>Author</th>
                          <th>Genre</th>
                          <th>Issue Date</th>
                          <th>Return Date</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myIssues.map(issue => (
                          <tr key={issue.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{issue.book.title}</td>
                            <td>{issue.book.author}</td>
                            <td>
                              <span className="book-genre">{issue.book.genre}</span>
                            </td>
                            <td>{issue.issueDate}</td>
                            <td>{issue.returnDate || '—'}</td>
                            <td>
                              <span className={`badge ${issue.status === 'ISSUED' ? 'badge-warning' : 'badge-success'}`}>
                                {issue.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                {issue.status === 'ISSUED' ? (
                                  <button 
                                    className="btn btn-success" 
                                    style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                                    onClick={() => handleReturnBook(issue.id)}
                                  >
                                    <RefreshCw size={14} style={{ marginRight: '0.25rem' }} />
                                    Return
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Returned</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
