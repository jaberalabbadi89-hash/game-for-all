const { query } = require('./config/db');

async function setupDatabase() {
  console.log('🚀 جاري الاتصال بقاعدة بيانات Aiven وإنشاء الجداول...');

  try {
    // 1. جدول المستخدمين (Users)
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ تم إنشاء جدول المستخدمين (users)');

    // 2. جدول الألعاب (Games)
    await query(`
      CREATE TABLE IF NOT EXISTS games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        platform VARCHAR(100),
        genre VARCHAR(100),
        state VARCHAR(50),
        image LONGTEXT,
        description TEXT,
        owner_id INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ تم إنشاء جدول الألعاب (games)');

    // 3. جدول المفضلات (Favorites)
    await query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        game_id INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        UNIQUE KEY unique_favorite (user_id, game_id)
      )
    `);
    console.log('✅ تم إنشاء جدول المفضلات (favorites)');

    // 4. جدول التبادلات (Trades)
    await query(`
      CREATE TABLE IF NOT EXISTS trades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        offeredGameId INT NOT NULL,
        requestedGameId INT NOT NULL,
        message TEXT,
        status ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
        requester_id INT NOT NULL,
        owner_id INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (offeredGameId) REFERENCES games(id) ON DELETE CASCADE,
        FOREIGN KEY (requestedGameId) REFERENCES games(id) ON DELETE CASCADE,
        FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ تم إنشاء جدول التبادلات (trades)');

    // 5. جدول الرسائل (Messages)
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        senderId INT NOT NULL,
        receiverId INT NOT NULL,
        messageText TEXT NOT NULL,
        sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ تم إنشاء جدول الرسائل (messages)');

    // 6. جدول التقييمات (Ratings)
    await query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        voterId INT NOT NULL,
        reviewedId INT NOT NULL,
        stars INT NOT NULL,
        comment TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (voterId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewedId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ تم إنشاء جدول التقييمات (ratings)');

    console.log('🎉 مبروك! تم رفع وتجهيز جميع الجداول على Aiven بنجاح!');
    process.exit(0);
  } catch (error) {
    console.error('❌ حدث خطأ أثناء إنشاء الجداول:', error);
    process.exit(1);
  }
}

setupDatabase();