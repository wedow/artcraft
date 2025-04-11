import React, {
  useCallback,
  useContext,
} from 'react';

import { TrimContext } from '../../contexts';
import { TRIM_OPTIONS } from '../../utilities';
import { SelectionBubbles } from 'components/common';

export const SelectTrim = ()=>{
  const trimValues = useContext(TrimContext);

  const handleSetTrimDuration = useCallback((selected: string)=>{
    // console.log(`trimDurationString: ${selected}`);
    if (trimValues!==null) {
      trimValues.onChange({
        trimStartMs: trimValues.trimStartMs,
        trimEndMs: trimValues.trimStartMs + TRIM_OPTIONS[selected],
        // trimDurationMs: TRIM_OPTIONS[selected],
      });
    }
  }, [trimValues]);

  return(
    <SelectionBubbles
      options={Object.keys(TRIM_OPTIONS)}
      onSelect={handleSetTrimDuration}
      selectedStyle="outline"
    />
  );
}