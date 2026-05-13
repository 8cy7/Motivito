import React from 'react';
import { Modal, ModalProps } from 'react-native';
import { isTablet } from '../utils/deviceUtils';

const IS_TABLET = isTablet();

const SUPPORTED_ORIENTATIONS: ModalProps['supportedOrientations'] = IS_TABLET
  ? ['landscape', 'landscape-left', 'landscape-right']
  : ['portrait'];

/**
 * Drop-in replacement for Modal that always declares the correct
 * supportedOrientations so iOS never crashes when a modal is presented
 * while the root view is orientation-locked.
 */
export const AppModal: React.FC<ModalProps> = ({ children, ...props }) => (
  <Modal supportedOrientations={SUPPORTED_ORIENTATIONS} {...props}>
    {children}
  </Modal>
);
