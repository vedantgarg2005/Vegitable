require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const existing = await User.findOne({ email: 'admin@sports.com' });
  if (existing) {
    console.log('Admin already exists. Email: admin@sports.com');
    process.exit(0);
  }

  const user = new User({
    name: 'Admin',
    email: 'admin@sports.com',
    phone: '9999999999',
    password: 'Admin@123',
    role: 'admin',
  });
  await user.save();
  console.log('✅ Admin created!\n  Email: admin@sports.com\n  Password: Admin@123');
  process.exit(0);
}

createAdmin().catch(err => { console.error(err.message); process.exit(1); });
