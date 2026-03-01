require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Service = require('../models/Service');
const User = require('../models/User');

const DEMO_SERVICES = [
  { name: 'Royal Feasts Catering', category: 'Catering', location: 'Banjara Hills, Hyderabad', price: 18000, owner: 'Rajesh Kumar', mobile: '+91 98765 11001', desc: 'Premium buffet catering with multi-cuisine menu for all occasions. Expert chefs, live counters available.', invite: 'You are warmly invited to an extraordinary culinary experience!', photos: ['🍽️','🥘','🍰','🎂','🥗','🍛'], additional: 'Veg & Non-Veg options. Min 50 guests. Service staff included.', rating: 4.5, ratingCount: 23 },
  { name: 'Pixel Perfect Photography', category: 'Photography', location: 'Jubilee Hills, Hyderabad', price: 12000, owner: 'Ananya Sharma', mobile: '+91 98765 11002', desc: 'Award-winning event photographers capturing candid and portrait moments. Drone shots available.', invite: 'Let us capture your precious memories forever!', photos: ['📸','🎬','🖼️','📷','🎥','🌅'], additional: '2 photographers + 1 videographer. Edited album in 7 days.', rating: 4.8, ratingCount: 45 },
  { name: 'Dream Decor Studio', category: 'Decoration', location: 'Madhapur, Hyderabad', price: 8500, owner: 'Priya Reddy', mobile: '+91 98765 11003', desc: 'Transform any venue into a magical celebration space with floral, balloon, and theme decor.', invite: 'Let us create a magical atmosphere for your special day!', photos: ['🌸','🎀','🎊','🌺','✨','💐'], additional: 'Theme-based decoration. Setup & cleanup included.', rating: 4.6, ratingCount: 31 },
  { name: 'Birthday Blast Events', category: 'Birthday Party', location: 'Gachibowli, Hyderabad', price: 6000, owner: 'Suresh Pillai', mobile: '+91 98765 11004', desc: 'Complete birthday packages — cake, decor, games, entertainment, and photo booth all included.', invite: 'Join us for a spectacular birthday celebration!', photos: ['🎂','🎈','🎉','🎁','🎊','🥳'], additional: 'Kids & Adult packages. Customizable themes.', rating: 4.3, ratingCount: 18 },
  { name: 'Grand Palace Banquet', category: 'Venue', location: 'Kondapur, Hyderabad', price: 45000, owner: 'Mohammed Ali', mobile: '+91 98765 11005', desc: 'Luxury banquet hall accommodating 500+ guests. State-of-the-art AV system and elegant interiors.', invite: 'We cordially invite you to our grand celebration hall!', photos: ['🏛️','🌟','💫','🎭','✨','🏰'], additional: 'AC hall, parking for 200 cars. In-house catering available.', rating: 4.7, ratingCount: 62 },
  { name: 'Glam Studio MUA', category: 'Makeup', location: 'Ameerpet, Hyderabad', price: 3500, owner: 'Kavitha Nair', mobile: '+91 98765 11006', desc: 'Professional bridal, party, and fashion makeup by certified MUA with 8+ years experience.', invite: 'Look radiant and beautiful for your special occasion!', photos: ['💄','💅','👄','💋','🌸','✨'], additional: 'Home visits available. Trials at ₹500 extra.', rating: 4.9, ratingCount: 89 },
  { name: 'Bass Drop Entertainment', category: 'Music & DJ', location: 'Kukatpally, Hyderabad', price: 9000, owner: 'DJ Rohan Mehta', mobile: '+91 98765 11007', desc: 'Professional DJ with premium sound system. Bollywood, EDM, and folk music on request.', invite: 'Get ready to dance the night away!', photos: ['🎵','🎶','🎤','🎸','🎹','🎺'], additional: 'Sound system & lighting included. 6-hour booking minimum.', rating: 4.5, ratingCount: 27 },
  { name: 'Magic Moments Shows', category: 'Entertainment', location: 'LB Nagar, Hyderabad', price: 5500, owner: 'Circus Fun Events', mobile: '+91 98765 11008', desc: 'Magic shows, clown acts, photo booth, caricature artists, and live games for all ages.', invite: 'Fun and laughter guaranteed for everyone!', photos: ['🎪','🎭','🎩','🃏','🎡','🎠'], additional: 'Suitable for kids 3+. Custom corporate packages.', rating: 4.2, ratingCount: 15 },
];

const seed = async () => {
  await connectDB();

  // Drop any stale geospatial index on the 'location' field
  try {
    const indexes = await Service.collection.indexes();
    for (const idx of indexes) {
      if (idx.key && idx.key.location && idx.name !== '_id_') {
        await Service.collection.dropIndex(idx.name);
        console.log(`🗑  Dropped geo index: ${idx.name}`);
      }
    }
  } catch (e) {
    // Ignore if collection doesn't exist yet
  }

  // Create a demo vendor
  let vendor = await User.findOne({ email: 'demo_vendor@celebratehub.com' });
  if (!vendor) {
    vendor = await User.create({
      username: 'Demo Vendor',
      email: 'demo_vendor@celebratehub.com',
      mobile: '+91 99999 00000',
      role: 'vendor',
      isVerified: true,
    });
    console.log('✅ Demo vendor created.');
  }

  const existing = await Service.countDocuments();
  if (existing > 0) {
    console.log('ℹ️  Services already seeded. Skipping.');
    process.exit(0);
  }

  const services = DEMO_SERVICES.map((s) => ({ ...s, vendorId: vendor._id }));
  await Service.insertMany(services);
  console.log(`✅ ${services.length} demo services seeded.`);
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
