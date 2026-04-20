import { cookies } from "next/headers";
import { verifyToken } from "./jwt";

export async function getServerSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return null;

    const decoded = verifyToken(token);
    return decoded as any;
  } catch (error) {
    return null;
  }
}
