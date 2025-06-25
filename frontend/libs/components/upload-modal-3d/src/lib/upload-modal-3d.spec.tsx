import { render } from '@testing-library/react';

import UploadModal3d from './upload-modal-3d';

describe('UploadModal3d', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<UploadModal3d />);
    expect(baseElement).toBeTruthy();
  });
  
});
