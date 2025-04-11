// useDocumentTitle.js
import { useRef, useEffect, useState } from 'react'

// Based on `useDocumentTitle()`, which was taken from elsewhere
export function useCanonicalLink(link?: string, preserveOnUnmount: boolean = false) {
  // Possible existing canonical URL
  const relMetaTag = useRef(document.head.querySelector("[rel~=canonical]"));

  useEffect(() => {
    if (!!link) {
      if (!!relMetaTag.current) {
        relMetaTag.current.setAttribute("href", link);
      } else {
        const linkTag = document.createElement('link');
        linkTag.setAttribute('rel', 'canonical');
        linkTag.href = link;
        document.head.appendChild(linkTag);
      }
    } else {
      document.head.querySelector("[rel~=canonical]")?.remove();
    }
  }, [link]);

  useEffect(() => () => {
    if (!preserveOnUnmount) {
      document.head.querySelector("[rel~=canonical]")?.remove();
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