import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  if (!(await isAdmin())) {
    return new Response("Non autorisé", { status: 401 });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const file = path.join(os.tmpdir(), `tresor-empire-${Date.now()}.db`);

  try {
    await db.$executeRawUnsafe(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
    const buffer = await fs.readFile(file);
    await fs.unlink(file).catch(() => null);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="tresor-empire-${stamp}.db"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("backup", error);
    await fs.unlink(file).catch(() => null);
    return new Response("Sauvegarde impossible", { status: 500 });
  }
}
