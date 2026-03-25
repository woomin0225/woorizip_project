package org.team4p.woorizip.board.ai.model.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.team4p.woorizip.board.ai.config.AiSummaryProperties;
import org.team4p.woorizip.board.ai.model.dto.BoardSummaryResponse;
import org.team4p.woorizip.board.ai.model.dto.FastApiSummaryRequest;
import org.team4p.woorizip.board.ai.model.dto.FastApiSummaryResponse;
import org.team4p.woorizip.board.file.jpa.entity.FileEntity;
import org.team4p.woorizip.board.file.jpa.repository.FileRepository;
import org.team4p.woorizip.board.post.jpa.entity.PostEntity;
import org.team4p.woorizip.board.post.jpa.repository.PostRepository;
import org.team4p.woorizip.common.config.UploadProperties;
import org.team4p.woorizip.common.exception.NotFoundException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(readOnly = true)
public class BoardSummaryServiceImpl implements BoardSummaryService {

    private static final String NOTICE = "N1";
    private static final String EVENT = "E1";
    private static final String INFORMATION = "I1";

    private final PostRepository postRepository;
    private final FileRepository fileRepository;
    private final UploadProperties uploadProperties;
    private final AiSummaryProperties aiSummaryProperties;
    private final RestTemplate restTemplate;
    
    private final ObjectMapper objectMapper;

    public BoardSummaryServiceImpl(
            PostRepository postRepository,
            FileRepository fileRepository,
            UploadProperties uploadProperties,
            AiSummaryProperties aiSummaryProperties,
            RestTemplateBuilder restTemplateBuilder,
            ObjectMapper objectMapper
    ) {
        this.postRepository = postRepository;
        this.fileRepository = fileRepository;
        this.uploadProperties = uploadProperties;
        this.aiSummaryProperties = aiSummaryProperties;
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(aiSummaryProperties.connectTimeoutSeconds()))
                .setReadTimeout(Duration.ofSeconds(aiSummaryProperties.readTimeoutSeconds()))
                .build();
    }

    @Override
    public BoardSummaryResponse summarizePost(int postNo, Authentication authentication) {
        PostEntity post = postRepository.findById(postNo)
                .orElseThrow(() -> new NotFoundException("해당 게시글이 존재하지 않습니다."));

        validateSupportedBoard(post.getBoardTypeNo());

        List<FileEntity> files = fileRepository.findByPostNo(postNo);
        List<String> warnings = new ArrayList<>();
        List<FastApiSummaryRequest.SummaryAttachment> attachments = buildAttachments(post, files, warnings);

        FastApiSummaryRequest request = new FastApiSummaryRequest(
                "post",
                post.getPostTitle(),
                post.getPostContent(),
                attachments,
                3
        );

        FastApiSummaryResponse response = callFastApi(request, authentication);

        List<BoardSummaryResponse.AttachmentInfo> attachmentInfos = new ArrayList<>();
        for (FastApiSummaryResponse.FastApiAttachmentInfo item : response.attachments()) {
            Integer fileNo = findFileNoByOriginalName(files, item.filename());
            attachmentInfos.add(new BoardSummaryResponse.AttachmentInfo(
                    fileNo,
                    item.filename(),
                    item.mimeType(),
                    item.chars()
            ));
        }

        List<String> mergedWarnings = new ArrayList<>(warnings);
        mergedWarnings.addAll(response.warnings());

        return new BoardSummaryResponse(
                post.getPostNo(),
                post.getBoardTypeNo(),
                post.getPostTitle(),
                response.summary(),
                response.keyPoints(),
                response.conclusion(),
                response.schedules(),
                response.actionItems(),
                response.attachmentCount(),
                attachmentInfos,
                mergedWarnings
        );
    }

    private void validateSupportedBoard(String boardTypeNo) {
        if (!NOTICE.equals(boardTypeNo)
                && !EVENT.equals(boardTypeNo)
                && !INFORMATION.equals(boardTypeNo)) {
            throw new IllegalArgumentException("요약을 지원하지 않는 게시판입니다.");
        }
    }

    private List<FastApiSummaryRequest.SummaryAttachment> buildAttachments(
            PostEntity post,
            List<FileEntity> files,
            List<String> warnings
    ) {
        List<FastApiSummaryRequest.SummaryAttachment> attachments = new ArrayList<>();
        Path boardDir = resolveBoardDir(post.getBoardTypeNo());

        for (FileEntity file : files) {
            Path path = boardDir.resolve(file.getUpdatedFileName());
            if (!Files.exists(path)) {
                warnings.add(file.getOriginalFileName() + ": 서버 파일이 없어 첨부 반영에서 제외되었습니다.");
                continue;
            }

            try {
                long size = Files.size(path);
                if (size > aiSummaryProperties.maxAttachmentBytes()) {
                    warnings.add(file.getOriginalFileName() + ": 파일 크기가 커서 요약에서 제외되었습니다.");
                    continue;
                }

                byte[] bytes = Files.readAllBytes(path);
                String mimeType = detectMimeType(path, file.getOriginalFileName());
                String base64 = Base64.getEncoder().encodeToString(bytes);
                Map<String, Object> meta = new LinkedHashMap<>();
                meta.put("fileNo", file.getFileNo());
                meta.put("boardTypeNo", post.getBoardTypeNo());
                meta.put("storedName", file.getUpdatedFileName());

                attachments.add(new FastApiSummaryRequest.SummaryAttachment(
                        file.getOriginalFileName(),
                        mimeType,
                        null,
                        base64,
                        meta
                ));
            } catch (IOException e) {
                log.warn("첨부파일 읽기 실패 postNo={}, fileNo={}", post.getPostNo(), file.getFileNo(), e);
                warnings.add(file.getOriginalFileName() + ": 첨부파일 읽기에 실패해 제외되었습니다.");
            }
        }

        return attachments;
    }

    private FastApiSummaryResponse callFastApi(FastApiSummaryRequest request, Authentication authentication) {
        validateAiProperties();

        String url = aiSummaryProperties.baseUrl() + "/ai/summary";

        try {
            String requestJson = objectMapper.writeValueAsString(request);
            
            List<String> attachmentNames = request.attachments().stream()
            		.map(FastApiSummaryRequest.SummaryAttachment::filename)
            		.filter(StringUtils::hasText)
            		.toList();
            
            log.info(
            		"FastAPI summary request url={}, targetType={}, attachmentCount={}, attachments={}",
            		url,
            		request.targetType(),
            		request.attachments().size(),
            		attachmentNames
    		);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            headers.set("X-API-KEY", aiSummaryProperties.apiKey());

            if (authentication != null && authentication.getName() != null) {
                headers.set("X-User-Id", authentication.getName());

                String roles = authentication.getAuthorities().stream()
                        .map(grantedAuthority -> grantedAuthority.getAuthority())
                        .reduce((a, b) -> a + "," + b)
                        .orElse("");

                if (StringUtils.hasText(roles)) {
                    headers.set("X-Roles", roles);
                }
            }
            
            HttpEntity<String> requestEntity = new HttpEntity<>(requestJson, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
            		url,
            		HttpMethod.POST,
            		requestEntity,
            		String.class
    		);
            
            if(!response.getStatusCode().is2xxSuccessful()) {
            	throw new IllegalStateException("AI 요약 서버 응답 오류: " + response.getStatusCode().value());
            }

            String responseBody = response.getBody();
            if (!StringUtils.hasText(responseBody)) {
                throw new IllegalStateException("AI 요약 응답이 비어 있습니다.");
            }
            
            FastApiSummaryResponse parsed = objectMapper.readValue(responseBody, FastApiSummaryResponse.class);
            
            log.info(
            		"FastAPI summary response status={}, summaryLength={}, warningCount={}, attachmentCount={}",
            		response.getStatusCode().value(),
            		parsed.summary() == null ? 0 : parsed.summary().length(),
            		parsed.warnings() == null ? 0 : parsed.warnings().size(),
            		parsed.attachmentCount()
    		);

            return parsed;

        } catch (JsonProcessingException e) {
            log.error("FastAPI summary JSON 처리 실패 url={}", url, e);
            throw new IllegalStateException("AI 요약 응답 처리에 실패했습니다.");
        } catch (ResourceAccessException e) {
            log.error("FastAPI summary 연결 실패 url={}", url, e);
            throw new IllegalStateException("AI 요약 서버 연결이 중간에 끊어졌습니다. AI 서버 상태를 확인해 주세요.");
        } catch (RestClientException e) {
            log.error("FastAPI summary 호출 실패 url={}", url, e);
            throw new IllegalStateException("AI 요약 서버 호출에 실패했습니다.");
        }
    }

    private void validateAiProperties() {
        if (!StringUtils.hasText(aiSummaryProperties.baseUrl())) {
            throw new IllegalStateException("ai.summary.base-url 설정이 필요합니다.");
        }
        if (!StringUtils.hasText(aiSummaryProperties.apiKey())) {
            throw new IllegalStateException("ai.summary.api-key 설정이 필요합니다.");
        }
    }

    private Path resolveBoardDir(String boardTypeNo) {
        return switch (boardTypeNo) {
            case NOTICE -> uploadProperties.noticeDir();
            case EVENT -> uploadProperties.eventDir();
            case INFORMATION -> uploadProperties.informationDir();
            default -> throw new IllegalArgumentException("요약을 지원하지 않는 게시판입니다.");
        };
    }

    private String detectMimeType(Path path, String filename) {
        try {
            String probed = Files.probeContentType(path);
            if (StringUtils.hasText(probed)) {
                return probed;
            }
        } catch (IOException ignored) {
        }

        String lower = filename == null ? "" : filename.toLowerCase();
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (lower.endsWith(".doc")) return "application/msword";
        if (lower.endsWith(".txt")) return "text/plain";
        if (lower.endsWith(".md")) return "text/markdown";
        if (lower.endsWith(".csv")) return "text/csv";
        if (lower.endsWith(".json")) return "application/json";
        return "application/octet-stream";
    }

    private Integer findFileNoByOriginalName(List<FileEntity> files, String filename) {
        for (FileEntity file : files) {
            if (filename != null && filename.equals(file.getOriginalFileName())) {
                return file.getFileNo();
            }
        }
        return null;
    }
}
