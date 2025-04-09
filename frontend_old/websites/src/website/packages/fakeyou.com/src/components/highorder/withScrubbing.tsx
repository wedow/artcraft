import React,{
  memo,
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
} from 'react';

export interface withScrubbingPropsI {
  debug?: boolean
  boundingWidth: number;
  scrubberWidth: number;
  hitboxPadding?: number;
  scrubPosition?: number; // scrubber location as px
  styleOverride?: {[key: string]: string|number };
  onScrubStart?: ()=>void;
  //only deal with event side effecrts
  onScrubEnd?: (newPos: number)=>void;
  //return scrubber location as px
}

type withSrcubbingStates = {
  currLeftOffset: number,
  prevLeftOffset: number;
  pointerStartPos: number;
}

export const withScrubbing = <P extends withScrubbingPropsI>(Component: React.ComponentType<P>) => memo(({
  debug: propsDebug = false,
  boundingWidth,
  scrubberWidth,
  hitboxPadding = 0,
  scrubPosition: propsLeftOffset = 0,
  styleOverride = {},
  onScrubStart,
  onScrubEnd,
  ...rest
}: withScrubbingPropsI) => {
  // const debug = true || propsDebug;


  const refEl = useRef<HTMLDivElement| null>(null);
  // const refListener = useRef<number>(Date.now());

  // if (debug) console.log(`${refListener.current} withSCRUBBING reRENDERING!! `);

  const [{
    currLeftOffset, pointerStartPos,
    prevLeftOffset
  }, setStates] = useState<withSrcubbingStates>({
    currLeftOffset: propsLeftOffset,
    prevLeftOffset: propsLeftOffset,
    pointerStartPos: -1 // negative denotes pointer not engaged
  });

  useLayoutEffect(() => {
    // if (debug) console.log(`withSCRUBBING useLAYOUTeffect!! `);
    function handleScrubStart (e: PointerEvent) {
      // if (debug) console.log(`${refListener.current} withSCRUBBING SCRUB_START!! `);
      e.preventDefault();
      e.stopPropagation();
      if(refEl.current){
        if(refEl.current.contains(e.target as Node)){
          setStates((curr)=>({
            ...curr,
            pointerStartPos: e.clientX
          }));

          if(onScrubStart) onScrubStart();
          window.addEventListener("pointermove", handleScrubMove);
          return true;
        }
      }
    };
    function handleScrubEnd (e: PointerEvent){
      // if (debug) console.log(`${refListener.current} withSCRUBBING SCRUB_END!! `);
      e.preventDefault();
      e.stopPropagation();

      window.removeEventListener("pointermove", handleScrubMove);
      setStates((curr)=>({
        ...curr,
        pointerStartPos: -1,
        prevLeftOffset: curr.currLeftOffset,
        setBySelf: Date.now(),
      })); 
    };
    function handleScrubMove (e: PointerEvent){
      // if (debug) console.log(`${refListener.current} withSCRUBBING SCRUB_MOVE!! `);
      e.preventDefault();
      e.stopPropagation();
      
      setStates((curr)=>{
        if(curr.pointerStartPos >= 0 && curr.pointerStartPos!==null){
          let newLeftOffset = curr.prevLeftOffset + e.clientX - curr.pointerStartPos;
          if (newLeftOffset + scrubberWidth > boundingWidth) {
            newLeftOffset = boundingWidth - scrubberWidth;
          }else if(newLeftOffset < 0) {
            newLeftOffset = 0;
          }
          if(newLeftOffset !== curr.currLeftOffset){
            return{
              ...curr,
              currLeftOffset: newLeftOffset,
            }
          }
        }
        return curr;
      });
    };

    // if(!(window as any)[`listener-id-${refListener.current}`]){
    //   (window as any)[`listender-id-${refListener.current}`] = true;
      window.addEventListener("pointerdown", handleScrubStart);
      window.addEventListener("pointerup", handleScrubEnd);
      return () => {
        // (window as any)[`listener-id-${refListener.current}`] = false;
        window.removeEventListener("pointerdown", handleScrubStart);
        window.removeEventListener("pointerup", handleScrubEnd);
        window.removeEventListener("pointermove", handleScrubMove);
      };
    // }
  }, [scrubberWidth, boundingWidth, onScrubStart]);

  // useEffect(()=>{
  //   // if (debug) console.log(`${refListener.current} withSCRUBBING useEFFECT for scrubStart!! `);
  //   if(onScrubStart && pointerStartPos > 0){
  //     onScrubStart();
  //   }
  // },[pointerStartPos, onScrubStart]);

  useEffect(()=>{
    // if (debug) console.log(`${refListener.current} withSCRUBBING useEFFECT for scrubEend!! `);
    if(onScrubEnd && boundingWidth > 0 && prevLeftOffset >= 0 && propsLeftOffset !== prevLeftOffset){
      onScrubEnd(prevLeftOffset);
    }
  },[propsLeftOffset, prevLeftOffset, boundingWidth, onScrubEnd]);

  useEffect(()=>{
    // this takes a forced reset on leftoffset
    setStates((curr)=>{
      if(curr.prevLeftOffset === curr.currLeftOffset
        && propsLeftOffset !== curr.prevLeftOffset
        && propsLeftOffset !== curr.prevLeftOffset
      ){
        return {
          ...curr,
          currLeftOffset: propsLeftOffset, // in pixels
          prevLeftOffset: propsLeftOffset, //in pixels
        }
      }else{
        return curr
      }
    });
  }, [propsLeftOffset])

  return(
    <div
      className="with-scrubber-wrapper"
      ref={refEl}
      style={{
        position: 'absolute',
        top:0,
        width: scrubberWidth + 'px',
        padding: hitboxPadding + 'px',
        left: (currLeftOffset - hitboxPadding) + 'px',
        cursor: pointerStartPos >=0 ? 'grabbing': 'grab',
        ...styleOverride
      }}
    >
      <Component 
        {...rest as P}
      />
    </div>
  );
});
