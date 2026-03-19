import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import MyPageSideNav from '../components/MyPageSideNav';
import { getMyInfo, updateMyInfo } from '../api/userAPI';
import styles from '../../../app/layouts/MyPageLayout.module.css';

function pickFirst(...values) {
  return values.find((v) => v !== undefined && v !== null && v !== '') || '';
}

function normalizeBirthDate(raw) {
  if (!raw) return '';
  const value = String(raw);
  return value.includes('T') ? value.split('T')[0] : value;
}

function calculateAge(birthDate) {
  if (!birthDate) return '-';
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return '-';

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age >= 0 ? String(age) : '-';
}

function normalizeType(type) {
  const t = String(type || '').toUpperCase();
  if (t === 'LANDLORD') return 'LESSOR';
  if (t === 'TENANT') return 'USER';
  return t || 'USER';
}

function normalizeGender(gender) {
  const g = String(gender || '').toUpperCase();
  if (g === 'MALE') return 'M';
  if (g === 'FEMALE') return 'F';
  return g || '';
}

export default function MyInfoModify() {
  const [form, setForm] = useState({
    emailId: '',
    name: '',
    phone: '',
    address: '',
    nickname: '',
    birthDate: '',
    gender: '',
    type: 'USER',
  });
  const [editable, setEditable] = useState({
    name: false,
    phone: false,
    address: false,
    nickname: false,
    type: false,
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    getMyInfo()
      .then((info) =>
        setForm({
          emailId: pickFirst(info?.emailId, info?.email_id, info?.email),
          name: info?.name || '',
          phone: pickFirst(info?.phone, info?.phoneNumber, info?.phone_number),
          address: pickFirst(info?.address, info?.addr, info?.roadAddress),
          nickname: pickFirst(info?.nickname, info?.nickName),
          birthDate: normalizeBirthDate(
            pickFirst(info?.birthDate, info?.birth_date)
          ),
          gender: normalizeGender(info?.gender),
          type: normalizeType(info?.type),
        })
      )
      .catch((e) => setMessage(e.message || '내정보 조회 실패'));
  }, []);

  const age = useMemo(() => calculateAge(form.birthDate), [form.birthDate]);

  const onChange = (key) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleEdit = (key) => {
    setEditable((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const onSave = async () => {
    try {
      const payload = {
        name: form.name?.trim(),
        phone: form.phone?.trim(),
        type: form.type || undefined,
      };

      Object.keys(payload).forEach((key) => {
        if (
          payload[key] === '' ||
          payload[key] === undefined ||
          payload[key] === null
        ) {
          delete payload[key];
        }
      });

      await updateMyInfo(payload);
      sessionStorage.setItem('userName', form.name?.trim() || '');
      localStorage.setItem('userName', form.name?.trim() || '');
      window.dispatchEvent(new Event('profile-updated'));
      setMessage('내정보가 수정되었습니다.');
      setEditable({
        name: false,
        phone: false,
        address: false,
        nickname: false,
        type: false,
      });
    } catch (e) {
      setMessage(e.message || '내정보 수정 실패');
    }
  };

  return (
    <>
      <section
        className={`section section-shaped section-lg ${styles.heroSection}`}
      >
        <div className="shape shape-style-1 bg-gradient-info">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>
      <section className={styles.contentSection}>
        <Container>
          <Row>
            <Col lg="3" className="mb-4">
              <Card className={`shadow border-0 ${styles.mainCard}`}>
                <CardBody>
                  <MyPageSideNav />
                </CardBody>
              </Card>
            </Col>
            <Col lg="9">
              <Card className={`shadow border-0 ${styles.mainCard}`}>
                <CardBody>
                  <div className={styles.headerRow}>
                    <h2 className={styles.title}>내정보 수정</h2>
                    <p className={styles.subTitle}>
                      오른쪽 수정 버튼을 눌러 항목별로 편집한 뒤 저장하세요.
                    </p>
                  </div>
                  <div className={styles.compactForm}>
                  <div className={styles.fieldRow}>
                    <p className={styles.fieldLabel}>이메일</p>
                    <div className={styles.fieldControl}>
                      <input
                        className={`${styles.input} ${styles.readOnlyInput}`}
                        value={form.emailId}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <p className={styles.fieldLabel}>이름</p>
                    <div className={styles.fieldControl}>
                      <input
                        className={`${styles.input} ${!editable.name ? styles.readOnlyInput : ''}`}
                        value={form.name}
                        onChange={onChange('name')}
                        disabled={!editable.name}
                      />
                    </div>
                    <button
                      type="button"
                      className={`${styles.inlineBtn} ${editable.name ? styles.inlineBtnActive : ''}`}
                      onClick={() => toggleEdit('name')}
                    >
                      {editable.name ? '완료' : '수정'}
                    </button>
                  </div>

                  <div className={styles.fieldRow}>
                    <p className={styles.fieldLabel}>휴대번호</p>
                    <div className={styles.fieldControl}>
                      <input
                        className={`${styles.input} ${!editable.phone ? styles.readOnlyInput : ''}`}
                        value={form.phone}
                        onChange={onChange('phone')}
                        disabled={!editable.phone}
                      />
                    </div>
                    <button
                      type="button"
                      className={`${styles.inlineBtn} ${editable.phone ? styles.inlineBtnActive : ''}`}
                      onClick={() => toggleEdit('phone')}
                    >
                      {editable.phone ? '완료' : '수정'}
                    </button>
                  </div>

                  <div className={styles.fieldRow}>
                    <p className={styles.fieldLabel}>주소</p>
                    <div className={styles.fieldControl}>
                      <input
                        className={`${styles.input} ${!editable.address ? styles.readOnlyInput : ''}`}
                        value={form.address}
                        onChange={onChange('address')}
                        disabled={!editable.address}
                      />
                    </div>
                    <button
                      type="button"
                      className={`${styles.inlineBtn} ${editable.address ? styles.inlineBtnActive : ''}`}
                      onClick={() => toggleEdit('address')}
                    >
                      {editable.address ? '완료' : '수정'}
                    </button>
                  </div>

                  <div className={styles.fieldRow}>
                    <p className={styles.fieldLabel}>닉네임</p>
                    <div className={styles.fieldControl}>
                      <input
                        className={`${styles.input} ${!editable.nickname ? styles.readOnlyInput : ''}`}
                        value={form.nickname}
                        onChange={onChange('nickname')}
                        disabled={!editable.nickname}
                      />
                    </div>
                    <button
                      type="button"
                      className={`${styles.inlineBtn} ${editable.nickname ? styles.inlineBtnActive : ''}`}
                      onClick={() => toggleEdit('nickname')}
                    >
                      {editable.nickname ? '완료' : '수정'}
                    </button>
                  </div>

                  <div className={styles.fieldRow}>
                    <p className={styles.fieldLabel}>생년월일</p>
                    <div className={styles.fieldControl}>
                      <input
                        className={`${styles.input} ${styles.readOnlyInput}`}
                        type="date"
                        value={form.birthDate}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <p className={styles.fieldLabel}>나이</p>
                    <div className={styles.fieldControl}>
                      <input
                        className={`${styles.input} ${styles.readOnlyInput}`}
                        value={age}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <p className={styles.fieldLabel}>성별</p>
                    <div className={styles.fieldControl}>
                      <select
                        className={`${styles.input} ${styles.readOnlyInput}`}
                        value={form.gender}
                        disabled
                      >
                        <option value="">성별 선택</option>
                        <option value="M">남성</option>
                        <option value="F">여성</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <p className={styles.fieldLabel}>회원유형</p>
                    <div className={styles.fieldControl}>
                      <select
                        className={`${styles.input} ${!editable.type ? styles.readOnlyInput : ''}`}
                        value={form.type}
                        onChange={onChange('type')}
                        disabled={!editable.type}
                      >
                        <option value="USER">사용자</option>
                        <option value="LESSOR">임대인</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      className={`${styles.inlineBtn} ${editable.type ? styles.inlineBtnActive : ''}`}
                      onClick={() => toggleEdit('type')}
                    >
                      {editable.type ? '완료' : '수정'}
                    </button>
                  </div>

                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={onSave}
                  >
                    저장
                  </button>
                  {message && (
                    <p className={styles.desc} style={{ marginTop: 10 }}>
                      {message}
                    </p>
                  )}
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
}
