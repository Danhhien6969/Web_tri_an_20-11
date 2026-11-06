import TributeConfetti from '../components/TributeConfetti';
export const metadata = { title: 'Những dấu ấn cùng Thầy, Cô — Từ trái tim người học trò', description: 'Diễn đàn chia sẻ những câu chuyện về thầy cô. Thời gian nộp bài: 05/11/2026 – 20/11/2026.' };
export default function ForumPage() {
  return <>
    <TributeConfetti heartsOnly />
    <header className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 border-b border-[#eeddc7] px-6 py-5"><a href="/" className="font-script text-3xl text-rose">Từ trái tim</a><nav aria-label="Điều hướng diễn đàn" className="flex flex-wrap gap-5 text-sm"><a href="/">Trang chủ</a><a href="/nhung-dau-an-thay-co" aria-current="page" className="font-semibold text-rose">Những dấu ấn cùng Thầy, Cô</a><a href="/#loi-tri-an">Lời tri ân</a></nav></header>
    <main className="mx-auto max-w-[1240px] pb-16">
      <h1 className="sr-only">Những dấu ấn cùng Thầy, Cô</h1>
      <img src="/forum-poster-optimized.webp" width="8677" height="2901" alt="Từ trái tim người học trò gửi đến Thầy Cô. Nhận bài từ 05/11 đến 20/11, tất cả tác giả, bài viết tối đa 1.500 từ." className="block h-auto w-full" fetchPriority="high" />
      <section className="px-6 py-12 text-center md:px-16 md:py-16" aria-labelledby="forum-info">
        <span className="text-xs font-semibold tracking-widest text-[#be7660]">NHỮNG DẤU ẤN CÙNG THẦY, CÔ</span>
        <h2 id="forum-info" className="mt-4 mb-7 font-display text-3xl text-rose md:text-4xl">Thông tin diễn đàn</h2>
        <div className="mx-auto max-w-4xl space-y-4 text-left text-sm leading-8 text-[#60362c] md:text-base">
          <p>Diễn đàn “Những dấu ấn cùng Thầy, Cô” là nơi chia sẻ những câu chuyện chân thực và kỷ niệm đáng nhớ về người thầy, người cô đã để lại dấu ấn trong cuộc đời mỗi người học trò.</p>
          <p>Một bài học mở ra cách nhìn mới, một lời động viên đúng lúc hay sự tận tâm qua từng buổi học đều có thể trở thành câu chuyện để gửi gắm lòng biết ơn. Qua những trải nghiệm của người viết, diễn đàn tôn vinh sự cống hiến của thầy cô và lan tỏa những điều đẹp đẽ trong tình thầy trò.</p>
          <p>Hãy kể lại dấu ấn của thầy cô bằng câu chuyện của chính bạn — như một lời cảm ơn nhân ngày Nhà giáo Việt Nam 20/11.</p>
        </div>
        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-[#efd6b2] bg-white/70 px-5 py-8"><p className="text-sm text-[#917867]">Thời gian nộp bài</p><p className="mt-3 text-xl font-bold text-rose md:text-2xl"><time dateTime="2026-11-05">05/11/2026</time> – <time dateTime="2026-11-20">20/11/2026</time></p><div className="mt-6 flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm"><p>Đối tượng: <strong>Tất cả tác giả</strong></p><p>Hình thức: <strong>Bài viết tối đa 1.500 từ</strong></p></div></div>
        <a href="/nhung-dau-an-thay-co/dang-ky" className="mt-8 inline-flex items-center gap-5 rounded-full bg-rose px-10 py-4 font-semibold text-white">Đăng ký tham gia <span aria-hidden="true">→</span></a>
      </section>
    </main>
  </>;
}
