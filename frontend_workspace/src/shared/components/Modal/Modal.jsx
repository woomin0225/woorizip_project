// src/components/common/Modal.js
// 리액트가 제공하는 'Potals' 이용한 모달 컴포넌트임
// 'Potals' 는 DOM 의 특정 노드로, React 컴포넌트 트리를 랜더링할 수 있도록 해 주는 기능임
// 랜더링 처리하는 컴포넌트 return ( 출력(랜더링)할 컴포넌트 작성 => DOM 트리 구성됨 );
// 'Potals' 는 별도로 작성된 컴포넌트를 특정 이벤트(click 등) 발생시 해당 페이지 DOM 트리에 끼워 넣는 기능임

import React from 'react';
import ReactDom from 'react-dom';
import styles from './Modal.module.css';

const Modal = ({ children, onClose }) => {
  return ReactDom.createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button onClick={onClose} className={styles.closeButton}>
          X
        </button>
        {children}
      </div>
    </div>,
    document.getElementById('portal-root') // Portals 를 사용할 DOM 노드
    // public/index.html 에 노드 추가 지정함
  );
};

export default Modal;
