CREATE DATABASE IF NOT EXISTS digital_museum;
USE digital_museum;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(80) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS museums (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS artifacts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  museum_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  image_url TEXT,
  description TEXT NOT NULL,
  historical_background TEXT NOT NULL,
  category VARCHAR(120) NOT NULL,
  tags VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_artifacts_museum FOREIGN KEY (museum_id) REFERENCES museums(id) ON DELETE CASCADE
);

ALTER TABLE museums
  MODIFY COLUMN image_url TEXT;

ALTER TABLE artifacts
  MODIFY COLUMN image_url TEXT;

CREATE TABLE IF NOT EXISTS comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  target_type ENUM('museum', 'artifact') NOT NULL,
  target_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  target_type ENUM('museum', 'artifact') NOT NULL,
  target_id INT NOT NULL,
  score TINYINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_ratings_score CHECK (score BETWEEN 1 AND 5),
  CONSTRAINT fk_ratings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_target (user_id, target_type, target_id)
);

INSERT INTO museums (name, location, description, image_url)
VALUES
  ('Metropolitan Museum of Art', 'New York, USA', 'One of the world''s largest and finest art museums.', 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7'),
  ('Louvre Museum', 'Paris, France', 'Home to iconic works including the Mona Lisa and Venus de Milo.', 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a');

INSERT INTO artifacts (museum_id, name, image_url, description, historical_background, category, tags)
VALUES
  (1, 'Egyptian Sarcophagus', 'https://images.unsplash.com/photo-1524492449090-c8f9a5d6f5f4', 'Wooden painted coffin from ancient Egypt.', 'Used for elite burials during the Late Period.', 'Ancient Egypt', 'egypt,burial,wood'),
  (2, 'Classical Marble Bust', 'https://images.unsplash.com/photo-1529429612779-c8e40ef2f36c', 'Marble bust depicting a Roman statesman.', 'Created during the imperial Roman era.', 'Classical Sculpture', 'rome,marble,bust');
