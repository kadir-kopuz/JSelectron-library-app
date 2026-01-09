-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Anamakine: 127.0.0.1
-- Üretim Zamanı: 09 Oca 2026, 11:27:09
-- Sunucu sürümü: 10.4.32-MariaDB
-- PHP Sürümü: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Veritabanı: `kutuphanedb`
--
CREATE DATABASE IF NOT EXISTS `kutuphanedb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `kutuphanedb`;

DELIMITER $$
--
-- Yordamlar
--
DROP PROCEDURE IF EXISTS `sp_KitapTeslimAl`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_KitapTeslimAl` (IN `p_odunc_id` INTEGER, IN `p_teslim_tarihi` DATE)   BEGIN
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
END$$

DROP PROCEDURE IF EXISTS `sp_UyeOzetRapor`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_UyeOzetRapor` (IN `p_uye_id` INTEGER)   BEGIN
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

END$$

DROP PROCEDURE IF EXISTS `sp_YeniOduncVer`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_YeniOduncVer` (IN `p_uye_id` INTEGER, IN `p_kitap_id` INTEGER, IN `p_kullanici_id` INTEGER)   BEGIN
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

END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `ceza`
--

DROP TABLE IF EXISTS `ceza`;
CREATE TABLE `ceza` (
  `ceza_id` int(11) NOT NULL,
  `odunc_id` int(11) DEFAULT NULL,
  `uye_id` int(11) DEFAULT NULL,
  `tutar` decimal(10,2) NOT NULL,
  `ceza_tarihi` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tetikleyiciler `ceza`
--
DROP TRIGGER IF EXISTS `TR_CEZA_INSERT`;
DELIMITER $$
CREATE TRIGGER `TR_CEZA_INSERT` AFTER INSERT ON `ceza` FOR EACH ROW BEGIN
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
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `kategori`
--

DROP TABLE IF EXISTS `kategori`;
CREATE TABLE `kategori` (
  `kategori_id` int(11) NOT NULL,
  `kategori_ad` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `kategori`
--

INSERT INTO `kategori` (`kategori_id`, `kategori_ad`) VALUES
(1, 'Bilim Kurgu'),
(2, 'Klasik Edebiyat'),
(3, 'Tarih'),
(4, 'Yazılım/Teknoloji'),
(5, 'Psikoloji');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `kitap`
--

DROP TABLE IF EXISTS `kitap`;
CREATE TABLE `kitap` (
  `kitap_id` int(11) NOT NULL,
  `kitap_adi` varchar(100) NOT NULL,
  `yazar` varchar(100) NOT NULL,
  `kategori_id` int(11) DEFAULT NULL,
  `yayin_evi` varchar(100) DEFAULT NULL,
  `basim_yili` int(11) DEFAULT NULL,
  `toplam_adet` int(11) NOT NULL DEFAULT 0,
  `mevcut_adet` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `kitap`
--

INSERT INTO `kitap` (`kitap_id`, `kitap_adi`, `yazar`, `kategori_id`, `yayin_evi`, `basim_yili`, `toplam_adet`, `mevcut_adet`) VALUES
(1, 'Dune', 'Frank Herbert', 1, 'İthaki', 1965, 5, 4),
(2, 'Suç ve Ceza', 'Dostoyevski', 2, 'Can Yayınları', 1866, 3, 1),
(3, 'Nutuk', 'Mustafa Kemal Atatürk', 3, 'Yapı Kredi', 1927, 10, 7),
(4, 'Clean Code', 'Robert C. Martin', 4, 'Pearson', 2008, 2, 1),
(5, 'İnsan Mühendisliği', 'Ndoğan Cüceloğlu', 5, 'Remzi', 1999, 4, 3);

--
-- Tetikleyiciler `kitap`
--
DROP TRIGGER IF EXISTS `kitap_sil_kontrol`;
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

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `kullanici`
--

DROP TABLE IF EXISTS `kullanici`;
CREATE TABLE `kullanici` (
  `kullanici_id` int(11) NOT NULL,
  `kullanici_adi` varchar(50) NOT NULL,
  `sifre` varchar(255) NOT NULL,
  `rol` enum('Admin','Görevli') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `kullanici`
--

INSERT INTO `kullanici` (`kullanici_id`, `kullanici_adi`, `sifre`, `rol`) VALUES
(1, 'admin', '1234', 'Admin'),
(2, 'gorevli', '1234', 'Görevli');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `log_islem`
--

DROP TABLE IF EXISTS `log_islem`;
CREATE TABLE `log_islem` (
  `log_id` int(11) NOT NULL,
  `tablo_adi` varchar(50) DEFAULT NULL,
  `islem_turu` varchar(50) DEFAULT NULL,
  `islem_zamani` timestamp NOT NULL DEFAULT current_timestamp(),
  `aciklama` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `log_islem`
--

INSERT INTO `log_islem` (`log_id`, `tablo_adi`, `islem_turu`, `islem_zamani`, `aciklama`) VALUES
(1, 'ODUNC', 'INSERT', '2026-01-09 10:26:44', 'ODUNC tablosuna kayıt eklendi'),
(2, 'ODUNC', 'INSERT', '2026-01-09 10:26:44', 'ODUNC tablosuna kayıt eklendi'),
(3, 'ODUNC', 'INSERT', '2026-01-09 10:26:44', 'ODUNC tablosuna kayıt eklendi'),
(4, 'ODUNC', 'INSERT', '2026-01-09 10:26:44', 'ODUNC tablosuna kayıt eklendi'),
(5, 'ODUNC', 'INSERT', '2026-01-09 10:26:44', 'ODUNC tablosuna kayıt eklendi'),
(6, 'ODUNC', 'INSERT', '2026-01-09 10:26:44', 'ODUNC tablosuna kayıt eklendi'),
(7, 'ODUNC', 'INSERT', '2026-01-09 10:26:44', 'ODUNC tablosuna kayıt eklendi'),
(8, 'ODUNC', 'INSERT', '2026-01-09 10:26:44', 'ODUNC tablosuna kayıt eklendi');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `odunc`
--

DROP TABLE IF EXISTS `odunc`;
CREATE TABLE `odunc` (
  `odunc_id` int(11) NOT NULL,
  `uye_id` int(11) DEFAULT NULL,
  `kitap_id` int(11) DEFAULT NULL,
  `gorevli_id` int(11) DEFAULT NULL,
  `odunc_tarihi` date DEFAULT curdate(),
  `son_teslim_tarihi` date NOT NULL,
  `teslim_tarihi` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `odunc`
--

INSERT INTO `odunc` (`odunc_id`, `uye_id`, `kitap_id`, `gorevli_id`, `odunc_tarihi`, `son_teslim_tarihi`, `teslim_tarihi`) VALUES
(1, 1, 1, NULL, '2025-12-10', '2025-12-24', NULL),
(2, 2, 2, NULL, '2025-12-20', '2026-01-03', NULL),
(3, 3, 2, NULL, '2025-12-10', '2025-11-24', NULL),
(4, 4, 3, NULL, '2025-12-20', '2025-12-03', NULL),
(5, 3, 3, NULL, '2026-01-05', '2026-01-19', NULL),
(6, 4, 4, NULL, '2026-01-08', '2026-01-22', NULL),
(7, 1, 5, NULL, '2025-12-01', '2025-12-15', '2025-12-12'),
(8, 2, 3, NULL, '2025-11-20', '2025-12-04', '2025-12-04');

--
-- Tetikleyiciler `odunc`
--
DROP TRIGGER IF EXISTS `TR_ODUNC_INSERT`;
DELIMITER $$
CREATE TRIGGER `TR_ODUNC_INSERT` AFTER INSERT ON `odunc` FOR EACH ROW BEGIN
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
END
$$
DELIMITER ;
DROP TRIGGER IF EXISTS `TR_ODUNC_UPDATE_TESLIM`;
DELIMITER $$
CREATE TRIGGER `TR_ODUNC_UPDATE_TESLIM` AFTER UPDATE ON `odunc` FOR EACH ROW BEGIN
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
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `uye`
--

DROP TABLE IF EXISTS `uye`;
CREATE TABLE `uye` (
  `uye_id` int(11) NOT NULL,
  `ad` varchar(50) NOT NULL,
  `soyad` varchar(50) NOT NULL,
  `telefon` varchar(15) NOT NULL,
  `e_posta` varchar(100) NOT NULL,
  `toplam_borc` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `uye`
--

INSERT INTO `uye` (`uye_id`, `ad`, `soyad`, `telefon`, `e_posta`, `toplam_borc`) VALUES
(1, 'Ahmet', 'Yılmaz', '05551112233', 'ahmet@mail.com', 0.00),
(2, 'Mehmet', 'Demir', '05552223344', 'mehmet@mail.com', 0.00),
(3, 'Zeynep', 'Kaya', '05553334455', 'zeynep@mail.com', 0.00),
(4, 'Can', 'Öztürk', '05554445566', 'can@mail.com', 0.00);

--
-- Tetikleyiciler `uye`
--
DROP TRIGGER IF EXISTS `TR_UYE_DELETE_BLOCK`;
DELIMITER $$
CREATE TRIGGER `TR_UYE_DELETE_BLOCK` BEFORE DELETE ON `uye` FOR EACH ROW BEGIN
    DECLARE aktif_odunc_sayisi INTEGER;

    SELECT COUNT(*) INTO aktif_odunc_sayisi 
    FROM Odunc 
    WHERE uye_id = OLD.uye_id AND teslim_tarihi IS NULL;

    IF aktif_odunc_sayisi > 0 OR OLD.toplam_borc > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Hata: Üye üzerinde aktif kitap kaydı veya ödenmemiş borç var. Silme işlemi yapılamaz!';
    END IF;
END
$$
DELIMITER ;

--
-- Dökümü yapılmış tablolar için indeksler
--

--
-- Tablo için indeksler `ceza`
--
ALTER TABLE `ceza`
  ADD PRIMARY KEY (`ceza_id`),
  ADD KEY `odunc_id` (`odunc_id`),
  ADD KEY `uye_id` (`uye_id`);

--
-- Tablo için indeksler `kategori`
--
ALTER TABLE `kategori`
  ADD PRIMARY KEY (`kategori_id`);

--
-- Tablo için indeksler `kitap`
--
ALTER TABLE `kitap`
  ADD PRIMARY KEY (`kitap_id`),
  ADD KEY `kategori_id` (`kategori_id`);

--
-- Tablo için indeksler `kullanici`
--
ALTER TABLE `kullanici`
  ADD PRIMARY KEY (`kullanici_id`),
  ADD UNIQUE KEY `kullanici_adi` (`kullanici_adi`);

--
-- Tablo için indeksler `log_islem`
--
ALTER TABLE `log_islem`
  ADD PRIMARY KEY (`log_id`);

--
-- Tablo için indeksler `odunc`
--
ALTER TABLE `odunc`
  ADD PRIMARY KEY (`odunc_id`),
  ADD KEY `uye_id` (`uye_id`),
  ADD KEY `kitap_id` (`kitap_id`),
  ADD KEY `gorevli_id` (`gorevli_id`);

--
-- Tablo için indeksler `uye`
--
ALTER TABLE `uye`
  ADD PRIMARY KEY (`uye_id`);

--
-- Dökümü yapılmış tablolar için AUTO_INCREMENT değeri
--

--
-- Tablo için AUTO_INCREMENT değeri `ceza`
--
ALTER TABLE `ceza`
  MODIFY `ceza_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `kategori`
--
ALTER TABLE `kategori`
  MODIFY `kategori_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Tablo için AUTO_INCREMENT değeri `kitap`
--
ALTER TABLE `kitap`
  MODIFY `kitap_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Tablo için AUTO_INCREMENT değeri `kullanici`
--
ALTER TABLE `kullanici`
  MODIFY `kullanici_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Tablo için AUTO_INCREMENT değeri `log_islem`
--
ALTER TABLE `log_islem`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Tablo için AUTO_INCREMENT değeri `odunc`
--
ALTER TABLE `odunc`
  MODIFY `odunc_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Tablo için AUTO_INCREMENT değeri `uye`
--
ALTER TABLE `uye`
  MODIFY `uye_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Dökümü yapılmış tablolar için kısıtlamalar
--

--
-- Tablo kısıtlamaları `ceza`
--
ALTER TABLE `ceza`
  ADD CONSTRAINT `ceza_ibfk_1` FOREIGN KEY (`odunc_id`) REFERENCES `odunc` (`odunc_id`),
  ADD CONSTRAINT `ceza_ibfk_2` FOREIGN KEY (`uye_id`) REFERENCES `uye` (`uye_id`);

--
-- Tablo kısıtlamaları `kitap`
--
ALTER TABLE `kitap`
  ADD CONSTRAINT `kitap_ibfk_1` FOREIGN KEY (`kategori_id`) REFERENCES `kategori` (`kategori_id`);

--
-- Tablo kısıtlamaları `odunc`
--
ALTER TABLE `odunc`
  ADD CONSTRAINT `odunc_ibfk_1` FOREIGN KEY (`uye_id`) REFERENCES `uye` (`uye_id`),
  ADD CONSTRAINT `odunc_ibfk_2` FOREIGN KEY (`kitap_id`) REFERENCES `kitap` (`kitap_id`),
  ADD CONSTRAINT `odunc_ibfk_3` FOREIGN KEY (`gorevli_id`) REFERENCES `kullanici` (`kullanici_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
