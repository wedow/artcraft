import { render } from '@testing-library/react';

import FrontendTauriEvents from './tauri-events';

describe('FrontendTauriEvents', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<FrontendTauriEvents />);
    expect(baseElement).toBeTruthy();
  });
  
});
