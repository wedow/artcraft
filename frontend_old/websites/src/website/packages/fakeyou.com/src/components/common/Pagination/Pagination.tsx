import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import ReactPaginate from "react-paginate";
import "./Pagination.scss";

interface PaginationComponentProps {
  currentPage: number,
  onPageChange: (selectedItem: { selected: number }) => void,
  pageCount: number
}

export default function Pagination({
  currentPage,
  onPageChange,
  pageCount
}: PaginationComponentProps) {
  return (
    <ReactPaginate
      previousLabel={<FontAwesomeIcon icon={faChevronLeft} />}
      nextLabel={<FontAwesomeIcon icon={faChevronRight} />}
      breakLabel={"..."}
      pageCount={pageCount}
      marginPagesDisplayed={1}
      pageRangeDisplayed={3}
      onPageChange={onPageChange}
      containerClassName={"pagination"}
      activeClassName={"active"}
      pageClassName={"page-item"}
      pageLinkClassName={"page-link"}
      previousClassName={"page-item"}
      previousLinkClassName={"page-link"}
      nextClassName={"page-item"}
      nextLinkClassName={"page-link"}
      breakClassName={"page-item"}
      breakLinkClassName={"page-link"}
      forcePage={currentPage}
    />
  );
}
