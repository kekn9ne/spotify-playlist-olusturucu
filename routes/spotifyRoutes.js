const express = require('express');
const axios = require('axios');
const { clientId, clientSecret, redirectUri } = require('../config/spotifyConfig');
const router = express.Router();
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
async function generatePlaylistImage(seedTrackName) {
  const width = 600;
  const height = 600;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  // Rastgele bir arka plan rengi seçin
  const backgroundColor = getRandomColor();
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, width, height);

  // Yazı rengini arka plan rengine göre ayarlayın
  const textColor = getContrastingTextColor(backgroundColor);
  context.fillStyle = textColor;
  context.font = 'bold 30px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  const titleText = seedTrackName;
  const maxTitleWidth = width - 40;

  if (context.measureText(titleText).width > maxTitleWidth) {
    const words = titleText.split(' ');
    let line = '';
    let y = height / 2 - 20;

    for (const word of words) {
      const testLine = line + word + ' ';
      if (context.measureText(testLine).width > maxTitleWidth) {
        context.fillText(line, width / 2, y);
        line = word + ' ';
        y += 35;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, width / 2, y);
  } else {
    context.fillText(titleText, width / 2, height / 2);
  }

  // Logo yükle ve sağ alt köşeye ekle
  const logoPath = path.join(__dirname, '../public/images/logo.png');
  const logo = await loadImage(logoPath);
  const logoSize = 80;
  context.drawImage(logo, width - logoSize - 20, height - logoSize - 20, logoSize, logoSize);

  // Resmi JPEG olarak Base64 dizesine dönüştür
  const base64Image = canvas.toDataURL('image/jpeg', 0.9).replace(/^data:image\/jpeg;base64,/, '');
  return base64Image;
}

// Rastgele renk üretme fonksiyonu
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// YIQ algoritmasını kullanarak kontrastlı yazı rengi belirleme fonksiyonu
function getContrastingTextColor(hexColor) {
  const rgb = hexToRgb(hexColor);
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#FFFFFF';
}

// Hex renk kodunu RGB formatına dönüştürme fonksiyonu
function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}


// Spotify yetkilendirme
router.get('/login', (req, res) => {
  const scope = 'user-read-private user-read-email playlist-modify-private user-modify-playback-state ugc-image-upload playlist-modify-public';
  res.redirect(`https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}`);
});

router.post('/create-playlist', async (req, res) => {
  const { playlistName, playlistDescription, trackUris } = req.body; // Playlist ismi ve açıklaması
  const authToken = req.cookies.spotifyAuthToken;

  try {
    // 1. Adım: Kullanıcı profilini alın (Spotify ID'sini öğrenmek için)
    const userProfileResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const userId = userProfileResponse.data.id;

    // 2. Adım: Yeni bir çalma listesi oluşturun
    const createPlaylistResponse = await axios.post(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        name: playlistName,
        description: playlistDescription,
        public: false
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    const playlistId = createPlaylistResponse.data.id;

    // 3. Adım: Çalma listesine şarkı ekleyin
    await axios.post(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      { uris: trackUris },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    // Playlist resmi oluştur ve yükle
    const base64Image = await generatePlaylistImage(playlistName);
    
    await axios.put(
      `https://api.spotify.com/v1/playlists/${playlistId}/images`,
      base64Image, // Base64'ü Buffer'a çevirin
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'image/jpeg'
        }
      }
    );


    res.status(201).send('Playlist created successfully with image');
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to create playlist');
  }
});


router.put('/play', async (req, res) => {
  const { trackUri } = req.body; // Çalmak istediğimiz şarkının URI'si
  const authToken = req.cookies.spotifyAuthToken;

  if (!trackUri) {
    return res.status(400).send('Track URI eksik');
  }

  const playOptions = {
    url: 'https://api.spotify.com/v1/me/player/play',
    headers: { Authorization: `Bearer ${authToken}` },
    data: {
      uris: [trackUri] // Çalmak istediğimiz şarkıyı URI ile belirtiyoruz
    }
  };

  try {
    await axios.put(playOptions.url, playOptions.data, { headers: playOptions.headers });
    res.status(204).send(); // Başarılı durumda boş yanıt döndür
  } catch (error) {
    console.error('Error starting playback:', error.response ? error.response.data : error.message);
    res.status(500).send('Failed to start playback');
  }
});

// OAuth callback
router.get('/callback', async (req, res) => {
  const code = req.query.code || null;

  const formData = new URLSearchParams();
  formData.append('code', code);
  formData.append('redirect_uri', redirectUri);
  formData.append('grant_type', 'authorization_code');

  const authOptions = {
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    data: formData,
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  try {
    const response = await axios(authOptions);
    res.cookie('spotifyAuthToken', response.data.access_token, { httpOnly: true });
    res.redirect('/');
  } catch (error) {
    console.error('Authentication failed:', error.response ? error.response.data : error.message);
    res.status(500).send('Authentication failed');
  }
});

// Spotify arama
router.get('/search', async (req, res) => {
  const query = req.query.q;
  const authToken = req.cookies.spotifyAuthToken;

  if (!query) {
    return res.status(400).send('Arama sorgusu eksik');
  }

  const searchOptions = {
    url: `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`,
    headers: { Authorization: `Bearer ${authToken}` },
  };

  try {
    const response = await axios.get(searchOptions.url, { headers: searchOptions.headers });
    res.json(response.data.tracks.items);
  } catch (error) {
    console.error('Error fetching search results:', error.response ? error.response.data : error.message);
    res.status(500).send('Failed to fetch search results');
  }
});

// Öneri listesi için çoklu istek
router.get('/recommendations', async (req, res) => {
  const seedTrack = req.query.seed_track;
  const songCount = parseInt(req.query.limit, 10) || 10;
  const authToken = req.cookies.spotifyAuthToken;

  if (!seedTrack) {
    return res.status(400).send('seed_track parametresi eksik');
  }

  try {
    let totalRecommendations = [];
    let offset = 0;

    // Toplam istek sayısını hesaplayarak çoklu istek yap
    while (totalRecommendations.length < songCount) {
      const remainingCount = songCount - totalRecommendations.length;
      const limit = Math.min(remainingCount, 10);

      const recommendationOptions = {
        url: `https://api.spotify.com/v1/recommendations?seed_tracks=${seedTrack}&limit=${limit}&offset=${offset}`,
        headers: { Authorization: `Bearer ${authToken}` },
      };

      const response = await axios.get(recommendationOptions.url, { headers: recommendationOptions.headers });
      totalRecommendations = totalRecommendations.concat(response.data.tracks);

      offset += limit;
    }

    res.json(totalRecommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error.response ? error.response.data : error.message);
    res.status(500).send('Failed to fetch recommendations');
  }
});
router.get('/get-user-info', async (req, res) => {
  const authToken = req.cookies.spotifyAuthToken;

  if (!authToken) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  try {
    // Spotify'dan kullanıcı bilgilerini alın
    const userProfileResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const { display_name, images } = userProfileResponse.data;
    const profileImageUrl = images.length > 0 ? images[0].url : null;

    res.json({ display_name, profileImageUrl });
  } catch (error) {
    console.error('Error fetching user info:', error.response ? error.response.data : error.message);
    res.status(500).send('Failed to fetch user info');
  }
});

module.exports = router;
