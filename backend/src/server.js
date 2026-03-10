import 'dotenv/config';                 // loads .env locally; no harm in Azure
import express from 'express';
import cors from 'cors';
import { Sequelize, DataTypes } from 'sequelize';

const app = express();
app.use(cors());                        // minimal; allows all origins

app.use(express.json());

// Prefer DATABASE_URL; fallback to discrete vars
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mysql',
  logging: false,
});

// Minimal inline model mapped to existing table/columns
const Employee = sequelize.define('employees', {
  employee_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  first_name:  { type: DataTypes.STRING(100), allowNull: false },
  last_name:   { type: DataTypes.STRING(100), allowNull: false },
  email:       { type: DataTypes.STRING(255), allowNull: false, unique: true },
  birthdate:   { type: DataTypes.DATEONLY, allowNull: true },
  salary:      { type: DataTypes.DECIMAL(12,2), allowNull: true }
}, { tableName: 'employees', timestamps: false, underscored: true });

// READ: list employees
app.get('/api/employees', async (_req, res) => {
  try {
    const rows = await Employee.findAll({ order: [['employee_id', 'ASC']] });
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch employees' }); }
});

// INSERT: add employee
app.post('/api/employees', async (req, res) => {
  try {
    const { first_name, last_name, email, birthdate, salary } = req.body;
    const row = await Employee.create({
      first_name,
      last_name,
      email,
      birthdate: birthdate || null,
      salary: salary === '' || salary === undefined ? null : Number(salary)
    });
    res.status(201).json(row);
  } catch (e) { res.status(500).json({ error: 'Failed to create employee' }); }
});

//update employee by id
app.put('/api/employees/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { first_name, last_name, email, birthdate, salary } = req.body;

    const row = await Employee.findByPk(id);
    if (!row) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await row.update({
      first_name,
      last_name,
      email,
      birthdate: birthdate || null,
      salary: salary === '' || salary === undefined ? null : Number(salary)
    });

    res.json(row);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// DELETE: remove employee by id
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const row = await Employee.findByPk(id);
    if (!row) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await row.destroy();

    res.json({ message: 'Employee deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

const port = process.env.PORT || 4000;
try {
  await sequelize.authenticate();
  app.listen(port, () => console.log(`API listening on :${port}`));
} catch (err) {
  console.error('DB connection failed', err);
  process.exit(1);
}
