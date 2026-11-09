import './globals.css';
import localFont from 'next/font/local';

const vietnameseSans = localFont({
  src: [
    { path: './fonts/be-vietnam-pro-400-normal.ttf', weight: '400', style: 'normal' },
    { path: './fonts/be-vietnam-pro-600-normal.ttf', weight: '600', style: 'normal' },
    { path: './fonts/be-vietnam-pro-700-normal.ttf', weight: '700', style: 'normal' }
  ],
  variable: '--font-vietnamese-sans', display: 'swap', fallback: ['Arial']
});
const vietnameseSerif = localFont({
  src: [
    { path: './fonts/noto-serif-500-normal.ttf', weight: '500', style: 'normal' },
    { path: './fonts/noto-serif-500-italic.ttf', weight: '500', style: 'italic' }
  ],
  variable: '--font-vietnamese-serif', display: 'swap', fallback: ['Georgia']
});
const handwriting = localFont({
  src: './fonts/dancing-script-700-normal.ttf', weight: '700',
  variable: '--font-handwriting', display: 'swap', preload: false
});
const title = 'Từ trái tim người học trò — Tri ân 20/11';
const description = 'Gửi đến thầy cô những lời tri ân từ trái tim người học trò nhân ngày Nhà giáo Việt Nam 20/11.';
const shareImage = {
  url: '/social-preview-20-11.jpg',
  width: 1200,
  height: 630,
  type: 'image/jpeg',
  alt: 'Từ trái tim người học trò gửi đến thầy cô nhân ngày 20/11'
};

export const metadata = {
  metadataBase: new URL('https://hutechloitrian.vn'),
  title,
  description,
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Từ trái tim người học trò',
    title,
    description,
    images: [shareImage]
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [shareImage]
  }
};
export default function RootLayout({ children }) {
  return <html lang="vi" className={`${vietnameseSans.variable} ${vietnameseSerif.variable} ${handwriting.variable}`}><body>{children}</body></html>;
}
