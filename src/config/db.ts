import mysql from 'mysql2/promise'; // Use promise-based mysql2 package

// Create a connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sample-project',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Function to test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to the MySQL database');
        connection.release(); // Release the connection back to the pool
    } catch (err) {
        console.error('Error connecting to the database:', err);
    }
};

// Test the connection when the module is imported
testConnection();

export default pool;
