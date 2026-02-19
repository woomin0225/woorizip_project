package org.team4p.woorizip.wishlist.jpa.entity;

import java.sql.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "tb_wishlist")
@Entity
public class WishlistEntity {

    @Id
    @Column(name = "wish_no", nullable = false, unique = true, length = 50)
    private String wishNo; // UUID

    @Column(name = "user_no", nullable = false, length = 50)
    private String userNo; // MemberEntity의 userNo와 매핑 (FK)

    @Column(name = "room_no", nullable = false, length = 50)
    private String roomNo; // 찜한 대상의 NO (예: 매물 번호, 상품 번호)

    @Column(name = "created_at", nullable = false)
    private Date createdAt;

    /**
     * insert 직전 자동 세팅
     */
    @PrePersist
    public void prePersist() {
        Date now = new Date(System.currentTimeMillis());
        if (createdAt == null) createdAt = now;
        
        // NO가 없으면 UUID 생성 (String PK인 경우)
        if (wishNo == null) wishNo = java.util.UUID.randomUUID().toString();
    }
}