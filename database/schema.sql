CREATE TABLE allowed_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL
);

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  type TEXT CHECK (type IN ('MCQ','THEORY')),
  question TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT
);

CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  email TEXT,
  question_id INT,
  answer TEXT
);
