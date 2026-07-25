import sqlite3
import os
db_path = os.path.join('instance', 'splitstay.db')
conn = sqlite3.connect(db_path)
try:
    conn.execute("ALTER TABLE Users ADD COLUMN full_name VARCHAR(255) NOT NULL DEFAULT 'User';")
    conn.commit()
    print('Success')
except Exception as e:
    print('Error:', e)
conn.close()
