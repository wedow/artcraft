import { render } from '@testing-library/react';

import TauriApi from './tauri-api';

describe('TauriApi', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<TauriApi />);
    expect(baseElement).toBeTruthy();
  });
  
});
