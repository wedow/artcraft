// useDocumentTitle.js
import { useRef, useEffect, useState } from 'react'

// Change the document title.
// Taken from https://dev.to/luispa/how-to-add-a-dynamic-title-on-your-react-app-1l7k
// But there's also a good approach here: https://devdojo.com/krissanawat101/3-ways-to-set-a-document-title-in-react
export function useDocumentTitle(title: string, prevailOnUnmount: boolean = false) {
  const defaultTitle = useRef(document.title);

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => () => {
    if (!prevailOnUnmount) {
      document.title = defaultTitle.current;
    }
  }, [])
}

//export function useDocumentTitle (title: string) {
//  const [document_title, setDoucmentTitle] = useState(title);
//   useEffect(() => {
//    document.title = document_title; 
//  },[document_title]);
//
//  return [document_title, setDoucmentTitle];
//};