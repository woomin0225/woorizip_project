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
@Table(name = "tb_wishlists")
@Entity
public class WishlistEntity {

    @Id
    @Column(name = "wish_no", nullable = false, unique = true, length = 50)
    private String wishNo;

    @Column(name = "user_no", nullable = false, length = 50)
    private String userNo;

    @Column(name = "room_no", nullable = false, length = 50)
    private String roomNo;

    @Column(name = "created_at", nullable = false)
    private Date createdAt;

    /**
     * insert 직전 자동 세팅
     */
    @PrePersist
    public void prePersist() {
        Date now = new Date(System.currentTimeMillis());
        if (createdAt == null) createdAt = now;
        
        if (wishNo == null) wishNo = java.util.UUID.randomUUID().toString();
    }
}