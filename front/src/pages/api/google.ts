import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { token } = req.body;

  // Проверка токена через Google API
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
  );
  const data = await response.json();

  if (data.error_description) {
    return res.status(400).json({ message: "Invalid Token" });
  }

  // Обработка данных пользователя и сохранение в сессию
  return res.status(200).json({
    message: "Login successful",
    user: data,
  });
}
