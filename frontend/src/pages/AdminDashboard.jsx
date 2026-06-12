import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { 
  BookOpen, Users, LogOut, Plus, Edit2, Trash2, ListChecks, 
  BookText, AlertCircle, CheckCircle, Package, FolderHeart, Info
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout, getAuthHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState('books'); // 'books' or 'issues'
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Form State for Add/Edit Book Modal
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    quantity: 1
  });

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setAlert(null);
    try {
      await Promise.all([fetchBooks(), fetchIssues()]);
    } catch (err) {
      triggerAlert('error', 'Failed to retrieve records from server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    const response = await fetch(`${API_BASE_URL}/books`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch books');
    }
    const data = await response.json();
    setBooks(data);
  };

  const fetchIssues = async () => {
    const response = await fetch(`${API_BASE_URL}/issues`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch issue logs');
    }
    const data = await response.json();
    setIssues(data);
  };

  const triggerAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  const handleOpenAddModal = () => {
    setEditingBook(null);
    setBookForm({
      title: '',
      author: '',
      isbn: '',
      genre: '',
      quantity: 1
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      genre: book.genre,
      quantity: book.quantity
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookForm(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value
    }));
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    setAlert(null);

    const { title, author, isbn, genre, quantity } = bookForm;
    if (!title.trim() || !author.trim() || !isbn.trim() || !genre.trim() || quantity < 0) {
      triggerAlert('error', 'Please fill in all fields with valid data.');
      return;
    }

    try {
      let response;
      if (editingBook) {
        // Edit Book
        response = await fetch(`${API_BASE_URL}/books/${editingBook.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(bookForm),
        });
      } else {
        // Add Book
        response = await fetch(`${API_BASE_URL}/books`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(bookForm),
        });
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Operation failed');
      }

      triggerAlert('success', editingBook ? 'Book details updated successfully!' : 'Book added to catalog!');
      setShowModal(false);
      fetchBooks();
    } catch (err) {
      triggerAlert('error', err.message);
    }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book from catalog?')) return;
    setAlert(null);

    try {
      const response = await fetch(`${API_BASE_URL}/books/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Deletion failed');
      }

      triggerAlert('success', 'Book deleted successfully!');
      fetchBooks();
      fetchIssues(); // Refresh issue logs in case checkouts were updated
    } catch (err) {
      triggerAlert('error', err.message);
    }
  };

  // Stat calculations
  const totalBooks = books.reduce((sum, b) => sum + b.quantity, 0);
  const activeIssues = issues.filter(i => i.status === 'ISSUED').length;
  const outOfStock = books.filter(b => b.availableQuantity === 0).length;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <BookOpen size={24} />
          <span>LMS Dashboard</span>
        </div>

        <nav className="sidebar-menu">
          <button 
            className={`menu-item ${activeTab === 'books' ? 'active' : ''}`}
            onClick={() => setActiveTab('books')}
          >
            <BookText size={18} />
            <span>Manage Catalog</span>
          </button>
          
          <button 
            className={`menu-item ${activeTab === 'issues' ? 'active' : ''}`}
            onClick={() => setActiveTab('issues')}
          >
            <ListChecks size={18} />
            <span>Issue Ledger</span>
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
            Role: <strong style={{ color: 'var(--brand-color)' }}>Librarian Admin</strong>
          </span>
        </header>

        <div className="content-body">
          <div className="page-header">
            <h1 className="page-title">
              {activeTab === 'books' ? 'Book Catalog Management' : 'Library Issued Books'}
            </h1>
            <p className="page-subtitle">
              {activeTab === 'books' ? 'Add, edit, inventory, or delete titles' : 'Monitor student checkouts and return status'}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="stats-row">
            <div className="stat-widget">
              <div className="stat-icon">
                <BookText size={20} />
              </div>
              <div>
                <p className="stat-label">Catalog Titles</p>
                <h3 className="stat-value">{books.length}</h3>
              </div>
            </div>
            
            <div className="stat-widget">
              <div className="stat-icon warning">
                <Users size={20} />
              </div>
              <div>
                <p className="stat-label">Active Loans</p>
                <h3 className="stat-value">{activeIssues}</h3>
              </div>
            </div>

            <div className="stat-widget">
              <div className="stat-icon success">
                <Package size={20} />
              </div>
              <div>
                <p className="stat-label">Out of Stock</p>
                <h3 className="stat-value">{outOfStock}</h3>
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
              <span>Fetching data from library database...</span>
            </div>
          ) : activeTab === 'books' ? (
            <>
              <div className="catalog-actions">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Active Book Directory</h3>
                <button className="btn btn-primary" onClick={handleOpenAddModal}>
                  <Plus size={18} />
                  <span>Add New Book</span>
                </button>
              </div>

              {books.length === 0 ? (
                <div className="card empty-state">
                  <BookText size={48} className="empty-state-icon" />
                  <h4>No books in library</h4>
                  <p>Click "Add New Book" above to populate the library catalog.</p>
                </div>
              ) : (
                <div className="table-container">
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Author</th>
                          <th>Genre</th>
                          <th>ISBN</th>
                          <th>Total Copies</th>
                          <th>Available Copies</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {books.map(book => (
                          <tr key={book.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{book.title}</td>
                            <td>{book.author}</td>
                            <td>
                              <span className="book-genre">{book.genre}</span>
                            </td>
                            <td style={{ fontFamily: 'monospace' }}>{book.isbn}</td>
                            <td>{book.quantity}</td>
                            <td>
                              <span className={`badge ${book.availableQuantity > 0 ? 'badge-success' : 'badge-danger'}`}>
                                {book.availableQuantity} available
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button 
                                  className="btn btn-secondary btn-icon"
                                  onClick={() => handleOpenEditModal(book)}
                                  title="Edit Book Details"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  className="btn btn-danger btn-icon"
                                  onClick={() => handleDeleteBook(book.id)}
                                  title="Delete Book"
                                >
                                  <Trash2 size={16} />
                                </button>
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
          ) : (
            <>
              <div className="catalog-actions">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Checkout Ledger</h3>
              </div>

              {issues.length === 0 ? (
                <div className="card empty-state">
                  <ListChecks size={48} className="empty-state-icon" />
                  <h4>No checkout logs found</h4>
                  <p>Transactions will appear here when students issue books.</p>
                </div>
              ) : (
                <div className="table-container">
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Book Title</th>
                          <th>Author</th>
                          <th>Student Name</th>
                          <th>Issue Date</th>
                          <th>Return Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {issues.map(issue => (
                          <tr key={issue.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{issue.book.title}</td>
                            <td>{issue.book.author}</td>
                            <td>{issue.user.name} ({issue.user.username})</td>
                            <td>{issue.issueDate}</td>
                            <td>{issue.returnDate || '—'}</td>
                            <td>
                              <span className={`badge ${issue.status === 'ISSUED' ? 'badge-warning' : 'badge-success'}`}>
                                {issue.status}
                              </span>
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

      {/* Book Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingBook ? 'Edit Book Information' : 'Add Book to Catalog'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveBook}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Book Title</label>
                  <input
                    type="text"
                    name="title"
                    className="form-input"
                    placeholder="e.g. Clean Code"
                    value={bookForm.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Author Name</label>
                  <input
                    type="text"
                    name="author"
                    className="form-input"
                    placeholder="e.g. Robert C. Martin"
                    value={bookForm.author}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">ISBN Code</label>
                    <input
                      type="text"
                      name="isbn"
                      className="form-input"
                      placeholder="978-0132350884"
                      value={bookForm.isbn}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Genre</label>
                    <input
                      type="text"
                      name="genre"
                      className="form-input"
                      placeholder="Programming"
                      value={bookForm.genre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Total Copies Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    className="form-input"
                    min="0"
                    placeholder="5"
                    value={bookForm.quantity}
                    onChange={handleInputChange}
                    required
                  />
                  {editingBook && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Info size={12} />
                      Currently issued: {editingBook.quantity - editingBook.availableQuantity} copies. Total copies cannot be less than this.
                    </p>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
