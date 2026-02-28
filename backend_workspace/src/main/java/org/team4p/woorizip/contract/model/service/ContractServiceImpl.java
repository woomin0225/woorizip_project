package org.team4p.woorizip.contract.model.service;

import java.util.ArrayList;
import java.sql.Timestamp;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Date;
import java.util.Optional;
import java.util.Locale;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.common.api.PageResponse;
import org.team4p.woorizip.common.config.UploadProperties;
import org.team4p.woorizip.contract.jpa.entity.ContractEntity;
import org.team4p.woorizip.contract.jpa.repository.ContractRepository;
import org.team4p.woorizip.contract.model.dto.ContractDto;
import org.team4p.woorizip.contract.model.dto.request.ContractElectronicCreateRequest;
import org.team4p.woorizip.contract.model.dto.request.ContractPaymentRequest;
import org.team4p.woorizip.contract.model.dto.request.ContractSignatureVerifyRequest;
import org.team4p.woorizip.house.jpa.entity.HouseEntity;
import org.team4p.woorizip.house.jpa.repository.HouseRepository;
import org.team4p.woorizip.room.jpa.entity.RoomEntity;
import org.team4p.woorizip.room.jpa.repository.RoomRepository;
import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.team4p.woorizip.user.jpa.repository.UserRepository;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

import java.io.ByteArrayOutputStream;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContractServiceImpl implements ContractService {

    private static final Set<String> ACTIVE_CONTRACT_STATUSES =
            Set.of("APPLIED", "APPROVED", "PAID", "ACTIVE", "AMENDMENT_REQUESTED");

    private final ContractRepository contractRepository;
    private final UploadProperties uploadProperties;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final HouseRepository houseRepository;

    @Value("${app.contract-doc-url-prefix:/contract-docs}")
    private String contractDocUrlPrefix;

    @Override
    public ContractDto selectContract(String contractNo) {
        ContractEntity entity = contractRepository.findByContractNo(contractNo);
        return entity != null ? ContractDto.fromEntity(entity) : null;
    }

    @Override
    public PageResponse<ContractDto> selectListContract(String userNo, int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.max(size, 1);
        Pageable pageable = PageRequest.of(safePage - 1, safeSize);
        Page<ContractEntity> resultPage = contractRepository.findByUserNoOrderByMoveInDateDesc(userNo, pageable);

        List<ContractDto> content = toList(resultPage.getContent());
        return new PageResponse<>(
                content,
                safePage,
                safeSize,
                resultPage.getTotalElements(),
                resultPage.getTotalPages()
        );
    }

    @Override
    public PageResponse<ContractDto> selectListContractByOwner(String ownerUserNo, int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.max(size, 1);
        Pageable pageable = PageRequest.of(safePage - 1, safeSize);
        Page<ContractEntity> resultPage = contractRepository.findByRoomOwnerNoOrderByMoveInDateDesc(ownerUserNo, pageable);

        List<ContractDto> content = toList(resultPage.getContent());
        return new PageResponse<>(
                content,
                safePage,
                safeSize,
                resultPage.getTotalElements(),
                resultPage.getTotalPages()
        );
    }

    @Override
    @Transactional
    public ContractDto insertContract(ContractDto contractDto) {
        contractDto.setStatus("APPLIED");
        ContractEntity entity = contractDto.toEntity();

        boolean alreadyReserved = contractRepository.existsByRoomNoAndMoveInDateAndStatusIn(
                entity.getRoomNo(),
                entity.getMoveInDate(),
                ACTIVE_CONTRACT_STATUSES
        );
        if (alreadyReserved) {
            throw new IllegalStateException("이미 신청된 입주 날짜입니다.");
        }

        try {
            ContractEntity saved = contractRepository.save(entity);
            return ContractDto.fromEntity(saved);
        } catch (DataIntegrityViolationException e) {
            log.warn("입주 신청 중복 차단: roomNo={}, moveInDate={}", entity.getRoomNo(), entity.getMoveInDate());
            throw new IllegalStateException("이미 신청된 입주 날짜입니다.");
        } catch (Exception e) {
            log.error("계약 등록 중 오류 발생: {}", e.getMessage());
            throw new IllegalStateException("입주 신청 처리 중 오류가 발생했습니다.");
        }
    }

    @Override
    @Transactional
    public int requestAmendment(String originalNo, ContractDto amendmentDto) {
        if (contractRepository.existsByParentContractNoAndStatus(originalNo, "AMENDMENT_REQUESTED")) {
            return -1;
        }

        ContractEntity entity = amendmentDto.toEntity();
        entity.setParentContractNo(originalNo);
        entity.setStatus("AMENDMENT_REQUESTED");
        entity.setContractNo(null);

        contractRepository.save(entity);
        return 1;
    }

    @Override
    @Transactional
    public int decideAmendment(String amendmentNo, boolean approved, String reason) {
        ContractEntity amendment = contractRepository.findById(amendmentNo).orElse(null);
        if (amendment == null) {
            return 0;
        }
        ContractEntity original = contractRepository.findById(amendment.getParentContractNo()).orElse(null);
        if (original == null) {
            return 0;
        }

        if (approved) {
            original.updateFromAmendment(amendment);
            original.setStatus("APPROVED");
            amendment.setStatus("APPROVED");
        } else {
            amendment.setStatus("REJECTED");
            amendment.setRejectionReason(reason);
        }

        return 1;
    }

    @Override
    @Transactional
    public int cancelContract(String contractNo, String reason) {
        ContractEntity target = contractRepository.findById(contractNo).orElse(null);
        if (target == null) {
            return 0;
        }
        target.setStatus("REJECTED");
        target.setRejectionReason(reason);
        return 1;
    }

    @Override
    @Transactional
    public ContractDto createElectronicContract(String contractNo, ContractElectronicCreateRequest request) {
        ContractEntity target = contractRepository.findById(contractNo)
                .orElseThrow(() -> new IllegalArgumentException("계약 정보를 찾을 수 없습니다."));

        target.setContractUrl(writeContractPdf(target, request));
        if ("APPLIED".equalsIgnoreCase(target.getStatus())) {
            target.setStatus("APPROVED");
        }
        return ContractDto.fromEntity(target);
    }

    @Override
    @Transactional
    public ContractDto verifyElectronicSignature(String contractNo, ContractSignatureVerifyRequest request) {
        ContractEntity target = contractRepository.findById(contractNo)
                .orElseThrow(() -> new IllegalArgumentException("계약 정보를 찾을 수 없습니다."));

        String signerName = request != null ? request.getSignerName() : null;
        if (signerName == null || signerName.trim().isEmpty()) {
            throw new IllegalArgumentException("전자서명자 이름은 필수입니다.");
        }

        if (target.getContractUrl() == null || target.getContractUrl().isBlank()) {
            target.setContractUrl(writeContractPdf(target, null));
        }

        if ("APPLIED".equalsIgnoreCase(target.getStatus())) {
            target.setStatus("APPROVED");
        }
        return ContractDto.fromEntity(target);
    }

    @Override
    @Transactional
    public ContractDto requestContractPayment(String contractNo, ContractPaymentRequest request) {
        ContractEntity target = contractRepository.findById(contractNo)
                .orElseThrow(() -> new IllegalArgumentException("계약 정보를 찾을 수 없습니다."));

        Long amount = request != null ? request.getAmount() : null;
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("결제 금액은 1원 이상이어야 합니다.");
        }

        target.setStatus("PAID");
        target.setPaymentDate(new Timestamp(System.currentTimeMillis()));
        return ContractDto.fromEntity(target);
    }

    @Override
    @Transactional
    public int updateStatus(String contractNo, String status, String reason) {
        ContractEntity target = contractRepository.findById(contractNo).orElse(null);
        if (target == null) return 0;

        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (normalized.isBlank()) return 0;

        target.setStatus(normalized);
        if ("REJECTED".equals(normalized)) {
            target.setRejectionReason(reason != null ? reason.trim() : "");
        } else {
            target.setRejectionReason(null);
        }
        return 1;
    }

    private List<ContractDto> toList(List<ContractEntity> list) {
        List<ContractDto> dtos = new ArrayList<>();
        if (list != null) {
            for (ContractEntity entity : list) {
                dtos.add(ContractDto.fromEntity(entity));
            }
        }
        return dtos;
    }

    private String writeContractPdf(ContractEntity target, ContractElectronicCreateRequest request) {
        try {
            Path root = uploadProperties.contractDocDirPath().toAbsolutePath().normalize();
            Files.createDirectories(root);

            String fileName = "contract-" + target.getContractNo() + ".pdf";
            Path filePath = root.resolve(fileName).normalize();

            String html = buildContractHtml(target, request);
            byte[] pdfBytes = renderPdfBytes(html);

            Files.write(
                    filePath,
                    pdfBytes,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING
            );

            return normalizeUrlPrefix(contractDocUrlPrefix) + "/" + fileName;
        } catch (Exception e) {
            log.error("계약서 파일 저장 실패: contractNo={}, message={}", target.getContractNo(), e.getMessage());
            throw new IllegalStateException("계약서 PDF 저장에 실패했습니다.");
        }
    }

    private String buildContractHtml(ContractEntity target, ContractElectronicCreateRequest request) {
        Date moveIn = target.getMoveInDate();
        String moveInText = moveIn != null ? new SimpleDateFormat("yyyy-MM-dd").format(moveIn) : "-";
        String memo = request != null && request.getMemo() != null ? request.getMemo().trim() : "";
        String memoRow = memo.isEmpty() ? "" : "<tr><th>요청 메모</th><td>" + escapeHtml(memo) + "</td></tr>";

        Optional<UserEntity> tenantOpt = userRepository.findById(target.getUserNo());
        RoomEntity room = roomRepository.findById(target.getRoomNo()).orElse(null);
        HouseEntity house = null;
        UserEntity lessor = null;
        if (room != null && room.getHouseNo() != null && !room.getHouseNo().isBlank()) {
            house = houseRepository.findById(room.getHouseNo()).orElse(null);
        }
        String lessorUserNo = room != null ? room.getUserNo() : null;
        if ((lessorUserNo == null || lessorUserNo.isBlank()) && house != null) {
            lessorUserNo = house.getUserNo();
        }
        if (lessorUserNo != null && !lessorUserNo.isBlank()) {
            lessor = userRepository.findById(lessorUserNo).orElse(null);
        }

        String roomName = room != null ? safe(room.getRoomName()) : safe(target.getRoomNo());
        String houseAddress = house != null ? safe(house.getHouseAddress()) : "-";
        String houseAddressDetail = house != null ? safe(house.getHouseAddressDetail()) : "";
        String fullAddress = (houseAddress + " " + houseAddressDetail).trim();
        if (fullAddress.isBlank()) fullAddress = "-";
        String method = room != null ? methodLabel(room.getRoomMethod()) : "-";
        String deposit = room != null ? money(room.getRoomDeposit()) : "-";
        String monthly = room != null ? money(room.getRoomMonthly()) : "-";

        UserEntity tenant = tenantOpt.orElse(null);
        String tenantName = tenant != null ? safe(tenant.getName()) : "-";
        String tenantPhone = tenant != null ? safe(tenant.getPhone()) : "-";
        String lessorName = lessor != null ? safe(lessor.getName()) : "-";
        String lessorPhone = lessor != null ? safe(lessor.getPhone()) : "-";
        String now = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());

        return """
                <!doctype html>
                <html lang="ko">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>임대차 계약서</title>
                  <style>
                    body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', Arial, sans-serif; margin: 24px; color: #222; }
                    h1 { margin: 0 0 16px; font-size: 24px; }
                    h2 { margin: 18px 0 8px; font-size: 18px; }
                    table { width: 100%%; border-collapse: collapse; margin-top: 12px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; }
                    th { width: 200px; background: #f7f7f7; }
                    .meta { margin-top: 20px; color: #666; font-size: 12px; }
                  </style>
                </head>
                <body>
                  <h1>주택 임대차 계약서</h1>
                  <h2>기본 정보</h2>
                  <table>
                    <tr><th>계약번호</th><td>%s</td></tr>
                    <tr><th>생성일시</th><td>%s</td></tr>
                    <tr><th>매물</th><td>%s</td></tr>
                    <tr><th>주소</th><td>%s</td></tr>
                    <tr><th>입주 예정일</th><td>%s</td></tr>
                    <tr><th>계약 기간</th><td>%d개월</td></tr>
                    <tr><th>거래유형</th><td>%s</td></tr>
                    <tr><th>보증금</th><td>%s</td></tr>
                    <tr><th>월세</th><td>%s</td></tr>
                    %s
                  </table>
                  <h2>당사자 정보</h2>
                  <table>
                    <tr><th>임대인 이름</th><td>%s</td></tr>
                    <tr><th>임대인 연락처</th><td>%s</td></tr>
                    <tr><th>임차인 이름</th><td>%s</td></tr>
                    <tr><th>임차인 연락처</th><td>%s</td></tr>
                  </table>
                  <p class="meta">본 문서는 시스템에 저장된 계약 정보 기준으로 생성되었습니다.</p>
                </body>
                </html>
                """.formatted(
                escapeHtml(target.getContractNo()),
                escapeHtml(now),
                escapeHtml(roomName),
                escapeHtml(fullAddress),
                escapeHtml(moveInText),
                target.getTermMonths(),
                escapeHtml(method),
                escapeHtml(deposit),
                escapeHtml(monthly),
                memoRow,
                escapeHtml(lessorName),
                escapeHtml(lessorPhone),
                escapeHtml(tenantName),
                escapeHtml(tenantPhone)
        );
    }

    private byte[] renderPdfBytes(String html) throws Exception {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);

            Path malgunPath = FileSystems.getDefault().getPath("C:", "Windows", "Fonts", "malgun.ttf");
            if (Files.exists(malgunPath)) {
                builder.useFont(malgunPath.toFile(), "Malgun Gothic");
            }

            builder.toStream(outputStream);
            builder.run();
            return outputStream.toByteArray();
        }
    }

    private String normalizeUrlPrefix(String prefix) {
        if (prefix == null || prefix.isBlank()) return "/contract-docs";
        String p = prefix.trim();
        if (!p.startsWith("/")) p = "/" + p;
        if (p.endsWith("/")) p = p.substring(0, p.length() - 1);
        return p;
    }

    private String methodLabel(String method) {
        if (method == null) return "-";
        return switch (method.trim().toUpperCase()) {
            case "M" -> "월세";
            case "L" -> "전세";
            default -> method;
        };
    }

    private String money(Long amount) {
        if (amount == null) return "-";
        return String.format("%,d원", amount);
    }

    private String safe(String s) {
        if (s == null) return "";
        return s.trim();
    }

    private String escapeHtml(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
