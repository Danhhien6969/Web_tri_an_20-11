export default function TributeLetter({item}) {
 return <article className="tribute-letter">
  <header className="letter-heading">
   <div className="letter-logos"><img src="/logo-doan.png" alt="Đoàn Thanh niên" width="527" height="558"/><img src="/logo-hutech.png" alt="HUTECH University" width="515" height="595"/><img src="/logo-hoi.png" alt="Hội Sinh viên Việt Nam" width="554" height="554"/></div>
   <p className="letter-kicker">LỜI TRI ÂN · 20/11</p>
   <p className="letter-script">Từ trái tim người học trò</p>
   <div className="letter-recipient"><p>Kính gửi Thầy/Cô</p><h2>{item.teacher}</h2>{item.teacherDepartment&&<span>{item.teacherDepartment}</span>}</div>
  </header>
  <div className="letter-message">{item.message}</div>
  {item.image&&<figure className="letter-memory"><img src={item.image} alt={`Ảnh kỷ niệm trong lời tri ân của ${item.sender}`} /><figcaption>Một kỷ niệm, một lời cảm ơn.</figcaption></figure>}
  <footer className="letter-signature"><span className="letter-signature-heart" aria-hidden="true">♡</span><div><span className="letter-signature-label">Trân trọng gửi từ</span><p>{item.sender}</p>{item.senderDepartment&&<span className="letter-unit">Đơn vị: {item.senderDepartment}</span>}</div></footer>
 </article>;
}
