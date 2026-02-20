package org.team4p.woorizip.board.event.controller;

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
import org.team4p.woorizip.board.bannerimage.jpa.entity.BannerImageEntity;
import org.team4p.woorizip.board.bannerimage.jpa.repository.BannerImageRepository;
import org.team4p.woorizip.board.bannerimage.model.dto.BannerImageDto;
import org.team4p.woorizip.board.event.model.service.EventService;
import org.team4p.woorizip.board.file.jpa.entity.FileEntity;
import org.team4p.woorizip.board.file.jpa.repository.FileRepository;
import org.team4p.woorizip.board.file.model.dto.FileDto;
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
@RequestMapping("/api/event")
public class EventController {

	private final EventService eventService;
	private final UploadProperties uploadProperties;
	private final FileRepository fileRepository;
	private final BannerImageRepository bannerImageRepository;
	private final UserRepository userRepository;
	
	//==============Top3===================
	@GetMapping("/top3")
	public ResponseEntity<ApiResponse<ArrayList<PostDto>>> top3() {
		return ResponseEntity.ok(
				ApiResponse.ok("top3 조회 성공", eventService.selectTop3()));
	}
	
	//==============목록===================
	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<PostDto>>> list(
			@ModelAttribute SearchRequest req) {
		
		Pageable pageable = req.toPageable();
		
		int total = eventService.selectListCount();
		ArrayList<PostDto> content = eventService.selectList(pageable);
		
		int totalPages = (int) Math.ceil((double) total / req.size());
		
		return ResponseEntity.ok(
				ApiResponse.ok("목록 조회 성공", new PageResponse<>(content, req.page(), req.size(), total, totalPages)));
	}
	
	//==============상세===================
	@GetMapping("/{postNo}")
	public ResponseEntity<ApiResponse<PostDto>> detail(
			@PathVariable("postNo") int postNo) {
		
		PostDto dto = eventService.selectEvent(postNo);
		eventService.updateAddReadCount(postNo);
		
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
		
		Path path = uploadProperties.eventDir()
				.resolve(fileEntity.getUpdatedFileName());
		
		File file = path.toFile();		
		if(!file.exists()) {
			throw new NotFoundException("파일이 존재하지 않습니다.");
		}
		
		String originalName = fileEntity.getOriginalFileName();
		String encodedName = URLEncoder.encode(originalName, StandardCharsets.UTF_8)
				.replaceAll("\\+", "%20");
		
		String contentType = Files.probeContentType(path);
		if(contentType == null) {
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
			@RequestParam(name = "bannerFile") MultipartFile bannerFile,
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
		
		//배너 필수 처리 ======================
		if(bannerFile == null || bannerFile.isEmpty()) {
			return ResponseEntity.badRequest()
					.body(ApiResponse.fail("배너 이미지는 필수 입니다.", null));
		}
		
		String bannerOriginal = bannerFile.getOriginalFilename();
		String bannerRename = FileNameChange.change(bannerOriginal);
		
		File bannerDir = uploadProperties.eventBannerDir().toFile();
		if(!bannerDir.exists())
			bannerDir.mkdirs();
		
		try {
			bannerFile.transferTo(new File(bannerDir, bannerRename));
		} catch (Exception e) {
			log.error("배너 업로드 실패", e);
			throw new IllegalStateException("배너 업로드 실패");
		}
		
		BannerImageDto bannerDto = BannerImageDto.builder()
				.originalFileName(bannerOriginal)
				.updatedFileName(bannerRename)
				.build();
		
		//일반 첨부파일 처리 ======================
		List<FileDto> fileDtoList = new ArrayList<>();
		
		if(files != null) {
			for(MultipartFile file : files) {
				
				if(file.isEmpty())
					continue;
				
				String original = file.getOriginalFilename();
				String rename = FileNameChange.change(original);
				
				File saveDir = uploadProperties.eventDir().toFile();
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
		
		eventService.insertEvent(postDto, bannerDto);
		
		return ResponseEntity.status(201)
				.body(ApiResponse.ok("이벤트 게시글 등록 성공", null));
	}
	
	//==============수정===================
	@PutMapping	(value = "/{postNo}/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<Void>> update(
			@PathVariable("postNo") int postNo,
			Authentication authentication,
			@Validated(PostDto.Update.class) @ModelAttribute PostDto postDto,
			BindingResult bindingResult,
			@RequestParam(name = "bannerFile", required = false) MultipartFile bannerFile,
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
		
		// 배너 처리=======
		BannerImageDto bannerDto = null;
		BannerImageEntity oldBanner = null;
		
		if(bannerFile != null && !bannerFile.isEmpty()) {
			//기존 배너 조회 
			oldBanner = bannerImageRepository.findByPostNo(postNo).orElse(null);
			
			String bannerOriginal = bannerFile.getOriginalFilename();
			String bannerRename = FileNameChange.change(bannerOriginal);
			
			File bannerDir = uploadProperties.eventBannerDir().toFile();
			if(!bannerDir.exists())
				bannerDir.mkdirs();
			
			try {
				bannerFile.transferTo(new File(bannerDir, bannerRename));
			} catch (Exception e) {
				log.error("배너 업로드 실패", e);
				throw new IllegalStateException("배너 업로드 실패");
			}
			
			bannerDto = BannerImageDto.builder()
					.originalFileName(bannerOriginal)
					.updatedFileName(bannerRename)
					.build();
		}
		
		//파일 등록 처리 =================
		List<FileDto> newFiles = new ArrayList<>();
		
		if(files != null) {
			for(MultipartFile file : files) {
				
				if(file.isEmpty())
					continue;
				
				String original = file.getOriginalFilename();
				String rename = FileNameChange.change(original);
				
				File saveDir = uploadProperties.eventDir().toFile();
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
		
		//기존 파일 삭제 처리 ======================
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
		
		//파일 검증 ====================================
		List<Integer> validatedDeleteFileNo = deleteFiles.stream()
				.map(FileEntity::getFileNo)
				.toList();
		
		//서비스 호출 ===============================
		eventService.updateEvent(postDto, validatedDeleteFileNo, bannerDto);

		// 등록된 파일 삭제 ==========================
		for (FileEntity fileEntity : deleteFiles) {
			File physical = uploadProperties.eventDir()
					.resolve(fileEntity.getUpdatedFileName())
					.toFile();

			if (physical.exists() && !physical.delete()) {
				log.warn("파일 삭제 실패: {}", physical.getAbsolutePath());
			}
		}

		// 기존 배너 이미지 삭제 =========================
		if (oldBanner != null) {
			File oldPhysical = uploadProperties.eventBannerDir()
					.resolve(oldBanner.getUpdatedFileName())
					.toFile();

			if (oldPhysical.exists() && !oldPhysical.delete()) {
				log.warn("배너 이미지 파일 삭제 실패: {}", oldPhysical.getAbsolutePath());
			}
		}

		return ResponseEntity.ok(ApiResponse.ok("수정 성공", null));
	}
	
	//==============삭제===================
	@DeleteMapping("/{postNo}/delete")
	public ResponseEntity<ApiResponse<Void>> delete(
			@PathVariable("postNo") int postNo) {

	    PostDto dto = eventService.selectEvent(postNo);	    
	    eventService.deleteEvent(postNo);
	    	
		// DB 삭제 성공 후 파일 삭제
		if (dto.getFiles() != null) {
			for (FileDto file : dto.getFiles()) {
				File physical = uploadProperties.eventDir()
						.resolve(file.getUpdatedFileName())
						.toFile();

				if (physical.exists() && !physical.delete()) {
					log.warn("파일 삭제 실패: {}", physical.getAbsolutePath());
				}
			}
		}

		// 배너 이미지 삭제
		if (dto.getBannerImage() != null) {
			File bannerFile = uploadProperties.eventBannerDir()
					.resolve(dto.getBannerImage().getUpdatedFileName())
					.toFile();

			if (bannerFile.exists() && !bannerFile.delete()) {
				log.warn("배너 이미지 파일 삭제 실패: {}", bannerFile.getAbsolutePath());
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
				total = eventService.selectSearchTitleCount(req.keyword());
				list = eventService.selectSearchTitle(req.keyword(), pageable);
			}
			case "content" -> {
				total = eventService.selectSearchContentCount(req.keyword());
				list = eventService.selectSearchContent(req.keyword(), pageable);
			}
			case "date" -> {
				LocalDate b = req.beginDateOrNull();
				LocalDate e = req.endDateOrNull();
				
				if(b == null || e == null) {
					return ResponseEntity.badRequest()
							.body(ApiResponse.fail("날짜 범위가 필요합니다.", null));
				}
				total = eventService.selectSearchDateCount(b, e);
				list = eventService.selectSearchDate(b, e, pageable);
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
	
	@InitBinder
	public void initBinder(WebDataBinder binder) {
	    binder.setDisallowedFields("files");
	}

}