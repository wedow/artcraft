import { render } from '@testing-library/react';

import FrontendBilling from './billing';

describe('FrontendBilling', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<FrontendBilling />);
    expect(baseElement).toBeTruthy();
  });
  
});
