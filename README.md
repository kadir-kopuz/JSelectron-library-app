# 📚 Kütüphane Yönetim Sistemi (VTYS Final Projesi)

Bu proje, **Veri Tabanı Yönetim Sistemleri (VTYS)** dersi kapsamında geliştirilmiş; üye, kitap, ödünç alma ve ceza süreçlerini uçtan uca yöneten **Electron.js** tabanlı bir masaüstü uygulamasıdır. Projenin temel amacı, karmaşık iş mantığını veritabanı düzeyinde **Trigger** (Tetikleyici) ve **Stored Procedure** (Saklı Yordam) yapıları ile yöneterek veri tutarlılığını sağlamaktır.

---

## 💻 Sistem Gereksinimleri

Uygulamayı yerel ortamınızda çalıştırmak için aşağıdaki araçların kurulu olması gerekmektedir:

* **Node.js :** Uygulama çalışma ortamı ve bağımlılıkların yönetimi için.
* **MySQL:** Verilerin saklanması ve SQL nesnelerinin çalışması için.
* **XAMPP:** MySQL sunucusunu ve phpMyAdmin panelini yönetmek için önerilir.
* **Git:** Proje dosyalarını klonlamak için.

---

## ⚙️ Veritabanı Kurulumu ve Bağlantı Ayarları

Uygulamanın çalışması için veritabanı kurulumu **zorunludur**. Aşağıdaki adımları takip edin:

### 1. projeyi klonla
```bash
git clone https://github.com/kadir-kopuz/JSelectron-library-app.git
```

### 2. Veritabanını İçe Aktarma(2 yöntem)
**1.yöntem**
`database/database-import.sql` dosyasını phpMyAdmin veya tercih ettiğiniz bir SQL istemcisi üzerinden içeri aktarın. Bu işlemi yaparken Diğer seçenekler kısmında
dış anahtar denetlemelerini etkinleştir kısmındaki işaretlemeyi kaldırın. Bu işlem `kutuphanedb`veritabanını ve tüm tabloları otomatik olarak oluşturacaktır.

**2.yöntem**
`database/sqlkodlari.sql` dosyasındaki tüm kodları kopyalayıp kutuphanedb diye bir database oluşturduktan sonra SQL sekmesinden bu kodları veritabanına ekleyin

### 2. Bağlantı Yapılandırması
`db.js` dosyasını açarak MySQL kullanıcı adınızı ve şifrenizi sunucunuza göre düzenleyin:

```javascript
// db.js dosyasındaki ilgili alan
const connection = mysql.createPool({
  host: "localhost",
  user: "root",       // MySQL kullanıcı adınız
  password: "",       // MySQL şifreniz (varsa)
  database: "kutuphanedb", // Oluşturduğunuz veritabanının adı
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```



### 3. Bağımlılıkları Yükleme
Terminali açıp proje klasöründe şu komutu çalıştırın:

```bash
npm install
```
### 4. Projeyi başlat
Terminale gelip
```bash
npm start
```
yaz.





