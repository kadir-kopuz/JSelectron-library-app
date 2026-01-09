CREATE DATABASE kutuphanedb;


CREATE TABLE Kullanici (
    kullanici_id INTEGER AUTO_INCREMENT PRIMARY KEY,
    kullanici_adi VARCHAR(50) UNIQUE NOT NULL,
    sifre VARCHAR(255) NOT NULL,
    rol ENUM('Admin', 'Görevli') NOT NULL
);
	

CREATE TABLE Uye (
    uye_id INTEGER AUTO_INCREMENT PRIMARY KEY,
    ad VARCHAR(50) NOT NULL,
    soyad VARCHAR(50) NOT NULL,
    telefon VARCHAR(15) NOT NULL,
    e_posta VARCHAR(100) NOT NULL,
    toplam_borc DECIMAL(10,2) DEFAULT 0.00
    );


CREATE TABLE Kategori (
    kategori_id INTEGER AUTO_INCREMENT PRIMARY KEY,
    kategori_ad VARCHAR(100) NOT NULL
);


CREATE TABLE Kitap (
    kitap_id INTEGER AUTO_INCREMENT PRIMARY KEY,
    kitap_adi VARCHAR(100) NOT NULL,
    yazar VARCHAR(100) NOT NULL,
    kategori_id INTEGER,
    yayin_evi VARCHAR(100),
    basim_yili INTEGER,
    toplam_adet INTEGER NOT NULL DEFAULT 0,
    mevcut_adet INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (kategori_id) REFERENCES kategori(kategori_id)
);


CREATE TABLE Odunc (
    odunc_id INTEGER AUTO_INCREMENT PRIMARY KEY,
    uye_id INTEGER,
    kitap_id INTEGER,
    gorevli_id INTEGER,
    odunc_tarihi DATE DEFAULT CURRENT_DATE,
    son_teslim_tarihi DATE NOT NULL,
    teslim_tarihi DATE DEFAULT NULL,
    FOREIGN KEY (uye_id) REFERENCES uye(uye_id),
    FOREIGN KEY (kitap_id) REFERENCES kitap(kitap_id),
    FOREIGN KEY (gorevli_id) REFERENCES kullanici(kullanici_id)
);


CREATE TABLE Log_islem (
    log_id INTEGER AUTO_INCREMENT PRIMARY KEY,
    tablo_adi VARCHAR(50),
    islem_turu VARCHAR(50),
    islem_zamani TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    aciklama TEXT
);


CREATE TABLE Ceza (
    ceza_id INTEGER AUTO_INCREMENT PRIMARY KEY,
    odunc_id INTEGER,
    uye_id INTEGER,
    tutar DECIMAL(10,2) NOT NULL,
    ceza_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (odunc_id) REFERENCES odunc(odunc_id),
    FOREIGN KEY (uye_id) REFERENCES uye(uye_id)
);



DELIMITER //

CREATE PROCEDURE sp_YeniOduncVer(
    IN p_uye_id INTEGER,
    IN p_kitap_id INTEGER,
    IN p_kullanici_id INTEGER
)
BEGIN
    DECLARE aktif_odunc_sayisi INTEGER;
    DECLARE stok_sayisi INTEGER;
    
    SELECT COUNT(*) INTO aktif_odunc_sayisi 
    FROM Odunc 
    WHERE uye_id = p_uye_id AND teslim_tarihi IS NULL;

    IF aktif_odunc_sayisi >= 5 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Hata: Üyenin 5 adetten fazla teslim edilmemiş kitabı var. Limit aşıldı!';
    END IF;

    SELECT mevcut_adet INTO stok_sayisi 
    FROM Kitap 
    WHERE kitap_id = p_kitap_id;

    IF stok_sayisi <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Hata: Seçilen kitap şu an stokta yok!';
    END IF;

    INSERT INTO Odunc (
        uye_id, 
        kitap_id, 
        gorevli_id, 
        odunc_tarihi, 
        son_teslim_tarihi
    ) VALUES (
        p_uye_id, 
        p_kitap_id, 
        p_kullanici_id, 
        CURRENT_DATE, 
        DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY)
    );

END //

DELIMITER ;


DELIMITER //

CREATE PROCEDURE sp_KitapTeslimAl(
    IN p_odunc_id INTEGER,
    IN p_teslim_tarihi DATE
)
BEGIN
    DECLARE v_kitap_id INTEGER;
    DECLARE v_uye_id INTEGER;
    DECLARE v_son_teslim_tarihi DATE;
    DECLARE v_gecikme_gun INTEGER;
    DECLARE v_ceza_tutari DECIMAL(10,2);

    SELECT kitap_id, uye_id, son_teslim_tarihi 
    INTO v_kitap_id, v_uye_id, v_son_teslim_tarihi
    FROM Odunc 
    WHERE odunc_id = p_odunc_id;

    UPDATE Odunc 
    SET teslim_tarihi = p_teslim_tarihi 
    WHERE odunc_id = p_odunc_id;


    
    SET v_gecikme_gun = DATEDIFF(p_teslim_tarihi, v_son_teslim_tarihi);

    IF v_gecikme_gun > 0 THEN
        SET v_ceza_tutari = v_gecikme_gun * 5.00;

        INSERT INTO Ceza (
            odunc_id, 
            uye_id, 
            tutar, 
            ceza_tarihi
        ) VALUES (
            p_odunc_id, 
            v_uye_id, 
            v_ceza_tutari, 
            CURRENT_TIMESTAMP
        );


    END IF;
END //

DELIMITER ;


DELIMITER //

CREATE PROCEDURE sp_UyeOzetRapor(
    IN p_uye_id INTEGER
)
BEGIN
    SELECT 
        (SELECT COUNT(*) 
         FROM Odunc 
         WHERE uye_id = p_uye_id) AS ToplamAlinanKitap,

        (SELECT COUNT(*) 
         FROM Odunc 
         WHERE uye_id = p_uye_id AND teslim_tarihi IS NULL) AS AktifOduncSayisi,

        COALESCE((SELECT SUM(tutar) FROM Ceza WHERE uye_id = p_uye_id), 0.00) AS ToplamCezaTutari
    
    FROM Uye
    WHERE uye_id = p_uye_id;

END //

DELIMITER ;




DELIMITER //

CREATE TRIGGER TR_ODUNC_INSERT
AFTER INSERT ON Odunc
FOR EACH ROW
BEGIN
    UPDATE Kitap 
    SET mevcut_adet = mevcut_adet - 1 
    WHERE kitap_id = NEW.kitap_id;

    INSERT INTO Log_islem (
        tablo_adi, 
        islem_turu, 
        aciklama
    ) VALUES (
        'ODUNC', 
        'INSERT', 
        'ODUNC tablosuna kayıt eklendi'
    );
END //

DELIMITER ;



DELIMITER //

CREATE TRIGGER TR_ODUNC_UPDATE_TESLIM
AFTER UPDATE ON Odunc
FOR EACH ROW
BEGIN
    IF OLD.teslim_tarihi IS NULL AND NEW.teslim_tarihi IS NOT NULL THEN
        
        UPDATE Kitap 
        SET mevcut_adet = mevcut_adet + 1 
        WHERE kitap_id = NEW.kitap_id;

        INSERT INTO Log_islem (
            tablo_adi, 
            islem_turu, 
            aciklama
        ) VALUES (
            'ODUNC', 
            'UPDATE', 
            CONCAT('Kitap iade edildi. Kitap ID: ', NEW.kitap_id, ' iade kaydı güncellendi.')
        );
        
    END IF;
END //

DELIMITER ;



DELIMITER //

CREATE TRIGGER TR_CEZA_INSERT
AFTER INSERT ON Ceza
FOR EACH ROW
BEGIN
    UPDATE Uye 
    SET toplam_borc = toplam_borc + NEW.tutar 
    WHERE uye_id = NEW.uye_id;

    INSERT INTO Log_islem (
        tablo_adi, 
        islem_turu, 
        aciklama
    ) VALUES (
        'CEZA', 
        'INSERT', 
        CONCAT(NEW.uye_id, ' ID numaralı üyeye ', NEW.tutar, ' TL ceza yansıtıldı.')
    );
END //

DELIMITER ;



DELIMITER //

CREATE TRIGGER TR_UYE_DELETE_BLOCK
BEFORE DELETE ON Uye
FOR EACH ROW
BEGIN
    DECLARE aktif_odunc_sayisi INTEGER;

    SELECT COUNT(*) INTO aktif_odunc_sayisi 
    FROM Odunc 
    WHERE uye_id = OLD.uye_id AND teslim_tarihi IS NULL;

    IF aktif_odunc_sayisi > 0 OR OLD.toplam_borc > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Hata: Üye üzerinde aktif kitap kaydı veya ödenmemiş borç var. Silme işlemi yapılamaz!';
    END IF;
END //

DELIMITER ;

DELIMITER $$
CREATE TRIGGER `kitap_sil_kontrol` BEFORE DELETE ON `kitap` FOR EACH ROW BEGIN
  IF EXISTS (
    SELECT 1 FROM odunc
    WHERE kitap_id = OLD.kitap_id
      AND teslim_tarihi IS NULL
  ) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Bu kitap ödünçte olduğu için silinemez';
  END IF;
END
$$
DELIMITER ;





INSERT INTO Kullanici (kullanici_adi, sifre, rol) VALUES 
('admin', '1234', 'Admin'),
('gorevli', '1234', 'Görevli');


INSERT INTO Kategori (kategori_ad) VALUES 
('Bilim Kurgu'),
('Klasik Edebiyat'),
('Tarih'),
('Yazılım/Teknoloji'),
('Psikoloji');


INSERT INTO Uye (ad, soyad, telefon, e_posta, toplam_borc) VALUES 
('Ahmet', 'Yılmaz', '05551112233', 'ahmet@mail.com', 0.00),
('Mehmet', 'Demir', '05552223344', 'mehmet@mail.com', 0.00),
('Zeynep', 'Kaya', '05553334455', 'zeynep@mail.com', 0.00),
('Can', 'Öztürk', '05554445566', 'can@mail.com', 0.00);


INSERT INTO Kitap (kitap_adi, yazar, kategori_id, yayin_evi, basim_yili, toplam_adet, mevcut_adet) VALUES 
('Dune', 'Frank Herbert', 1, 'İthaki', 1965, 5, 5),
('Suç ve Ceza', 'Dostoyevski', 2, 'Can Yayınları', 1866, 3, 3),
('Nutuk', 'Mustafa Kemal Atatürk', 3, 'Yapı Kredi', 1927, 10, 10),
('Clean Code', 'Robert C. Martin', 4, 'Pearson', 2008, 2, 2),
('İnsan Mühendisliği', 'Ndoğan Cüceloğlu', 5, 'Remzi', 1999, 4, 4);


INSERT INTO odunc (kitap_id, uye_id, odunc_tarihi, son_teslim_tarihi, teslim_tarihi)
VALUES 

(1, 1, '2025-12-10', '2025-12-24', NULL), 
(2, 2, '2025-12-20', '2025-01-03', NULL), 
(2, 3, '2025-12-10', '2025-11-24', NULL), 
(3, 4, '2025-12-20', '2025-12-03', NULL), 

(3, 3, '2026-01-05', '2026-01-19', NULL),
(4, 4, '2026-01-08', '2026-01-22', NULL), 


(5, 1, '2025-12-01', '2025-12-15', '2025-12-12'), 
(3, 2, '2025-11-20', '2025-12-04', '2025-12-04'); 