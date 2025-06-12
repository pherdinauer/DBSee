-- DBSee Demo Database Schema
-- Sample data for testing the database explorer

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Products table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert sample data
INSERT INTO users (username, email, first_name, last_name) VALUES 
('admin', 'admin@example.com', 'Admin', 'User'),
('john_doe', 'john@example.com', 'John', 'Doe'),
('jane_smith', 'jane@example.com', 'Jane', 'Smith');

INSERT INTO products (name, price, description, category, stock_quantity) VALUES 
('Laptop', 999.99, 'High-performance laptop', 'Electronics', 10),
('Mouse', 29.99, 'Wireless mouse', 'Electronics', 50),
('Book', 19.99, 'Programming book', 'Books', 25);

INSERT INTO orders (user_id, total_amount, status) VALUES 
(2, 999.99, 'completed'),
(3, 49.98, 'pending'),
(2, 19.99, 'completed'); 