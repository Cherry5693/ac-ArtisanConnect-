/*
  One-off migration script: copy ArtisanUser.address.zip -> address.zipCode when zipCode missing
  Usage: node scripts/migrate_zip_to_zipCode.js
  Ensure MONGODB_URI is set in environment or .env (same as backend index.js uses).
*/

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { ArtisanUser } = require('../models/model');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/artisanconnect';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB:', uri);

  const users = await ArtisanUser.find({ 'address.zip': { $exists: true }, $or: [{ 'address.zipCode': { $exists: false } }, { 'address.zipCode': null }] });
  console.log('Found', users.length, 'artisan users with legacy zip field');
  let updated = 0;
  for (const u of users) {
    try {
      u.address = u.address || {};
      u.address.zipCode = u.address.zip;
      await u.save();
      updated++;
    } catch (e) {
      console.error('Failed to update user', u._id, e.message);
    }
  }

  console.log('Migration complete. Updated', updated, 'documents.');
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed', err);
  process.exit(1);
});