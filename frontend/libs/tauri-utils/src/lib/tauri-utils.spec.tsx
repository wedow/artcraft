import { render } from '@testing-library/react';

import TauriUtils from './tauri-utils';

describe('TauriUtils', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<TauriUtils />);
    expect(baseElement).toBeTruthy();
  });
  
});
