const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const pool = new Pool({
  user: 'titiwut',
  host: 'localhost',
  database: 'portfolio',
  password: '145455',
  port: 5432,
});


app.post('/projects', async (req, res) => {
  const { title, description, link } = req.body;
  const query = 'INSERT INTO projects(title, description, link) VALUES($1, $2, $3)';
  const values = [title, description, link];

  try {
    await pool.query(query, values);
    res.send('Project created successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating project');
  }
});


app.get('/projects', async (req, res) => {
  const query = 'SELECT * FROM projects';

  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching projects');
  }
});


app.put('/projects/:id', async (req, res) => {
  const { title, description, link } = req.body;
  const query = 'UPDATE projects SET title = $1, description = $2, link = $3 WHERE id = $4';
  const values = [title, description, link, req.params.id];

  try {
    await pool.query(query, values);
    res.send('Project updated successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating project');
  }
});


app.delete('/projects/:id', async (req, res) => {
  const query = 'DELETE FROM projects WHERE id = $1';
  const values = [req.params.id];

  try {
    await pool.query(query, values);
    res.send('Project deleted successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting project');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
