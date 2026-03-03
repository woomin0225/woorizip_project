package org.team4p.woorizip.board.notice.controller;

import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.WebDataBinder;
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
import org.team4p.woorizip.common.exception.NotFoundException;
import org.team4p.woorizip.common.util.FileNameChange;
import org.team4p.woorizip.user.jpa.repository.UserRepository;

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
	private final UserRepository userRepository;
	
	//==============상단 고정=================== 
	@PatchMapping("/{postNo}/pin")
	public ResponseEntity<ApiResponse<Void>> togglePin(
			@PathVariable("postNo") int postNo) {
		noticeService.togglePin(postNo);
		log.info("PIN TOGGLE HIT postNo={}", postNo);
		return ResponseEntity.ok(ApiResponse.ok("고정 상태 변경", null));
	}
	
	//==============Top3===================
	@GetMapping("/top5")
	public ResponseEntity<ApiResponse<ArrayList<PostDto>>> top5() {
		return ResponseEntity.ok(
				ApiResponse.ok("top5 조회 성공", noticeService.selectTop5()));
	}
	
	//==============목록===================
	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<PostDto>>> list(
		@ModelAttribute SearchRequest req) {

		Pageable pageable = req.toPageable();

		int total = noticeService.selectListCount();

		int totalPages = (int) Math.ceil((double) total / req.size());
		int currentPage = req.page();

		ArrayList<PostDto> content = noticeService.selectList(pageable);

		return ResponseEntity
				.ok(ApiResponse.ok("목록 조회 성공", new PageResponse<>(content, currentPage, req.size(), total, totalPages)));
	}
	
	//==============상세===================
	@GetMapping("/{postNo}")
	public ResponseEntity<ApiResponse<PostDto>> detail(
			@PathVariable("postNo") int postNo) {
		
		PostDto dto = noticeService.selectNotice(postNo);
		
		return ResponseEntity.ok(ApiResponse.ok("상세 조회 성공", dto));
	}
	
	//==============파일 다운로드===================
	@GetMapping("/{postNo}/filedown/{fileNo}")
	public ResponseEntity<Resource> downloadFile(
			@PathVariable("postNo") Integer postNo,
			@PathVariable("fileNo") Integer fileNo) throws IOException {
		
		FileEntity fileEntity = fileRepository.findById(fileNo)
				.orElseThrow(() -> new NotFoundException("파일이 존재하지 않습니다."));
		
		if(!fileEntity.getPostNo().equals(postNo)) {
			throw new NotFoundException("해당 게시글의 파일이 아닙니다.");
		}
		
		Path path = uploadProperties.noticeDir()
		        .resolve(fileEntity.getUpdatedFileName());

		File file = path.toFile();		
		if(!file.exists())
			throw new NotFoundException("파일이 존재하지 않습니다.");
		
		String originalName = fileEntity.getOriginalFileName();
		String encodedName = URLEncoder.encode(originalName, StandardCharsets.UTF_8)
		        .replaceAll("\\+", "%20");

		String contentType = Files.probeContentType(path);
		if (contentType == null) {
		    contentType = "application/octet-stream";
		}

		HttpHeaders headers = new HttpHeaders();
		headers.add(HttpHeaders.CONTENT_DISPOSITION,
		        "attachment; filename=\"" + originalName + "\"; filename*=UTF-8''" + encodedName);

		headers.setContentType(MediaType.parseMediaType(contentType));

		return ResponseEntity.ok()
		        .headers(headers)
		        .body(new FileSystemResource(file));
	}
	
	//==============등록===================
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<Void>> create(
			Authentication authentication,
			@Validated(PostDto.Create.class) @ModelAttribute PostDto postDto,
			BindingResult bindingResult,
			@RequestParam(name = "files", required = false) List<MultipartFile> files) {
		
		if(bindingResult.hasErrors()) {
			String message = bindingResult.getFieldError().getDefaultMessage();
			return ResponseEntity.badRequest()
					.body(ApiResponse.fail(message, null));
		}
		
		String email = authentication.getName();
		String userNo = userRepository.findByEmailId(email)
		        .getUserNo();
		
		postDto.setUserNo(userNo);
		
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
					throw new IllegalStateException("파일 업로드 실패");
				}
				
				fileDtoList.add(
						FileDto.builder()
						.originalFileName(original)
						.updatedFileName(rename)
						.build());
			}
		}
		
		postDto.setFiles(fileDtoList);
		
		noticeService.insertNotice(postDto);
		return ResponseEntity.status(201).body(ApiResponse.ok("공지 등록 성공", null));
	}
	
	//==============수정===================
	@PutMapping	(value = "/{postNo}/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<Void>> update(
			@PathVariable("postNo") int postNo,
			Authentication authentication,
			@Validated(PostDto.Update.class) @ModelAttribute PostDto postDto,
			BindingResult bindingResult,
			@RequestParam(name = "deleteFileNo", required = false) List<Integer> deleteFileNo,
			@RequestParam(name = "files", required = false) List<MultipartFile> files) {
		
		if(bindingResult.hasErrors()) {
			String message = bindingResult.getFieldError().getDefaultMessage();
			return ResponseEntity.badRequest()
					.body(ApiResponse.fail(message, null));
		}
		
		String email = authentication.getName();
		String userNo = userRepository.findByEmailId(email)
		        .getUserNo();
		
		postDto.setUserNo(userNo);
		postDto.setPostNo(postNo);
		
		//파일 등록처리 ==============================
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
					throw new IllegalStateException("파일 업로드 실패");
				}
				
				newFiles.add(FileDto.builder()
						.originalFileName(original)
						.updatedFileName(rename)
						.build());
			}
		}
		
		//기존 파일 삭제 처리 ==========================
		List<FileEntity> deleteFiles = new ArrayList<>();

		if(deleteFileNo != null && !deleteFileNo.isEmpty()) {
		    for(Integer fileNo : deleteFileNo) {
		        FileEntity fileEntity = fileRepository.findById(fileNo)
		        		.orElseThrow(() -> 
		        				new NotFoundException("삭제할 파일이 존재하지 않습니다."));
		        
		        if(!fileEntity.getPostNo().equals(postNo)) {
		        	throw new NotFoundException("해당 게시글의 파일이 아닙니다.");
		        }
		        
		        deleteFiles.add(fileEntity);
		    }
		}
		
		postDto.setFiles(newFiles);
		
		//파일 검증 ==================================
		List<Integer> validatedDeleteFileNo = deleteFiles.stream()
				.map(FileEntity::getFileNo)
				.toList();
		
		//서비스 호출 ===============================
		noticeService.updateNotice(postDto, validatedDeleteFileNo);
		
		for(FileEntity fileEntity : deleteFiles) {
			File physical = uploadProperties.noticeDir()
					.resolve(fileEntity.getUpdatedFileName())
					.toFile();
			
			if(physical.exists() && !physical.delete()) {
				log.warn("파일 삭제 실패: {}", physical.getAbsolutePath());
			}
		}
		
		return ResponseEntity.ok(ApiResponse.ok("수정 성공", null));
	}
	
	//==============삭제===================
	@DeleteMapping("/{postNo}/delete")
	public ResponseEntity<ApiResponse<Void>> delete(
			@PathVariable("postNo") int postNo) {

	    PostDto dto = noticeService.selectNotice(postNo);
	    noticeService.deleteNotice(postNo);
	    
	    if(dto.getFiles() != null) {
	    		for(FileDto file : dto.getFiles()) {
	    			File physical = uploadProperties.noticeDir()
	    					.resolve(file.getUpdatedFileName())
	    					.toFile();
	    			
	    			if(physical.exists() && !physical.delete()) {
	    				log.warn("파일 삭제 실패: {}", physical.getAbsolutePath());
	    			}
	    		}
	    }
	    
	    return ResponseEntity.ok(ApiResponse.ok("삭제 성공", null));
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
	
	//============== 조회수 증가 ===================
	@PatchMapping("/{postNo}/view")
	public ResponseEntity<ApiResponse<Void>> increaseView(
	        @PathVariable("postNo") int postNo) {

	    noticeService.updateAddReadCount(postNo);

	    return ResponseEntity.ok(ApiResponse.ok("조회수 증가 성공", null));
	}
	
	@InitBinder
	public void initBinder(WebDataBinder binder) {
	    binder.setDisallowedFields("files");
	}

}
