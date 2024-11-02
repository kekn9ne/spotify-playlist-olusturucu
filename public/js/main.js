let currentOffset = 0;
var track

document.getElementById('login-btn').addEventListener('click', () => {
  window.location.href = '/api/spotify/login';
});

document.getElementById('search-btn').addEventListener('click', async () => {
    const query = document.getElementById('search-input').value.trim();
    
    if (!query) {
      alert("Lütfen bir şarkı adı girin.");
      return;
    }
  
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Arama sonuçları alınamadı. Lütfen tekrar deneyin.");
      }
  
      const searchResults = await response.json();
      const searchResultsElement = document.getElementById('search-results');
      searchResultsElement.innerHTML = '';
  
      searchResults.forEach(track => {
        const listItem = document.createElement('li');
        
        // Albüm kapağını ekleyin
        const albumCover = document.createElement('img');
        albumCover.src = track.album.images[0].url; // Albüm kapağı URL'si
        albumCover.alt = `${track.name} albüm kapağı`;
        albumCover.classList.add('album-cover');
  
        const trackInfo = document.createElement('span');
        trackInfo.textContent = `${track.name} - ${track.artists.map(artist => artist.name).join(', ')}`;
        
        listItem.appendChild(albumCover); // Albüm kapağını ekle
        listItem.appendChild(trackInfo); // Şarkı ismi ve sanatçıyı ekle
  
        // Şarkıya tıklanınca önerileri getir
        listItem.addEventListener('click', () => fetchRecommendations(track.id, track.name));
        searchResultsElement.appendChild(listItem);
      });
    } catch (error) {
      alert(error.message);
      console.error('Error:', error);
    }
  });
  async function getUserInfo() {
    try {
      const response = await fetch('/api/spotify/get-user-info');
      if (!response.ok) throw new Error("Kullanıcı bilgileri alınamadı");
  
      const { display_name, profileImageUrl } = await response.json();
  
      // Kullanıcı bilgilerini göster ve giriş yap butonunu gizle
      document.getElementById('login-btn').style.display = 'none';
      const userInfoContainer = document.getElementById('user-info');
      userInfoContainer.innerHTML = `
        <div class="user-profile">
          ${profileImageUrl ? `<img src="${profileImageUrl}" alt="${display_name}" class="profile-pic"/>` : ''}
          <span class="user-name">${display_name}</span>
        </div>
      `;
    } catch (error) {
      console.error("Error:", error);
    }
  }
  
  async function fetchRecommendations(seedTrack, seedTrackName) {
    const songCount = parseInt(document.getElementById('song-count').value, 10) || 10;
  
    try {
      const response = await fetch(`/api/spotify/recommendations?seed_track=${seedTrack}&limit=${songCount}`);
      if (!response.ok) {
        throw new Error("Öneri listesi alınamadı. Lütfen tekrar deneyin.");
      }
  
      const data = await response.json();
      const playlistElement = document.getElementById('playlist');
      playlistElement.innerHTML = '';
  
      data.forEach(track => {
        const listItem = document.createElement('li');
        
        // Albüm kapağını ekleyin
        const albumCover = document.createElement('img');
        albumCover.src = track.album.images[0].url;
        albumCover.alt = `${track.name} albüm kapağı`;
        albumCover.classList.add('album-cover');
  
        const trackInfo = document.createElement('span');
        trackInfo.textContent = `${track.name} - ${track.artists.map(artist => artist.name).join(', ')}`;
        
        listItem.appendChild(albumCover);
        listItem.appendChild(trackInfo);
  
        listItem.addEventListener('click', () => playTrack(track.uri));
        
        playlistElement.appendChild(listItem);
      });
  
      // `create-playlist-btn` butonuna tıklandığında `seedTrackName` parametresi de gönderilecek
      document.getElementById('create-playlist-btn').onclick = () => createPlaylist(data, seedTrackName);
    } catch (error) {
      alert(error.message);
      console.error('Error:', error);
    }
  }
    
  // Şarkıyı aktif Spotify cihazında çalmak için API çağrısı
  async function playTrack(trackUri) {
    try {
      const response = await fetch('/api/spotify/play', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trackUri })
      });
  
      if (!response.ok) {
        throw new Error("Şarkı çalınamadı. Lütfen Spotify uygulamanızın açık olduğundan emin olun.");
      }
    } catch (error) {
      alert(error.message);
      console.error('Error:', error);
    }
  }
  
  async function createPlaylist(tracks, seedTrackName) {
    // Çalma listesi ismi ve açıklaması otomatik olarak ayarlanacak
    const playlistName = `Şu Şarkıya Benzer: ${seedTrackName}`;
    const playlistDescription = "Otomatik playlist oluşturucu ile oluşturuldu.";
  
    // Önerilen şarkıların URI'lerini alın
    const trackUris = tracks.map(track => track.uri);
  
    try {
      const response = await fetch('/api/spotify/create-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ playlistName, playlistDescription, trackUris })
      });
  
      if (!response.ok) {
        throw new Error("Çalma listesi oluşturulamadı. Lütfen tekrar deneyin.");
      }
  
      alert('Çalma listesi başarıyla oluşturuldu!');
    } catch (error) {
      alert(error.message);
      console.error('Error:', error);
    }
  }
  // Sayfa yüklendiğinde kullanıcı giriş yapmışsa bilgilerini göster
window.onload = () => {
  getUserInfo();
};