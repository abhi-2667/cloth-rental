const User = require('../models/User');
const Cloth = require('../models/Cloth');
const devStore = require('./devStore');

const migrateUsers = async () => {
  const userSummaries = devStore.listUsers();
  let inserted = 0;

  for (const summary of userSummaries) {
    const sourceUser = devStore.findUserByEmail(summary.email);
    if (!sourceUser) {
      continue;
    }

    const exists = await User.findOne({ email: sourceUser.email.toLowerCase() }).lean();
    if (exists) {
      continue;
    }

    await User.create({
      name: sourceUser.name,
      email: sourceUser.email.toLowerCase(),
      password: sourceUser.password,
      role: sourceUser.role || 'user',
      approvalStatus: sourceUser.approvalStatus || 'approved',
    });

    inserted += 1;
  }

  return inserted;
};

const migrateClothes = async () => {
  const clothes = devStore.listClothes();
  let inserted = 0;

  for (const cloth of clothes) {
    const exists = await Cloth.findOne({
      title: cloth.title,
      category: cloth.category,
      size: cloth.size,
    }).lean();

    if (exists) {
      continue;
    }

    await Cloth.create({
      title: cloth.title,
      description: cloth.description,
      category: cloth.category,
      size: cloth.size,
      pricePerDay: cloth.pricePerDay,
      availability: cloth.availability,
      imageUrl: cloth.imageUrl,
      occasion: cloth.occasion || cloth.category,
      gender: cloth.gender || 'unisex',
    });

    inserted += 1;
  }

  return inserted;
};

const seedMongoDemoDataIfEmpty = async () => {
  const [userCount, clothCount] = await Promise.all([
    User.countDocuments(),
    Cloth.countDocuments(),
  ]);

  if (userCount > 0 && clothCount > 0) {
    return { usersInserted: 0, clothesInserted: 0 };
  }

  await devStore.seedInventory();

  const [usersInserted, clothesInserted] = await Promise.all([
    userCount === 0 ? migrateUsers() : Promise.resolve(0),
    clothCount === 0 ? migrateClothes() : Promise.resolve(0),
  ]);

  return { usersInserted, clothesInserted };
};

module.exports = { seedMongoDemoDataIfEmpty };