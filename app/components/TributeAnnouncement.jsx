'use client';
import { useState } from 'react';
function Message(){return <>Mỗi độ tháng 11 về, trong không khí hân hoan của cả nước hướng về Ngày Nhà giáo Việt Nam 20/11, chúng ta lại lắng lòng mình để nhớ về những <strong>"người đưa đò"</strong> thầm lặng, những người đã và đang miệt mài <strong>gieo mầm tri thức</strong>, thắp lên ngọn lửa đam mê và chắp cánh ước mơ cho bao thế hệ học trò.</>;}
export default function TributeAnnouncement(){
 const [paused,setPaused]=useState(false);
 return <aside className={`tribute-announcement ${paused?'is-paused':''}`} aria-label="Thông điệp tri ân ngày Nhà giáo Việt Nam"><div className="announcement-window"><div className="announcement-track"><p><span aria-hidden="true" className="announcement-star">✦</span><Message/></p><p aria-hidden="true"><span className="announcement-star">✦</span><Message/></p></div></div><button type="button" onClick={()=>setPaused(value=>!value)} aria-label={paused?'Tiếp tục chạy thông điệp':'Tạm dừng thông điệp'} aria-pressed={paused} title={paused?'Tiếp tục':'Tạm dừng'}>{paused?'▶':'Ⅱ'}</button></aside>;
}
