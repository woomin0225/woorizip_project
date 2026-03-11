package org.team4p.woorizip.user.jpa.entity;

import java.util.Date;
import jakarta.persistence.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Entity
@Table(name = "tb_users")
public class UserEntity {

    @Id
    @Column(name = "user_no", columnDefinition = "char(36)")
    private String userNo;

    @Column(name = "email_id", nullable = false, unique = true)
    private String emailId;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "name", nullable = false, length = 20)
    private String name;

    @Column(name = "phone", nullable = false, length = 15)
    private String phone;

    @Column(name = "gender", nullable = false, columnDefinition = "char(1)")
    private String gender;

    @Temporal(TemporalType.DATE)
    @Column(name = "birth_date", nullable = false)
    private Date birthDate;

    @Column(name = "type", nullable = false)
    private String type; 

    @Column(name = "role", nullable = false)
    private String role;
    
    @Transient
    private String socialId;

    @Transient
    private String provider;

    @Column(name = "created_at")
    private Date createdAt;

    @Column(name = "updated_at")
    private Date updatedAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "withdraw_at")
    private Date withdrawAt;

    @Column(name = "deleted_yn", nullable = false, columnDefinition = "char(1)")
    private String deletedYn;

    @PrePersist
    public void prePersist() {
        Date now = new Date();
        if (this.userNo == null) this.userNo = java.util.UUID.randomUUID().toString();
        if (this.createdAt == null) this.createdAt = now;
        
        if (this.type == null) this.type = "USER";
        if (this.role == null) this.role = "USER";
        if (this.deletedYn == null) this.deletedYn = "N";

        if (this.gender != null) {
            if (this.gender.equals("1") || this.gender.equals("3")) this.gender = "M";
            else if (this.gender.equals("2") || this.gender.equals("4")) this.gender = "F";
        }
    }


}
