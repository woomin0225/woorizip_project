package org.team4p.woorizip.common;

import java.sql.Date;

public class Search {
	private String keyword;  //제목, 내용, 아이디 (작성자, 회원) 검색 키워드
	private int startRow;    //한 페이지에 출력할 목록의 시작행
	//private int endRow;     //한 페이지에 출력할 목록의 끝행
	private int limit;		//한 페이지에 출력할 목록 갯수 (mysql 에서 LIMIT 시작행, 갯수 때문에 필요함)
	private Date begin;     //등록날짜 검색의 시작날짜
	private Date end;       //등록날짜 검색의 끝날짜
	private int age;		 //회원관리에서 연령대별 검색의 나이
	
	public Search() {
		super();
	}

	//getters and setters
	public String getKeyword() {
		return keyword;
	}

	public void setKeyword(String keyword) {
		this.keyword = keyword;
	}

	public int getStartRow() {
		return startRow;
	}

	public void setStartRow(int startRow) {
		this.startRow = startRow;
	}

//	public int getEndRow() {
//		return endRow;
//	}
//
//	public void setEndRow(int endRow) {
//		this.endRow = endRow;
//	}

	public Date getBegin() {
		return begin;
	}

	public void setBegin(Date begin) {
		this.begin = begin;
	}

	public Date getEnd() {
		return end;
	}

	public void setEnd(Date end) {
		this.end = end;
	}

	public int getAge() {
		return age;
	}

	public void setAge(int age) {
		this.age = age;
	}

	public int getLimit() {
		return limit;
	}

	public void setLimit(int limit) {
		this.limit = limit;
	}

	@Override
	public String toString() {
		return "Search [keyword=" + keyword + ", startRow=" + startRow + ", limit=" + limit + ", begin=" + begin
				+ ", end=" + end + ", age=" + age + "]";
	}
	

//	@Override
//	public String toString() {
//		return "Search [keyword=" + keyword + ", startRow=" + startRow + ", endRow=" + endRow + ", begin=" + begin
//				+ ", end=" + end + ", age=" + age + "]";
//	}	
}
