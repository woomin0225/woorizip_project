ALTER TABLE `tb_posts`
ADD COLUMN `post_visible_yn` TINYINT(1) NOT NULL DEFAULT 1 AFTER `post_pinned_yn`;

UPDATE `tb_posts`
SET `post_visible_yn` = 1
WHERE `post_visible_yn` IS NULL;
