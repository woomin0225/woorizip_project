import React from 'react';
import CategoryForm from '../../components/form/CategoryForm';
import styles from './FacilityCategoryPage.module.css';

export default function FacilityCategoryFormPage() {
  return (
    <main className={styles.categoryPage}>
      <CategoryForm />
    </main>
  );
}