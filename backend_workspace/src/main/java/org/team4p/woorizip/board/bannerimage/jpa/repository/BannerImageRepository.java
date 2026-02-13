package org.team4p.woorizip.board.bannerimage.jpa.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.board.bannerimage.jpa.entity.BannerImageEntity;

public interface BannerImageRepository extends JpaRepository<BannerImageEntity, Integer> {

	//이벤트 게시글로 배너 조회 =========================
	Optional<BannerImageEntity> findByPostNo(Integer postNo);
	
	//이벤트 배너별 배너 존재 여부 확인 =====================
	boolean existsByPostNo(Integer postNo);
	
	//메인페이지 슬라이드 배너 최신 5개 조회 =================
	List<BannerImageEntity> findTop5ByOrderByBannerImageNoDesc();
}
