require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const bcrypt = require('bcrypt');

// Connect to PostgreSQL using environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Health check route
app.get('/', (req, res) => {
  res.send('🌙 SiameseDream API is running');
});

// Get all dream symbols
app.get('/symbols', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM symbols');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch symbols' });
  }
});

// POST /dreams - submit a new dream


// Also fix the regular /dreams GET endpoint to include sleep data:

app.get('/dreams', async (req, res) => {
  const user_id = req.query.user_id;

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id parameter' });
  }

  try {
    const result = await pool.query(
      `SELECT
        d.id,
        d.user_id,
        d.summary AS title,
        d.content,
        d.dream_date,
        d.is_lucid,
        d.mood_score,
        d.sleep_duration,
        d.sleep_quality,
        d.bedtime,
        d.sleep_disruptions,
        COALESCE(array_agg(s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS symbols
      FROM dreams d
      LEFT JOIN dream_symbols ds ON d.id = ds.dream_id
      LEFT JOIN symbols s ON ds.symbol_id = s.id
      WHERE d.user_id = $1
      GROUP BY d.id, d.user_id, d.summary, d.content, d.dream_date, d.is_lucid, d.mood_score, d.sleep_duration, d.sleep_quality, d.bedtime, d.sleep_disruptions
      ORDER BY d.dream_date DESC;`,
      [user_id]
    );

    console.log('Dreams query result:', result.rows); // Add this debug log
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dreams' });
  }
});


app.post('/dreams', async (req, res) => {
  console.log('=== DREAMS POST REQUEST RECEIVED ===');
  console.log('Full request body:', JSON.stringify(req.body, null, 2));
  
  const { user_id, content, summary, is_lucid, mood_score, dream_date,
        sleep_duration, sleep_quality, bedtime, sleep_disruptions, symbols } = req.body;
  
  console.log('Destructured symbols:', symbols);
  console.log('Symbols type:', typeof symbols);
  console.log('Symbols is array:', Array.isArray(symbols));
  
  try {
    // Insert dream first
    console.log('Inserting dream...');
    const dreamResult = await pool.query(
  `INSERT INTO dreams 
   (user_id, content, summary, is_lucid, mood_score, dream_date,
    sleep_duration, sleep_quality, bedtime, sleep_disruptions)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
   RETURNING id`,
  [user_id, content, summary, is_lucid || false, mood_score || null, dream_date,
   sleep_duration || null, sleep_quality || null, bedtime || null, sleep_disruptions || null]
);

    const dreamId = dreamResult.rows[0].id;
    console.log('Dream inserted with ID:', dreamId);

    // Handle symbols if provided
    if (Array.isArray(symbols) && symbols.length > 0) {
      console.log('Processing', symbols.length, 'symbols:', symbols);
      
      for (const symbolName of symbols) {
        console.log('Processing symbol:', symbolName);
        
        // First, try to find existing symbol
        let symbolResult = await pool.query(
          `SELECT id FROM symbols WHERE name = $1`,
          [symbolName]
        );

        let symbolId;
        if (symbolResult.rows.length === 0) {
          console.log('Symbol not found, creating new one...');
          const newSymbolResult = await pool.query(
            `INSERT INTO symbols (name) VALUES ($1) RETURNING id`,
            [symbolName]
          );
          symbolId = newSymbolResult.rows[0].id;
          console.log('Created new symbol with ID:', symbolId);
        } else {
          symbolId = symbolResult.rows[0].id;
          console.log('Found existing symbol with ID:', symbolId);
        }

        // Link dream to symbol
        console.log('Linking dream', dreamId, 'to symbol', symbolId);
        await pool.query(
          `INSERT INTO dream_symbols (dream_id, symbol_id) VALUES ($1, $2)`,
          [dreamId, symbolId]
        );
        console.log('Successfully linked!');
      }
    } else {
      console.log('No symbols to process. Symbols:', symbols);
    }

    console.log('Dream creation complete!');
    res.status(201).json({ message: "Dream and symbols saved", dreamId });
  } catch (err) {
    console.error('ERROR in dreams POST:', err);
    res.status(500).json({ error: 'Failed to submit dream: ' + err.message });
  }
});


// POST /login - verify user
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const userQuery = await pool.query(
      `SELECT * FROM users WHERE username = $1`,
      [username]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = userQuery.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Auth success — return basic user info for now
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// DELETE /dreams/:id - delete a specific dream
app.delete('/dreams/:id', async (req, res) => {
  const dreamId = req.params.id;
  const user_id = req.query.user_id; // Get user_id from query to ensure user owns this dream

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id parameter' });
  }

  try {
    // First check if the dream belongs to the user
    const dreamCheck = await pool.query(
      'SELECT user_id FROM dreams WHERE id = $1',
      [dreamId]
    );

    if (dreamCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Dream not found' });
    }

    if (dreamCheck.rows[0].user_id !== parseInt(user_id)) {
      return res.status(403).json({ error: 'Not authorized to delete this dream' });
    }

    // Delete from dream_symbols first (foreign key constraint)
    await pool.query('DELETE FROM dream_symbols WHERE dream_id = $1', [dreamId]);
    
    // Then delete the dream
    await pool.query('DELETE FROM dreams WHERE id = $1', [dreamId]);

    res.json({ message: 'Dream deleted successfully' });
  } catch (err) {
    console.error('Error deleting dream:', err);
    res.status(500).json({ error: 'Failed to delete dream' });
  }
});

// GET /feed - get public dreams for the feed
app.get('/feed', async (req, res) => {
  const { symbol, limit = 20, offset = 0 } = req.query;

  try {
    let query;
    let params;

    if (symbol) {
      // Filter by specific symbol
      query = `
  SELECT 
    d.id,
    d.user_id,
    d.summary AS title,
    d.content,
    d.dream_date,
    d.is_lucid,
    d.mood_score,
    d.sleep_duration,
    d.sleep_quality,
    d.bedtime,
    d.sleep_disruptions,
    u.username,
    COALESCE(array_agg(s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS symbols
  FROM dreams d
  JOIN users u ON d.user_id = u.id
  LEFT JOIN dream_symbols ds ON d.id = ds.dream_id
  LEFT JOIN symbols s ON ds.symbol_id = s.id
  WHERE d.id IN (
    SELECT DISTINCT d2.id 
    FROM dreams d2
    JOIN dream_symbols ds2 ON d2.id = ds2.dream_id
    JOIN symbols s2 ON ds2.symbol_id = s2.id
    WHERE s2.name = $1
  )
  GROUP BY d.id, d.user_id, d.summary, d.content, d.dream_date, d.is_lucid, d.mood_score, d.sleep_duration, d.sleep_quality, d.bedtime, d.sleep_disruptions, u.username
  ORDER BY d.dream_date DESC
  LIMIT $2 OFFSET $3
`;

      params = [symbol, limit, offset];
    } else {
      // Get all public dreams
      query = `
        SELECT 
  d.id,
  d.user_id,
  d.summary AS title,
  d.content,
  d.dream_date,
  d.is_lucid,
  d.mood_score,
  d.sleep_duration,
  d.sleep_quality,
  d.bedtime,
  d.sleep_disruptions,
  u.username,
  COALESCE(array_agg(s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS symbols
        FROM dreams d
        JOIN users u ON d.user_id = u.id
        LEFT JOIN dream_symbols ds ON d.id = ds.dream_id
        LEFT JOIN symbols s ON ds.symbol_id = s.id
        GROUP BY d.id, d.user_id, d.summary, d.content, d.dream_date, u.username
        ORDER BY d.dream_date DESC
        LIMIT $1 OFFSET $2`;
      params = [limit, offset];
    }

    const result = await pool.query(query, params);
    console.log('Feed query result:', result.rows); // Add this to debug
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching feed:', err);
    res.status(500).json({ error: 'Failed to fetch dream feed' });
  }
});

// GET /symbols/popular - get most used symbols
app.get('/symbols/popular', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.name, COUNT(ds.dream_id) as dream_count
      FROM symbols s
      JOIN dream_symbols ds ON s.id = ds.symbol_id
      GROUP BY s.id, s.name
      ORDER BY dream_count DESC
      LIMIT 20
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching popular symbols:', err);
    res.status(500).json({ error: 'Failed to fetch popular symbols' });
  }
});

// GET /users/:id/profile - get user profile with dream statistics
app.get('/users/:id/profile', async (req, res) => {
  const userId = req.params.id;
  
  try {
    // Get basic user info (removed created_at since it doesn't exist)
    const userResult = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get dream statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_dreams,
        COUNT(*) FILTER (WHERE is_lucid = true) as lucid_dreams,
        AVG(mood_score) as avg_mood,
        MIN(dream_date) as first_dream_date,
        MAX(dream_date) as last_dream_date
      FROM dreams 
      WHERE user_id = $1
    `, [userId]);

    // Get most common symbols
    const symbolsResult = await pool.query(`
      SELECT s.name, COUNT(*) as frequency
      FROM dreams d
      JOIN dream_symbols ds ON d.id = ds.dream_id
      JOIN symbols s ON ds.symbol_id = s.id
      WHERE d.user_id = $1
      GROUP BY s.name
      ORDER BY frequency DESC
      LIMIT 10
    `, [userId]);

    // Get dream frequency by month (last 12 months)
    const frequencyResult = await pool.query(`
      SELECT 
        DATE_TRUNC('month', dream_date) as month,
        COUNT(*) as dream_count
      FROM dreams
      WHERE user_id = $1 
        AND dream_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', dream_date)
      ORDER BY month
    `, [userId]);

    // Get recent dreams
    const recentDreamsResult = await pool.query(`
      SELECT 
        d.id,
        d.summary as title,
        d.content,
        d.dream_date,
        d.is_lucid,
        COALESCE(array_agg(s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS symbols
      FROM dreams d
      LEFT JOIN dream_symbols ds ON d.id = ds.dream_id
      LEFT JOIN symbols s ON ds.symbol_id = s.id
      WHERE d.user_id = $1
      GROUP BY d.id, d.summary, d.content, d.dream_date, d.is_lucid
      ORDER BY d.dream_date DESC
      LIMIT 5
    `, [userId]);

    res.json({
      user,
      statistics: statsResult.rows[0],
      topSymbols: symbolsResult.rows,
      dreamFrequency: frequencyResult.rows,
      recentDreams: recentDreamsResult.rows
    });

  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// GET /users/:id/symbol-timeline - get user's symbol usage over time
app.get('/users/:id/symbol-timeline', async (req, res) => {
  const userId = req.params.id;
  
  try {
    const result = await pool.query(`
      SELECT 
        s.name as symbol,
        DATE_TRUNC('month', d.dream_date) as month,
        COUNT(*) as usage_count
      FROM dreams d
      JOIN dream_symbols ds ON d.id = ds.dream_id
      JOIN symbols s ON ds.symbol_id = s.id
      WHERE d.user_id = $1
        AND d.dream_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY s.name, DATE_TRUNC('month', d.dream_date)
      ORDER BY month, usage_count DESC
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching symbol timeline:', err);
    res.status(500).json({ error: 'Failed to fetch symbol timeline' });
  }
});

// Add this new endpoint to your backend (index.js)

// Replace the /dreams/search endpoint in your backend (index.js) with this fixed version:

// Replace your /dreams/search endpoint with this safer version that handles missing columns

// COMPLETELY REPLACE your entire /dreams/search endpoint with this:

app.get('/dreams/search', async (req, res) => {
  const {
    user_id,
    query,
    symbols,
    date_from,
    date_to,
    is_lucid,
    mood_min,
    mood_max,
    limit: limitRaw = "50",
    offset: offsetRaw = "0"
  } = req.query;

  console.log('=== DREAMS SEARCH REQUEST ===');
  console.log('Request params:', req.query);

  // Validate required
  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id parameter' });
  }

  // Parse limit/offset as integers
  const limit = parseInt(limitRaw, 10);
  const offset = parseInt(offsetRaw, 10);

  if (isNaN(limit) || isNaN(offset)) {
    return res.status(400).json({ error: "Invalid pagination parameters" });
  }

  try {
    let whereConditions = ['d.user_id = $1'];
    let params = [user_id];
    let paramCount = 1;

    // Add filters
    if (query && query.trim()) {
      paramCount++;
      whereConditions.push(`(d.content ILIKE $${paramCount} OR d.summary ILIKE $${paramCount})`);
      params.push(`%${query.trim()}%`);
    }

    if (symbols) {
      const symbolList = Array.isArray(symbols) ? symbols : [symbols];
      paramCount++;
      whereConditions.push(`d.id IN (
        SELECT DISTINCT ds.dream_id 
        FROM dream_symbols ds 
        JOIN symbols s ON ds.symbol_id = s.id 
        WHERE s.name = ANY($${paramCount})
      )`);
      params.push(symbolList);
    }

    if (date_from) {
      paramCount++;
      whereConditions.push(`d.dream_date >= $${paramCount}`);
      params.push(date_from);
    }

    if (date_to) {
      paramCount++;
      whereConditions.push(`d.dream_date <= $${paramCount}`);
      params.push(date_to);
    }

    if (is_lucid !== undefined) {
      paramCount++;
      whereConditions.push(`d.is_lucid = $${paramCount}`);
      params.push(is_lucid === 'true');
    }

    if (mood_min) {
      paramCount++;
      whereConditions.push(`d.mood_score >= $${paramCount}`);
      params.push(parseInt(mood_min, 10));
    }

    if (mood_max) {
      paramCount++;
      whereConditions.push(`d.mood_score <= $${paramCount}`);
      params.push(parseInt(mood_max, 10));
    }

    // Add LIMIT and OFFSET
    paramCount++;
    const limitParam = paramCount;
    params.push(limit);

    paramCount++;
    const offsetParam = paramCount;
    params.push(offset);

    // FIXED: Complete GROUP BY with ALL non-aggregate columns
    const searchQuery = `
      SELECT
        d.id,
        d.user_id,
        d.summary AS title,
        d.content,
        d.dream_date,
        d.is_lucid,
        d.mood_score,
        d.sleep_duration,
        d.sleep_quality,
        d.bedtime,
        d.sleep_disruptions,
        d.created_at,
        COALESCE(array_agg(s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS symbols
      FROM dreams d
      LEFT JOIN dream_symbols ds ON d.id = ds.dream_id
      LEFT JOIN symbols s ON ds.symbol_id = s.id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY d.id, d.user_id, d.summary, d.content, d.dream_date, d.is_lucid, d.mood_score, d.sleep_duration, d.sleep_quality, d.bedtime, d.sleep_disruptions, d.created_at
      ORDER BY d.dream_date DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    console.log('Search query:', searchQuery);
    console.log('Search params:', params);

    const result = await pool.query(searchQuery, params);
    console.log('Search result sample:', result.rows[0]); // This should show the sleep data

    // Get total count (omit LIMIT/OFFSET for count query)
    const countQuery = `
      SELECT COUNT(DISTINCT d.id) as total
      FROM dreams d
      LEFT JOIN dream_symbols ds ON d.id = ds.dream_id
      LEFT JOIN symbols s ON ds.symbol_id = s.id
      WHERE ${whereConditions.join(' AND ')}
    `;
    const countResult = await pool.query(countQuery, params.slice(0, -2));

    res.json({
      dreams: result.rows,
      total: parseInt(countResult.rows[0].total, 10),
      hasMore: offset + result.rows.length < parseInt(countResult.rows[0].total, 10)
    });

  } catch (err) {
    console.error('Error in /dreams/search:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ error: 'Failed to search dreams: ' + err.message });
  }
});

app.get('/dreams', async (req, res) => {
  const user_id = req.query.user_id;

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id parameter' });
  }

  try {
    const result = await pool.query(
      `SELECT
        d.id,
        d.user_id,
        d.summary AS title,
        d.content,
        d.dream_date,
        d.is_lucid,
        d.mood_score,
        d.sleep_duration,
        d.sleep_quality,
        d.bedtime,
        d.sleep_disruptions,
        d.created_at,
        COALESCE(array_agg(s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS symbols
      FROM dreams d
      LEFT JOIN dream_symbols ds ON d.id = ds.dream_id
      LEFT JOIN symbols s ON ds.symbol_id = s.id
      WHERE d.user_id = $1
      GROUP BY d.id, d.user_id, d.summary, d.content, d.dream_date, d.is_lucid, d.mood_score, d.sleep_duration, d.sleep_quality, d.bedtime, d.sleep_disruptions, d.created_at
      ORDER BY d.dream_date DESC;`,
      [user_id]
    );

    console.log('Dreams query result sample:', result.rows[0]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching dreams:', err);
    res.status(500).json({ error: 'Failed to fetch dreams: ' + err.message });
  }
});

app.get('/dreams/debug/:id', async (req, res) => {
  const dreamId = req.params.id;
  
  try {
    const result = await pool.query(
      'SELECT * FROM dreams WHERE id = $1',
      [dreamId]
    );
    
    console.log('Debug dream query result:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Debug query error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /register - create new user
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Username or email already taken" });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, password_hash]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
});


const PORT = process.env.PORT || 5051;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
