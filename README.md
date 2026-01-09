📚 Kütüphane Yönetim Sistemi (Electron.js & MySQL)
Bu proje, Veri Tabanı Yönetim Sistemleri (VTYS) dersi final ödevi kapsamında geliştirilmiş, Electron.js tabanlı bir masaüstü uygulamasıdır. Sistem; kütüphane süreçlerini (üye, kitap, ödünç, ceza) veritabanı düzeyinde tetikleyiciler (trigger) ve saklı yordamlar (procedure) kullanarak yönetmektedir.

🖥️ Bilgisayarda Olması Gerekenler (Gereksinimler)
Uygulamayı çalıştırmadan önce aşağıdaki araçların bilgisayarınızda yüklü olduğundan emin olun:

Node.js & npm: Bağımlılıkların yüklenmesi ve uygulamanın çalıştırılması için gereklidir (Önerilen: v14 veya üzeri).

MySQL: Verilerin saklanacağı aktif bir veritabanı sunucusu.

XAMPP: MySQL sunucusunu başlatmak ve veritabanını phpMyAdmin üzerinden yönetmek için önerilir.

Git: Projeyi GitHub üzerinden klonlamak için gereklidir.

Kod Editörü: Ayarları düzenlemek için VS Code veya benzeri bir editör.

⚙️ Veritabanı Bağlantı Ayarları
Uygulamanın veritabanına erişebilmesi için şu adımları takip edin:

Veritabanını İçe Aktarın: * database/database-import.sql dosyasını phpMyAdmin veya MySQL arayüzünüz üzerinden sunucuya aktarın.

Bu işlem kutuphanedb veritabanını, tüm tabloları, procedure'leri ve trigger'ları otomatik oluşturacaktır.

Bağlantı Bilgilerini Düzenleyin:

db.js dosyasını açın ve MySQL şifreniz varsa ilgili alana ekleyin:

JavaScript

const connection = mysql.createPool({
  host: "localhost",
  user: "root",       // MySQL kullanıcı adınız
  password: "",       // MySQL şifreniz (varsa buraya yazın)
  database: "kutuphanedb",
  // ... diğer ayarlar
});
🚀 Kurulum ve Çalıştırma
Proje dizininde bir terminal açarak aşağıdaki komutları sırasıyla çalıştırın:

Bağımlılıkları Yükleyin:

Bash

npm install
Not: Bu komut package.json içindeki electron ve mysql2 dahil tüm gerekli kütüphaneleri otomatik olarak yükler; paketleri ayrı ayrı kurmanıza gerek yoktur.

Uygulamayı Başlatın:

Bash

npm start
🛠️ Uygulama Özellikleri ve İstenirler
Uygulama, ödev kapsamında istenen tüm işlevleri yerine getirmektedir:

Giriş Sistemi: Admin ve Görevli rolleriyle giriş desteği.

Üye Yönetimi: Ekleme, güncelleme ve silme. (Borcu veya kitabı olan üye silinemez - Trigger Kontrolü).

Kitap Yönetimi: Stok takibi ve kategori filtreleme. (Ödünçteki kitap silinemez - Trigger Kontrolü).

Ödünç/İade: 15 günlük süre tanımlama ve 5 kitap sınırı kontrolü (Stored Procedure).

Ceza Sistemi: Gecikme durumunda günlük 5 TL ceza hesaplama (Stored Procedure).

Raporlar: Tarih bazlı işlemler ve en çok okunanlar analizi.

Dinamik Sorgu: SQL kriterlerine göre arama ve sonuçları PDF olarak dışa aktarma.
