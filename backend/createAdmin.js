require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function main() {
await mongoose.connect(process.env.MONGODB_URI);

  const existing = await User.findOne({ phone: '<your-phone>' });
  if (existing) { console.log('User already exists'); process.exit(0); }

  const user = new User({
    name: '<your-name>',
    phone: '<your-phone>',
    password: '<your-password>',
    role: 'admin',
  });
  await user.save();
  console.log('Admin created:', user._id);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
