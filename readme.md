# Spotify Çalma Listesi Oluşturucu 🎶

Bu proje, kullanıcıların Spotify hesapları ile giriş yaparak belirli bir şarkıya benzer şarkılardan çalma listesi oluşturmasını sağlar. Ayrıca, çalma listesine rastgele bir arka plan rengine sahip kapak resmi de ekler.

## Özellikler

- **Spotify ile Giriş**: Kullanıcılar, Spotify hesaplarıyla giriş yapabilir.
- **Benzer Şarkılardan Çalma Listesi**: Seçilen bir şarkıya benzer şarkılardan otomatik çalma listesi oluşturulur.
- **Otomatik Kapak Resmi**: Çalma listesi için arka plan rengi rastgele olan bir kapak resmi oluşturulur.
- **Kullanıcı Bilgisi Gösterimi**: Giriş yaptıktan sonra kullanıcının adı ve profil resmi gösterilir.

## Kurulum

1. **Projeyi Klonlayın**:

    ```bash
    git clone https://github.com/kullanici_adiniz/spotify-playlist-generator.git
    cd spotify-playlist-generator
    ```

2. **Gerekli Bağımlılıkları Yükleyin**:

    ```bash
    npm install
    ```

3. **.env Dosyasını Oluşturun**:

    `.env` dosyasına Spotify API bilgilerinizi ekleyin:

    ```plaintext
    SPOTIFY_CLIENT_ID=spotify_client_id
    SPOTIFY_CLIENT_SECRET=spotify_client_secret
    SPOTIFY_REDIRECT_URI=http://localhost:5000/api/spotify/callback
    ```

4. **Sunucuyu Başlatın**:

    ```bash
    npm start
    ```

## Kullanım

1. **Spotify ile Giriş Yapın**.
2. **Şarkı Arayın ve Seçin**.
3. **Otomatik Çalma Listesi Oluşturun**.

## Lisans

Bu proje MIT Lisansı ile lisanslanmıştır.
