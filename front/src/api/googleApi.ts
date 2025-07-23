export const verifyGoogleToken = async (token: string) => {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
  );
  return response.json();
}; 