import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const values = {
  whatsapp: "+971 56 893 4905",
  phone: "+226 76 95 00 89",
  email: "contact@tresorempire.com",
  address: "Ouagadougou, Burkina Faso",
};

for (const [key, value] of Object.entries(values)) {
  await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

console.log(await db.setting.findMany());
await db.$disconnect();
