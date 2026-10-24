// Seed data: 5 homestay, 12 kamar, 8 pesanan (lokasi di Sumatera Utara)
// Jalankan: npm run seed  (database lama akan direset)
const { openDatabase, initSchema, DEFAULT_DB_PATH } = require('./database');
const { hashPassword } = require('../utils/password');

const homestays = [
  {
    name: 'Homestay Tepi Toba',
    description: 'Penginapan keluarga tepat di tepi Danau Toba dengan pemandangan matahari terbit.',
    address: 'Jl. Pelabuhan No. 12, Parapat',
    city: 'Parapat',
    phone: '081260001001',
    image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
  },
  {
    name: 'Rumah Batak Samosir',
    description: 'Menginap di rumah adat Batak yang dikelola warga Tomok, lengkap dengan sarapan lokal.',
    address: 'Desa Tomok, Kec. Simanindo',
    city: 'Samosir',
    phone: '081260001002',
    image_url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
  },
  {
    name: 'Villa Sibayak Berastagi',
    description: 'Villa sejuk di kaki Gunung Sibayak, dikelilingi kebun jeruk dan sayuran.',
    address: 'Jl. Gundaling No. 5, Berastagi',
    city: 'Berastagi',
    phone: '081260001003',
    image_url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
  },
  {
    name: 'Bukit Lawang Jungle Stay',
    description: 'Bungalow di tepi Sungai Bohorok, dekat dengan pusat konservasi orangutan.',
    address: 'Jl. Bohorok, Bukit Lawang',
    city: 'Bukit Lawang',
    phone: '081260001004',
    image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
  },
  {
    name: 'Griya Siantar Asri',
    description: 'Homestay nyaman di pusat Pematangsiantar, dekat kuliner khas dan terminal.',
    address: 'Jl. Merdeka No. 20, Pematangsiantar',
    city: 'Pematangsiantar',
    phone: '081260001005',
    image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  },
];

// Akun demo. GANTI password admin untuk deployment sungguhan: set SEED_ADMIN_PASSWORD saat menjalankan seed.
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin12345';
const users = [
  { name: 'Administrator', email: 'admin@mulakjabu.test', password: ADMIN_PASSWORD, role: 'admin' },
  { name: 'Tamu Demo', email: 'tamu@mulakjabu.test', password: 'Tamu12345', role: 'guest' },
];

// homestay_id merujuk ke urutan homestay di atas (1..5)
const rooms = [
  { homestay_id: 1, name: 'Kamar Standar Danau', type: 'standard', capacity: 2, price_per_night: 250000, description: 'Kasur double, kamar mandi dalam, balkon menghadap danau.' },
  { homestay_id: 1, name: 'Kamar Keluarga Toba', type: 'family', capacity: 4, price_per_night: 450000, description: 'Dua kasur, ruang duduk kecil, cocok untuk keluarga.' },
  { homestay_id: 1, name: 'Suite View Toba', type: 'suite', capacity: 2, price_per_night: 600000, description: 'Suite luas dengan jendela panorama dan air panas.' },
  { homestay_id: 2, name: 'Kamar Ulos', type: 'standard', capacity: 2, price_per_night: 200000, description: 'Kamar bernuansa ulos dengan kasur nyaman.' },
  { homestay_id: 2, name: 'Rumah Adat Bolon', type: 'family', capacity: 6, price_per_night: 550000, description: 'Satu rumah adat utuh untuk rombongan, dapur bersama.' },
  { homestay_id: 3, name: 'Cottage Kebun Jeruk', type: 'cottage', capacity: 3, price_per_night: 350000, description: 'Cottage mandiri di antara kebun jeruk.' },
  { homestay_id: 3, name: 'Kamar Deluxe Sibayak', type: 'deluxe', capacity: 2, price_per_night: 400000, description: 'Kamar luas dengan pemanas air dan pemandangan gunung.' },
  { homestay_id: 4, name: 'Bungalow Sungai', type: 'bungalow', capacity: 2, price_per_night: 300000, description: 'Bungalow kayu di tepi sungai, suara air sepanjang malam.' },
  { homestay_id: 4, name: 'Pondok Hutan', type: 'cottage', capacity: 4, price_per_night: 380000, description: 'Pondok dua lantai dekat jalur trekking.' },
  { homestay_id: 5, name: 'Kamar Ekonomi', type: 'economy', capacity: 2, price_per_night: 150000, description: 'Kamar sederhana, bersih, dengan kipas angin.' },
  { homestay_id: 5, name: 'Kamar Superior', type: 'superior', capacity: 3, price_per_night: 250000, description: 'Kamar ber-AC dengan TV dan kamar mandi dalam.' },
  { homestay_id: 5, name: 'Kamar Keluarga Asri', type: 'family', capacity: 5, price_per_night: 400000, description: 'Dua kamar tidur, ruang keluarga, parkir luas.' },
];

// room_id merujuk ke urutan kamar di atas (1..12). total_price dihitung otomatis di bawah.
// Tidak ada tanggal yang bentrok untuk kamar yang sama pada pesanan aktif (pending/confirmed).
const bookings = [
  { room_id: 1, guest_name: 'Budi Santoso', guest_email: 'budi.santoso@example.com', guest_phone: '081211110001', guests_count: 2, check_in: '2026-09-10', check_out: '2026-09-12', status: 'completed' },
  { room_id: 2, guest_name: 'Siti Aminah', guest_email: 'siti.aminah@example.com', guest_phone: '081211110002', guests_count: 4, check_in: '2026-10-05', check_out: '2026-10-08', status: 'completed' },
  { room_id: 3, guest_name: 'Andreas Simanjuntak', guest_email: 'andreas.s@example.com', guest_phone: '081211110003', guests_count: 2, check_in: '2026-11-01', check_out: '2026-11-04', status: 'confirmed' },
  { room_id: 5, guest_name: 'Rina Hutapea', guest_email: 'rina.hutapea@example.com', guest_phone: '081211110004', guests_count: 6, check_in: '2026-11-14', check_out: '2026-11-16', status: 'confirmed' },
  { room_id: 6, guest_name: 'Dewi Lestari', guest_email: 'dewi.lestari@example.com', guest_phone: '081211110005', guests_count: 3, check_in: '2026-11-20', check_out: '2026-11-22', status: 'pending' },
  { room_id: 8, guest_name: 'Michael Tan', guest_email: 'michael.tan@example.com', guest_phone: '081211110006', guests_count: 2, check_in: '2026-12-24', check_out: '2026-12-27', status: 'pending' },
  { room_id: 10, guest_name: 'Joko Prasetyo', guest_email: 'joko.prasetyo@example.com', guest_phone: '081211110007', guests_count: 1, check_in: '2026-10-30', check_out: '2026-11-01', status: 'cancelled' },
  { room_id: 4, guest_name: 'Maria Sitorus', guest_email: 'maria.sitorus@example.com', guest_phone: '081211110008', guests_count: 2, check_in: '2026-12-30', check_out: '2027-01-02', status: 'confirmed' },
];

// Menghitung jumlah malam antara dua tanggal ISO (YYYY-MM-DD)
function countNights(checkIn, checkOut) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / msPerDay);
}

// Mengosongkan lalu mengisi ulang database. Dipisah sebagai fungsi agar bisa dipakai test.
function seedDatabase(db) {
  // Hapus dari tabel anak ke induk agar tidak melanggar foreign key
  db.exec(
    'DROP TABLE IF EXISTS bookings; DROP TABLE IF EXISTS rooms; DROP TABLE IF EXISTS homestays; DROP TABLE IF EXISTS users;'
  );
  initSchema(db);

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (@name, @email, @password_hash, @role)'
  );
  const insertHomestay = db.prepare(
    `INSERT INTO homestays (name, description, address, city, phone, image_url)
     VALUES (@name, @description, @address, @city, @phone, @image_url)`
  );
  const insertRoom = db.prepare(
    `INSERT INTO rooms (homestay_id, name, type, capacity, price_per_night, description)
     VALUES (@homestay_id, @name, @type, @capacity, @price_per_night, @description)`
  );
  const insertBooking = db.prepare(
    `INSERT INTO bookings (room_id, guest_name, guest_email, guest_phone, guests_count,
                           check_in, check_out, total_price, status)
     VALUES (@room_id, @guest_name, @guest_email, @guest_phone, @guests_count,
             @check_in, @check_out, @total_price, @status)`
  );

  // Semua insert dalam satu transaksi: kalau gagal di tengah, tidak ada data setengah jadi
  const run = db.transaction(() => {
    users.forEach(({ password, ...u }) => insertUser.run({ ...u, password_hash: hashPassword(password) }));
    homestays.forEach((h) => insertHomestay.run(h));
    rooms.forEach((r) => insertRoom.run(r));
    bookings.forEach((b) => {
      const room = rooms[b.room_id - 1];
      const total_price = countNights(b.check_in, b.check_out) * room.price_per_night;
      insertBooking.run({ ...b, total_price });
    });
  });
  run();

  return { users: users.length, homestays: homestays.length, rooms: rooms.length, bookings: bookings.length };
}

module.exports = { seedDatabase };

// Dijalankan langsung lewat `npm run seed`
if (require.main === module) {
  const db = openDatabase();
  const result = seedDatabase(db);
  db.close();
  console.log(`Seed selesai di ${DEFAULT_DB_PATH}`);
  console.log(`  users: ${result.users}, homestays: ${result.homestays}, rooms: ${result.rooms}, bookings: ${result.bookings}`);
}
