import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <Script
          src="https://api-maps.yandex.ru/2.1/?apikey=718c3dc5-6c50-469a-886a-4ab165ea7876&suggest_apikey=b58e9c89-1936-4791-9b21-992744890054&lang=ru_RU"
          strategy="afterInteractive"
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
