const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const db = require("./db");

function createWindow() {
  const win = new BrowserWindow({
    width: 1800,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

//üye işlemleri
ipcMain.handle("get-members", async () => {
  try {
    const [rows] = await db.query("SELECT * FROM Uye");
    return rows;
  } catch (err) {
    console.error(err);
    return { error: err.message };
  }
});

ipcMain.handle("add-member", async (event, member) => {
  try {
    const { ad, soyad, telefon, e_posta } = member;
    const [result] = await db.query(
      "INSERT INTO Uye (ad, soyad, telefon, e_posta) VALUES (?, ?, ?, ?)",
      [ad, soyad, telefon, e_posta]
    );
    return { success: true, insertId: result.insertId };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("update-member", async (event, member) => {
  try {
    const { id, ad, soyad, telefon, e_posta } = member;
    await db.query(
      "UPDATE Uye SET ad=?, soyad=?, telefon=?, e_posta=? WHERE uye_id=?",
      [ad, soyad, telefon, e_posta, id]
    );
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("delete-member", async (event, id) => {
  try {
    await db.query("DELETE FROM Uye WHERE uye_id = ?", [id]);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("search-members", async (event, searchTerm) => {
  const query = `SELECT * FROM Uye WHERE ad LIKE ? OR soyad LIKE ? OR e_posta LIKE ?`;
  const [rows] = await db.query(query, [
    `%${searchTerm}%`,
    `%${searchTerm}%`,
    `%${searchTerm}%`,
  ]);
  return rows;
});
//üye işlemleri

//kitap işlemleri
ipcMain.handle("get-categories", async () => {
  try {
    const [rows] = await db.query("SELECT * FROM Kategori");
    return rows;
  } catch (err) {
    console.error("Kategori yükleme hatası:", err);
    return [];
  }
});
ipcMain.handle("search-books-by-category", async (event, categoryId) => {
  const query = `
    SELECT k.*, c.kategori_ad 
    FROM Kitap k 
    LEFT JOIN Kategori c ON k.kategori_id = c.kategori_id 
    WHERE k.kategori_id = ?`;
  const [rows] = await db.query(query, [categoryId]);
  return rows;
});

ipcMain.handle("get-books", async () => {
  const query = `
    SELECT k.*, c.kategori_ad 
    FROM Kitap k 
    LEFT JOIN Kategori c ON k.kategori_id = c.kategori_id`;
  const [rows] = await db.query(query);
  return rows;
});

ipcMain.handle("add-book", async (event, book) => {
  try {
    const { ad, yazar, kategori_id, yayinevi, yil, stok } = book;
    await db.query(
      "INSERT INTO Kitap (kitap_adi, yazar, kategori_id, yayin_evi, basim_yili, toplam_adet, mevcut_adet) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [ad, yazar, kategori_id, yayinevi, yil, stok, stok]
    );
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("update-book", async (event, book) => {
  try {
    const { id, ad, yazar, kategori_id, yayinevi, yil, stok } = book;

    const [rows] = await db.query(
      "SELECT toplam_adet, mevcut_adet FROM Kitap WHERE kitap_id = ?",
      [id]
    );

    if (rows.length === 0) return { success: false, error: "Kitap bulunamadı" };

    const eskiToplam = rows[0].toplam_adet;
    const eskiMevcut = rows[0].mevcut_adet;

    const fark = stok - eskiToplam;
    const yeniMevcut = eskiMevcut + fark;

    await db.query(
      "UPDATE Kitap SET kitap_adi=?, yazar=?, kategori_id=?, yayin_evi=?, basim_yili=?, toplam_adet=?, mevcut_adet=? WHERE kitap_id=?",
      [ad, yazar, kategori_id, yayinevi, yil, stok, yeniMevcut, id]
    );

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("delete-book", async (event, id) => {
  try {
    await db.query("DELETE FROM Kitap WHERE kitap_id = ?", [id]);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("search-books", async (event, searchTerm) => {
  const query = `
    SELECT k.*, c.kategori_ad 
    FROM Kitap k 
    LEFT JOIN Kategori c ON k.kategori_id = c.kategori_id 
    WHERE k.kitap_adi LIKE ? OR k.yazar LIKE ?`;
  const [rows] = await db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`]);
  return rows;
});

//kitap işlemleri

ipcMain.handle("run-report", async (event, params) => {
  const { type, start, end, memberId, categoryId } = params;
  let query = "";
  let queryParams = [];

  if (type === 1) {
    query = `
      SELECT o.odunc_id, u.ad, u.soyad, k.kitap_adi, o.odunc_tarihi, o.son_teslim_tarihi, o.teslim_tarihi
      FROM Odunc o
      JOIN Uye u ON o.uye_id = u.uye_id
      JOIN Kitap k ON o.kitap_id = k.kitap_id
      WHERE o.odunc_tarihi BETWEEN ? AND ?`;
    queryParams = [start, end];

    if (memberId) {
      query += " AND o.uye_id = ?";
      queryParams.push(memberId);
    }
    if (categoryId) {
      query += " AND k.kategori_id = ?";
      queryParams.push(categoryId);
    }
  } else if (type === 2) {
    query = `
      SELECT o.odunc_id, u.ad, u.soyad, k.kitap_adi, o.son_teslim_tarihi, 
             DATEDIFF(CURDATE(), o.son_teslim_tarihi) as gecikme_gunu
      FROM Odunc o
      JOIN Uye u ON o.uye_id = u.uye_id
      JOIN Kitap k ON o.kitap_id = k.kitap_id
      WHERE o.teslim_tarihi IS NULL AND o.son_teslim_tarihi < CURDATE()`;
  } else if (type === 3) {
    query = `
      SELECT k.kitap_adi, k.yazar, COUNT(o.odunc_id) as okunma_sayisi
      FROM Odunc o
      JOIN Kitap k ON o.kitap_id = k.kitap_id
      GROUP BY k.kitap_id
      ORDER BY okunma_sayisi DESC LIMIT 10`;
  }

  try {
    const [rows] = await db.query(query, queryParams);
    return rows;
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle("get-fines", async (event, filters) => {
  const { memberId, startDate, endDate } = filters;
  let query = `
    SELECT c.*, u.ad, u.soyad, k.kitap_adi 
    FROM Ceza c
    JOIN Uye u ON c.uye_id = u.uye_id
    JOIN Odunc o ON c.odunc_id = o.odunc_id
    JOIN Kitap k ON o.kitap_id = k.kitap_id
    WHERE 1=1`;

  let params = [];

  if (memberId) {
    query += " AND c.uye_id = ?";
    params.push(memberId);
  }
  if (startDate && endDate) {
    query += " AND DATE(c.ceza_tarihi) BETWEEN ? AND ?";
    params.push(startDate, endDate);
  }

  query += " ORDER BY c.ceza_tarihi DESC";

  try {
    const [rows] = await db.query(query, params);
    return rows;
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle("get-member-debt", async (event, memberId) => {
  try {
    const [rows] = await db.query(
      "SELECT toplam_borc FROM Uye WHERE uye_id = ?",
      [memberId]
    );
    return rows[0] ? rows[0].toplam_borc : 0;
  } catch (err) {
    return 0;
  }
});

ipcMain.handle("get-active-loans", async () => {
  const query = `
    SELECT o.odunc_id, u.ad, u.soyad, k.kitap_adi, o.odunc_tarihi, o.son_teslim_tarihi 
    FROM Odunc o
    JOIN Uye u ON o.uye_id = u.uye_id
    JOIN Kitap k ON o.kitap_id = k.kitap_id
    WHERE o.teslim_tarihi IS NULL`;
  try {
    const [rows] = await db.query(query);
    return rows;
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle("add-loan", async (event, data) => {
  try {
    await db.query("CALL sp_YeniOduncVer(?, ?, ?)", [
      data.uye_id,
      data.kitap_id,
      1,
    ]);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("return-book", async (event, oduncId) => {
  try {
    const bugun = new Date().toISOString().slice(0, 10);
    await db.query("CALL sp_KitapTeslimAl(?, ?)", [oduncId, bugun]);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("run-dynamic-query", async (event, filters) => {
  let query = `
    SELECT k.kitap_id, k.kitap_adi, k.yazar, c.kategori_ad, k.basim_yili, k.mevcut_adet 
    FROM Kitap k 
    LEFT JOIN Kategori c ON k.kategori_id = c.kategori_id 
    WHERE 1=1`;

  let params = [];

  if (filters.title) {
    query += " AND k.kitap_adi LIKE ?";
    params.push(`%${filters.title}%`);
  }
  if (filters.author) {
    query += " AND k.yazar LIKE ?";
    params.push(`%${filters.author}%`);
  }
  if (filters.category) {
    query += " AND c.kategori_ad = ?";
    params.push(filters.category);
  }
  if (filters.minYear) {
    query += " AND k.basim_yili >= ?";
    params.push(filters.minYear);
  }
  if (filters.maxYear) {
    query += " AND k.basim_yili <= ?";
    params.push(filters.maxYear);
  }
  if (filters.stockOnly) {
    query += " AND k.mevcut_adet > 0";
  }

  const sortMap = {
    "name-asc": "ORDER BY k.kitap_adi ASC",
    "name-desc": "ORDER BY k.kitap_adi DESC",
    "year-desc": "ORDER BY k.basim_yili DESC",
    "year-asc": "ORDER BY k.basim_yili ASC",
  };
  query += " " + (sortMap[filters.sort] || "ORDER BY k.kitap_id DESC");

  try {
    const [rows] = await db.query(query, params);

    let displaySql = query;
    params.forEach((p) => {
      displaySql = displaySql.replace("?", `'${p}'`);
    });

    return { rows, sql: displaySql };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle("login-attempt", async (event, credentials) => {
  const { username, password } = credentials;

  try {
    const [rows] = await db.execute(
      "SELECT * FROM kullanici WHERE kullanici_adi = ? AND sifre = ?",
      [username, password]
    );

    if (rows.length > 0) {
      return { success: true, user: rows[0] };
    } else {
      return { success: false, message: "Kullanıcı adı veya şifre hatalı!" };
    }
  } catch (err) {
    return { success: false, message: "Bağlantı Hatası: " + err.message };
  }
});
