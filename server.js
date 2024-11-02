const express = require('express');
const cookieParser = require('cookie-parser');
const spotifyRoutes = require('./routes/spotifyRoutes');

const app = express();
app.use(express.static('public'));
app.use(cookieParser());
app.use(express.json());

// Spotify rotalarını kullan
app.use('/api/spotify', spotifyRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
