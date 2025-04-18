import { render } from '@testing-library/react';

import Toaster from './toaster';

describe('Toaster', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<Toaster />);
    expect(baseElement).toBeTruthy();
  });
  
});
