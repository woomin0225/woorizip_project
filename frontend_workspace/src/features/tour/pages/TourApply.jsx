import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import { createTour } from '../api/tourAPI';
import { getRoom, getRoomImages } from '../../houseAndRoom/api/roomApi';
import { getMyInfo } from '../../user/api/userAPI';
import styles from './TourApply.module.css';

function getTodayLocalIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function TourApply() {
  const { roomNo } = useParams();
  const [message, setMessage] = useState('');
  const [room, setRoom] = useState(null);
  const [thumb, setThumb] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', inquiry: '' });

  const timeSlots = useMemo(
    () => ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
    []
  );
  const minDate = useMemo(() => getTodayLocalIso(), []);

  useEffect(() => {
    if (!roomNo) return;

    (async () => {
      try {
        const roomDto = await getRoom(roomNo);
        setRoom(roomDto || null);
      } catch {
        setMessage('방 정보를 불러오지 못했습니다.');
      }
    })();
  }, [roomNo]);

  useEffect(() => {
    if (!roomNo) return;

    (async () => {
      try {
        const images = await getRoomImages(roomNo);
        const first = Array.isArray(images) && images.length > 0 ? images[0] : null;
        const imageName =
          first?.imageName ||
          first?.storedImageName ||
          first?.fileName ||
          first?.roomImageName ||
          '';
        setThumb(imageName ? `/upload_files/room_image/${imageName}` : '');
      } catch {
        setThumb('');
      }
    })();
  }, [roomNo]);

  useEffect(() => {
    (async () => {
      try {
        const info = await getMyInfo();
        setForm((prev) => ({
          ...prev,
          name: info?.name || '',
          phone: info?.phone || info?.phoneNumber || info?.phone_number || '',
        }));
      } catch {
        // 내정보 조회 실패 시 직접 입력으로 대체
      }
    })();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!roomNo) {
      setMessage('방 번호가 없습니다.');
      return;
    }
    if (!selectedDate) {
      setMessage('투어 날짜를 선택해 주세요.');
      return;
    }
    if (!selectedTime) {
      setMessage('투어 시간을 선택해 주세요.');
      return;
    }
    if (!form.name.trim() || !form.phone.trim()) {
      setMessage('이름과 전화번호를 입력해 주세요.');
      return;
    }

    const tourDate = `${selectedDate} ${selectedTime}`;

    try {
      setIsSubmitting(true);
      await createTour(roomNo, { tourDate });
      setMessage('투어 신청이 완료되었습니다.');
      setForm((prev) => ({ ...prev, inquiry: '' }));
    } catch (e2) {
      setMessage(e2.message || '투어 신청 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.page}>
      <Container>
        <Row className="justify-content-center">
          <Col lg="9">
            <Card className="shadow border-0">
              <CardBody>
                <h2 className={styles.title}>투어 신청</h2>

                <div className={styles.roomSummary}>
                  <div className={styles.roomImageWrap}>
                    {thumb ? (
                      <img className={styles.roomImage} src={thumb} alt="방 대표 이미지" />
                    ) : (
                      <div className={styles.noImage}>대표 이미지 없음</div>
                    )}
                  </div>
                  <div className={styles.roomInfo}>
                    <h3>{room?.roomName || `방 #${roomNo || '-'}`}</h3>
                    <p>{room?.roomAbstract || '선택한 방의 투어를 신청해 보세요.'}</p>
                    <div className={styles.metaRow}>
                      <span>거래: {room?.roomMethod || '-'}</span>
                      <span>월세: {room?.roomMonthly || '-'}</span>
                      <span>면적: {room?.roomArea || '-'}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={onSubmit}>
                  <label className={styles.label}>투어 희망 날짜</label>
                  <input
                    className={styles.input}
                    type="date"
                    value={selectedDate}
                    min={minDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime('');
                    }}
                  />

                  {selectedDate && (
                    <>
                      <label className={styles.label}>투어 희망 시간</label>
                      <div className={styles.timeSlots}>
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            type="button"
                            className={`${styles.timeBtn} ${selectedTime === time ? styles.timeBtnActive : ''}`}
                            onClick={() => setSelectedTime(time)}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <label className={styles.label}>이름</label>
                  <input
                    className={styles.input}
                    placeholder="이름"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />

                  <label className={styles.label}>전화번호</label>
                  <input
                    className={styles.input}
                    placeholder="전화번호"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />

                  <label className={styles.label}>문의사항</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="문의사항을 입력해 주세요. (선택)"
                    value={form.inquiry}
                    onChange={(e) => setForm({ ...form, inquiry: e.target.value })}
                  />

                  <button className={styles.btn} type="submit" disabled={isSubmitting}>
                    {isSubmitting ? '신청 중...' : '투어 신청하기'}
                  </button>
                </form>

                {message && <p className={styles.msg}>{message}</p>}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
