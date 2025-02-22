CREATE TABLE double_edged_answers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    double_edged_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (double_edged_id) REFERENCES double_edgeds(id)
);

CREATE INDEX idx_double_edged_answers_user ON double_edged_answers(user_id);
CREATE INDEX idx_double_edged_answers_double_edged ON double_edged_answers(double_edged_id);