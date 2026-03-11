// src/features/facility/pages/admin/CategoryPage.jsx
import React from 'react';
import CategoryList from '../../components/detail/CategoryList';
import styles from './FacilityCategoryPage.module.css';

export default function CategoryPage() {
  return (
    <main className={styles.categoryPage}>
      <CategoryList /> 
    </main>
  );
}