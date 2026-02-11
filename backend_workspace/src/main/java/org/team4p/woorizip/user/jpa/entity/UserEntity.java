package org.team4p.woorizip.user.jpa.entity;

import java.util.Date;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "tb_users") // 기술서에 따른 테이블명
public class UserEntity {

    @Id
    @Column(name = "user_no", length = 36)
    private String userNo;

    @Column(name = "email_id", nullable = false, unique = true)
    private String emailId;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "name", nullable = false, length = 20)
    private String name;

    @Column(name = "phone", nullable = false, length = 15)
    private String phone;

    @Column(name = "gender", nullable = false, length = 1)
    private String gender;

    @Temporal(TemporalType.DATE)
    @Column(name = "birth_date", nullable = false)
    private Date birthDate;
    
    @Column(name = "social_id")
    private String socialId;
    
    @Column(name = "provider") // google, kakao 등
    private String provider;

    @Column(name = "type", nullable = false, length = 6)
    private String type;

    @Column(name = "role", nullable = false, length = 6)
    private String role;

    @Column(name = "created_at")
    private Date createdAt;

    @Column(name = "updated_at")
    private Date updatedAt;

    @Column(name = "deleted_yn", nullable = false)
    private int deletedYn;

    @PrePersist
    public void prePersist() {
        Date now = new Date();
        
        // 1. 기본 설정 (PK, 시간)
        if (this.userNo == null) this.userNo = java.util.UUID.randomUUID().toString();
        if (this.createdAt == null) this.createdAt = now;
        if (this.updatedAt == null) this.updatedAt = now;
        
        // 2. 기본값 설정
        if (this.type == null) this.type = "USER";
        if (this.role == null) this.role = "USER";
        this.deletedYn = 0; 

        // 3. 성별 처리 (프론트에서 넘어온 1~4 숫자를 M/F로 변환)
        if (this.gender != null) {
            if (this.gender.equals("1") || this.gender.equals("3")) {
                this.gender = "M";
            } else if (this.gender.equals("2") || this.gender.equals("4")) {
                this.gender = "F";
            }
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = new Date();
    }
}