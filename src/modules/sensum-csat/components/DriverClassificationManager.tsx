'use client';

import React, { useState, useEffect } from 'react';

export interface ClassificationRule {
  pplKeywords: string[];
  prcKeywords: string[];
  prmKeywords: string[];
  overrides: Record<string, 'Overall' | 'People' | 'Process' | 'Premises'>;
}

const DEFAULT_RULES: ClassificationRule = {
  pplKeywords: ['staff', 'petugas', 'karyawan', 'keramahan', 'pelayanan', 'penampilan', 'kasir', 'personil'],
  prcKeywords: ['alur', 'proses', 'antrean', 'akses', 'pembayaran', 'informasi', 'prosedur', 'kecepatan', 'waktu', 'transaksi'],
  prmKeywords: ['fasilitas', 'kebersihan', 'kenyamanan', 'kelengkapan', 'ketersediaan', 'ruangan', 'toilet', 'tisu', 'kondisi', 'kualitas', 'harga'],
  overrides: {}
};

const DISCOVERED_QUESTIONS = [
  {
    "id": "1",
    "name": "Akses & Pengelolaan Praying Room-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Musholla kami",
    "defaultCategory": "Process"
  },
  {
    "id": "2",
    "name": "Akses & Pengelolaan Toilet-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Toilet kami",
    "defaultCategory": "Process"
  },
  {
    "id": "3",
    "name": "Akses & Proses Pendapatan Informasi-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di layanan Information Center kami",
    "defaultCategory": "Process"
  },
  {
    "id": "4",
    "name": "Alur & Pengelolaan Baggage Claim-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Baggage Claim kami",
    "defaultCategory": "Process"
  },
  {
    "id": "5",
    "name": "Alur & Pengelolaan Boarding Lounge-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Boarding Lounge kami",
    "defaultCategory": "Process"
  },
  {
    "id": "6",
    "name": "Alur & Pengelolaan Nursery Room-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Nursery Room kami",
    "defaultCategory": "Process"
  },
  {
    "id": "7",
    "name": "Alur & Pengelolaan Praying Room-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Praying Room kami",
    "defaultCategory": "Process"
  },
  {
    "id": "8",
    "name": "Alur & Pengelolaan Toilet-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Toilet kami",
    "defaultCategory": "Process"
  },
  {
    "id": "9",
    "name": "Bagaimana Anda menilai kebersihan kamar Anda?",
    "defaultCategory": "Premises"
  },
  {
    "id": "10",
    "name": "Bagaimana Anda menilai kualitas dan fungsi fasilitas dalam kamar (kopi/teh, perlengkapan mandi, minibar)?",
    "defaultCategory": "Premises"
  },
  {
    "id": "11",
    "name": "Bagaimana Anda menilai kualitas keseluruhan layanan makan di kamar kami?",
    "defaultCategory": "Premises"
  },
  {
    "id": "12",
    "name": "Bagaimana penilaian Anda terhadap kebersihan venue?",
    "defaultCategory": "Premises"
  },
  {
    "id": "13",
    "name": "Bagaimana penilaian Anda terhadap kualitas wi-fi di venue?",
    "defaultCategory": "Premises"
  },
  {
    "id": "14",
    "name": "Bagaimana penilaian Anda terhadap penataan dan pengaturan ruangan?",
    "defaultCategory": "Overall"
  },
  {
    "id": "15",
    "name": "Bagaimana penilaian Anda terhadap penyajian makanan dan minuman yang disajikan selama acara?",
    "defaultCategory": "Overall"
  },
  {
    "id": "16",
    "name": "Bagaimana penilaian Anda terhadap peralatan audio visual di venue?",
    "defaultCategory": "Overall"
  },
  {
    "id": "17",
    "name": "Bagaimana penilaian Anda terhadap rasa makanan dan minuman yang disajikan selama acara?",
    "defaultCategory": "Overall"
  },
  {
    "id": "18",
    "name": "Bagaimana penilaian Anda terhadap suhu ruangan?",
    "defaultCategory": "Overall"
  },
  {
    "id": "19",
    "name": "Bagaimana penilaian Anda terhadap toilet venue?",
    "defaultCategory": "Overall"
  },
  {
    "id": "20",
    "name": "Dari skala 1 - 5, seberapa puas Bapak / Ibu terhadap Fasilitas Halte kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "21",
    "name": "Dari skala 1 - 5, seberapa puas Bapak / Ibu terhadap fasilitas Kereta Gantung kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "22",
    "name": "Dari skala 1 - 5, seberapa puas Bapak / Ibu terhadap fasilitas Toilet kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "23",
    "name": "Dari skala 1 - 5, seberapa puas Bapak / Ibu terhadap fasiltias Merchandise Store kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "24",
    "name": "Dari skala 1 - 5, seberapa puas Bapak / Ibu terhadap fasiltias Parkir kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "25",
    "name": "Dari skala 1 - 5, seberapa puas Bapak / Ibu terhadap layanan Angkutan Keliling (Angling) kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "26",
    "name": "Dari skala 1 - 5, seberapa puas Bapak / Ibu terhadap layanan Information Center kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "27",
    "name": "Dari skala 1 - 5, seberapa puas Bapak / Ibu terhadap layanan Pengambilan Foto kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "28",
    "name": "Dari skala 1 - 5, seberapa puas Bapak / Ibu terhadap layanan Pos Security kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "29",
    "name": "Dari skala 1 - 5, seberapa puas Bapak / Ibu terhadap layanan Shelter kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "30",
    "name": "Dari skala 1 - 5, seberapa puas Bapak / Ibu terhadap layanan kuliner {KETERANGAN FASILITAS} kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "31",
    "name": "Fasilitas Baggage Claim (Convetor Belt, Troli, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Baggage Claim kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "32",
    "name": "Fasilitas Boarding Lounge (Tempat duduk, Layar Informasi, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Boarding Lounge kami",
    "defaultCategory": "Process"
  },
  {
    "id": "33",
    "name": "Fasilitas Check-In (Counter Check-In, Timbangan Bagasi, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Check-In kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "34",
    "name": "Fasilitas Information Center\u00a0-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di layanan Information Center kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "35",
    "name": "Fasilitas Kasir (Opsi pembayaran, Peralatan kasir, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Kasir kami",
    "defaultCategory": "Process"
  },
  {
    "id": "36",
    "name": "Fasilitas Lift (Tombol, Interior lift, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Lift kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "37",
    "name": "Fasilitas Musholla (Tempat wudhu, Peralatan sholat, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Musholla kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "38",
    "name": "Fasilitas Nursery Room (Meja ganti, Wastafel, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Nursery Room kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "39",
    "name": "Fasilitas Praying Room (Tempat wudhu, Peralatan sholat, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Praying Room kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "40",
    "name": "Fasilitas SCP (X - Ray, Tray, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Security Check Point kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "41",
    "name": "Fasilitas Toilet (Toilet bowl, Tisu, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Toilet kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "42",
    "name": "Fasilitas Toilet\u00a0 (Toilet bowl, tisu, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Toilet kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "43",
    "name": "Kebersihan area musholla-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Musholla kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "44",
    "name": "Kebersihan area toilet-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Toilet kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "45",
    "name": "Kebersihan, Kenyamanan, Keamanan dan Alur parkir-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Parkiran kami",
    "defaultCategory": "Process"
  },
  {
    "id": "46",
    "name": "Kebersihan, Kenyamanan, Keamanan, dan Kecepatan Antre-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Angkutan Keliling - {KETERANGAN FASILITAS}  kami",
    "defaultCategory": "Process"
  },
  {
    "id": "47",
    "name": "Kebersihan, Kenyamanan, Keamanan, dan Kecepatan Antre-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Angkutan Keliling kami",
    "defaultCategory": "Process"
  },
  {
    "id": "48",
    "name": "Kebersihan, Kenyamanan, Keamanan, dan Kecepatan Antre-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Shuttle kami",
    "defaultCategory": "Process"
  },
  {
    "id": "49",
    "name": "Kebersihan, Kenyamanan, Keamanan, dan Kemudahan Akses-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Kereta Gantung kami",
    "defaultCategory": "Process"
  },
  {
    "id": "50",
    "name": "Kebersihan, Kenyamanan, dan Alur Museum-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Museum kami",
    "defaultCategory": "Process"
  },
  {
    "id": "51",
    "name": "Kebersihan, Kenyamanan, dan Keamanan-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Toilet kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "52",
    "name": "Kebersihan, Kenyamanan, dan Keamanan-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di {KETERANGAN FASILITAS} kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "53",
    "name": "Kebersihan, Kenyamanan, dan Keamanan-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di {TIPE FASILITAS} kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "54",
    "name": "Kebersihan, Kenyamanan, dan Keamanan-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di{KETERANGAN FASILITAS} kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "55",
    "name": "Kebersihan, Kenyamanan, dan Kemudahan Akses Informasi-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Information Center kami",
    "defaultCategory": "Process"
  },
  {
    "id": "56",
    "name": "Kebersihan, Kenyamanan, dan Kemudahan Akses-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Halte kami",
    "defaultCategory": "Process"
  },
  {
    "id": "57",
    "name": "Kebersihan, Kenyamanan, dan Kemudahan Akses-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Merchandise Store kami",
    "defaultCategory": "Process"
  },
  {
    "id": "58",
    "name": "Kebersihan, Kenyamanan, dan Kemudahan Akses-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Shuttle kami",
    "defaultCategory": "Process"
  },
  {
    "id": "59",
    "name": "Kebersihan, Kenyamanan, dan Keteraturan Alur Tunggu Shelter-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Shelter kami",
    "defaultCategory": "Process"
  },
  {
    "id": "60",
    "name": "Kebersihan, Kenyamanan, dan Keterawatan Nursery Room-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Nursery Room kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "61",
    "name": "Kebersihan, Kenyamanan, dan Opsi Pembayaran-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di {KETERANGAN FASILITAS} kami",
    "defaultCategory": "Process"
  },
  {
    "id": "62",
    "name": "Kecepatan antrean kasir-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Kasir kami",
    "defaultCategory": "Process"
  },
  {
    "id": "63",
    "name": "Kecepatan dan Prosedur Keamanan Layanan-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Pos Security kami",
    "defaultCategory": "Process"
  },
  {
    "id": "64",
    "name": "Kecepatan proses pembayaran di kasir-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Kasir kami",
    "defaultCategory": "Process"
  },
  {
    "id": "65",
    "name": "Kecukupan/antrean fasilitas toilet-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Toilet kami",
    "defaultCategory": "Process"
  },
  {
    "id": "66",
    "name": "Kejelasan informasi pembayaran (harga, promo, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Kasir kami",
    "defaultCategory": "Process"
  },
  {
    "id": "67",
    "name": "Kejelasan informasi program Sarinah Club-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Kasir kami",
    "defaultCategory": "Process"
  },
  {
    "id": "68",
    "name": "Kelengkapan dan Ketersediaan Fasilitas-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Halte kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "69",
    "name": "Kelengkapan dan Ketersediaan Fasilitas-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Information Center kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "70",
    "name": "Kelengkapan dan Ketersediaan Fasilitas-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Kereta Gantung kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "71",
    "name": "Kelengkapan dan Ketersediaan Fasilitas-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Museum kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "72",
    "name": "Kelengkapan dan Ketersediaan Fasilitas-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Nursery Room kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "73",
    "name": "Kelengkapan dan Ketersediaan Fasilitas-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Shelter kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "74",
    "name": "Kelengkapan dan Ketersediaan Fasilitas-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Shuttle kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "75",
    "name": "Kelengkapan dan Ketersediaan Fasilitas-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Toilet kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "76",
    "name": "Kelengkapan dan Ketersediaan Fasilitas-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di {KETERANGAN FASILITAS} kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "77",
    "name": "Kelengkapan dan Ketersediaan Fasilitas-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di {TIPE FASILITAS} kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "78",
    "name": "Kelengkapan dan Ketersediaan Fasilitas-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di{KETERANGAN FASILITAS} kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "79",
    "name": "Kelengkapan dan Ketersediaan Sarana Keamanan-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Pos Security kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "80",
    "name": "Kelengkapan fasilitas Musholla (tempat wudhu, loker penyimpanan barang)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Musholla kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "81",
    "name": "Kelengkapan fasilitas pendukung (sabun, tisu, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Toilet kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "82",
    "name": "Kelengkapan fasilitas, Ketersediaan, Rasa dan Kualitas Produk-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di {KETERANGAN FASILITAS} kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "83",
    "name": "Kemudahan Pengambilan Foto, Durasi Pemrosesan Foto, dan Kebersihan Tempat Pengambilan Foto-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Pos Pengambilan Foto kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "84",
    "name": "Kenyamanan Musholla untuk beribadah-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Musholla kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "85",
    "name": "Kenyamanan penggunaan fasilitas toilet-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Toilet kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "86",
    "name": "Ketersediaan Tempat Parkir-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Parkiran kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "87",
    "name": "Ketersediaan dan Kelengkapan Angkutan Keliling-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Angkutan Keliling - {KETERANGAN FASILITAS}  kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "88",
    "name": "Ketersediaan dan Kelengkapan Angkutan Keliling-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Angkutan Keliling kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "89",
    "name": "Ketersediaan dan Kelengkapan Shuttle-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Shuttle kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "90",
    "name": "Ketersediaan perlengkapan ibadah (sarung, mukena, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Musholla kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "91",
    "name": "Kualitas Foto dan Harga layanan-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Pos Pengambilan Foto kami",
    "defaultCategory": "Premises"
  },
  {
    "id": "92",
    "name": "NPS",
    "defaultCategory": "Overall"
  },
  {
    "id": "93",
    "name": "Overall CSAT",
    "defaultCategory": "Overall"
  },
  {
    "id": "94",
    "name": "Overall Satisfaction",
    "defaultCategory": "Overall"
  },
  {
    "id": "95",
    "name": "Pelayanan petugas kasir-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Kasir kami",
    "defaultCategory": "People"
  },
  {
    "id": "96",
    "name": "Pelayanan petugas kebersihan toilet-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Toilet kami",
    "defaultCategory": "People"
  },
  {
    "id": "97",
    "name": "Pelayanan petugas musholla-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Musholla kami",
    "defaultCategory": "People"
  },
  {
    "id": "98",
    "name": "People CSAT",
    "defaultCategory": "Overall"
  },
  {
    "id": "99",
    "name": "People-3PS",
    "defaultCategory": "Overall"
  },
  {
    "id": "100",
    "name": "People-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di layanan kami",
    "defaultCategory": "Overall"
  },
  {
    "id": "101",
    "name": "Process CSAT",
    "defaultCategory": "Overall"
  },
  {
    "id": "102",
    "name": "Process-3PS",
    "defaultCategory": "Overall"
  },
  {
    "id": "103",
    "name": "Process-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di layanan kami",
    "defaultCategory": "Overall"
  },
  {
    "id": "104",
    "name": "Product or Premise CSAT",
    "defaultCategory": "Overall"
  },
  {
    "id": "105",
    "name": "Product or Premises-3PS",
    "defaultCategory": "Overall"
  },
  {
    "id": "106",
    "name": "Product or Premises-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di layanan kami",
    "defaultCategory": "Overall"
  },
  {
    "id": "107",
    "name": "Product/Premise-3PS",
    "defaultCategory": "Overall"
  },
  {
    "id": "108",
    "name": "Proses & Alur Transaksi-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Kasir kami",
    "defaultCategory": "Process"
  },
  {
    "id": "109",
    "name": "Proses & Pengelolaan Lift-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Lift kami",
    "defaultCategory": "Process"
  },
  {
    "id": "110",
    "name": "Proses dan Alur Check-In-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Check-In kami",
    "defaultCategory": "Process"
  },
  {
    "id": "111",
    "name": "Proses pemeriksaan dan Alur SCP-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Security Check Point kami",
    "defaultCategory": "Process"
  },
  {
    "id": "112",
    "name": "Seberapa besar kemungkinan Anda merekomendasikan{NAMA LOKASI} kepada teman atau kolega?",
    "defaultCategory": "Overall"
  },
  {
    "id": "113",
    "name": "Seberapa besar kemungkinan Anda merekomendasikan{NAMA LOKASI} untuk menjadi venue acara di masa mendatang?",
    "defaultCategory": "Overall"
  },
  {
    "id": "114",
    "name": "Seberapa nyamankah kamar Anda selama menginap?",
    "defaultCategory": "Overall"
  },
  {
    "id": "115",
    "name": "Seberapa puas Anda dengan keseluruhan pengalaman acara di{NAMA LOKASI}?",
    "defaultCategory": "Overall"
  },
  {
    "id": "116",
    "name": "Seberapa puas Anda dengan keseluruhan pengalaman selama menginap di {NAMA LOKASI}?",
    "defaultCategory": "Overall"
  },
  {
    "id": "117",
    "name": "Seberapa puas Anda dengan pelayanan dari staf sales kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "118",
    "name": "Seberapa puas Anda dengan pelayanan dari staf service kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "119",
    "name": "Seberapa puas Bapak / Ibu layanan Information Center kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "120",
    "name": "Seberapa puas Bapak / Ibu terhadap fasilitas Boarding Lounge kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "121",
    "name": "Seberapa puas Bapak / Ibu terhadap fasilitas Halte kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "122",
    "name": "Seberapa puas Bapak / Ibu terhadap fasilitas Kereta Gantung kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "123",
    "name": "Seberapa puas Bapak / Ibu terhadap fasilitas Lift kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "124",
    "name": "Seberapa puas Bapak / Ibu terhadap fasilitas Merchandise Store kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "125",
    "name": "Seberapa puas Bapak / Ibu terhadap fasilitas Museum kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "126",
    "name": "Seberapa puas Bapak / Ibu terhadap fasilitas Musholla kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "127",
    "name": "Seberapa puas Bapak / Ibu terhadap fasilitas Nursery Room kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "128",
    "name": "Seberapa puas Bapak / Ibu terhadap fasilitas Parkir kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "129",
    "name": "Seberapa puas Bapak / Ibu terhadap fasilitas Praying Room kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "130",
    "name": "Seberapa puas Bapak / Ibu terhadap fasilitas Shelter kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "131",
    "name": "Seberapa puas Bapak / Ibu terhadap fasilitas Shuttle kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "132",
    "name": "Seberapa puas Bapak / Ibu terhadap fasilitas Toilet kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "133",
    "name": "Seberapa puas Bapak / Ibu terhadap fasilitas {KETERANGAN FASILITAS} kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "134",
    "name": "Seberapa puas Bapak / Ibu terhadap layanan Angkutan Keliling (Angling) kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "135",
    "name": "Seberapa puas Bapak / Ibu terhadap layanan Angkutan Keliling - {KETERANGAN FASILITAS} kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "136",
    "name": "Seberapa puas Bapak / Ibu terhadap layanan Baggage Claim  kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "137",
    "name": "Seberapa puas Bapak / Ibu terhadap layanan Check-In kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "138",
    "name": "Seberapa puas Bapak / Ibu terhadap layanan Information Center kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "139",
    "name": "Seberapa puas Bapak / Ibu terhadap layanan Kasir kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "140",
    "name": "Seberapa puas Bapak / Ibu terhadap layanan Pengambilan Foto kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "141",
    "name": "Seberapa puas Bapak / Ibu terhadap layanan Pos Security kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "142",
    "name": "Seberapa puas Bapak / Ibu terhadap layanan Security Check Point (SCP) kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "143",
    "name": "Seberapa puas Bapak / Ibu terhadap layanan kuliner {KETERANGAN FASILITAS} kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "144",
    "name": "Seberapa puas Bapak / Ibu terhadap pelayanan di {KETERANGAN FASILITAS} kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "145",
    "name": "Seberapa puas Bapak / Ibu terhadap {TIPE FASILITAS} kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "146",
    "name": "Seberapa puaskah Anda dengan kejelasan dan ketepatan tagihan Anda?",
    "defaultCategory": "Overall"
  },
  {
    "id": "147",
    "name": "Seberapa puaskah Anda dengan keramahan staf kami selama Anda menginap?",
    "defaultCategory": "Overall"
  },
  {
    "id": "148",
    "name": "Seberapa puaskah Anda dengan kondisi dan kebersihan fasilitas hotel kami?",
    "defaultCategory": "Premises"
  },
  {
    "id": "149",
    "name": "Seberapa puaskah Anda dengan koneksi Wi-Fi di kamar Anda?",
    "defaultCategory": "Overall"
  },
  {
    "id": "150",
    "name": "Seberapa puaskah Anda dengan pengalaman kedatangan Anda?",
    "defaultCategory": "Overall"
  },
  {
    "id": "151",
    "name": "Seberapa puaskah Anda dengan pengalaman kepergian Anda?",
    "defaultCategory": "Overall"
  },
  {
    "id": "152",
    "name": "Seberapa puaskah Anda dengan suhu ruangan selama menginap?",
    "defaultCategory": "Overall"
  },
  {
    "id": "153",
    "name": "Secara keseluruhan bagaimanakah tingkat kepuasan Bapak / Ibu terhadap fasilitas Shuttle kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "154",
    "name": "Secara keseluruhan bagaimanakah tingkat kepuasan Bapak / Ibu terhadap {TIPE FASILITAS} kami?",
    "defaultCategory": "Overall"
  },
  {
    "id": "155",
    "name": "Staff (penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Toilet kami",
    "defaultCategory": "People"
  },
  {
    "id": "156",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Angkutan Keliling - {KETERANGAN FASILITAS}  kami",
    "defaultCategory": "People"
  },
  {
    "id": "157",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Angkutan Keliling kami",
    "defaultCategory": "People"
  },
  {
    "id": "158",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Baggage Claim kami",
    "defaultCategory": "People"
  },
  {
    "id": "159",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Boarding Lounge kami",
    "defaultCategory": "People"
  },
  {
    "id": "160",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Check-In kami",
    "defaultCategory": "People"
  },
  {
    "id": "161",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Halte kami",
    "defaultCategory": "People"
  },
  {
    "id": "162",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Information Center kami",
    "defaultCategory": "People"
  },
  {
    "id": "163",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Kasir kami",
    "defaultCategory": "People"
  },
  {
    "id": "164",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Kereta Gantung kami",
    "defaultCategory": "People"
  },
  {
    "id": "165",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Lift kami",
    "defaultCategory": "People"
  },
  {
    "id": "166",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Merchandise Store kami",
    "defaultCategory": "People"
  },
  {
    "id": "167",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Museum kami",
    "defaultCategory": "People"
  },
  {
    "id": "168",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Musholla kami",
    "defaultCategory": "People"
  },
  {
    "id": "169",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Nursery Room kami",
    "defaultCategory": "People"
  },
  {
    "id": "170",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Parkiran kami",
    "defaultCategory": "People"
  },
  {
    "id": "171",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Pos Pengambilan Foto kami",
    "defaultCategory": "People"
  },
  {
    "id": "172",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Pos Security kami",
    "defaultCategory": "People"
  },
  {
    "id": "173",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Security Check Point kami",
    "defaultCategory": "People"
  },
  {
    "id": "174",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Shelter kami",
    "defaultCategory": "People"
  },
  {
    "id": "175",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Shuttle kami",
    "defaultCategory": "People"
  },
  {
    "id": "176",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Toilet kami",
    "defaultCategory": "People"
  },
  {
    "id": "177",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di layanan Information Center kami",
    "defaultCategory": "People"
  },
  {
    "id": "178",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di {KETERANGAN FASILITAS} kami",
    "defaultCategory": "People"
  },
  {
    "id": "179",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di {TIPE FASILITAS} kami",
    "defaultCategory": "People"
  },
  {
    "id": "180",
    "name": "Staff dan Petugas (Penampilan, keramahan, dll)-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di{KETERANGAN FASILITAS} kami",
    "defaultCategory": "People"
  },
  {
    "id": "181",
    "name": "Variasi dan Ketersediaan Produk-Berikan penilaian Anda terhadap kepuasan Anda dengan hal-hal berikut di Merchandise Store kami",
    "defaultCategory": "Premises"
  }
];

export default function DriverClassificationManager() {
  const [rules, setRules] = useState<ClassificationRule>(DEFAULT_RULES);
  const [newPplTag, setNewPplTag] = useState('');
  const [newPrcTag, setNewPrcTag] = useState('');
  const [newPrmTag, setNewPrmTag] = useState('');
  const [testText, setTestText] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('csat_driver_classification_rules');
      if (stored) {
        setRules(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const saveRules = (updated: ClassificationRule) => {
    setRules(updated);
    try {
      localStorage.setItem('csat_driver_classification_rules', JSON.stringify(updated));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {}
  };

  const addTag = (pillar: 'ppl' | 'prc' | 'prm', val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (!trimmed) return;
    if (pillar === 'ppl' && !rules.pplKeywords.includes(trimmed)) {
      saveRules({ ...rules, pplKeywords: [...rules.pplKeywords, trimmed] });
      setNewPplTag('');
    } else if (pillar === 'prc' && !rules.prcKeywords.includes(trimmed)) {
      saveRules({ ...rules, prcKeywords: [...rules.prcKeywords, trimmed] });
      setNewPrcTag('');
    } else if (pillar === 'prm' && !rules.prmKeywords.includes(trimmed)) {
      saveRules({ ...rules, prmKeywords: [...rules.prmKeywords, trimmed] });
      setNewPrmTag('');
    }
  };

  const removeTag = (pillar: 'ppl' | 'prc' | 'prm', tag: string) => {
    if (pillar === 'ppl') {
      saveRules({ ...rules, pplKeywords: rules.pplKeywords.filter(t => t !== tag) });
    } else if (pillar === 'prc') {
      saveRules({ ...rules, prcKeywords: rules.prcKeywords.filter(t => t !== tag) });
    } else if (pillar === 'prm') {
      saveRules({ ...rules, prmKeywords: rules.prmKeywords.filter(t => t !== tag) });
    }
  };

  const handleOverride = (questionName: string, category: 'Overall' | 'People' | 'Process' | 'Premises') => {
    saveRules({
      ...rules,
      overrides: { ...rules.overrides, [questionName]: category }
    });
  };

  const classifyText = (text: string) => {
    if (!text.trim()) return null;
    const l = text.toLowerCase();
    const matchesPpl = rules.pplKeywords.filter(k => l.includes(k));
    const matchesPrc = rules.prcKeywords.filter(k => l.includes(k));
    const matchesPrm = rules.prmKeywords.filter(k => l.includes(k));

    if (matchesPpl.length >= matchesPrc.length && matchesPpl.length >= matchesPrm.length && matchesPpl.length > 0) {
      return { category: 'People', color: '#6366f1', matches: matchesPpl };
    }
    if (matchesPrc.length >= matchesPrm.length && matchesPrc.length > 0) {
      return { category: 'Process', color: '#06b6d4', matches: matchesPrc };
    }
    if (matchesPrm.length > 0) {
      return { category: 'Premises', color: '#ec4899', matches: matchesPrm };
    }
    return { category: 'Unclassified', color: '#94a3b8', matches: [] };
  };

  const testResult = classifyText(testText);

  return (
    <div className="space-y-6 animate-in">
      {/* Top Banner */}
      <div className="glass-card flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/20">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            ⚙️ Driver Question Classification Manager
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Configure keyword rules and manual overrides to classify survey headers into People, Process, and Premises.
          </p>
        </div>
        {savedSuccess && (
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold animate-in">
            ✓ Rules Saved!
          </span>
        )}
      </div>

      {/* 3 Pillars Keyword Rules Config */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* People */}
        <div className="glass-card border-indigo-500/30 bg-indigo-500/5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">👥</span>
            <div>
              <h3 className="text-sm font-bold text-indigo-400">1. People (PPL) Keywords</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Staff, service attitude & hospitality</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3 min-h-[60px]">
            {rules.pplKeywords.map(k => (
              <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {k}
                <button onClick={() => removeTag('ppl', k)} className="hover:text-red-400 font-bold ml-1">✕</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPplTag}
              onChange={e => setNewPplTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTag('ppl', newPplTag)}
              placeholder="Add keyword..."
              className="flex-1 text-xs rounded-lg px-2.5 py-1.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)]"
            />
            <button onClick={() => addTag('ppl', newPplTag)} className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">
              + Add
            </button>
          </div>
        </div>

        {/* Process */}
        <div className="glass-card border-cyan-500/30 bg-cyan-500/5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🔄</span>
            <div>
              <h3 className="text-sm font-bold text-cyan-400">2. Process (PRC) Keywords</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Workflow, queue speed & procedures</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3 min-h-[60px]">
            {rules.prcKeywords.map(k => (
              <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {k}
                <button onClick={() => removeTag('prc', k)} className="hover:text-red-400 font-bold ml-1">✕</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPrcTag}
              onChange={e => setNewPrcTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTag('prc', newPrcTag)}
              placeholder="Add keyword..."
              className="flex-1 text-xs rounded-lg px-2.5 py-1.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)]"
            />
            <button onClick={() => addTag('prc', newPrcTag)} className="px-3 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg">
              + Add
            </button>
          </div>
        </div>

        {/* Premises */}
        <div className="glass-card border-pink-500/30 bg-pink-500/5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🏢</span>
            <div>
              <h3 className="text-sm font-bold text-pink-400">3. Premises (PRM) Keywords</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Facilities, cleanliness & physical setup</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3 min-h-[60px]">
            {rules.prmKeywords.map(k => (
              <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {k}
                <button onClick={() => removeTag('prm', k)} className="hover:text-red-400 font-bold ml-1">✕</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPrmTag}
              onChange={e => setNewPrmTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTag('prm', newPrmTag)}
              placeholder="Add keyword..."
              className="flex-1 text-xs rounded-lg px-2.5 py-1.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)]"
            />
            <button onClick={() => addTag('prm', newPrmTag)} className="px-3 py-1.5 text-xs font-medium bg-pink-600 hover:bg-pink-500 text-white rounded-lg">
              + Add
            </button>
          </div>
        </div>
      </div>

      {/* Simulator / Test Tool */}
      <div className="glass-card bg-gradient-to-r from-slate-900/40 to-slate-800/40">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">🧪 Real-time Question Classifier Simulator</h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={testText}
            onChange={e => setTestText(e.target.value)}
            placeholder="Type any question prompt e.g., 'Kejelasan informasi di area lift'..."
            className="flex-1 text-xs rounded-lg px-3 py-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)]"
          />
          {testResult && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold" style={{ borderColor: testResult.color, color: testResult.color }}>
              <span>Category: {testResult.category}</span>
              {testResult.matches.length > 0 && (
                <span className="text-[10px] font-normal text-[var(--text-muted)]">
                  (Matched: {testResult.matches.join(', ')})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Question Header Overrides Table */}
      <div className="glass-card !p-0 overflow-hidden">
        <div className="p-4 border-b border-[var(--glass-border)] bg-[var(--bg-secondary)] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Discovered Question Headers & Manual Overrides</h3>
            <p className="text-[11px] text-[var(--text-muted)]">Override default classification for specific survey question headers</p>
          </div>
          <button
            onClick={() => saveRules(DEFAULT_RULES)}
            className="text-xs px-3 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
          >
            Reset to Defaults
          </button>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--glass-border)] bg-[var(--bg-secondary)]">
              <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase">#</th>
              <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase">Survey Question Header</th>
              <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase">Default Class</th>
              <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase">Active Pillar Assignment</th>
            </tr>
          </thead>
          <tbody>
            {DISCOVERED_QUESTIONS.map((q, idx) => {
              const activeCategory = rules.overrides[q.name] || q.defaultCategory;
              return (
                <tr key={q.id} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors">
                  <td className="p-3 text-xs text-[var(--text-muted)]">{idx + 1}</td>
                  <td className="p-3 font-medium text-xs text-[var(--text-primary)]">{q.name}</td>
                  <td className="p-3 text-xs text-[var(--text-muted)]">{q.defaultCategory}</td>
                  <td className="p-3">
                    <select
                      value={activeCategory}
                      onChange={e => handleOverride(q.name, e.target.value as any)}
                      className="text-xs font-semibold rounded-lg px-2.5 py-1 border bg-[var(--glass-bg)]"
                      style={{
                        color: activeCategory === 'Overall' ? '#eab308' : activeCategory === 'People' ? '#6366f1' : activeCategory === 'Process' ? '#06b6d4' : '#ec4899',
                        borderColor: activeCategory === 'Overall' ? '#eab30840' : activeCategory === 'People' ? '#6366f140' : activeCategory === 'Process' ? '#06b6d440' : '#ec489940'
                      }}
                    >
                      <option value="Overall">🌟 Overall CSAT</option>
                      <option value="People">👥 People (PPL)</option>
                      <option value="Process">🔄 Process (PRC)</option>
                      <option value="Premises">🏢 Premises (PRM)</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
