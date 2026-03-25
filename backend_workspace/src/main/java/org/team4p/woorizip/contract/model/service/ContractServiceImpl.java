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
import java.util.Objects;
import java.util.Optional;
import java.util.Locale;
import java.util.Set;
import java.time.ZoneId;

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
import org.team4p.woorizip.room.service.RoomAvailabilityPolicyService;
import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.team4p.woorizip.user.jpa.repository.UserRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

import java.io.ByteArrayOutputStream;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContractServiceImpl implements ContractService {

    // 동일 입주일 중복 신청 차단 대상 상태
    private static final Set<String> ACTIVE_CONTRACT_STATUSES =
            Set.of("APPLIED", "APPROVED", "PAID", "ACTIVE", "AMENDMENT_REQUESTED");

    private final ContractRepository contractRepository;
    private final UploadProperties uploadProperties;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final HouseRepository houseRepository;
    private final ObjectMapper objectMapper;
    private final RoomAvailabilityPolicyService roomAvailabilityPolicyService;

    @Value("${app.contract-doc-url-prefix:/contract-docs}")
    private String contractDocUrlPrefix;

    @Value("${app.contract-pdf-font-path:}")
    private String contractPdfFontPath;

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
    public PageResponse<ContractDto> selectListAllContracts(int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.max(size, 1);
        Pageable pageable = PageRequest.of(safePage - 1, safeSize);
        Page<ContractEntity> resultPage = contractRepository.findAll(pageable);

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
        roomAvailabilityPolicyService.validateContractApplication(
                entity.getRoomNo(),
                entity.getMoveInDate() == null ? null : entity.getMoveInDate().toInstant().atZone(ZoneId.of("Asia/Seoul")).toLocalDate()
        );

        Optional<ContractEntity> existingMine = contractRepository
                .findFirstByRoomNoAndMoveInDateAndStatusInAndUserNoOrderByContractNoDesc(
                        entity.getRoomNo(),
                        entity.getMoveInDate(),
                        ACTIVE_CONTRACT_STATUSES,
                        entity.getUserNo()
                );
        if (existingMine.isPresent()) {
            return ContractDto.fromEntity(existingMine.get());
        }

        boolean alreadyAppliedBySameUser = contractRepository.existsByRoomNoAndUserNoAndStatusIn(
                entity.getRoomNo(),
                entity.getUserNo(),
                ACTIVE_CONTRACT_STATUSES
        );
        if (alreadyAppliedBySameUser) {
            throw new IllegalStateException("이미 해당 방에 진행 중인 계약이 있습니다.");
        }

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
            Optional<ContractEntity> existingAfterRace = contractRepository
                    .findFirstByRoomNoAndMoveInDateAndStatusInAndUserNoOrderByContractNoDesc(
                            entity.getRoomNo(),
                            entity.getMoveInDate(),
                            ACTIVE_CONTRACT_STATUSES,
                            entity.getUserNo()
                    );
            if (existingAfterRace.isPresent()) {
                return ContractDto.fromEntity(existingAfterRace.get());
            }
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

        ContractEntity original = contractRepository.findById(originalNo).orElse(null);
        if (original == null) {
            return 0;
        }

        ContractEntity entity = amendmentDto != null ? amendmentDto.toEntity() : new ContractEntity();
        // 수정요청 파생 건은 원본 계약의 사용자/방 정보를 그대로 사용
        entity.setUserNo(original.getUserNo());
        entity.setRoomNo(original.getRoomNo());
        entity.setMoveInDate(entity.getMoveInDate() != null ? entity.getMoveInDate() : original.getMoveInDate());
        entity.setTermMonths(entity.getTermMonths() > 0 ? entity.getTermMonths() : original.getTermMonths());
        entity.setContractUrl(entity.getContractUrl() != null ? entity.getContractUrl() : original.getContractUrl());
        entity.setParentContractNo(originalNo);
        entity.setStatus("AMENDMENT_REQUESTED");
        entity.setContractNo(null);

        try {
            contractRepository.save(entity);
            return 1;
        } catch (DataIntegrityViolationException e) {
            String msg = e.getMostSpecificCause() != null
                    ? e.getMostSpecificCause().getMessage()
                    : e.getMessage();
            if (msg != null && msg.contains("Data truncated for column 'status'")) {
                throw new IllegalStateException(
                        "DB 스키마 불일치: tb_contracts.status ENUM에 AMENDMENT_REQUESTED 값이 필요합니다.");
            }
            throw e;
        }
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
            // 승인 시 원본 계약을 수정안 값으로 동기화
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

        updateTenantSignatureMeta(contractNo, request);
        target.setContractUrl(writeContractPdf(target, request));
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

        updateTenantSignerMeta(contractNo, request);
        target.setContractUrl(writeContractPdf(target, null));
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
    public int updateStatus(
            String contractNo,
            String status,
            String reason,
            String signerName,
            String signatureDataUrl,
            String signedAt
    ) {
        ContractEntity target = contractRepository.findById(contractNo).orElse(null);
        if (target == null) return 0;

        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (normalized.isBlank()) return 0;

        target.setStatus(normalized);
        if ("REJECTED".equals(normalized)) {
            target.setRejectionReason(reason != null ? reason.trim() : "");
        } else {
            target.setRejectionReason(null);
            if ("APPROVED".equals(normalized)) {
                if (signatureDataUrl == null || signatureDataUrl.isBlank()) {
                    throw new IllegalArgumentException("임대인 승인 시 서명이 필요합니다.");
                }
                if (signerName == null || signerName.isBlank()) {
                    throw new IllegalArgumentException("임대인 서명자 이름이 필요합니다.");
                }
                updateLessorSignatureMeta(contractNo, signerName, signatureDataUrl, signedAt);
                target.setContractUrl(writeContractPdf(target, null));
            }
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
            Path root = resolveContractDocRoot();
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

            // FE 접근용 상대 URL 반환
            return normalizeUrlPrefix(contractDocUrlPrefix) + "/" + fileName;
        } catch (Exception e) {
            log.error("계약서 파일 저장 실패: contractNo={}", target.getContractNo(), e);
            throw new IllegalStateException("계약서 PDF 저장에 실패했습니다.");
        }
    }

    private Path resolveContractDocRoot() {
        String configured = uploadProperties.contractDocDir();
        if (configured != null && !configured.isBlank()) {
            return Path.of(configured).toAbsolutePath().normalize();
        }
        return Path.of(
                Objects.requireNonNullElse(uploadProperties.uploadDir(), "C:/upload_files"),
                "contract_docs"
        ).toAbsolutePath().normalize();
    }

    private String buildContractHtml(ContractEntity target, ContractElectronicCreateRequest request) {
        Date moveIn = target.getMoveInDate();
        String moveInText = moveIn != null ? new SimpleDateFormat("yyyy-MM-dd").format(moveIn) : "-";
        String memo = request != null && request.getMemo() != null ? request.getMemo().trim() : "";
        String memoRow = memo.isEmpty() ? "" : "<tr><th>요청 메모</th><td>" + escapeHtml(memo) + "</td></tr>";
        ContractSignatureMeta signatureMeta = readContractSignatureMeta(target.getContractNo());
        String requestSignatureDataUrl = request != null ? safe(request.getSignatureDataUrl()) : "";
        String tenantSignatureDataUrl = !requestSignatureDataUrl.isBlank()
                ? requestSignatureDataUrl
                : safe(signatureMeta.tenantSignatureDataUrl);
        String tenantSignatureMarkup = buildSignatureMarkup(tenantSignatureDataUrl, "임차인 서명 정보 없음");
        String lessorSignatureMarkup = buildSignatureMarkup(
                safe(signatureMeta.lessorSignatureDataUrl),
                "임대인 승인 시 서명이 추가됩니다."
        );
        String tenantSignerMeta = buildSignerMetaText(
                safe(signatureMeta.tenantSignerName),
                safe(signatureMeta.tenantSignedAt)
        );
        String lessorSignerMeta = buildSignerMetaText(
                safe(signatureMeta.lessorSignerName),
                safe(signatureMeta.lessorSignedAt)
        );

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
                <!DOCTYPE html>
                <html lang="ko" xmlns="http://www.w3.org/1999/xhtml">
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
                    .agreement-box { margin-top: 16px; border: 1px solid #ddd; background: #fafafa; padding: 12px; font-size: 13px; }
                    .signature-wrap { min-height: 92px; border: 1px dashed #bbb; background: #fff; padding: 8px; }
                    .signature-image { max-width: 280px; max-height: 90px; object-fit: contain; }
                    .sig-placeholder { color: #666; }
                    .sig-meta { margin-top: 6px; color: #666; font-size: 12px; }
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
                  <h2>전자 동의 및 서명</h2>
                  <div class="agreement-box">
                    <p>임차인은 개인정보 수집 및 이용, 전자계약서 내용, 전자문서 및 전자서명 이용에 동의한 후 본 계약을 진행하였습니다.</p>
                  </div>
                  <table>
                    <tr><th>임차인 전자서명</th><td><div class="signature-wrap">%s</div><div class="sig-meta">%s</div></td></tr>
                    <tr><th>임대인 전자서명</th><td><div class="signature-wrap">%s</div><div class="sig-meta">%s</div></td></tr>
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
                escapeHtml(tenantPhone),
                tenantSignatureMarkup,
                escapeHtml(tenantSignerMeta),
                lessorSignatureMarkup,
                escapeHtml(lessorSignerMeta)
        );
    }

    private void updateTenantSignatureMeta(String contractNo, ContractElectronicCreateRequest request) {
        if (request == null || request.getSignatureDataUrl() == null || request.getSignatureDataUrl().isBlank()) {
            return;
        }
        ContractSignatureMeta meta = readContractSignatureMeta(contractNo);
        meta.tenantSignatureDataUrl = request.getSignatureDataUrl().trim();
        writeContractSignatureMeta(contractNo, meta);
    }

    private void updateTenantSignerMeta(String contractNo, ContractSignatureVerifyRequest request) {
        if (request == null) {
            return;
        }
        ContractSignatureMeta meta = readContractSignatureMeta(contractNo);
        meta.tenantSignerName = safe(request.getSignerName());
        meta.tenantSignedAt = safe(request.getAgreedAt());
        writeContractSignatureMeta(contractNo, meta);
    }

    private void updateLessorSignatureMeta(String contractNo, String signerName, String signatureDataUrl, String signedAt) {
        ContractSignatureMeta meta = readContractSignatureMeta(contractNo);
        meta.lessorSignerName = safe(signerName);
        meta.lessorSignatureDataUrl = safe(signatureDataUrl);
        meta.lessorSignedAt = safe(signedAt);
        writeContractSignatureMeta(contractNo, meta);
    }

    private ContractSignatureMeta readContractSignatureMeta(String contractNo) {
        Path metaPath = resolveContractMetaPath(contractNo);
        if (!Files.exists(metaPath)) {
            return new ContractSignatureMeta();
        }
        try {
            return objectMapper.readValue(Files.readString(metaPath), ContractSignatureMeta.class);
        } catch (Exception e) {
            log.warn("계약 서명 메타데이터 읽기 실패: contractNo={}", contractNo, e);
            return new ContractSignatureMeta();
        }
    }

    private void writeContractSignatureMeta(String contractNo, ContractSignatureMeta meta) {
        try {
            Path metaPath = resolveContractMetaPath(contractNo);
            Files.createDirectories(metaPath.getParent());
            Files.writeString(
                    metaPath,
                    objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(meta),
                    StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING
            );
        } catch (Exception e) {
            throw new IllegalStateException("계약 서명 정보 저장에 실패했습니다.");
        }
    }

    private Path resolveContractMetaPath(String contractNo) {
        return resolveContractDocRoot()
                .resolve("contract-" + contractNo + "-meta.json")
                .normalize();
    }

    private String buildSignatureMarkup(String dataUrl, String emptyMessage) {
        if (dataUrl == null || dataUrl.isBlank()) {
            return "<div class='sig-placeholder'>" + escapeHtml(emptyMessage) + "</div>";
        }
        return "<img src=\"" + escapeHtml(dataUrl)
                + "\" alt=\"signature\" class=\"signature-image\" />";
    }

    private String buildSignerMetaText(String signerName, String signedAt) {
        String safeName = signerName == null || signerName.isBlank() ? "-" : signerName;
        String safeTime = signedAt == null || signedAt.isBlank() ? "-" : signedAt;
        return "서명자: " + safeName + " / 서명시각: " + safeTime;
    }

    private byte[] renderPdfBytes(String html) throws Exception {
        try {
            return renderPdfBytes(html, true);
        } catch (Exception first) {
            log.warn("PDF 렌더링 1차 실패(폰트 포함). 폰트 제외 재시도: {}", first.getMessage());
            return renderPdfBytes(html, false);
        }
    }

    private byte[] renderPdfBytes(String html, boolean useWindowsFont) throws Exception {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(normalizeHtmlForPdf(html), null);

            Optional<Path> fontPath = resolvePdfFontPath(useWindowsFont);
            if (fontPath.isPresent()) {
                builder.useFont(fontPath.get().toFile(), "Malgun Gothic");
                log.info("계약서 PDF 폰트 사용: {}", fontPath.get());
            } else {
                log.warn("계약서 PDF용 한글 폰트를 찾지 못했습니다. 기본 폰트로 렌더링합니다.");
            }

            builder.toStream(outputStream);
            builder.run();
            return outputStream.toByteArray();
        }
    }

    private Optional<Path> resolvePdfFontPath(boolean includeWindowsFont) {
        if (contractPdfFontPath != null && !contractPdfFontPath.isBlank()) {
            Path configuredPath = Path.of(contractPdfFontPath.trim()).toAbsolutePath().normalize();
            if (Files.exists(configuredPath)) {
                return Optional.of(configuredPath);
            }
            log.warn("설정된 계약서 PDF 폰트 경로가 존재하지 않습니다: {}", configuredPath);
        }

        List<Path> candidates = new ArrayList<>();
        if (includeWindowsFont) {
            candidates.add(FileSystems.getDefault().getPath("C:", "Windows", "Fonts", "malgun.ttf"));
        }
        candidates.add(Path.of("/usr/share/fonts/truetype/nanum/NanumGothic.ttf"));
        candidates.add(Path.of("/usr/share/fonts/truetype/nanum/NanumBarunGothic.ttf"));
        candidates.add(Path.of("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"));
        candidates.add(Path.of("/usr/share/fonts/opentype/noto/NotoSansKR-Regular.otf"));
        candidates.add(Path.of("/usr/share/fonts/truetype/noto/NotoSansKR-Regular.ttf"));

        return candidates.stream()
                .map(path -> path.toAbsolutePath().normalize())
                .filter(Files::exists)
                .findFirst();
    }

    private String normalizeHtmlForPdf(String html) {
        if (html == null) {
            return "<html><body></body></html>";
        }

        // XML parser가 문서 시작 전 BOM/불필요 문자에 민감하므로 제거
        String normalized = html.replace("\uFEFF", "").trim();
        int firstTag = normalized.indexOf('<');
        if (firstTag > 0) {
            normalized = normalized.substring(firstTag);
        }

        // XHTML 루트 보정
        String lower = normalized.toLowerCase(Locale.ROOT);
        if (!lower.startsWith("<!doctype") && !lower.startsWith("<html")) {
            normalized = "<html><body>" + escapeHtml(normalized) + "</body></html>";
        }
        return normalized;
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

    private static final class ContractSignatureMeta {
        public String tenantSignatureDataUrl = "";
        public String tenantSignerName = "";
        public String tenantSignedAt = "";
        public String lessorSignatureDataUrl = "";
        public String lessorSignerName = "";
        public String lessorSignedAt = "";
    }
}
