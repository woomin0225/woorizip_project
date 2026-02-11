package org.team4p.woorizip.board.notice.controller;

import java.io.File;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.team4p.woorizip.board.file.jpa.entity.FileEntity;
import org.team4p.woorizip.board.file.jpa.repository.FileRepository;
import org.team4p.woorizip.board.file.model.dto.FileDto;
import org.team4p.woorizip.board.notice.model.service.NoticeService;
import org.team4p.woorizip.board.post.model.dto.PostDto;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.common.api.PageResponse;
import org.team4p.woorizip.common.api.SearchRequest;
import org.team4p.woorizip.common.config.UploadProperties;
import org.team4p.woorizip.common.util.FileNameChange;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notice")
public class NoticeController {

	private final NoticeService noticeService;
	private final UploadProperties uploadProperties;
	private final FileRepository fileRepository;
	
	//==============Top3===================
	@GetMapping("/top3")
	public ResponseEntity<ApiResponse<ArrayList<PostDto>>> top3() {
		return ResponseEntity.ok(
				ApiResponse.ok("top3 조회 성공", noticeService.selectTop3()));
	}
	
	//==============목록===================
	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<PostDto>>> list(
			@ModelAttribute SearchRequest req) {
		
		Pageable pageable = req.toPageable();
		
		int total = noticeService.selectListCount();
		ArrayList<PostDto> content = noticeService.selectList(pageable);
		
		int totalPages = (int) Math.ceil((double) total / req.size());
		
		return ResponseEntity.ok(
				ApiResponse.ok("목록 조회 성공", new PageResponse<>(content, req.page(), req.size(), total, totalPages)));
	}
	
	//==============상세===================
	@GetMapping("/{postNo}")
	public ResponseEntity<ApiResponse<PostDto>> detail(@PathVariable int postNo) {
		
		PostDto dto = noticeService.selectNotice(postNo);
		if(dto == null) {
			return ResponseEntity.status(404)
					.body(ApiResponse.fail("해당 공지가 없습니다.", null));
		}
		
		noticeService.updateAddReadCount(postNo);
		return ResponseEntity.ok(ApiResponse.ok("상세 조회 성공", dto));
	}
	
	//==============파일 다운로드===================
	@GetMapping("/{postNo}/file/{fileNo}")
	public ResponseEntity<Resource> downloadFile(
			@PathVariable Integer postNo,
			@PathVariable Integer fileNo) throws Exception {
		
		FileEntity fileEntity = fileRepository.findById(fileNo).orElse(null);
		
		if(fileEntity == null || !fileEntity.getPostNo().equals(postNo))
			return ResponseEntity.notFound().build();
		
		Path path = uploadProperties.noticeDir()
				.resolve(fileEntity.getUpdatedFileName());
		
		File file = path.toFile();		
		if(!file.exists())
			return ResponseEntity.notFound().build();
		
		String encoded = URLEncoder.encode(
				fileEntity.getOriginalFileName(), StandardCharsets.UTF_8);
		
		HttpHeaders headers = new HttpHeaders();
		headers.setContentDisposition(
				ContentDisposition.attachment()
					.filename(encoded, StandardCharsets.UTF_8)
					.build());
		
		headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
		
		return ResponseEntity.ok()
				.headers(headers)
				.body(new FileSystemResource(file));
	}
	
	//==============등록===================
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<Void>> create(
			@Valid @ModelAttribute PostDto postDto,
			@RequestParam(name = "files", required = false) List<MultipartFile> files) {
		
		List<FileDto> fileDtoList = new ArrayList<>();
		
		if(files != null) {
			for(MultipartFile file : files) {
				
				if(file.isEmpty())
					continue;
				
				String original = file.getOriginalFilename();
				String rename = FileNameChange.change(original);
				
				File saveDir = uploadProperties.noticeDir().toFile();
				if(!saveDir.exists())
					saveDir.mkdirs();
				
				try {
					file.transferTo(new File(saveDir, rename));
				} catch (Exception e) {
					log.error("파일 업로드 실패", e);
					return ResponseEntity.status(500).body(ApiResponse.fail("파일 업로드 실패", null));
				}
				
				fileDtoList.add(
						FileDto.builder()
						.originalFileName(original)
						.updatedFileName(rename)
						.build());
			}
		}
		
		postDto.setFiles(fileDtoList);
		
		int result = noticeService.insertNotice(postDto);
		
		if(result > 0)
			return ResponseEntity.status(201).body(ApiResponse.ok("공지 등록 성공", null));
		
		return ResponseEntity.status(500).body(ApiResponse.fail("공지 등록 실패", null));
	}
	
	//==============수정===================
	@PutMapping	(value = "/{postNo}/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<Void>> update(
			@PathVariable int postNo,
			@Valid @ModelAttribute PostDto postDto,
			@RequestParam(name = "deleteFileNo", required = false) List<Integer> deleteFileNo,
			@RequestParam(name = "files", required = false) List<MultipartFile> files) {
		
		postDto.setPostNo(postNo);
		
		List<FileDto> newFiles = new ArrayList<>();
		
		if(files != null) {
			for(MultipartFile file : files) {
				
				if(file.isEmpty())
					continue;
				
				String original = file.getOriginalFilename();
				String rename = FileNameChange.change(original);
				
				File saveDir = uploadProperties.noticeDir().toFile();
				if(!saveDir.exists())
					saveDir.mkdirs();
				
				try {
					file.transferTo(new File(saveDir, rename));
				} catch (Exception e) {
					log.error("파일 업로드 실패", e);
					return ResponseEntity.status(500).body(ApiResponse.fail("파일 업로드 실패", null));
				}
				
				newFiles.add(FileDto.builder()
						.originalFileName(original)
						.updatedFileName(rename)
						.build());
			}
		}
		
		postDto.setFiles(newFiles);
		
		int result = noticeService.updateNotice(postDto, deleteFileNo);
		
		if(result > 0) {
			if(deleteFileNo != null && !deleteFileNo.isEmpty()) {
				for(Integer fileNo : deleteFileNo) {
					
					FileEntity fileEntity = fileRepository.findById(fileNo).orElse(null);
					if(fileEntity != null) {
						
						File physical = uploadProperties.noticeDir()
								.resolve(fileEntity.getUpdatedFileName())
								.toFile();
						
						if (physical.exists() && !physical.delete()) {
		                    log.warn("파일 삭제 실패: {}", physical.getAbsolutePath());
		                }
					}
				}
			}
			
			return ResponseEntity.ok(ApiResponse.ok("수정 성공", null));
		}
			
		return ResponseEntity.status(500)
				.body(ApiResponse.fail("수정 실패", null));
	}
	
	//==============삭제===================
	@DeleteMapping("/{postNo}/delete")
	public ResponseEntity<ApiResponse<Void>> delete(@PathVariable int postNo) {

	    PostDto dto = noticeService.selectNotice(postNo);

	    int result = noticeService.deleteNotice(postNo);

	    if(result > 0) {

	        // DB 삭제 성공 후 파일 삭제
	        if(dto != null && dto.getFiles() != null) {
	            for(FileDto file : dto.getFiles()) {
	                File physical = uploadProperties.noticeDir()
	                        .resolve(file.getUpdatedFileName())
	                        .toFile();

	                if (physical.exists() && !physical.delete()) {
	                    log.warn("파일 삭제 실패: {}", physical.getAbsolutePath());
	                }
	            }
	        }

	        return ResponseEntity.ok(ApiResponse.ok("삭제 성공", null));
	    }

	    return ResponseEntity.status(500)
	            .body(ApiResponse.fail("삭제 실패", null));
	}

	
	//==============검색===================
	@GetMapping("search")
	public ResponseEntity<ApiResponse<PageResponse<PostDto>>> search(
			@ModelAttribute @Valid SearchRequest req) {
		
		if(!req.hasSearchCondition())
			return ResponseEntity.badRequest().body(ApiResponse.fail("검색 조건 오류", null));
		
		Pageable pageable = req.toPageable();
		
		long total;
		ArrayList<PostDto> list;
		
		switch (req.type()) {
			case "title" -> {
				total = noticeService.selectSearchTitleCount(req.keyword());
				list = noticeService.selectSearchTitle(req.keyword(), pageable);
			}
			case "content" -> {
				total = noticeService.selectSearchContentCount(req.keyword());
				list = noticeService.selectSearchContent(req.keyword(), pageable);
			}
			case "date" -> {
				LocalDate b = req.beginDateOrNull();
				LocalDate e = req.endDateOrNull();
				
				if(b == null || e == null) {
					return ResponseEntity.badRequest()
							.body(ApiResponse.fail("날짜 범위가 필요합니다.", null));
				}
				total = noticeService.selectSearchDateCount(b, e);
				list = noticeService.selectSearchDate(b, e, pageable);
			}
			default -> {
				return ResponseEntity.badRequest()
						.body(ApiResponse.fail("type 오류", null));
			}
		}
		
		int totalPages = (int) Math.ceil((double) total / req.size());
		
		return ResponseEntity.ok(
				ApiResponse.ok("검색 성공", 
						new PageResponse<>(list, req.page(), req.size(), total, totalPages)));
	}
}
