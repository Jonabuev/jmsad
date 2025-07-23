import type { NextApiRequest, NextApiResponse } from "next";
import { verifyGoogleToken } from "@/api/googleApi";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { token } = req.body;

  // Проверка токена через Google API
  const data = await verifyGoogleToken(token);

  if (data.error_description) {
    return res.status(400).json({ message: "Invalid Token" });
  }

  // Обработка данных пользователя и сохранение в сессию
  return res.status(200).json({
    message: "Login successful",
    user: data,
  });
}
