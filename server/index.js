const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const env3 = require('./config/env');
const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
app.use(cors({ origin: env3.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use('/api/auth', require('./routes/auth'));

app.get('/api/ping', (_req, res) => res.json({ ok: true }));

app.use(errorHandler);

connectDB().then(() => {
  app.listen(env3.PORT, () => console.log(`API on :${env3.PORT}`));
});
